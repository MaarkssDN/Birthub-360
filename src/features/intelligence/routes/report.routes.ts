import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import type { Prisma } from '@prisma/client';
import { type NextFunction, type Request, type Response, Router } from 'express';
import { z } from 'zod';
import { getAiModel, logAiUsage } from '../../../lib/ai/gateway.js';
import { logger } from '../../../lib/logger.js';
import { prisma } from '../../../lib/prisma.js';
import type { AuthRequest } from '../../../shared/middlewares/authenticateToken.js';
import { validateRequest } from '../../../shared/middlewares/validateRequest.js';
import { redactAndTrackPiiLeak } from '../services/guardrails.service.js';
import { SYSTEM_RULES, streamText } from '../services/studio/shared.js';

const router = Router();

// Geração e interpretação de relatórios via IA — recebe as métricas já calculadas pelo frontend
// (mesmo /api/analytics/overview usado no LiveStatsWidget) e devolve uma leitura executiva em Markdown.
const reportSchema = z.object({
  metrics: z.record(z.string(), z.unknown()),
  brandId: z.literal('geral').default('geral'),
});

// Antes do playbook geral único, este texto variava por playbook (logística vs. frota) — ver
// git blame para o conteúdo antigo. Removido junto com Birth Hub 360 (pedido explícito do
// usuário); mantém-se genérico até o desenho de um playbook configurável por organização.
function reportBrandContext(_brandId: 'geral'): string {
  return 'Birth Hub 360 (inteligência comercial B2B)';
}

function reportPrompt(brandContext: string): string {
  return `Você é um analista de operações comerciais da ${brandContext}.
Escreva um relatório executivo curto em Markdown interpretando os dados fornecidos para a liderança comercial:
1. Um resumo de 2-3 frases do estado atual.
2. Os 2 pontos mais fortes e os 2 pontos mais fracos, cada um em uma linha.
3. 3 recomendações de ação concretas e priorizadas para a próxima semana.
Baseie-se SOMENTE nos números fornecidos acima — nunca invente métricas que não estão no JSON.`;
}

// PC-008: o relatório era devolvido ao frontend e nunca persistido — sumia ao navegar/recarregar
// a tela (ReportsHub mantinha só em estado local). Persiste aqui e expõe GET /report/latest
// abaixo para a tela carregar o último relatório gerado da organização ao montar.
router.get(
  '/report/latest',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = (req as AuthRequest).user.organizationId;
      const latest = await prisma.report.findFirst({
        // Filtro explícito por ON_DEMAND: sem isto, o resumo diário automático (`ReportSource
        // DAILY_AUTO`, gerado por `dailyExecutiveSummary.worker.ts`) apareceria aqui sem o
        // usuário ter pedido, substituindo silenciosamente o último relatório que ele gerou.
        where: { organizationId, source: 'ON_DEMAND' },
        orderBy: { createdAt: 'desc' },
      });
      res.json({ success: true, data: latest });
    } catch (error: any) {
      next(error);
    }
  },
);

// Histórico do resumo executivo diário automático (`dailyExecutiveSummary.worker.ts`, cron
// 0 18 * * *) — antes gerava via IA todo dia mas só logava; nunca aparecia em nenhuma tela.
router.get(
  '/report/daily-summaries',
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = (req as AuthRequest).user.organizationId;
      const summaries = await prisma.report.findMany({
        where: { organizationId, source: 'DAILY_AUTO' },
        orderBy: { createdAt: 'desc' },
        take: 14,
        select: { id: true, content: true, metrics: true, createdAt: true },
      });
      res.json({ success: true, data: summaries });
    } catch (error: any) {
      next(error);
    }
  },
);

router.post(
  '/report',
  validateRequest(reportSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const organizationId = (req as AuthRequest).user.organizationId;
      const { metrics, brandId } = req.body as z.infer<typeof reportSchema>;

      const systemPrompt = `${SYSTEM_RULES}

${reportPrompt(reportBrandContext(brandId))}`;
      const userPrompt = `Números atuais da plataforma (CRM, prospecção e pipeline):\n${JSON.stringify(metrics, null, 2)}`;

      const model = getAiModel('local-llama3-fast', 0.4, 'report_interpretation');
      const startTime = Date.now();
      const response = await model.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage(userPrompt),
      ]);
      const latencyMs = Date.now() - startTime;

      await logAiUsage({
        model: response.response_metadata.model,
        usage: response.response_metadata.tokenUsage,
        latencyMs,
      });

      const content = await redactAndTrackPiiLeak(String(response.content), 'report');

      const saved = await prisma.report.create({
        data: {
          organizationId,
          brandId,
          content,
          metrics: metrics as Prisma.InputJsonValue,
        },
      });

      res.json({ result: saved.content, reportId: saved.id, createdAt: saved.createdAt });
    } catch (error: any) {
      logger.error({ err: error }, 'Error generating report interpretation');
      next(error);
    }
  },
);

router.post(
  '/report/stream',
  validateRequest(reportSchema),
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const organizationId = (req as AuthRequest).user.organizationId;
    const { metrics, brandId } = req.body as z.infer<typeof reportSchema>;
    const prompt = `${SYSTEM_RULES}

${reportPrompt(reportBrandContext(brandId))}

Números atuais da plataforma (CRM, prospecção e pipeline):
${JSON.stringify(metrics, null, 2)}`;

    try {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.flushHeaders?.();

      const content = await streamText(
        prompt,
        'report_interpretation',
        0.4,
        'local-llama3-fast',
        (chunk) => {
          res.write(`event: delta\ndata: ${JSON.stringify({ delta: chunk })}\n\n`);
        },
      );

      const saved = await prisma.report.create({
        data: { organizationId, brandId, content, metrics: metrics as Prisma.InputJsonValue },
      });

      res.write(
        `event: end\ndata: ${JSON.stringify({ reportId: saved.id, createdAt: saved.createdAt })}\n\n`,
      );
      res.end();
    } catch (error: any) {
      logger.error({ err: error }, 'Error streaming report interpretation');
      if (!res.headersSent) {
        next(error);
      } else {
        res.write(`event: error\ndata: ${JSON.stringify((error as Error).message)}\n\n`);
        res.end();
      }
    }
  },
);

export const reportRoutes = router;
