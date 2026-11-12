import client from 'prom-client';
import { getTenantId } from '../../../lib/async-context.js';
import { logger } from '../../../lib/logger.js';
import { prisma } from '../../../lib/prisma.js';
import { cacheConnection, redisConfigured } from '../../../lib/queue/redis.js';
import { AppError } from '../../../shared/middlewares/errorHandler.js';

/** Providers de prospecção faturáveis — definido aqui (não em `providerCostMetrics.ts`) para
 * evitar um ciclo de import: `providerCostMetrics.ts` já depende deste arquivo em runtime
 * (`recordProspectingProviderSpend`), então a dependência do tipo segue a mesma direção.
 * `providerCostMetrics.ts` reexporta este tipo para quem já importava de lá. */
export type ProspectingCostProvider = 'apollo' | 'hunter';

/**
 * Custo estimado por chamada bem-sucedida a cada provider faturável (Apollo/Hunter). Definido
 * AQUI (e não em `providerCostMetrics.ts`) pelo mesmo motivo de `ProspectingCostProvider`:
 * `providerCostMetrics.ts` já depende deste arquivo em runtime, então a dependência segue uma
 * direção só — este módulo pode usar `getCostPerCallUsd` no débito atômico
 * (`consumeProspectingProviderCredit`, RN-MKT-03 / AC-MKT-003) sem criar ciclo de import.
 * `providerCostMetrics.ts` reexporta estas funções para quem já importava de lá.
 *
 * Fonte do custo por chamada: nem Apollo nem Hunter devolvem custo/crédito consumido no corpo da
 * resposta — é uma ESTIMATIVA CONSERVADORA fixa por chamada, documentada em
 * `providerCostMetrics.ts` (que mantém a justificativa detalhada dos valores e dos overrides por
 * env). Ajustável via PROSPECTING_APOLLO_COST_PER_CALL_USD /
 * PROSPECTING_HUNTER_COST_PER_CALL_USD.
 */
export const DEFAULT_PROVIDER_COST_PER_CALL_USD: Record<ProspectingCostProvider, number> = {
  apollo: 0.01,
  hunter: 0.02,
};

function envVarNameFor(provider: ProspectingCostProvider): string {
  return provider === 'apollo'
    ? 'PROSPECTING_APOLLO_COST_PER_CALL_USD'
    : 'PROSPECTING_HUNTER_COST_PER_CALL_USD';
}

/** Lê o custo estimado por chamada (env), com fallback à estimativa conservadora documentada. */
export function getCostPerCallUsd(
  provider: ProspectingCostProvider,
  environment: NodeJS.ProcessEnv = process.env,
): number {
  const raw = environment[envVarNameFor(provider)];
  const parsed = raw != null ? Number(raw) : NaN;
  if (Number.isFinite(parsed) && parsed >= 0) return parsed;
  return DEFAULT_PROVIDER_COST_PER_CALL_USD[provider];
}

/**
 * DEC-09 (dossiê CPI, onda 42, opção B escolhida pelo usuário): teto REAL (bloqueante) de gasto
 * mensal de provider de prospecção (Apollo/Hunter), por organização. Diferente de
 * `providerCostMetrics.ts` (Counter Prometheus só de observação — sem rótulo de organização nem
 * corte por mês, documentado ali como "NÃO é um teto/orçamento"), este módulo aplica o bloqueio de
 * verdade.
 *
 * Diferença deliberada em relação a `src/lib/ai/budget.ts` (o mesmo tipo de circuit breaker para
 * IA): lá, o custo acumulado por organização já existe em Postgres (`AILog.organizationId` +
 * `cost`) — só faltava a checagem. Aqui NÃO existe hoje nenhuma tabela com o custo de Apollo/Hunter
 * por organização (nem por chamada) — `providerCostMetrics.ts` só incrementa um Counter Prometheus
 * sem rótulo de tenant, que também não tem corte por mês (Counter só cresce, nunca é comparável
 * entre "este mês" e "mês passado" sem uma tabela ou reset explícito). Uma tabela Postgres nova
 * (o equivalente de AILog para custo de provider) resolveria isso com a mesma robustez do lado de
 * IA, mas exigiria uma migration de schema além dos dois campos em Organization já pedidos no
 * handoff (`.agents/handoffs/onda-42/03-para-00-campo-orcamento-organization.md`) — fora do meu
 * boundary nesta execução (não editar `prisma/schema.prisma`).
 *
 * Solução adotada enquanto essa tabela não existe: Redis (`cacheConnection`, já usado como
 * armazenamento durável — não só cache — por outros módulos deste mesmo domínio, ex. o token
 * bucket de `providerRateLimit.ts`) com uma chave por (organização, mês) incrementada via
 * `INCRBYFLOAT`. Isso é REAL bloqueio, não só observação: sobrevive a restart do processo (ao
 * contrário de um contador em memória) e é compartilhado entre todos os processos web (ao
 * contrário do Counter Prometheus, que é por processo). Quando Redis não está configurado (dev
 * local sem REDIS_URL, ou instância caída), cai para um Map em memória por processo — mesmo
 * trade-off já aceito por `providerRateLimit.ts`/`providerCache.ts` neste mesmo domínio: proteção
 * pior nesse cenário (não compartilhada entre processos, não sobrevive a restart), mas nunca o
 * motivo de um 5xx, e nunca finge ser mais durável do que é.
 *
 * Ver o handoff citado acima para a recomendação de migrar isto para uma tabela Postgres dedicada
 * assim que ela existir — o contrato público (`recordProspectingProviderSpend`,
 * `getOrgMonthProspectingCostUsd`, `assertProspectingBudgetNotExceeded`) não precisa mudar, só a
 * implementação interna.
 */

const REDIS_KEY_PREFIX = 'prospecting-budget:org:';
// ~2 meses: cobre qualquer atraso entre o fim do mês e a última leitura dele, sem deixar a chave
// viver para sempre no Redis (cada mês novo já usa uma chave própria, então a antiga só precisa
// sobreviver o suficiente para qualquer consulta tardia — nunca precisa ser lida de novo depois
// disso).
const REDIS_KEY_TTL_SECONDS = 60 * 60 * 24 * 62;

// UTC, não hora local: se o processo rodar num servidor num fuso atrás de UTC (ex.: America/
// Sao_Paulo, UTC-3), `getFullYear()`/`getMonth()` ainda reportam o mês anterior nas primeiras horas
// do dia 1 — a virada do teto mensal de prospecção dependeria do fuso do container em vez de ser
// determinística. Achado real ao investigar um teste flaky (`escopa o acumulado pelo mês corrente`
// em providerBudget.test.ts) que só falhava em máquinas num fuso atrás de UTC.
function currentMonthKey(date: Date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

function buildKey(organizationId: string, monthKey: string = currentMonthKey()): string {
  return `${REDIS_KEY_PREFIX}${organizationId}:${monthKey}`;
}

// Fallback em memória — bounded (mesma eviction simples "mais antigo inserido" de providerCache.ts)
// para nunca crescer sem limite num processo de vida longa.
const MEMORY_MAX_ENTRIES = 1000;
const memoryTotals = new Map<string, number>();

function memoryIncr(key: string, amountUsd: number): number {
  const current = memoryTotals.get(key) ?? 0;
  const next = current + amountUsd;
  if (!memoryTotals.has(key) && memoryTotals.size >= MEMORY_MAX_ENTRIES) {
    const oldestKey = memoryTotals.keys().next().value;
    if (oldestKey !== undefined) memoryTotals.delete(oldestKey);
  }
  memoryTotals.set(key, next);
  return next;
}

/**
 * Versão SÍNCRONA de check-and-debit do fallback em memória. Como não há `await` entre a leitura
 * do total e a escrita, o bloco inteiro é atômico dentro do processo Node (single-threaded) —
 * é o equivalente em memória do script Lua atômico usado no caminho Redis. Chamadas concorrentes
 * no mesmo processo nunca ultrapassam o teto: cada uma observa o total já debitado pelas anteriores.
 */
function memoryTryDebit(
  key: string,
  amountUsd: number,
  budgetUsd: number,
): { allowed: boolean; total: number } {
  const current = memoryTotals.get(key) ?? 0;
  const next = current + amountUsd;
  if (next > budgetUsd) {
    return { allowed: false, total: current };
  }
  if (!memoryTotals.has(key) && memoryTotals.size >= MEMORY_MAX_ENTRIES) {
    const oldestKey = memoryTotals.keys().next().value;
    if (oldestKey !== undefined) memoryTotals.delete(oldestKey);
  }
  memoryTotals.set(key, next);
  return { allowed: true, total: next };
}

/**
 * Débito atômico check-and-add no Redis: incrementa o acumulado do mês e, na MESMA execução
 * Lua (sem janela entre ler e escrever), desfaz o incremento se o novo total passar do teto.
 * Retorna 1 quando o débito foi efetivado, 0 quando bloqueado. É o equivalente Redis do
 * `SELECT ... FOR UPDATE` pedido pela auditoria (RN-MKT-03 / AC-MKT-003): sem este script, o par
 * `GET`+comparação de `assertProspectingBudgetNotExceeded` seguido de `INCRBYFLOAT` tardio
 * (recordProspectingProviderSpend, pós-chamada) deixava duas requisições concorrentes passarem
 * juntas pelo check e estourarem o teto (double-spend).
 */
const ATOMIC_DEBIT_LUA = `
local cost = tonumber(ARGV[1])
local budget = tonumber(ARGV[2])
local ttl = tonumber(ARGV[3])
local current = redis.call('INCRBYFLOAT', KEYS[1], cost)
if current > budget then
  redis.call('DECRBYFLOAT', KEYS[1], cost)
  return 0
end
redis.call('EXPIRE', KEYS[1], ttl)
return 1
`;

/** Lê o total gravado para UMA chave (Redis ou memória) — best-effort, usado só para a
 * mensagem do erro de bloqueio; nunca deve propagar falha de leitura. */
async function readStoredTotal(key: string): Promise<number> {
  if (redisConfigured) {
    try {
      const raw = await cacheConnection.get(key);
      return raw != null ? Number(raw) : 0;
    } catch {
      return 0;
    }
  }
  return memoryTotals.get(key) ?? 0;
}

/** Só para testes: limpa o fallback em memória entre casos. */
export function __resetProspectingBudgetForTests(): void {
  memoryTotals.clear();
}

/**
 * Registra `costUsd` no acumulado do mês corrente da organização (via `getTenantId()`, a menos que
 * `organizationId` seja passado explicitamente — usado pelos testes). Chamado por
 * `recordProviderCallCost` (providerCostMetrics.ts) logo depois de incrementar o Counter
 * Prometheus, sempre com o MESMO valor (mesma estimativa por chamada). Nunca lançado ao chamador
 * (best-effort: uma falha ao gravar o gasto nunca deve derrubar a resposta ao usuário que já
 * recebeu o resultado real do provider) — só logado.
 */
export async function recordProspectingProviderSpend(
  provider: ProspectingCostProvider,
  costUsd: number,
  organizationId: string | undefined = getTenantId(),
): Promise<void> {
  if (!organizationId) return; // chamada sem tenant conhecido (script/worker) — nada a debitar por organização
  if (!Number.isFinite(costUsd) || costUsd <= 0) return;

  const key = buildKey(organizationId);
  if (redisConfigured) {
    try {
      await cacheConnection.incrbyfloat(key, costUsd);
      await cacheConnection.expire(key, REDIS_KEY_TTL_SECONDS);
      return;
    } catch (err: any) {
      logger.warn(
        { err, organizationId, provider },
        'providerBudget: falha ao gravar gasto no Redis — usando fallback em memória só para esta chamada',
      );
    }
  }
  memoryIncr(key, costUsd);
}

/** Gasto acumulado (USD) do mês corrente de UMA organização com providers de prospecção pagos. */
export async function getOrgMonthProspectingCostUsd(organizationId: string): Promise<number> {
  const key = buildKey(organizationId);
  if (redisConfigured) {
    try {
      const raw = await cacheConnection.get(key);
      return raw != null ? Number(raw) : 0;
    } catch (err: any) {
      logger.warn(
        { err, organizationId },
        'providerBudget: falha ao ler gasto do Redis — tratando como custo desconhecido (nunca bloqueia por falha de leitura)',
      );
      return 0;
    }
  }
  return memoryTotals.get(key) ?? 0;
}

/**
 * Teto mensal de prospecção configurado para UMA organização
 * (`Organization.monthlyProspectingBudgetUsd`). `null`/ausente = sem teto (nunca bloqueia).
 */
async function getOrgProspectingBudgetUsd(organizationId: string): Promise<number | null> {
  try {
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { monthlyProspectingBudgetUsd: true },
    });
    return org?.monthlyProspectingBudgetUsd ?? null;
  } catch (err: any) {
    logger.warn(
      { err, organizationId },
      'providerBudget: falha ao ler o teto mensal de prospecção da organização — tratando como sem teto configurado',
    );
    return null;
  }
}

export const prospectingBudgetBlockedTotal = new client.Counter({
  name: 'prospecting_budget_blocked_total',
  help: 'Chamadas a providers de prospecção (Apollo/Hunter) bloqueadas pelo teto mensal por organização (DEC-09, Organization.monthlyProspectingBudgetUsd), por organização e provider.',
  labelNames: ['organization', 'provider'] as const,
});

export class ProspectingBudgetExceededError extends AppError {
  constructor(
    public readonly organizationId: string,
    public readonly provider: ProspectingCostProvider,
    public readonly monthCostUsd: number,
    public readonly budgetUsd: number,
  ) {
    super(
      `Orçamento mensal de prospecção (Apollo/Hunter) desta organização foi atingido ` +
        `(US$ ${monthCostUsd.toFixed(2)} de US$ ${budgetUsd.toFixed(2)}). Novas buscas em providers pagos de ` +
        'prospecção estão bloqueadas para esta organização até o início do próximo mês ou até o teto mensal ' +
        'de prospecção da organização ser aumentado.',
      429,
    );
    this.name = 'ProspectingBudgetExceededError';
  }
}

/**
 * Ponto único de checagem, chamado ANTES de qualquer chamada de rede real a Apollo/Hunter — mesmo
 * lugar (e mesma forma "cheque, então retorne/lance cedo") onde `checkProviderRateLimit` já é
 * checado em cada um dos 7 pontos de chamada reais (apollo/organizationSearch.ts,
 * apollo/organizationEnrich.ts, apollo/people.ts ×3, hunter.service.ts ×2).
 *
 * Fail-OPEN (nunca bloqueia) quando: (a) não há organização conhecida no `requestContext` —
 * chamada de worker/script sem tenant; ou (b) a organização não tem teto configurado
 * (`monthlyProspectingBudgetUsd` nulo — nullable significa SEM LIMITE, nunca um teto implícito de
 * US$0). Fail-CLOSED (bloqueia, lançando `ProspectingBudgetExceededError`) só quando um teto real
 * está configurado E foi atingido/excedido — mesma decisão de segurança/produto documentada (e
 * pendente de confirmação) no handoff citado acima, espelhando `assertAiBudgetNotExceeded`.
 */
export async function assertProspectingBudgetNotExceeded(
  provider: ProspectingCostProvider,
): Promise<void> {
  const organizationId = getTenantId();
  if (!organizationId) return;

  const budgetUsd = await getOrgProspectingBudgetUsd(organizationId);
  if (budgetUsd === null) return;

  const monthCostUsd = await getOrgMonthProspectingCostUsd(organizationId);
  if (monthCostUsd >= budgetUsd) {
    prospectingBudgetBlockedTotal.inc({ organization: organizationId, provider });
    throw new ProspectingBudgetExceededError(organizationId, provider, monthCostUsd, budgetUsd);
  }
}

/**
 * RN-MKT-03 / AC-MKT-003 (MOD-02, JOR-02): "débito atômico no ledger antes da chamada externa".
 *
 * Diferente de `assertProspectingBudgetNotExceeded` (que só LÊ o acumulado e decide — o débito
 * real só acontecia depois, via `recordProspectingProviderSpend` pós-resposta, abrindo a janela
 * de double-spend sob concorrência), esta função debita o custo estimado da chamada
 * (`getCostPerCallUsd`) de forma ATÔMICA no ledger do mês ANTES de qualquer byte sair para o
 * provider: no Redis via script Lua check-and-add (INCRBYFLOAT + rollback condicional na mesma
 * execução), no fallback em memória via seção síncrona sem `await` entre leitura e escrita.
 *
 * Chame no lugar de `assertProspectingBudgetNotExceeded`, no mesmo ponto dos 7 call sites
 * faturáveis (antes de `fetchWithProviderRetry`). Uma chamada bloqueada lança
 * `ProspectingBudgetExceededError` (HTTP 429) — o provider nunca é contatado.
 *
 * Trade-off consciente: o débito acontece mesmo se a chamada de rede falhar depois (timeout,
 * HTTP 5xx) — a tentativa já é potencialmente faturável pelo provider e o lado seguro é sempre
 * cobrar. Mesma política fail-open/fail-closed de `assertProspectingBudgetNotExceeded`:
 * sem organização no contexto ou sem teto configurado (`monthlyProspectingBudgetUsd` nulo) =
 * nunca bloqueia e nada é debitado; Redis configurado mas falhando = cai para o fallback em
 * memória só desta chamada (proteção por processo, documentada no topo do arquivo).
 *
 * `recordProviderCallCost` (providerCostMetrics.ts) continua sendo chamado após `res.ok` nos
 * mesmos pontos, mas passou a alimentar SÓ o Counter Prometheus de observação — o ledger
 * durável por organização/mês é alimentado exclusivamente por esta função, para não contar
 * duas vezes.
 */
export async function consumeProspectingProviderCredit(
  provider: ProspectingCostProvider,
  organizationId: string | undefined = getTenantId(),
): Promise<void> {
  if (!organizationId) return;

  const budgetUsd = await getOrgProspectingBudgetUsd(organizationId);
  if (budgetUsd === null) return; // sem teto configurado = sem débito e sem bloqueio

  const costUsd = getCostPerCallUsd(provider);
  if (!Number.isFinite(costUsd) || costUsd <= 0) return;

  const key = buildKey(organizationId);
  let allowed: boolean;
  let monthCostUsd: number;

  if (redisConfigured) {
    try {
      const result = await cacheConnection.eval(
        ATOMIC_DEBIT_LUA,
        1,
        key,
        String(costUsd),
        String(budgetUsd),
        String(REDIS_KEY_TTL_SECONDS),
      );
      allowed = result === 1 || result === '1';
      monthCostUsd = allowed ? 0 : await readStoredTotal(key);
    } catch (err: any) {
      logger.warn(
        { err, organizationId, provider },
        'providerBudget: falha no débito atômico via Redis — usando fallback em memória só para esta chamada',
      );
      const mem = memoryTryDebit(key, costUsd, budgetUsd);
      allowed = mem.allowed;
      monthCostUsd = mem.total;
    }
  } else {
    const mem = memoryTryDebit(key, costUsd, budgetUsd);
    allowed = mem.allowed;
    monthCostUsd = mem.total;
  }

  if (!allowed) {
    prospectingBudgetBlockedTotal.inc({ organization: organizationId, provider });
    throw new ProspectingBudgetExceededError(organizationId, provider, monthCostUsd, budgetUsd);
  }
}
