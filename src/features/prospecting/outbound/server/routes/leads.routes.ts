import { Router, type Request, type Response } from 'express';
import { getDatabase, saveDatabase, logActivity } from '../db.js';
import { generateCopiesWithEngine, enrichLeadWithPublicNewsAndScripts } from '../ai.js';
import { resolveAndEnrichCnpjForLead } from '../cnpj.js';
import { getFieldEvidence } from '../evidence.js';
import { requireAuth, requireTenantScope, tenantCompany } from '../auth.js';
import type { Lead, DecisionMaker } from '../../types.js';
import { validateChangedLeadFields, upsertMessageWithVersioning } from '../utils/formatLead.js';
import { z } from 'zod';
import { prospectRouter } from './prospect.routes.js';
import { heavyAiLimiter, leadBelongsToCompany, LEAD_COMPANY_CLAUSE } from './leads.shared.js';

const updateStageSchema = z.object({
  stage: z.string().min(1, 'Stage é obrigatório'),
  userId: z.string().optional(),
  lossReason: z.string().optional(),
  winReason: z.string().optional(),
});

const updateTagsSchema = z.object({
  tags: z.array(z.string()),
  userId: z.string().optional(),
});

export const leadsRouter = Router();

// Handoff 12→05 (F2): defesa em profundidade — sessão + company obrigatórias
// mesmo que este router seja montado fora do apiRouter.
leadsRouter.use(requireTenantScope);

// Update Lead Stage directly
leadsRouter.put('/leads/:id/stage', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsed = updateStageSchema.safeParse(req.body);
    if (!parsed.success) {
      return res
        .status(400)
        .json({ error: parsed.error.issues[0]?.message || 'Stage é obrigatório' });
    }
    const { stage, userId, lossReason, winReason } = parsed.data;
    const db = await getDatabase();
    const company = tenantCompany(req);
    const beforeRes = await db.exec(
      `SELECT stage FROM leads WHERE id = ? AND ${LEAD_COMPANY_CLAUSE}`,
      [id, company],
    );
    if (beforeRes.length === 0 || beforeRes[0].values.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }
    const previousStage = beforeRes[0].values[0][0] ?? null;

    if (lossReason !== undefined && winReason !== undefined) {
      await db.run(`UPDATE leads SET stage = ?, loss_reason = ?, win_reason = ? WHERE id = ?`, [
        stage,
        lossReason,
        winReason,
        id,
      ]);
    } else if (lossReason !== undefined) {
      await db.run(`UPDATE leads SET stage = ?, loss_reason = ? WHERE id = ?`, [
        stage,
        lossReason,
        id,
      ]);
    } else if (winReason !== undefined) {
      await db.run(`UPDATE leads SET stage = ?, win_reason = ? WHERE id = ?`, [
        stage,
        winReason,
        id,
      ]);
    } else {
      await db.run(`UPDATE leads SET stage = ? WHERE id = ?`, [stage, id]);
    }
    if (previousStage !== stage) {
      const reasonNote = lossReason
        ? ` (motivo: ${lossReason})`
        : winReason
          ? ` (motivo: ${winReason})`
          : '';
      await logActivity(db, {
        leadId: id,
        userId,
        action: 'stage_changed',
        fromValue: previousStage,
        toValue: `${stage}${reasonNote}`,
      });
    }
    saveDatabase();
    res.json({ success: true, stage, leadId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Lead Tags directly
leadsRouter.put('/leads/:id/tags', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { tags, userId } = req.body;
    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'Tags deve ser um array de strings' });
    }
    const db = await getDatabase();
    const company = tenantCompany(req);
    const beforeRes = await db.exec(
      `SELECT tags FROM leads WHERE id = ? AND ${LEAD_COMPANY_CLAUSE}`,
      [id, company],
    );
    if (beforeRes.length === 0 || beforeRes[0].values.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }
    const previousTags = beforeRes[0].values[0][0] ?? null;
    const tagsJson = JSON.stringify(tags);

    await db.run(`UPDATE leads SET tags = ? WHERE id = ?`, [tagsJson, id]);
    if (previousTags !== tagsJson) {
      await logActivity(db, {
        leadId: id,
        userId,
        action: 'tags_changed',
        fromValue: previousTags,
        toValue: tagsJson,
      });
    }
    saveDatabase();
    res.json({ success: true, tags, leadId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update Lead General Info
leadsRouter.put('/leads/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      stage,
      tags,
      decision_maker_name,
      decision_maker_title,
      decision_maker_email,
      decision_maker_linkedin,
      cnpj,
      phone,
      corporate_email,
      website,
      address,
      userId,
    } = req.body;

    const db = await getDatabase();
    const company = tenantCompany(req);

    const currentRes = await db.exec(
      `SELECT cnpj, phone, corporate_email, decision_maker_email FROM leads WHERE id = ? AND ${LEAD_COMPANY_CLAUSE}`,
      [id, company],
    );
    if (currentRes.length === 0 || currentRes[0].values.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }
    const currentRow = currentRes[0].values[0] || [];
    const validationErrors = validateChangedLeadFields(
      { cnpj, phone, corporate_email, decision_maker_email },
      {
        cnpj: currentRow[0],
        phone: currentRow[1],
        corporate_email: currentRow[2],
        decision_maker_email: currentRow[3],
      },
    );
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(' ') });
    }

    if (stage !== undefined) {
      const beforeRes = await db.exec(`SELECT stage FROM leads WHERE id = ?`, [id]);
      const previousStage = beforeRes[0]?.values[0]?.[0] ?? null;
      await db.run(`UPDATE leads SET stage = ? WHERE id = ?`, [stage, id]);
      if (previousStage !== stage) {
        await logActivity(db, {
          leadId: id,
          userId,
          action: 'stage_changed',
          fromValue: previousStage,
          toValue: stage,
        });
      }
    }
    if (tags !== undefined) {
      await db.run(`UPDATE leads SET tags = ? WHERE id = ?`, [JSON.stringify(tags), id]);
    }
    if (decision_maker_name !== undefined) {
      await db.run(`UPDATE leads SET decision_maker_name = ? WHERE id = ?`, [
        decision_maker_name,
        id,
      ]);
    }
    if (decision_maker_title !== undefined) {
      await db.run(`UPDATE leads SET decision_maker_title = ? WHERE id = ?`, [
        decision_maker_title,
        id,
      ]);
    }
    if (decision_maker_email !== undefined) {
      await db.run(`UPDATE leads SET decision_maker_email = ? WHERE id = ?`, [
        decision_maker_email,
        id,
      ]);
    }
    if (decision_maker_linkedin !== undefined) {
      await db.run(`UPDATE leads SET decision_maker_linkedin = ? WHERE id = ?`, [
        decision_maker_linkedin,
        id,
      ]);
    }
    if (cnpj !== undefined) {
      await db.run(`UPDATE leads SET cnpj = ? WHERE id = ?`, [cnpj, id]);
    }
    if (phone !== undefined) {
      await db.run(`UPDATE leads SET phone = ? WHERE id = ?`, [phone, id]);
    }
    if (corporate_email !== undefined) {
      await db.run(`UPDATE leads SET corporate_email = ? WHERE id = ?`, [corporate_email, id]);
    }
    if (website !== undefined) {
      await db.run(`UPDATE leads SET website = ? WHERE id = ?`, [website, id]);
    }
    if (address !== undefined) {
      await db.run(`UPDATE leads SET address = ? WHERE id = ?`, [address, id]);
    }
    saveDatabase();
    res.json({ success: true, leadId: id });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Save Lead Comprehensive Edits directly
leadsRouter.post('/leads/:id/save', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const leadData = req.body;

    const db = await getDatabase();
    const company = tenantCompany(req);

    const currentRes = await db.exec(
      `SELECT cnpj, phone, corporate_email, decision_maker_email FROM leads WHERE id = ? AND ${LEAD_COMPANY_CLAUSE}`,
      [id, company],
    );
    if (currentRes.length === 0 || currentRes[0].values.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }
    const currentRow = currentRes[0].values[0] || [];
    const validationErrors = validateChangedLeadFields(
      {
        cnpj: leadData.cnpj,
        phone: leadData.phone,
        corporate_email: leadData.corporate_email,
        decision_maker_email: leadData.decision_maker_email,
      },
      {
        cnpj: currentRow[0],
        phone: currentRow[1],
        corporate_email: currentRow[2],
        decision_maker_email: currentRow[3],
      },
    );
    if (validationErrors.length > 0) {
      return res.status(400).json({ error: validationErrors.join(' ') });
    }

    const userId = leadData.userId;

    if (leadData.stage) {
      const beforeRes = await db.exec(`SELECT stage FROM leads WHERE id = ?`, [id]);
      const previousStage = beforeRes[0]?.values[0]?.[0] ?? null;
      if (leadData.lossReason !== undefined && leadData.winReason !== undefined) {
        await db.run(`UPDATE leads SET stage = ?, loss_reason = ?, win_reason = ? WHERE id = ?`, [
          leadData.stage,
          leadData.lossReason,
          leadData.winReason,
          id,
        ]);
      } else if (leadData.lossReason !== undefined) {
        await db.run(`UPDATE leads SET stage = ?, loss_reason = ? WHERE id = ?`, [
          leadData.stage,
          leadData.lossReason,
          id,
        ]);
      } else if (leadData.winReason !== undefined) {
        await db.run(`UPDATE leads SET stage = ?, win_reason = ? WHERE id = ?`, [
          leadData.stage,
          leadData.winReason,
          id,
        ]);
      } else {
        await db.run(`UPDATE leads SET stage = ? WHERE id = ?`, [leadData.stage, id]);
      }
      if (previousStage !== leadData.stage) {
        const reasonNote = leadData.lossReason
          ? ` (motivo: ${leadData.lossReason})`
          : leadData.winReason
            ? ` (motivo: ${leadData.winReason})`
            : '';
        await logActivity(db, {
          leadId: id,
          userId,
          action: 'stage_changed',
          fromValue: previousStage,
          toValue: `${leadData.stage}${reasonNote}`,
        });
      }
    }
    if (leadData.tags) {
      await db.run(`UPDATE leads SET tags = ? WHERE id = ?`, [JSON.stringify(leadData.tags), id]);
    }
    if (leadData.cnpj) {
      await db.run(`UPDATE leads SET cnpj = ? WHERE id = ?`, [leadData.cnpj, id]);
    }
    if (leadData.phone) {
      await db.run(`UPDATE leads SET phone = ? WHERE id = ?`, [leadData.phone, id]);
    }
    if (leadData.corporate_email) {
      await db.run(`UPDATE leads SET corporate_email = ? WHERE id = ?`, [
        leadData.corporate_email,
        id,
      ]);
    }
    if (leadData.website) {
      await db.run(`UPDATE leads SET website = ? WHERE id = ?`, [leadData.website, id]);
    }
    if (leadData.address) {
      await db.run(`UPDATE leads SET address = ? WHERE id = ?`, [leadData.address, id]);
    }
    if (leadData.decision_maker_name) {
      await db.run(`UPDATE leads SET decision_maker_name = ? WHERE id = ?`, [
        leadData.decision_maker_name,
        id,
      ]);
    }
    if (leadData.decision_maker_title) {
      await db.run(`UPDATE leads SET decision_maker_title = ? WHERE id = ?`, [
        leadData.decision_maker_title,
        id,
      ]);
    }
    if (leadData.decision_maker_email) {
      await db.run(`UPDATE leads SET decision_maker_email = ? WHERE id = ?`, [
        leadData.decision_maker_email,
        id,
      ]);
    }
    if (leadData.decision_maker_linkedin) {
      await db.run(`UPDATE leads SET decision_maker_linkedin = ? WHERE id = ?`, [
        leadData.decision_maker_linkedin,
        id,
      ]);
    }
    if (leadData.company_linkedin !== undefined) {
      await db.run(`UPDATE leads SET company_linkedin = ? WHERE id = ?`, [
        leadData.company_linkedin,
        id,
      ]);
    }
    if (leadData.assigned_to !== undefined) {
      const beforeRes = await db.exec(`SELECT assigned_to FROM leads WHERE id = ?`, [id]);
      const previousAssignee = beforeRes[0]?.values[0]?.[0] ?? null;
      await db.run(`UPDATE leads SET assigned_to = ? WHERE id = ?`, [leadData.assigned_to, id]);
      if (previousAssignee !== leadData.assigned_to) {
        await logActivity(db, {
          leadId: id,
          userId,
          action: 'reassigned',
          fromValue: previousAssignee,
          toValue: leadData.assigned_to,
        });
      }
    }
    if (leadData.activity_notes !== undefined) {
      await db.run(`UPDATE leads SET activity_notes = ? WHERE id = ?`, [
        leadData.activity_notes,
        id,
      ]);
    }
    if (leadData.activity_context !== undefined) {
      await db.run(`UPDATE leads SET activity_context = ? WHERE id = ?`, [
        leadData.activity_context,
        id,
      ]);
    }

    if (leadData.copies) {
      const channels = [
        'cold_call',
        'cold_email',
        'whatsapp',
        'linkedin',
        'objection_matrix',
        'qualification_matrix',
        'ice_breaker',
      ] as const;
      for (const ch of channels) {
        if (leadData.copies[ch]) {
          const msgId = `msg-${id}-${ch}`;
          try {
            await db.run(`UPDATE messages SET content = ? WHERE id = ?`, [
              leadData.copies[ch],
              msgId,
            ]);
          } catch (_e: any) {}
        }
      }
    }

    saveDatabase();
    res.json({ success: true, message: 'Dados do lead salvos com sucesso!' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Second Stage: News & Public Sources Enrichment with Script Generation
leadsRouter.post(
  '/leads/:id/enrich-news',
  heavyAiLimiter,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { pitch, aiConfig, tone, force } = req.body;
      const db = await getDatabase();
      const company = tenantCompany(req);

      const leadRes = await db.exec(`SELECT * FROM leads WHERE id = ? AND ${LEAD_COMPANY_CLAUSE}`, [
        id,
        company,
      ]);
      if (leadRes.length === 0 || leadRes[0].values.length === 0) {
        return res.status(404).json({ error: 'Lead não encontrado.' });
      }

      const cols = leadRes[0].columns;
      const rawLead: any = {};
      cols.forEach((col, idx) => {
        rawLead[col] = leadRes[0].values[0][idx];
      });

      let dmEmails: string[] = [];
      try {
        if (rawLead.decision_maker_emails) {
          dmEmails = JSON.parse(rawLead.decision_maker_emails);
        }
      } catch (_e: any) {
        dmEmails = [rawLead.decision_maker_email];
      }
      if (dmEmails.length === 0 && rawLead.decision_maker_email) {
        dmEmails = [rawLead.decision_maker_email];
      }

      let dmPhones: string[] = [];
      try {
        if (rawLead.decision_maker_phones) {
          dmPhones = JSON.parse(rawLead.decision_maker_phones);
        }
      } catch (_e: any) {
        dmPhones = [rawLead.decision_maker_phone || rawLead.phone].filter(Boolean);
      }
      if (dmPhones.length === 0 && (rawLead.decision_maker_phone || rawLead.phone)) {
        dmPhones = [rawLead.decision_maker_phone || rawLead.phone];
      }

      const lead: Lead = {
        ...rawLead,
        decision_makers: rawLead.decision_maker_name
          ? [
              {
                name: rawLead.decision_maker_name,
                title: rawLead.decision_maker_title || '',
                email: rawLead.decision_maker_email || dmEmails[0] || '',
                emails: dmEmails,
                phone: rawLead.decision_maker_phone || dmPhones[0] || '',
                phones: dmPhones,
                linkedin: rawLead.decision_maker_linkedin || '',
              },
            ]
          : [],
      };

      const defaultPitch =
        pitch ||
        'A Atlas conecta pessoas e tecnologia gerando valores com segurança e inteligência logística.';
      const storedEvidence = await getFieldEvidence(db, 'lead', id);
      const enrichedData = await enrichLeadWithPublicNewsAndScripts(
        lead,
        defaultPitch,
        aiConfig || {
          provider: 'ollama',
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: 'llama3',
        },
        tone,
        storedEvidence,
      );

      const newsDossierJson = JSON.stringify(enrichedData.news_dossier);
      await db.run(`UPDATE leads SET news_dossier = ?, is_enriched = 1 WHERE id = ?`, [
        newsDossierJson,
        id,
      ]);

      const channels = [
        'cold_call',
        'cold_email',
        'whatsapp',
        'linkedin',
        'objection_matrix',
        'qualification_matrix',
        'ice_breaker',
      ] as const;
      const finalCopies: Record<string, string> = {};
      let anySkipped = false;
      for (const ch of channels) {
        const msgId = `msg-${id}-${ch}`;
        const { content, skipped } = await upsertMessageWithVersioning(db, {
          msgId,
          campaignId: rawLead.campaign_id || 'camp-default',
          leadId: id,
          channel: ch,
          content: enrichedData.copies[ch] || '',
          engineUsed: enrichedData.engineUsed,
          force: Boolean(force),
        });
        finalCopies[ch] = content;
        if (skipped) anySkipped = true;
      }

      saveDatabase();

      res.json({
        success: true,
        leadId: id,
        news_dossier: enrichedData.news_dossier,
        copies: finalCopies,
        engineUsed: enrichedData.engineUsed,
        personalization_level: enrichedData.personalization_level,
        skippedSentMessages: anySkipped,
        message: anySkipped
          ? `Lead "${lead.name}" enriquecido — algum roteiro já marcado como "enviado" foi preservado (use force para sobrescrever).`
          : `Lead "${lead.name}" enriquecido com sucesso com notícias públicas e novos roteiros!`,
      });
    } catch (err: any) {
      console.error('Erro no enriquecimento de notícias:', err);
      res.status(500).json({ error: err.message || 'Falha ao enriquecer lead com notícias.' });
    }
  },
);

// Dedicated On-Demand AI Copy Generation (Runs only when user requests)
leadsRouter.post(
  '/leads/:id/generate-copies',
  heavyAiLimiter,
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { pitch, aiConfig, force } = req.body;
      const db = await getDatabase();
      const company = tenantCompany(req);

      const leadRes = await db.exec(`SELECT * FROM leads WHERE id = ? AND ${LEAD_COMPANY_CLAUSE}`, [
        id,
        company,
      ]);
      if (leadRes.length === 0 || leadRes[0].values.length === 0) {
        return res.status(404).json({ error: 'Lead não encontrado.' });
      }

      const cols = leadRes[0].columns;
      const rawLead: any = {};
      cols.forEach((col, idx) => {
        rawLead[col] = leadRes[0].values[0][idx];
      });

      let dmEmails: string[] = [];
      try {
        if (rawLead.decision_maker_emails) {
          dmEmails = JSON.parse(rawLead.decision_maker_emails);
        }
      } catch (_e: any) {
        dmEmails = [rawLead.decision_maker_email];
      }

      let dmPhones: string[] = [];
      try {
        if (rawLead.decision_maker_phones) {
          dmPhones = JSON.parse(rawLead.decision_maker_phones);
        }
      } catch (_e: any) {
        dmPhones = [rawLead.decision_maker_phone || rawLead.phone].filter(Boolean);
      }

      const mainDm: DecisionMaker = {
        name: rawLead.decision_maker_name || '',
        title: rawLead.decision_maker_title || '',
        email: rawLead.decision_maker_email || dmEmails[0] || '',
        emails: dmEmails,
        phone: rawLead.decision_maker_phone || dmPhones[0] || rawLead.phone || '',
        phones: dmPhones,
        linkedin: rawLead.decision_maker_linkedin || '',
      };

      const lead: Lead = {
        ...rawLead,
        decision_makers: [mainDm],
      };

      const defaultPitch =
        pitch ||
        'A Atlas conecta pessoas e tecnologia gerando valores com segurança e inteligência logística.';
      const storedEvidence = await getFieldEvidence(db, 'lead', id);
      const { copies, engineUsed, personalization_level } = await generateCopiesWithEngine(
        lead,
        defaultPitch,
        aiConfig || {
          provider: 'ollama',
          ollamaUrl: 'http://localhost:11434',
          ollamaModel: 'llama3',
        },
        mainDm,
        storedEvidence,
      );

      const channels = [
        'cold_call',
        'cold_email',
        'whatsapp',
        'linkedin',
        'objection_matrix',
        'qualification_matrix',
        'ice_breaker',
      ] as const;
      const finalCopies: Record<string, string> = {};
      let anySkipped = false;
      for (const ch of channels) {
        const msgId = `msg-${id}-${ch}`;
        const result = await upsertMessageWithVersioning(db, {
          msgId,
          campaignId: rawLead.campaign_id || 'camp-default',
          leadId: id,
          channel: ch,
          content: copies[ch] || '',
          engineUsed,
          force: Boolean(force),
        });
        finalCopies[ch] = result.content;
        if (result.skipped) anySkipped = true;
      }

      saveDatabase();

      res.json({
        success: true,
        leadId: id,
        copies: finalCopies,
        engineUsed,
        personalization_level,
        skippedSentMessages: anySkipped,
        message: anySkipped
          ? `Roteiros gerados — algum já marcado como "enviado" foi preservado (use force para sobrescrever).`
          : `Roteiros comerciais gerados com sucesso para ${rawLead.name}!`,
      });
    } catch (err: any) {
      console.error('Erro na geração de copys sob demanda:', err);
      res.status(500).json({ error: err.message || 'Falha ao gerar roteiros comerciais.' });
    }
  },
);

// Aprendizado contínuo
const VALID_COPY_FEEDBACK = ['used_as_is', 'edited', 'not_used'] as const;
leadsRouter.post(
  '/leads/:id/copies/:channel/feedback',
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { id, channel } = req.params;
      const { feedback } = req.body;
      if (!VALID_COPY_FEEDBACK.includes(feedback)) {
        return res
          .status(400)
          .json({ error: `feedback deve ser um de: ${VALID_COPY_FEEDBACK.join(', ')}` });
      }
      const db = await getDatabase();
      const company = tenantCompany(req);
      if (!(await leadBelongsToCompany(db, id, company))) {
        return res.status(404).json({ error: 'Lead não encontrado.' });
      }
      const msgId = `msg-${id}-${channel}`;
      await db.run(`UPDATE messages SET feedback = ? WHERE id = ?`, [feedback, msgId]);
      saveDatabase();
      res.json({ success: true, leadId: id, channel, feedback });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Falha ao registrar feedback do roteiro.' });
    }
  },
);

// Refresh / Update CNPJ for a Lead
leadsRouter.post('/leads/:id/cnpj-refresh', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { cnpj } = req.body;
    const db = await getDatabase();
    const company = tenantCompany(req);

    const leadRes = await db.exec(`SELECT * FROM leads WHERE id = ? AND ${LEAD_COMPANY_CLAUSE}`, [
      id,
      company,
    ]);
    if (leadRes.length === 0 || leadRes[0].values.length === 0) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }

    const cols = leadRes[0].columns;
    const currentLead: any = {};
    cols.forEach((col, idx) => {
      currentLead[col] = leadRes[0].values[0][idx];
    });

    const targetCnpj = cnpj || currentLead.cnpj;
    const cnpjData = await resolveAndEnrichCnpjForLead({
      name: currentLead.name,
      domain: currentLead.domain,
      cnpj: targetCnpj,
      address: currentLead.address,
    });

    await db.run(
      `
      UPDATE leads 
      SET cnpj = ?, razao_social = ?, situacao_cadastral = ?, cnae_fiscal = ?, cnae_fiscal_descricao = ?, capital_social = ?, qsa = ?
      WHERE id = ?
    `,
      [
        cnpjData.cnpj,
        cnpjData.razao_social,
        cnpjData.situacao_cadastral,
        cnpjData.cnae_fiscal,
        cnpjData.cnae_fiscal_descricao,
        cnpjData.capital_social,
        JSON.stringify(cnpjData.qsa || []),
        id,
      ],
    );

    saveDatabase();

    res.json({
      success: true,
      leadId: id,
      cnpjData,
      message: `CNPJ ${cnpjData.cnpj} atualizado com dados oficiais da Receita Federal!`,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Evidence & Provenance
leadsRouter.get('/leads/:id/evidence', requireAuth, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const db = await getDatabase();
    const company = tenantCompany(req);
    if (!(await leadBelongsToCompany(db, id, company))) {
      return res.status(404).json({ error: 'Lead não encontrado.' });
    }
    const evidence = await getFieldEvidence(db, 'lead', id);
    res.json({ leadId: id, evidence });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Prospecting Pipeline — handler extraído para prospect.routes.ts (handoff 40→43).
// Montado aqui para preservar requireTenantScope (leadsRouter.use acima) e a
// ordem de middlewares (heavyAiLimiter + requireAuth por rota).
leadsRouter.use(prospectRouter);
