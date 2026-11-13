import { fromNodeHeaders } from 'better-auth/node';
import { type NextFunction, type Request, type Response, Router } from 'express';
import { BRAND } from '../../../config/brand.js';
import { requestContext } from '../../../lib/async-context.js';
import { auth } from '../../../lib/auth.js';
import { MailerNotConfiguredError, sendEmail } from '../../../lib/email/mailer.js';
import { logger } from '../../../lib/logger.js';
import { prisma } from '../../../lib/prisma.js';
import type { AuthRequest } from '../../../shared/middlewares/authenticateToken.js';

const router = Router();

// Disparado pelo próprio usuário (ChangePasswordGate.tsx) logo após trocar com sucesso a senha
// temporária/padrão — não requer ADMIN, qualquer usuário autenticado pode chamar para si mesmo.
// Best-effort de propósito: a troca de senha já aconteceu e o usuário já está liberado a entrar
// no app quando isto roda, então uma falha de e-mail (SMTP não configurado, provedor fora do ar)
// nunca pode bloquear ou reverter esse acesso — só registramos e respondemos sucesso do mesmo jeito.
router.post(
  '/welcome-email',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as AuthRequest).user;
      try {
        await sendEmail({
          to: user.email,
          subject: `Bem-vindo(a) ao ${BRAND.name}`,
          text: [
            `Olá,`,
            '',
            `Sua senha foi trocada com sucesso e sua conta no ${BRAND.name} — ${BRAND.slogan} — já está pronta para uso.`,
            '',
            'Com ela você tem acesso a prospecção, pipeline de vendas, roleplay de vendas com IA e automações comerciais, de acordo com o papel atribuído à sua conta.',
            '',
            'Se você não reconhece esta conta ou não trocou sua senha agora, avise um administrador imediatamente.',
            '',
            'Bom trabalho!',
            `Equipe ${BRAND.shortName}`,
          ].join('\n'),
        });
      } catch (error: any) {
        if (error instanceof MailerNotConfiguredError) {
          logger.warn(
            { userId: user.id },
            'E-mail de boas-vindas não enviado — SMTP_HOST não configurado.',
          );
        } else {
          logger.error({ err: error, userId: user.id }, 'Falha ao enviar e-mail de boas-vindas.');
        }
      }
      res.json({ success: true });
    } catch (error: any) {
      next(error);
    }
  },
);

// ---- Gestão de sessões (DEM-20261113-002 / MEL-06) ----
// O usuário vê e revoga os próprios dispositivos/sessões. Session tem FORCE RLS,
// então toda leitura/escrita roda com bypassRls — mesmo padrão de authenticateToken.
// Respostas nunca expõem o token da sessão.

interface SessionRow {
  id: string;
  userAgent?: string | null;
  ipAddress?: string | null;
  createdAt: Date;
  expiresAt: Date;
  token?: string;
}

async function currentSessionId(req: Request): Promise<string | null> {
  const result = await requestContext.run({ bypassRls: true }, () =>
    auth.api.getSession({ headers: fromNodeHeaders(req.headers) }),
  );
  return (result?.session as { id?: string } | undefined)?.id ?? null;
}

router.get('/sessions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const [sessions, currentId] = await Promise.all([
      requestContext.run({ bypassRls: true }, async () => {
        const rows = await prisma.session.findMany({
          where: { userId: user.id, expiresAt: { gt: new Date() } },
          orderBy: { createdAt: 'desc' },
        });
        return rows as SessionRow[];
      }),
      currentSessionId(req),
    ]);
    res.json({
      success: true,
      sessions: sessions.map((s) => ({
        id: s.id,
        userAgent: s.userAgent ?? null,
        ipAddress: s.ipAddress ?? null,
        createdAt: s.createdAt,
        expiresAt: s.expiresAt,
        current: s.id === currentId,
      })),
    });
  } catch (error) {
    next(error);
  }
});

router.delete(
  '/sessions/:id',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = (req as AuthRequest).user;
      const { id: sessionId } = req.params;
      const id = String(sessionId);
      const currentId = await currentSessionId(req);
      if (id === currentId) {
        res.status(400).json({ success: false, error: 'Use sign-out para encerrar a sessão atual.' });
        return;
      }
      const deleted = await requestContext.run({ bypassRls: true }, () =>
        prisma.session.deleteMany({ where: { id: String(id), userId: user.id } }),
      );
      if (deleted.count === 0) {
        res.status(404).json({ success: false, error: 'Sessão não encontrada.' });
        return;
      }
      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  },
);

router.post('/sessions/revoke-others', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = (req as AuthRequest).user;
    const currentId = await currentSessionId(req);
    const deleted = await requestContext.run({ bypassRls: true }, () =>
      prisma.session.deleteMany({
        where: { userId: user.id, ...(currentId ? { id: { not: currentId } } : {}) },
      }),
    );
    res.json({ success: true, revoked: deleted.count });
  } catch (error) {
    next(error);
  }
});

export const authExtraRoutes = router;
