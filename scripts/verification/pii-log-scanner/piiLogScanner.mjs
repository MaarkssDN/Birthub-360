/**
 * piiLogScanner.mjs — Agente 22 (Verificação de Realidade)
 * TAREFA-SANEAMENTO-040 / BT360-DT-0090 — harness de injeção e varredura de PII em logs.
 *
 * Objetivo: dar ao projeto um verificador determinístico e contínuo de que stdout/stderr da
 * aplicação não vazam dados pessoais (e-mail, CPF/CNPJ, telefone, cartão, tokens, segredos).
 * Auditor externo precisa de prova reproduzível: este módulo é a prova — qualquer log capturado
 * pode ser varrido com `scan-pii-logs.mjs` (CLI) ou `scanTextForPii`/`assertNoPii` (programático).
 *
 * Regras de segurança do próprio scanner:
 * - NUNCA devolve o valor de PII encontrado em claro — findings carregam apenas o nome do padrão,
 *   linha/coluna e um preview mascarado. Um scanner que vaza o que procura seria pior que o vazamento.
 * - Valores mascarados pelo próprio logger (`***`, `<redacted>`, `[REDACTED]`, hashes) não são
 *   reportados — evita falso positivo em logs já sanitizados (ver src/lib/logger.ts e
 *   scripts/verify-auth-log-redaction.mjs).
 *
 * Uso:
 *   import { scanTextForPii, assertNoPii, createPiiCanaries } from './piiLogScanner.mjs';
 *   const findings = scanTextForPii(logText);           // [] = limpo
 *   assertNoPii(logText, { context: 'startup' });       // lança se houver vazamento
 *   const canaries = createPiiCanaries();               // PII sintético único p/ injeção
 */

// Cada padrão é avaliado por linha (logs são line-oriented). `name` é o identificador estável
// usado em relatórios/auditoria — não renomear sem versionar o contrato.
export const PII_PATTERNS = [
  {
    name: 'email',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
  },
  {
    name: 'cpf-formatado',
    regex: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g,
  },
  {
    name: 'cnpj-formatado',
    regex: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g,
  },
  {
    name: 'telefone-br-com-ddd',
    regex: /\(\d{2}\)\s?9?\d{4}[-\s]?\d{4}\b/g,
  },
  {
    name: 'telefone-br-ddi',
    regex: /\+55[\s.-]?\(?\d{2}\)?[\s.-]?9?\d{4}[-\s]?\d{4}\b/g,
  },
  {
    name: 'cartao-grupos-de-4',
    regex: /\b(?:\d{4}[ -]){3}\d{4}\b/g,
  },
  {
    name: 'jwt',
    regex: /\beyJ[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\.[A-Za-z0-9_-]{8,}\b/g,
  },
  {
    name: 'aws-access-key',
    regex: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
  },
  {
    name: 'chave-privada',
    regex: /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/g,
  },
  {
    name: 'bearer-token',
    regex: /\bBearer\s+[A-Za-z0-9._~+/=-]{20,}/gi,
  },
  {
    // Atribuições do tipo password=..., api_key: "...", secret: '...' — o valor precisa ter
    // >= 8 chars e não ser um placeholder mascarado.
    name: 'segredo-atribuido',
    regex:
      /\b(?:password|passwd|pwd|secret|api[_-]?key|access[_-]?token|refresh[_-]?token|client[_-]?secret)\b\s*[:=]\s*["'`]?([^\s"'`,;}]{8,})/gi,
  },
];

// Placeholders que indicam valor já mascarado pelo logger — não são vazamento.
const MASKED_VALUE = /^(?:\*+|x+|•+|<redacted>|\[redacted\]|\[masked\]|null|undefined|none)$/i;

function maskPreview(value) {
  const trimmed = value.trim();
  if (trimmed.length <= 2) return '***';
  return `${trimmed.slice(0, 2)}${'*'.repeat(Math.min(trimmed.length - 2, 6))}`;
}

function isMasked(match) {
  const candidate = match.trim();
  return MASKED_VALUE.test(candidate) || /^\*+$/.test(candidate);
}

/**
 * Varre um texto (tipicamente stdout/stderr capturado) e retorna findings de PII.
 * Cada finding: { line, column, pattern, masked } — `masked` é um preview seguro para log,
 * nunca o PII em claro.
 */
export function scanTextForPii(text) {
  const findings = [];
  const lines = String(text).split(/\r?\n/);
  lines.forEach((line, lineIndex) => {
    for (const { name, regex } of PII_PATTERNS) {
      regex.lastIndex = 0;
      let match = regex.exec(line);
      while (match !== null) {
        // Para padrões com grupo de captura (segredo-atribuido), mascara o VALOR capturado,
        // não o "password=" inteiro — o nome do campo não é PII.
        const raw = name === 'segredo-atribuido' && match[1] ? match[1] : match[0];
        if (!isMasked(raw)) {
          const column = match.index + (name === 'segredo-atribuido' && match[1]
            ? match[0].indexOf(match[1])
            : 0);
          findings.push({
            line: lineIndex + 1,
            column: column + 1,
            pattern: name,
            masked: maskPreview(raw),
          });
        }
        // Evita loop infinito em regex que casam string vazia.
        if (match[0].length === 0) regex.lastIndex += 1;
        match = regex.exec(line);
      }
    }
  });
  return findings;
}

/**
 * Lança erro se `text` contiver PII. A mensagem lista findings mascarados — segura para CI/log.
 * Retorna o array de findings (vazio) para uso fluente.
 */
export function assertNoPii(text, { context = 'unspecified' } = {}) {
  const findings = scanTextForPii(text);
  if (findings.length > 0) {
    const summary = findings
      .map((f) => `  linha ${f.line}:${f.column} [${f.pattern}] ~${f.masked}`)
      .join('\n');
    throw new Error(
      `Vazamento de PII detectado em logs (${context}): ${findings.length} ocorrência(s):\n${summary}`,
    );
  }
  return findings;
}

/**
 * Gera valores de PII SINTÉTICOS e únicos para testes de injeção: injeta-se um canary no fluxo
 * sob teste e depois prova-se que ele NÃO aparece em nenhum log capturado. Valores são válidos
 * no formato (passam nos regexes) mas não pertencem a pessoa real alguma — seguro para commit
 * em fixtures e para uso em staging.
 */
export function createPiiCanaries(suffix = '') {
  const tag = suffix || `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  // 11 dígitos deriváveis do timestamp — base dos formatos CPF (9+2) e telefone (8 usados).
  const digits = String(Date.now()).slice(-11);
  return {
    email: `canary-pii-${tag}@example.invalid`,
    cpf: `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9, 11)}`,
    cnpj: `12.345.678/0001-${String(90 + (Date.now() % 10))}`,
    phone: `(11) 9${digits.slice(0, 4)}-${digits.slice(4, 8)}`,
    password: `Canary!Passw0rd-${tag}-nao-usar`,
    jwt: `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify({ sub: `canary-${tag}` })).toString('base64url')}.canarysignature${tag}abc`,
    // AKIA/ASIA + exatamente 16 chars [0-9A-Z] — os 8 dígitos do timestamp + 8 do sufixo.
    awsKey: `AKIA${digits.slice(-8)}${tag.toUpperCase().replace(/[^A-Z0-9]/g, 'X').slice(0, 8).padEnd(8, 'X')}`,
  };
}

/**
 * Verifica se um texto contém ALGUM dos canaries informados (match exato do valor).
 * Usado pelo harness de injeção: depois de exercitar o fluxo com PII canary, varre-se o log
 * capturado — qualquer ocorrência significa vazamento real.
 */
export function findCanaryLeak(logText, canaries) {
  const text = String(logText);
  const leaks = [];
  for (const [name, value] of Object.entries(canaries)) {
    if (typeof value === 'string' && value.length >= 6 && text.includes(value)) {
      leaks.push({ canary: name, masked: maskPreview(value) });
    }
  }
  return leaks;
}
