/**
 * TAREFA-SANEAMENTO-040 (BT360-DT-0090) — Scanner de vazamento de PII em logs.
 *
 * Varre saída de aplicação (stdout/stderr capturado, arquivos de log, dumps) em
 * busca de padrões de dado pessoal que NUNCA devem aparecer em log:
 *
 *  - CPF (`000.000.000-00` ou 11 dígitos com contexto);
 *  - CNPJ;
 *  - e-mail;
 *  - telefone brasileiro (fixo/celular, com/sem +55 e DDI);
 *  - cartão de crédito (13–19 dígitos com separadores, validado por Luhn);
 *  - token de sessão Bearer/JWT cru (heurística, reporta mas não é PII —
 *    classificado como SECRET para não mascarar o relatório de PII).
 *
 * Uso:
 *   npx tsx scripts/security/pii-log-scanner.ts <arquivo|diretório> [...]
 *   npx tsx scripts/security/pii-log-scanner.ts --stdin < app.log
 *   npx tsx scripts/security/pii-log-scanner.ts --self-test   # injeção + varredura
 *
 * Exit code: 0 = limpo; 1 = achados de PII/segredo; 2 = erro de uso/I/O.
 * Saída nunca ecoa o valor encontrado — apenas tipo, arquivo, linha e amostra
 * com o trecho suspeito mascarado (LGPD: o relatório não pode virar nova fonte
 * de vazamento).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, join, resolve } from 'node:path';
import { stdin } from 'node:process';
import { fileURLToPath } from 'node:url';

export type PiiKind = 'CPF' | 'CNPJ' | 'EMAIL' | 'PHONE' | 'CARD' | 'SECRET';

export interface PiiFinding {
  kind: PiiKind;
  /** Linha lógica (1-based) dentro do conteúdo varrido. */
  line: number;
  /** Trecho mascarado ao redor do achado — nunca o valor completo. */
  maskedSnippet: string;
}

const PATTERNS: Array<{ kind: PiiKind; re: RegExp }> = [
  { kind: 'CPF', re: /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b|\b\d{11}\b/g },
  { kind: 'CNPJ', re: /\b\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}\b/g },
  { kind: 'EMAIL', re: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
  {
    kind: 'PHONE',
    re: /(?:\+?55[\s.-]?)?\(?\d{2}\)?[\s.-]?(?:9\d{4}|\d{4})[\s.-]?\d{4}\b/g,
  },
  { kind: 'CARD', re: /\b(?:\d[ -]?){13,19}\b/g },
  {
    kind: 'SECRET',
    re: /\b(?:Bearer\s+)?eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{5,}\b/g,
  },
];

/** Luhn — evita falso positivo de CARD em sequências numéricas inocentes. */
function luhnOk(digits: string): boolean {
  let sum = 0;
  let dbl = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = digits.charCodeAt(i) - 48;
    if (dbl) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
    dbl = !dbl;
  }
  return sum % 10 === 0;
}

function mask(value: string): string {
  if (value.length <= 4) return '****';
  return `${value.slice(0, 2)}${'*'.repeat(Math.min(value.length - 4, 6))}${value.slice(-2)}`;
}

/** Varre um texto e retorna achados (valor original nunca é exposto). */
export function scanText(text: string): PiiFinding[] {
  const findings: PiiFinding[] = [];
  const lines = text.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Faixas de padrões numéricos de maior prioridade (CPF/CNPJ/cartão) — um PAN ou
    // documento não deve ser reportado também como PHONE (falso positivo de substring).
    const numericSpans: Array<[number, number]> = [];
    {
      const re =
        /\b(?:\d{3}\.\d{3}\.\d{3}-\d{2}|\d{11}|\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}|(?:\d[ -]?){13,19})\b/g;
      for (const m of line.matchAll(re)) {
        const digits = m[0].replace(/\D/g, '');
        const looksLikeCard = digits.length >= 13;
        if (looksLikeCard && !luhnOk(digits)) continue;
        numericSpans.push([m.index ?? 0, (m.index ?? 0) + m[0].length]);
      }
    }
    const overlapsNumeric = (start: number, end: number) =>
      numericSpans.some(([s, e]) => start < e && end > s);
    for (const { kind, re } of PATTERNS) {
      for (const m of line.matchAll(re)) {
        if (kind === 'CARD') {
          const digits = m[0].replace(/\D/g, '');
          if (digits.length < 13 || digits.length > 19 || !luhnOk(digits)) continue;
        }
        if (kind === 'PHONE') {
          const digits = m[0].replace(/\D/g, '');
          // Exige 10–13 dígitos para reduzir FP (datas, ids curtos).
          if (digits.length < 10 || digits.length > 13) continue;
          const idx = m.index ?? 0;
          if (overlapsNumeric(idx, idx + m[0].length)) continue;
        }
        if (kind === 'SECRET' && !/^eyJ/.test(m[0].replace(/^Bearer\s+/, ''))) continue;
        findings.push({
          kind,
          line: i + 1,
          maskedSnippet: mask(m[0]),
        });
      }
    }
  }
  return findings;
}

function collectFiles(targets: string[]): string[] {
  const out: string[] = [];
  for (const t of targets) {
    const p = resolve(t);
    const st = statSync(p, { throwIfNoEntry: false });
    if (!st) throw new Error(`caminho inexistente: ${t}`);
    if (st.isDirectory()) {
      for (const e of readdirSync(p, { withFileTypes: true, recursive: true })) {
        if (e.isFile()) out.push(join(e.parentPath ?? e.path, e.name));
      }
    } else {
      out.push(p);
    }
  }
  return out;
}

function selfTest(): number {
  const samples: Array<[string, PiiKind[]]> = [
    ['usuário cpf 123.456.789-09 acessou', ['CPF']],
    ['cnpj 12.345.678/0001-90 inválido de propósito', ['CNPJ']],
    ['contato maria@empresa.com.br', ['EMAIL']],
    ['ligue para (11) 98765-4321', ['PHONE']],
    ['cartão 4111 1111 1111 1111', ['CARD']],
    [
      'token eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U',
      ['SECRET'],
    ],
    ['linha limpa sem dado pessoal', []],
  ];
  let failed = 0;
  for (const [text, expected] of samples) {
    const got = [...new Set(scanText(text).map((f) => f.kind))].sort();
    const exp = [...expected].sort();
    const ok = JSON.stringify(got) === JSON.stringify(exp);
    if (!ok) failed++;
    console.log(
      `${ok ? 'PASS' : 'FAIL'} ${JSON.stringify(exp)} → ${JSON.stringify(got)} :: ${text.slice(0, 60)}`,
    );
  }
  console.log(failed === 0 ? 'self-test: OK' : `self-test: ${failed} falha(s)`);
  return failed === 0 ? 0 : 1;
}

function main(): number {
  const args = process.argv.slice(2);
  if (args.includes('--self-test')) return selfTest();

  const targets = args.filter((a) => !a.startsWith('--'));
  const useStdin = args.includes('--stdin');
  if (useStdin) {
    const chunks: Buffer[] = [];
    stdin.on('data', (c) => chunks.push(c as Buffer));
    stdin.on('end', () => {
      const findings = scanText(Buffer.concat(chunks).toString('utf8'));
      report(findings, '<stdin>');
      process.exit(findings.length > 0 ? 1 : 0);
    });
    return 0;
  }
  if (targets.length === 0) {
    console.error('uso: pii-log-scanner.ts <arquivo|diretório> [...] | --stdin | --self-test');
    return 2;
  }

  let total = 0;
  try {
    for (const file of collectFiles(targets)) {
      const findings = scanText(readFileSync(file, 'utf8'));
      if (findings.length > 0) report(findings, file);
      total += findings.length;
    }
  } catch (err) {
    console.error(`[pii-log-scanner] ERRO: ${err instanceof Error ? err.message : String(err)}`);
    return 2;
  }
  console.log(
    total === 0
      ? '[pii-log-scanner] limpo — nenhum padrão de PII/segredo encontrado'
      : `[pii-log-scanner] ${total} achado(s) — ver relatório acima`,
  );
  return total > 0 ? 1 : 0;
}

function report(findings: PiiFinding[], source: string): void {
  const label = basename(source);
  for (const f of findings) {
    console.log(`${label}:${f.line} [${f.kind}] ${f.maskedSnippet}`);
  }
}

// Só executa CLI quando invocado diretamente (não em import por teste).
const invokedAs = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedAs === fileURLToPath(import.meta.url)) {
  process.exit(main());
}
