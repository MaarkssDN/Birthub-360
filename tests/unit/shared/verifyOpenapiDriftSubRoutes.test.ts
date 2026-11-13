import { describe, expect, it } from 'vitest';
import { readFileSync } from 'fs';
import path from 'path';
import { parse as parseYaml } from 'yaml';
import { collectCompositionRootSource } from '../../../src/shared/contracts/openapiRouteInventory.js';
import {
  computeSubRouteDrift,
  extractUseMounts,
} from '../../../scripts/verify-openapi-drift.js';

/**
 * Testes do Passe 2 do `scripts/verify-openapi-drift.ts` (TAREFA-SANEAMENTO-037 /
 * BT360-DT-0083): o passe só cobria `router.use('/path', subRouter)` COM path literal — mounts
 * sem path (`router.use(subRouter)`, usados por `agent.routes.ts` para a Célula Comercial e o
 * Ecossistema Universal, e por `bitrix.routes.ts` para o Plano Diário) deixavam ~14 endpoints
 * reais invisíveis ao gate. Estes testes provam que a extração agora cobre os dois formatos e
 * que a verificação FALHA quando um endpoint real não está documentado.
 */
describe('extractUseMounts', () => {
  it('extrai mount COM path literal', () => {
    const source = `router.use('/suite', requireRole(['ADMIN']), aiSuiteRouter);`;
    expect(extractUseMounts(source, 'router')).toEqual([
      { path: '/suite', routerVarName: 'aiSuiteRouter' },
    ]);
  });

  it('extrai mount SEM path (sub-router montado na raiz do prefixo atual)', () => {
    const source = `router.use(commercialCellRoutes);`;
    expect(extractUseMounts(source, 'router')).toEqual([
      { path: '', routerVarName: 'commercialCellRoutes' },
    ]);
  });

  it('extrai mount sem path com middlewares antes do identificador', () => {
    const source = `router.use(writeRoles, universalEcosystemRoutes);`;
    expect(extractUseMounts(source, 'router')).toEqual([
      { path: '', routerVarName: 'universalEcosystemRoutes' },
    ]);
  });

  it('ignora handlers inline e chamadas de middleware sem router identificável', () => {
    const source = `
      router.use((req, res, next) => next());
      router.use(requireRole(['ADMIN', 'GESTOR']));
      router.use('/x', (_req, res) => res.json({}));
    `;
    expect(extractUseMounts(source, 'router')).toEqual([]);
  });
});

describe('computeSubRouteDrift (repositório real)', () => {
  const repoRoot = path.resolve(__dirname, '../../..');
  const bootstrapDir = path.join(repoRoot, 'src', 'bootstrap');
  const compositionRootSource = collectCompositionRootSource(repoRoot);
  const openapiPaths = (
    parseYaml(readFileSync(path.join(repoRoot, 'docs', 'openapi.yaml'), 'utf-8')) as {
      paths?: Record<string, unknown>;
    }
  ).paths ?? {};

  it('não encontra endpoints reais sem documentação (sucesso)', () => {
    const { findings } = computeSubRouteDrift(
      repoRoot,
      compositionRootSource,
      bootstrapDir,
      openapiPaths,
    );
    expect(findings).toEqual([]);
  });

  it('FALHA e cobre os mounts sem path quando o documento está vazio', () => {
    const { findings } = computeSubRouteDrift(repoRoot, compositionRootSource, bootstrapDir, {});
    const docStylePaths = findings.map((f) => f.docStylePath);

    // Prova de que os sub-routers montados sem path agora são percorridos:
    expect(docStylePaths).toContain('/agent/commercial-cell/ldr-intelligence/run');
    expect(docStylePaths).toContain('/agent/commercial-cell/bitrix-guardian/run');
    expect(docStylePaths).toContain('/agent/ecosystem/playbooks/{playbookId}/run');
    expect(docStylePaths).toContain('/agent/ecosystem/connectors/{provider}/test');
    // E o mount COM path continua coberto (regressão):
    expect(docStylePaths).toContain('/agent/characters/{id}');
    expect(findings.length).toBeGreaterThan(50);
  });
});
