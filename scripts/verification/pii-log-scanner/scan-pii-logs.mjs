#!/usr/bin/env node
/**
 * scan-pii-logs.mjs — CLI do harness de verificação de PII em logs (Agente 22,
 * TAREFA-SANEAMENTO-040 / BT360-DT-0090).
 *
 * Uso:
 *   node scripts/verification/pii-log-scanner/scan-pii-logs.mjs <arquivo-log> [outro...]
 *   <comando que gera logs> | node scripts/verification/pii-log-scanner/scan-pii-logs.mjs -
 *   node scripts/verification/pii-log-scanner/scan-pii-logs.mjs --self-test
 *
 * Sai com código 1 se qualquer PII for encontrada (gate de CI/auditoria) e 0 se os logs estiverem
 * limpos. Findings nunca imprimem o PII em claro — apenas padrão, linha e preview mascarado.
 */

import fs from 'node:fs';
import path from 'node:path';
import {
  assertNoPii,
  createPiiCanaries,
  findCanaryLeak,
  scanTextForPii,
} from './piiLogScanner.mjs';

function usage() {
  console.error(
    'Uso: node scan-pii-logs.mjs <arquivo-log>... | - (stdin) | --self-test',
  );
  process.exit(2);
}

function scanSource(label, text, allFindings) {
  const findings = scanTextForPii(text);
  for (const f of findings) {
    allFindings.push({ source: label, ...f });
  }
  return findings.length;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks.map((c) => (Buffer.isBuffer(c) ? c : Buffer.from(c)))).toString('utf8');
}

function selfTest() {
  // Injeção: canaries sintéticos DEVEM ser detectados pelo scanner (prova de que ele não é cego).
  const canaries = createPiiCanaries('selftest');
  const dirty = [
    `login ok user=${canaries.email}`,
    `cpf=${canaries.cpf} gravado`,
    `senha informada: password="${canaries.password}"`,
    `token jwt: ${canaries.jwt}`,
    `aws: ${canaries.awsKey}`,
  ].join('\n');
  const detected = scanTextForPii(dirty);
  const leaked = findCanaryLeak(dirty, canaries);
  const clean = 'INFO servidor ouvindo na porta 3000\nWARN retry em 500ms\n';
  assertNoPii(clean, { context: 'self-test-clean' });
  if (leaked.length === 0) {
    console.error('SELF-TEST FALHOU: scanner não detectou canaries injetados.');
    process.exit(1);
  }
  if (detected.length < 4) {
    console.error(`SELF-TEST FALHOU: esperava >=4 padrões, detectou ${detected.length}.`);
    process.exit(1);
  }
  try {
    assertNoPii(dirty, { context: 'self-test-dirty' });
    console.error('SELF-TEST FALHOU: assertNoPii não lançou em texto sujo.');
    process.exit(1);
  } catch {
    // esperado — o assert deve rejeitar o log sujo
  }
  console.log(
    `SELF-TEST OK: ${detected.length} findings em log injetado, ${leaked.length} canaries vazados, log limpo aceito.`,
  );
}

async function main() {
  const args = process.argv.slice(2);
  if (args.length === 0 || (args.length === 1 && args[0] === '--help')) usage();
  if (args.includes('--self-test')) return selfTest();

  const allFindings = [];
  let totalBytes = 0;
  for (const arg of args) {
    let text;
    let label = arg;
    if (arg === '-') {
      text = await readStdin();
      label = '<stdin>';
    } else {
      const resolved = path.resolve(arg);
      if (!fs.existsSync(resolved)) {
        console.error(`Arquivo de log não encontrado: ${arg}`);
        process.exit(2);
      }
      text = fs.readFileSync(resolved, 'utf8');
    }
    totalBytes += Buffer.byteLength(text);
    scanSource(label, text, allFindings);
  }

  if (allFindings.length > 0) {
    console.error(`FALHA: ${allFindings.length} possível(is) vazamento(s) de PII em ${args.length} fonte(s):`);
    for (const f of allFindings) {
      console.error(`  ${f.source}:${f.line}:${f.column} [${f.pattern}] ~${f.masked}`);
    }
    process.exit(1);
  }
  console.log(`OK: nenhum vazamento de PII detectado (${totalBytes} bytes varridos, ${args.length} fonte(s)).`);
}

main().catch((err) => {
  console.error(`scan-pii-logs falhou: ${err?.message ?? err}`);
  process.exit(2);
});
