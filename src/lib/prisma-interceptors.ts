import {
  ENCRYPTED_MODEL_FIELDS,
  encryptSensitiveFields,
} from './crypto/piiFields.js';
import { computeContactPiiIndexes } from './crypto/piiIndex.js';
import { tryDecryptField } from './crypto/secretFields.js';
import { TENANT_INJECTED_MODELS } from './tenant-scoping-registry.js';

// Interceptores PUROS da extensão `$allOperations` do Prisma Client (src/lib/prisma.ts),
// extraídos para este módulo sem nenhuma dependência de `@prisma/client` instanciado/`pg`/
// `prom-client` — mesmo padrão já usado por `src/lib/crypto/piiFields.ts` — justamente para que
// cada etapa do pipeline de interceptação (injeção de tenant, cifragem de PII em escrita, filtro
// de soft delete em leitura, allowlist de bypass de RLS, descriptografia aninhada de PII) possa
// ser testada em unidade de forma isolada, sem importar prisma.ts inteiro (que cria um `Pool`
// do `pg` e registra métricas Prometheus no top-level do módulo).
//
// TAREFA-SANEAMENTO-013 (BT360-DT-0010, handoff
// .agents/handoffs/onda-saneamento-20261110/00-para-01-hotspot-arquitetural-critico-em-src-lib-prisma-ts-acumulando-multiplas.md):
// prisma.ts acumulava TODAS as responsabilidades do ORM num único arquivo de ~930 linhas;
// esta extração é deliberadamente cirúrgica — só a lógica de transformação de args/decisão de
// bypass, que é pura e autocontida. A orquestração que depende do client (`executeWithRls`,
// transação interativa, propagação de tx, auditoria e fila de busca) permanece em prisma.ts.
// Nenhuma mudança de comportamento: cada função abaixo é uma cópia fiel do bloco que existia
// inline em `$allOperations`, incluindo mutação in-place de `args` (o Prisma reusa o mesmo
// objeto de args na operação seguinte da cadeia de extensão).

/**
 * Allowlist de models para os quais `bypassRls` tem efeito EM PRODUÇÃO. Fora de produção
 * (`NODE_ENV !== 'production'`), `bypassRls` vale para qualquer model — ver comentário do
 * ponto de chamada em prisma.ts e os testes de integração que dependem disso.
 *
 * BitrixConnection entrou nesta allowlist só para o lookup de bootstrap do webhook de
 * entrada do Bitrix (ver bitrix.webhook.ts): a rota recebe apenas um connectionId (cuid,
 * não adivinhável) na URL e um segredo no corpo, sem JWT — não há tenant conhecido até
 * achar a conexão. O mesmo modelo de confiança das tabelas de identidade abaixo (um
 * token/id opaco É a credencial, não o "estar logado"). O bypass aqui só cobre esta ÚNICA
 * query (findUnique por id); toda leitura/escrita seguinte roda dentro de
 * requestContext.run({ tenantId: connection.organizationId }) com RLS normal, igual ao
 * padrão já usado pelo lookup de Organization em runBitrixSyncTick (syncRules.ts).
 * FeatureFlag entrou nesta allowlist por um motivo diferente das tabelas de identidade
 * acima: não tem organizationId (catálogo global, ver prisma/schema.prisma), e é
 * sincronizada em server.ts no BOOT do processo (featureFlagsService.syncRegistry()),
 * antes de qualquer request HTTP existir — logo sem tenantId nem sessão possíveis. A
 * policy de RLS da tabela (app_context_policy, ver migration
 * 20260815030000_feature_flags_and_bug_reports) exige app.bypass_rls='on' nesse caso
 * porque `INSERT ... ON CONFLICT DO UPDATE` (o que Prisma `upsert` gera) precisa da
 * visibilidade da cláusula USING para checar conflito, mesmo indo pelo ramo de INSERT.
 * Sem este bypass, o catálogo de flags nunca seria semeado em produção. Zero risco de
 * vazamento cross-tenant: a tabela não tem nenhuma linha "de uma organização" para vazar.
 * CadenceRun/CadenceSequence entraram nesta allowlist pelo mesmo motivo já documentado acima
 * para BitrixConnection: o worker de cadência (CYC-008, onda-19) precisa descobrir QUAIS
 * organizações têm CadenceRun ativo antes de saber qual tenant escopar — sem isso, a
 * varredura cross-tenant devolve sempre 0 linhas em produção (confirmado por teste de
 * integração real: FORCE ROW LEVEL SECURITY nessas tabelas nega qualquer leitura sem
 * app.current_tenant_id OU app.bypass_rls setados, e nenhum dos dois é setado numa query sem
 * contexto de request). bypassRls só cobre esta descoberta inicial: assim que o worker sabe o
 * `organizationId` de cada run, todo o resto do ciclo (`advanceCadenceRun`, dispatch,
 * gravação em CadenceTouchAttempt) roda escopado normalmente por tenant, sem bypass — nenhum
 * dado de outra organização é lido além da lista de runs ativos e das sequências que eles
 * referenciam (nenhuma delas contém credencial ou dado pessoal do lead, diferente de
 * BitrixConnection).
 * Lead entrou nesta allowlist pelo MESMO motivo e pelo MESMO teste de integração real que
 * confirmou CadenceRun/CadenceSequence: `followUp.worker.ts` (job diário de follow-up de
 * WhatsApp, cron 0 9 * * *) varre leads elegíveis de TODAS as organizações antes de saber
 * qual tenant escopar, exatamente como o worker de cadência. Sem isto, essa varredura
 * sempre devolvia 0 linhas em produção — o follow-up automático nunca disparava para
 * ninguém, silenciosamente (nenhum erro, nenhum log de falha: o worker via "0 leads
 * elegíveis hoje" e seguia em frente). O `include: { contact: true }` da mesma query
 * também precisa do bypass: a política de RLS é por sessão Postgres (`app.bypass_rls`),
 * não por model do Prisma, então o JOIN para Contact dentro dessa MESMA transação herda o
 * mesmo bypass — inerente ao que este worker já precisa fazer (ler telefone de leads de
 * qualquer tenant para decidir quem mensagear), não uma exposição nova. bypassRls só cobre
 * esta descoberta inicial: o envio real e o `Lead.update` seguinte rodam escopados por
 * tenant (`requestContext.run({ tenantId: lead.organizationId })`), sem bypass.
 * CrmCommercialDocument entrou nesta allowlist pelo MESMO motivo/modelo de confiança já
 * documentado acima para BitrixConnection: a rota pública de rastreamento de visualização
 * (CYC-005, onda 25 — `GET /api/public/proposals/:token/view`, sem authenticateToken)
 * recebe só um `publicToken` opaco (uuid, não adivinhável) na URL — não há tenant conhecido
 * até achar o documento. O bypass aqui cobre só o `findUnique` por `publicToken`; a
 * atualização real de `viewCount`/`firstViewedAt`/`lastViewedAt`/`status` roda dentro de
 * `requestContext.run({ tenantId: doc.organizationId })` com RLS normal, igual ao lookup de
 * BitrixConnection.
 * AILog entrou nesta allowlist por um motivo DIFERENTE de todos os anteriores: não é uma
 * descoberta de bootstrap (achar o tenant e depois voltar a operar escopado) — é uma leitura
 * agregada genuinamente cross-tenant, permanente, usada pelo circuit breaker de orçamento
 * mensal de IA (AI-011, `src/lib/ai/budget.ts`), que precisa saber o custo acumulado de IA
 * da PLATAFORMA inteira no mês corrente antes de cada chamada, não de uma organização por
 * vez. Seguro porque a única operação que usa este bypass é `prisma.aILog.aggregate({ _sum:
 * { cost: true } })` — devolve um único número somado, nunca uma linha, nunca um
 * organizationId específico; nenhuma API expõe esse bypass a um tenant (é lido só dentro do
 * próprio gateway de IA, uma decisão interna de bloquear ou não a chamada). Continua sem
 * bypass a leitura por-organização já existente (`usageService.summary`/`GET /api/usage`,
 * escopada normalmente por `requestContext.run({ tenantId })`).
 * Company foi CONSIDERADO para esta allowlist (accountIntelligenceInsights.worker.ts/
 * newsMonitor.worker.ts precisavam descobrir contas cross-tenant) e revertido:
 * `tests/integration/rls-bypass-allowlist.test.ts` prova, a nível de banco, que Company foi
 * deliberadamente excluído do bypass pela migration 20260825120000 (ITEM-02) — dado
 * comercial sensível, raio de explosão maior que as tabelas de bootstrap/sessão já aqui. Os
 * dois workers descobrem organização por organização via bypass em `Organization` (já
 * permitido abaixo) e escopam `Company` por tenant real (`requestContext.run({ tenantId })`)
 * a cada organização — nunca leem `Company` sob bypass.
 * PublicBookingLink entrou nesta allowlist pelo MESMO motivo/modelo de confiança já
 * documentado acima para CrmCommercialDocument: as duas rotas públicas de agendamento
 * (`GET`/`POST /api/public/book/:slug`, sem authenticateToken) recebem só um `slug` opaco
 * (regex restrita, não sequencial) na URL — não há tenant conhecido até achar o link.
 * Achado real (auditoria de release-readiness, database-integrity): a tabela nunca teve
 * RLS habilitada via migration (ver `20260908090000_public_booking_link_create_and_rls`),
 * e o `findUnique` por slug em `booking.routes.ts` roda sem bypass — habilitar RLS sem
 * este bypass quebraria a busca pública em produção (a policy negaria a linha sem
 * `app.current_tenant_id`/`app.bypass_rls` setados). O bypass aqui cobre só o `findUnique`
 * por `slug`; o restante do fluxo (criação de Company/Contact/Lead/Activity a partir do
 * agendamento) já roda escopado por tenant real (`requestContext.run({ tenantId:
 * link.organizationId })`), igual ao lookup de CrmCommercialDocument/BitrixConnection.
 * VoiceHubConnection entrou nesta allowlist pelo MESMO motivo/modelo de confiança já
 * documentado acima para BitrixConnection (ACH-06-01): o webhook de resultado de ligação
 * do Birth Voices Hub (`birthVoice.webhook.ts::handleWebhook`) é uma rota única
 * compartilhada por todas as organizações, sem JWT nem `connectionId` na URL — o
 * `organizationId` do payload não é confiável até a assinatura HMAC bater contra o
 * segredo de UMA conexão específica. O bypass aqui cobre só o `findMany` por
 * `organizationId` (candidato, ainda não confiável) usado para escolher quais segredos
 * tentar; toda escrita seguinte (`recordCallResult`) já roda dentro de
 * `requestContext.run({ tenantId: organizationId })` com RLS normal, só depois de a
 * assinatura ter validado esse organizationId.
 *
 * As tabelas de identidade do Better Auth (User/Organization/Session/Account/Verification)
 * são o caso original: as rotas de login/signup/sessão precisam localizar usuário/sessão/
 * organização antes de haver um tenant conhecido.
 */
export const BYPASS_RLS_ALLOWED_MODELS = [
  'User',
  'Organization',
  'Session',
  'Account',
  'Verification',
  'BitrixConnection',
  'FeatureFlag',
  'CadenceRun',
  'CadenceSequence',
  'Lead',
  'CrmCommercialDocument',
  'CrmDocumentSignatureRequest',
  'AILog',
  'PublicBookingLink',
  'VoiceHubConnection',
];

/**
 * Resolve se o `bypassRls` do requestContext vale para ESTA operação. `isProduction` é
 * passado explicitamente (em vez de ler `env.NODE_ENV` aqui) para manter este módulo livre de
 * dependência de `src/config/env.ts` e testável em qualquer ambiente.
 */
export function resolveBypassRls(
  rawBypassRls: boolean,
  model: string,
  isProduction: boolean,
): boolean {
  return rawBypassRls && (!isProduction || BYPASS_RLS_ALLOWED_MODELS.includes(model));
}

/**
 * Models auditáveis: toda escrita (create/update/delete) gera registro em AuditLog e delete
 * vira soft delete (`deletedAt`/`deletedBy`/`deleteReason`) em vez de remoção física; leituras
 * (findFirst/findMany/count/aggregate/groupBy) ganham `where.deletedAt = null` automático.
 */
export const AUDITABLE_MODELS = [
  'Company',
  'Contact',
  'Lead',
  'Activity',
  'CrmPipeline',
  'CrmProduct',
  'CrmDealItem',
  'CrmCommercialDocument',
  'Attachment',
];

export function isAuditableModel(model: string): boolean {
  return AUDITABLE_MODELS.includes(model);
}

/**
 * Injeta `organizationId` do tenant da request em toda escrita (create/createMany/upsert/
 * update/updateMany) dos models de `TENANT_INJECTED_MODELS` — rede de segurança adicional à
 * RLS do Postgres para os models "core" gravados direto pelo client global. Mutação in-place
 * de `args`, exatamente como o bloco inline fazia. No `upsert`, o `update` tem
 * `organizationId` REMOVIDO de propósito (`delete`, não `= undefined`): guarda de segurança
 * multi-tenant — preferimos remover a chave de verdade a confiar em como o Prisma trata um
 * valor undefined neste campo específico.
 */
export function injectTenantIntoWriteArgs(
  args: unknown,
  model: string,
  operation: string,
  tenantId: string | undefined,
): void {
  if (!tenantId || !TENANT_INJECTED_MODELS.includes(model)) return;
  const a = args as Record<string, unknown>;
  if (operation === 'create' || operation === 'createMany') {
    if (a.data) {
      if (Array.isArray(a.data)) {
        a.data = (a.data as Record<string, unknown>[]).map((d) => ({
          ...d,
          organizationId: tenantId,
        }));
      } else {
        a.data = { ...(a.data as Record<string, unknown>), organizationId: tenantId };
      }
    }
  }
  if (operation === 'upsert') {
    if (a.create) {
      a.create = { ...(a.create as Record<string, unknown>), organizationId: tenantId };
    }
    // Evita que o usuário mude o organizationId no update de um upsert
    if (a.update && typeof a.update === 'object' && 'organizationId' in a.update) {
      // `delete` de propósito, não `= undefined`: guarda de segurança multi-tenant —
      // preferimos remover a chave de verdade a confiar em como o Prisma trata um valor
      // undefined neste campo específico.
      // biome-ignore lint/performance/noDelete: ver comentário acima
      delete (a.update as Record<string, unknown>).organizationId;
    }
  }
  if (operation === 'update' || operation === 'updateMany') {
    if (a.data && typeof a.data === 'object' && 'organizationId' in a.data) {
      // `delete` de propósito, não `= undefined`: guarda de segurança multi-tenant —
      // preferimos remover a chave de verdade a confiar em como o Prisma trata um valor
      // undefined neste campo específico.
      // biome-ignore lint/performance/noDelete: ver comentário acima
      delete (a.data as Record<string, unknown>).organizationId;
    }
  }
}

/**
 * Criptografia de credenciais/PII em repouso (write) — campos listados em
 * `ENCRYPTED_MODEL_FIELDS` (src/lib/crypto/encryptedModelFields.ts) são cifrados
 * (AES-256-GCM, ver src/lib/crypto/secretFields.ts) antes de chegar ao banco, de forma
 * transparente para o resto do código.
 *
 * Índice cego de Contact (ver piiIndex.ts): precisa ser calculado ANTES de
 * `encryptSensitiveFields` (que substitui email/phone/whatsapp pelo ciphertext no mesmo
 * objeto `data`) — senão o índice seria computado sobre o ciphertext, não sobre o valor
 * normalizado real, e nunca bateria com uma busca feita a partir do texto puro recebido.
 *
 * `partial: true` (update/updateMany/upsert.update) só inclui no patch o índice do
 * campo que o próprio `data` está tocando — um `update({ data: { name: 'x' } })` que não
 * toca email/phone/whatsapp NÃO PODE apagar o índice já gravado desses campos (senão
 * qualquer edição parcial do contato zeraria a busca exata dele). `partial: false`
 * (create/createMany/upsert.create) sempre grava o conjunto completo, inclusive null
 * para um contato novo sem e-mail/telefone.
 */
export function applyPiiEncryptionToWriteArgs(
  args: unknown,
  model: string,
  operation: string,
): void {
  if (!ENCRYPTED_MODEL_FIELDS[model]) return;
  const a = args as Record<string, unknown>;
  const withContactIndex = (
    d: Record<string, unknown>,
    partial: boolean,
  ): Record<string, unknown> => {
    if (model !== 'Contact') return d;
    const all = computeContactPiiIndexes({
      email: d.email as string | null | undefined,
      phone: d.phone as string | null | undefined,
      whatsapp: d.whatsapp as string | null | undefined,
    });
    if (!partial) return { ...d, ...all };
    const patch: Record<string, unknown> = {};
    if ('email' in d) {
      patch.emailIndex = all.emailIndex;
      patch.emailDomainIndex = all.emailDomainIndex;
    }
    if ('phone' in d) {
      patch.phoneIndex = all.phoneIndex;
      patch.phoneLast8Index = all.phoneLast8Index;
      patch.phoneLast9Index = all.phoneLast9Index;
    }
    if ('whatsapp' in d) {
      patch.whatsappIndex = all.whatsappIndex;
      patch.whatsappLast8Index = all.whatsappLast8Index;
      patch.whatsappLast9Index = all.whatsappLast9Index;
    }
    return { ...d, ...patch };
  };
  if (operation === 'create' && a.data) {
    a.data = encryptSensitiveFields(
      model,
      withContactIndex(a.data as Record<string, unknown>, false),
    );
  } else if ((operation === 'update' || operation === 'updateMany') && a.data) {
    a.data = encryptSensitiveFields(
      model,
      withContactIndex(a.data as Record<string, unknown>, true),
    );
  } else if (operation === 'createMany' && Array.isArray(a.data)) {
    a.data = (a.data as Record<string, unknown>[]).map((d) =>
      encryptSensitiveFields(model, withContactIndex(d, false)),
    );
  } else if (operation === 'upsert') {
    if (a.create)
      a.create = encryptSensitiveFields(
        model,
        withContactIndex(a.create as Record<string, unknown>, false),
      );
    if (a.update)
      a.update = encryptSensitiveFields(
        model,
        withContactIndex(a.update as Record<string, unknown>, true),
      );
  }
}

/**
 * Soft Delete (Read Filtering): models auditáveis nunca devolvem registros com
 * `deletedAt` preenchido em leituras. Mutação in-place de `args.where`.
 */
export function applySoftDeleteReadFilter(
  args: unknown,
  model: string,
  operation: string,
): void {
  if (!isAuditableModel(model)) return;
  if (
    !['findFirst', 'findFirstOrThrow', 'findMany', 'count', 'aggregate', 'groupBy'].includes(
      operation,
    )
  ) {
    return;
  }
  const a = args as Record<string, unknown>;
  a.where = { ...(a.where as Record<string, unknown>), deletedAt: null };
}

const CONTACT_PII_FIELDS = ['email', 'phone', 'whatsapp'] as const;
const NESTED_CONTACT_PII_MAX_DEPTH = 6;

/**
 * Decifra `email`/`phone`/`whatsapp` (ver `ENCRYPTED_MODEL_FIELDS.Contact` em
 * `src/lib/crypto/piiFields.ts`) em QUALQUER profundidade de um resultado do Prisma, não só
 * no nível do model da própria operação. `decryptSensitiveResult` só decifra quando Contact
 * é o MODEL da operação (`prisma.contact.findMany(...)`) — uma query de outro model que traz
 * Contact junto via `include`/`select` aninhado (ex.: `prisma.lead.findFirst({ include: {
 * contact: true } })`) nunca passa por ali, e o e-mail/telefone/whatsapp do contato voltariam
 * como ciphertext cru para quem espera texto puro.
 *
 * Em vez de mapear cada relação que aponta pra Contact (frágil — quebra de novo a cada
 * relação nova), decifra POR FORMA: qualquer valor de string em `email`/`phone`/`whatsapp`,
 * em qualquer profundidade do resultado, que comece com o prefixo versionado `enc:v1:`
 * (`decryptField` já trata qualquer outro valor como texto legado/sem cifra e devolve sem
 * alteração) — idempotente mesmo quando já decifrado pelo passo de decrypt do model.
 * Muda os objetos em memória mesmo (mesmo padrão dos outros passos desta extensão) — o
 * resultado de uma query do Prisma não é reutilizado por mais ninguém depois de sair daqui.
 */
export function decryptNestedContactPii(value: unknown, depth = 0): unknown {
  if (depth > NESTED_CONTACT_PII_MAX_DEPTH || value === null || value === undefined) return value;
  if (value instanceof Date) return value;
  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      value[i] = decryptNestedContactPii(value[i], depth + 1);
    }
    return value;
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const id = typeof obj.id === 'string' ? obj.id : undefined;
    for (const field of CONTACT_PII_FIELDS) {
      const v = obj[field];
      if (typeof v === 'string' && v.startsWith('enc:v1:')) {
        // tryDecryptField isola a falha a ESTE campo/registro em vez de derrubar toda a query
        // (ver secretFields.ts) — incidente real de produção corrigido nesta rodada de
        // finalização: um único Contact com PII indecifrável quebrava qualquer listagem de
        // leads que o incluísse via relação aninhada.
        obj[field] = tryDecryptField(v, { model: 'Contact', field, id });
      }
    }
    for (const key of Object.keys(obj)) {
      const v = obj[key];
      if (v && typeof v === 'object') decryptNestedContactPii(v, depth + 1);
    }
    return obj;
  }
  return value;
}
