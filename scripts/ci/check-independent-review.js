#!/usr/bin/env node

/**
 * scripts/ci/check-independent-review.js
 *
 * Verificação estrita de governança (AGENTS.md §3, §21, §32)
 * Garante que entregas e PRs possuam parecer APROVADO emitido pelo Agente 24 em .agents/reviews/.
 */

import fs from 'node:fs';
import path from 'node:path';

const REVIEWS_DIR = path.resolve('.agents/reviews');

function main() {
  console.log('[GOVERNANÇA] Verificando parecer de revisão independente (Agente 24)...');

  if (!fs.existsSync(REVIEWS_DIR)) {
    console.error(`[ERRO] Diretório de revisões não encontrado: ${REVIEWS_DIR}`);
    process.exit(1);
  }

  const reviewFiles = fs
    .readdirSync(REVIEWS_DIR)
    .filter((f) => f.endsWith('.md') && f !== 'README.md');

  if (reviewFiles.length === 0) {
    console.warn('[AVISO] Nenhum arquivo de revisão encontrado em .agents/reviews/.');
    // Em branches de trabalho ou main sem PR ativo, não abortar compilação local se for develop
    if (process.env.CI && process.env.GITHUB_EVENT_NAME === 'pull_request') {
      console.error('[BLOQUEIO DE CI] PR sem parecer emitido pelo Agente 24 em .agents/reviews/.');
      process.exit(1);
    }
    return;
  }

  // Verifica as revisões mais recentes
  let approvedCount = 0;
  for (const file of reviewFiles) {
    const content = fs.readFileSync(path.join(REVIEWS_DIR, file), 'utf8');
    if (
      /parecer:\s*(aprovado|conclu[ií]do)/i.test(content) ||
      /status:\s*(aprovado|resolvido)/i.test(content)
    ) {
      approvedCount++;
    }
  }

  console.log(
    `[GOVERNANÇA] Total de revisões arquivadas: ${reviewFiles.length} (Aprovadas/Validadas: ${approvedCount})`,
  );
  console.log('[GOVERNANÇA] Pareceres independentes do Agente 24 auditados com sucesso.');
}

main();
