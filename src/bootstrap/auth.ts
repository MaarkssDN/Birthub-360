import { toNodeHandler } from 'better-auth/node';
import type { Express } from 'express';
import { requestContext } from '../lib/async-context.js';
import { auth } from '../lib/auth.js';
import { logger } from '../lib/logger.js';

/**
 * Monta o handler do Better Auth em /api/auth. As tabelas Organization/user/session/account/
 * verification têm tenant_isolation_policy via RLS (app.current_tenant_id = organizationId).
 * Login e validação de sessão acontecem ANTES de descobrir o tenant do usuário — sem bypass
 * explícito, a própria consulta que descobriria o tenant é bloqueada pelo RLS, e login por
 * e-mail/senha nunca consegue ler o usuário (ver bypassRls em src/lib/async-context.ts e o
 * allowlist de models em src/lib/prisma.ts, que restringe esse bypass só às tabelas de
 * identidade do Better Auth). O isolamento de dados de negócio (companies, leads, etc.) continua
 * real: essas rotas passam por authenticateToken, que só concede tenantId real da sessão.
 */
export function mountAuthHandler(app: Express): void {
  // Endpoints declarados de SSO Corporativo — audita provedores reais e evita simulação fictícia
  app.get('/api/auth/sso-providers', (_req, res) => {
    const google = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const microsoft = Boolean(
      process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET,
    );
    res.json({
      success: true,
      providers: {
        google: { id: 'google', name: 'Google Workspace', configured: google },
        microsoft: { id: 'microsoft', name: 'Microsoft Entra ID', configured: microsoft },
      },
    });
  });

  app.post('/api/auth/sso-discover', (req, res) => {
    const rawInput =
      typeof req.body?.domain === 'string'
        ? req.body.domain
        : typeof req.body?.email === 'string'
          ? req.body.email
          : '';
    const trimmed = rawInput.trim().toLowerCase();

    if (!trimmed) {
      res.status(400).json({
        success: false,
        error: 'Informe um domínio corporativo válido (ex: empresa.com.br).',
      });
      return;
    }

    const domain = trimmed.includes('@') ? trimmed.split('@')[1] : trimmed;
    if (!domain?.includes('.') || domain.length < 4) {
      res.status(400).json({
        success: false,
        error: 'Domínio corporativo inválido. Formato esperado: suaempresa.com.br.',
      });
      return;
    }

    const googleConfigured = Boolean(
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET,
    );
    const microsoftConfigured = Boolean(
      process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET,
    );

    const isMicrosoftDomain =
      domain.endsWith('microsoft.com') ||
      domain.endsWith('onmicrosoft.com') ||
      domain.endsWith('outlook.com') ||
      domain.endsWith('live.com') ||
      domain.endsWith('hotmail.com');

    const provider = isMicrosoftDomain ? 'microsoft' : 'google';
    const isConfigured = provider === 'microsoft' ? microsoftConfigured : googleConfigured;
    const providerName = provider === 'microsoft' ? 'Microsoft Entra ID' : 'Google Workspace';

    if (!isConfigured) {
      res.status(503).json({
        success: false,
        code: 'SSO_NOT_CONFIGURED',
        provider,
        providerName,
        domain,
        error: `O provedor SSO corporativo (${providerName}) ainda não foi ativado com credenciais empresariais (CLIENT_ID / CLIENT_SECRET) neste ambiente. Utilize autenticação por E-mail Corporativo ou contate o administrador do tenant.`,
      });
      return;
    }

    res.json({
      success: true,
      domain,
      provider,
      providerName,
      configured: true,
    });
  });

  const authHandler = toNodeHandler(auth);
  // CORREÇÃO: app.all captura todos os métodos HTTP, incluindo CONNECT e TRACE.
  // app.use é mais correto aqui: deixa o Better Auth decidir quais métodos aceita.
  app.use('/api/auth', (req, res) => {
    requestContext.run({ bypassRls: true }, async () => {
      try {
        await authHandler(req, res);
      } catch (err: unknown) {
        // Handoff 15→01 (BT360-DT-0072 residual): nunca logar o objeto de erro cru —
        // ele pode carregar contexto da request (headers/query com token de
        // verify-email/reset). O pino aplica LOGGER_REDACT_PATHS, mas payload
        // mínimo é defesa em profundidade. A resposta 500 também não ecoa
        // err.message (pode conter detalhe interno).
        logger.error(
          {
            err:
              err instanceof Error
                ? { message: err.message, name: err.name }
                : 'Unknown error',
          },
          'MOUNT_AUTH_HANDLER_CAUGHT_ERROR',
        );
        if (!res.headersSent) {
          res.status(500).json({ error: 'Erro interno no servidor' });
        }
      }
    });
  });
}
