import { isValidCnpjFormat, isValidEmailFormat, isValidPhoneFormat } from '../validators.js';

// Só valida um campo quando ele está sendo de fato alterado para um valor novo —
// nunca quando é reenviado sem mudança (o botão "Salvar" manda o lead inteiro de
// volta), senão um dado legado imperfeito de um lead antigo travaria qualquer
// edição futura nele, mesmo em campos que a pessoa nem tocou.
export function validateChangedLeadFields(
  incoming: {
    cnpj?: string;
    phone?: string;
    corporate_email?: string;
    decision_maker_email?: string;
  },
  current: {
    cnpj?: string;
    phone?: string;
    corporate_email?: string;
    decision_maker_email?: string;
  },
): string[] {
  const errors: string[] = [];
  const changed = (key: keyof typeof incoming) =>
    incoming[key] !== undefined && incoming[key] !== current[key];

  if (changed('cnpj') && incoming.cnpj && !isValidCnpjFormat(incoming.cnpj)) {
    errors.push('CNPJ com formato ou dígito verificador inválido.');
  }
  if (changed('phone') && incoming.phone && !isValidPhoneFormat(incoming.phone)) {
    errors.push('Telefone precisa ter entre 10 e 13 dígitos.');
  }
  if (
    changed('corporate_email') &&
    incoming.corporate_email &&
    !isValidEmailFormat(incoming.corporate_email)
  ) {
    errors.push('E-mail corporativo com formato inválido.');
  }
  if (
    changed('decision_maker_email') &&
    incoming.decision_maker_email &&
    !isValidEmailFormat(incoming.decision_maker_email)
  ) {
    errors.push('E-mail do decisor com formato inválido.');
  }
  return errors;
}

// SQLite guarda tags/qsa/dossiê/e-mails/telefones como texto JSON. O client (LeadCard)
// espera arrays/objetos reais, então todo endpoint que devolve leads precisa passar por aqui.
export function formatLeadRow(leadObj: any, messages: any[] = []): any {
  const copies: any = {};
  let lastEngineUsed: string | null = null;
  messages.forEach((msgObj: any) => {
    if (msgObj.channel) {
      copies[msgObj.channel] = msgObj.content;
    }
    if (msgObj.engine_used) {
      lastEngineUsed = msgObj.engine_used;
    }
  });

  let tags: string[] = [];
  try {
    if (typeof leadObj.tags === 'string') {
      tags = JSON.parse(leadObj.tags);
    } else if (Array.isArray(leadObj.tags)) {
      tags = leadObj.tags;
    }
  } catch (_e: any) {
    tags = [];
  }

  let newsDossier = null;
  try {
    if (leadObj.news_dossier && typeof leadObj.news_dossier === 'string') {
      newsDossier = JSON.parse(leadObj.news_dossier);
    } else if (leadObj.news_dossier) {
      newsDossier = leadObj.news_dossier;
    }
  } catch (_e: any) {
    newsDossier = null;
  }

  let dmEmails: string[] = [];
  try {
    if (leadObj.decision_maker_emails) {
      dmEmails =
        typeof leadObj.decision_maker_emails === 'string'
          ? JSON.parse(leadObj.decision_maker_emails)
          : leadObj.decision_maker_emails;
    }
  } catch (_e: any) {
    dmEmails = leadObj.decision_maker_email ? [leadObj.decision_maker_email] : [];
  }
  if (dmEmails.length === 0 && leadObj.decision_maker_email) {
    dmEmails = [leadObj.decision_maker_email];
  }

  let dmPhones: string[] = [];
  try {
    if (leadObj.decision_maker_phones) {
      dmPhones =
        typeof leadObj.decision_maker_phones === 'string'
          ? JSON.parse(leadObj.decision_maker_phones)
          : leadObj.decision_maker_phones;
    }
  } catch (_e: any) {
    dmPhones = leadObj.decision_maker_phone ? [leadObj.decision_maker_phone] : [];
  }
  if (dmPhones.length === 0 && leadObj.decision_maker_phone) {
    dmPhones = [leadObj.decision_maker_phone];
  }

  let qsa: any[] = [];
  try {
    if (leadObj.qsa && typeof leadObj.qsa === 'string') {
      qsa = JSON.parse(leadObj.qsa);
    } else if (Array.isArray(leadObj.qsa)) {
      qsa = leadObj.qsa;
    }
  } catch (_e: any) {
    qsa = [];
  }

  leadObj.tags = tags;
  leadObj.qsa = qsa;
  leadObj.stage = leadObj.stage || 'prospecto';
  leadObj.copies = copies;
  leadObj.engine_used = lastEngineUsed;
  leadObj.copies_generated = Object.values(copies).some(
    (c: any) => typeof c === 'string' && c.trim().length > 10,
  );
  leadObj.messages = messages;
  leadObj.news_dossier = newsDossier;
  leadObj.is_enriched = Boolean(leadObj.is_enriched || newsDossier);
  leadObj.decision_maker_emails = dmEmails;
  leadObj.decision_maker_phones = dmPhones;

  leadObj.decision_makers = leadObj.decision_maker_name
    ? [
        {
          name: leadObj.decision_maker_name,
          title: leadObj.decision_maker_title || 'Decisor',
          email: leadObj.decision_maker_email || dmEmails[0] || '',
          emails: dmEmails,
          phone: leadObj.decision_maker_phone || dmPhones[0] || leadObj.phone || '',
          phones: dmPhones,
          linkedin: leadObj.decision_maker_linkedin || '',
        },
      ]
    : [];

  return leadObj;
}

// Previsibilidade: um roteiro já marcado como 'sent' (efetivamente usado com o
// cliente) não é sobrescrito silenciosamente ao regenerar — precisa de force=true
// explícito. Quando sobrescreve, guarda a versão anterior em message_versions para
// nunca perder o que já foi enviado.
export async function upsertMessageWithVersioning(
  db: any,
  params: {
    msgId: string;
    campaignId: string;
    leadId: string;
    channel: string;
    content: string;
    engineUsed?: string;
    force?: boolean;
  },
): Promise<{ content: string; skipped: boolean }> {
  const { msgId, campaignId, leadId, channel, content, engineUsed, force } = params;

  let existing: { content: string; status: string } | null = null;
  try {
    const existingRes = await db.exec(`SELECT content, status FROM messages WHERE id = ?`, [msgId]);
    if (existingRes.length > 0 && existingRes[0].values.length > 0) {
      existing = { content: existingRes[0].values[0][0], status: existingRes[0].values[0][1] };
    }
  } catch (_err: any) {
    existing = null;
  }

  if (existing && existing.status === 'sent' && !force) {
    return { content: existing.content, skipped: true };
  }

  if (existing?.content && existing.content.trim().length > 10 && existing.content !== content) {
    try {
      await db.run(
        `INSERT INTO message_versions (message_id, lead_id, channel, content, engine_used) VALUES (?, ?, ?, ?, ?)`,
        [msgId, leadId, channel, existing.content, null],
      );
    } catch (err: any) {
      console.error('Falha ao versionar mensagem anterior:', err);
    }
  }

  try {
    await db.run(
      `
      INSERT INTO messages (id, campaign_id, lead_id, channel, role, content, status, engine_used, created_at)
      VALUES (?, ?, ?, ?, 'assistant', ?, 'reviewed', ?, ?)
      ON CONFLICT(id) DO UPDATE SET content = excluded.content, status = 'reviewed', engine_used = excluded.engine_used
    `,
      [msgId, campaignId, leadId, channel, content, engineUsed || null, new Date().toISOString()],
    );
  } catch (_err: any) {
    await db.run(
      `UPDATE messages SET content = ?, status = 'reviewed', engine_used = ? WHERE id = ?`,
      [content, engineUsed || null, msgId],
    );
  }

  return { content, skipped: false };
}
