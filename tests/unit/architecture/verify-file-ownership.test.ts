import { describe, expect, it } from 'vitest';

import {
  handoffCovers,
  normalizeRepoPath,
  OWNERSHIP_RULES,
  rulesForPath,
  verifyOwnership,
  type HandoffDoc,
} from '../../../scripts/architecture/verify-file-ownership';

const handoff = (text: string, file = 'h.md'): HandoffDoc => ({ file, text });

describe('verify-file-ownership (AGENTS.md §15 — TAREFA-SANEAMENTO-011)', () => {
  describe('normalizeRepoPath / rulesForPath', () => {
    it('normaliza separadores Windows e prefixo ./', () => {
      expect(normalizeRepoPath('.\\Prisma\\Schema.prisma')).toBe('prisma/schema.prisma');
      expect(normalizeRepoPath('./server.ts')).toBe('server.ts');
    });

    it('cobre os paths canônicos da matriz §15', () => {
      const cases: Array<[string, string]> = [
        ['prisma/schema.prisma', 'agente-01-schema'],
        ['prisma/migrations/20261110_add_tabela/migration.sql', 'agente-01-schema'],
        ['.github/workflows/ci.yml', 'agente-08-ci'],
        ['Dockerfile', 'agente-08-ci'],
        ['docker-compose.yml', 'agente-08-ci'],
        ['docker-compose.services.yml', 'agente-08-ci'],
        ['android/app/build.gradle', 'agente-09-mobile'],
        ['capacitor.config.ts', 'agente-09-mobile'],
        ['identidade-visual/logo.svg', 'agente-11-marca'],
        ['documentacao-aplicacao/guia.md', 'agente-11-marca'],
        ['.agents/prompts/14-harness.md', 'prompts-decisao-humana'],
        ['.agents/runs/onda-5/14-relatorio.md', 'agente-00-runs'],
        ['.agents/reviews/24-parecer.md', 'agente-24-reviews'],
        ['package.json', 'aprovacao-00'],
        ['package-lock.json', 'aprovacao-00'],
        ['pnpm-lock.yaml', 'aprovacao-00'],
        ['server.ts', 'aprovacao-00'],
      ];
      for (const [file, ruleId] of cases) {
        expect(rulesForPath(file).map((r) => r.id), file).toContain(ruleId);
      }
    });

    it('não marca caminhos fora da matriz nem .agents/handoffs/** (cada agente cria os seus)', () => {
      for (const file of [
        'src/features/crm/x.ts',
        'docs/orchestration/PROTOCOLO.md',
        '.agents/handoffs/onda-5/14-para-00-x.md',
        'AGENTS.md',
        'tsconfig.json',
        'ios/App/App.xcodeproj', // §15 lista android/** e capacitor.config.ts; ios não é slot do 09
      ]) {
        expect(rulesForPath(file), file).toEqual([]);
      }
    });
  });

  describe('verifyOwnership — caminho de falha (sem handoff)', () => {
    it('emite finding quando prisma/schema.prisma muda sem handoff', () => {
      const findings = verifyOwnership({
        changedFiles: ['prisma/schema.prisma'],
        handoffs: [handoff('De: Agente 14\nPara: Agente 00\nassunto qualquer')],
      });
      expect(findings).toHaveLength(1);
      expect(findings[0]).toMatchObject({ file: 'prisma/schema.prisma', ruleId: 'agente-01-schema' });
    });

    it('emite finding para package.json sem menção de aprovação do 00', () => {
      const findings = verifyOwnership({
        changedFiles: ['package.json'],
        // handoff que cita package.json mas NÃO fala de aprovação do coordenador
        handoffs: [handoff('De: Agente 04\nPara: Agente 06\npackage.json apareceu no CI')],
      });
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('aprovacao-00');
    });

    it('emite um finding por regra quando o mesmo arquivo casa com mais de uma', () => {
      const findings = verifyOwnership({ changedFiles: ['server.ts'], handoffs: [] });
      expect(findings).toHaveLength(1);
      expect(findings[0].ruleId).toBe('aprovacao-00');
    });
  });

  describe('verifyOwnership — caminho de sucesso (com handoff)', () => {
    it('não emite finding quando handoff menciona o caminho exato', () => {
      const findings = verifyOwnership({
        changedFiles: ['prisma/schema.prisma'],
        handoffs: [handoff('De: Agente 00\nPara: Agente 01\nAlterar prisma/schema.prisma para nova coluna')],
      });
      expect(findings).toEqual([]);
    });

    it('aceita caminho com separador Windows no handoff', () => {
      const findings = verifyOwnership({
        changedFiles: ['prisma/migrations/x/migration.sql'],
        handoffs: [handoff('arquivo prisma\\migrations\\x\\migration.sql precisa de revisão')],
      });
      expect(findings).toEqual([]);
    });

    it('aceita handoff que cita dono + área sem o caminho literal', () => {
      const findings = verifyOwnership({
        changedFiles: ['prisma/schema.prisma'],
        handoffs: [
          handoff('De: Agente 00\nPara: Agente 01 — Plataforma\nMigração do schema Prisma pendente'),
        ],
      });
      expect(findings).toEqual([]);
    });

    it('não aceita dono sem área (evita falso negativo por menção genérica)', () => {
      const findings = verifyOwnership({
        changedFiles: ['prisma/schema.prisma'],
        handoffs: [handoff('De: Agente 00\nPara: Agente 01\nrevisão de fila')],
      });
      expect(findings).toHaveLength(1);
    });

    it('package.json coberto por handoff com basename + aprovação do 00', () => {
      const findings = verifyOwnership({
        changedFiles: ['package.json'],
        handoffs: [
          handoff('De: Agente 14\nPara: Agente 00\nSolicito aprovação para adicionar script npm em package.json'),
        ],
      });
      expect(findings).toEqual([]);
    });

    it('ignora arquivos fora da matriz mesmo sem handoff', () => {
      const findings = verifyOwnership({
        changedFiles: ['src/features/crm/lead.ts', '.agents/handoffs/onda-5/x.md', 'README.md'],
        handoffs: [],
      });
      expect(findings).toEqual([]);
    });

    it('deduplica e ignora lista vazia', () => {
      expect(verifyOwnership({ changedFiles: [], handoffs: [] })).toEqual([]);
      const findings = verifyOwnership({
        changedFiles: ['server.ts', './server.ts', 'SERVER.TS'],
        handoffs: [],
      });
      expect(findings).toHaveLength(1);
    });
  });

  describe('handoffCovers', () => {
    it('regra de aprovação exige basename + termo de aprovação', () => {
      const rule = OWNERSHIP_RULES.find((r) => r.id === 'aprovacao-00')!;
      expect(handoffCovers(handoff('menciona server.ts sem pedido de liberação'), 'server.ts', rule)).toBe(
        false,
      );
      expect(
        handoffCovers(handoff('Agente 00 aprova mudança em server.ts'), 'src/server.ts.bak', rule),
      ).toBe(false); // basename não casa
      expect(handoffCovers(handoff('aprovação do 00 para server.ts'), 'server.ts', rule)).toBe(true);
    });

    it('regra de agente cobre por caminho exato mesmo sem ownerRe/areaRe', () => {
      const rule = OWNERSHIP_RULES.find((r) => r.id === 'agente-08-ci')!;
      expect(handoffCovers(handoff('ajuste em .github/workflows/ci.yml'), '.github/workflows/ci.yml', rule)).toBe(
        true,
      );
      expect(handoffCovers(handoff('De: Agente 08\nworkflow de CI'), '.github/workflows/ci.yml', rule)).toBe(
        true,
      );
    });
  });
});
