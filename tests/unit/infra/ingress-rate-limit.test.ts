// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import YAML from 'yaml';

// TAREFA-SANEAMENTO-029 / BT360-DT-0057 (Agente 10): rate limiting de borda.
// Implementado na PR #240 (nginx limit_req/limit_conn em produção + anotações
// nginx.ingress.kubernetes.io/limit-rps/limit-connections no Ingress estático
// e nos values do Helm chart). Estes testes impedem remoção silenciosa das
// anotações — a camada de borda é complemento dos limitadores express-rate-limit
// da aplicação, não substituto.

const ingress = readFileSync('k8s/ingress.yaml', 'utf8');
const values = readFileSync('charts/birthhub-360/values.yaml', 'utf8');

describe('Ingress/k8s — rate limiting de borda (BT360-DT-0057)', () => {
  it('k8s/ingress.yaml declara limit-rps e limit-connections', () => {
    const doc = YAML.parse(ingress) as {
      metadata: { annotations: Record<string, string> };
    };
    const annotations = doc.metadata.annotations;
    expect(annotations['nginx.ingress.kubernetes.io/limit-rps']).toBeDefined();
    expect(annotations['nginx.ingress.kubernetes.io/limit-connections']).toBeDefined();
  });

  it('values.yaml do Helm expõe as mesmas anotações em ingress.annotations', () => {
    const doc = YAML.parse(values) as {
      ingress: { annotations: Record<string, string> };
    };
    const annotations = doc.ingress.annotations ?? {};
    expect(annotations['nginx.ingress.kubernetes.io/limit-rps']).toBeDefined();
    expect(annotations['nginx.ingress.kubernetes.io/limit-connections']).toBeDefined();
  });

  it('template do Ingress renderiza .Values.ingress.annotations', () => {
    const template = readFileSync('charts/birthhub-360/templates/ingress.yaml', 'utf8');
    expect(template).toContain('.Values.ingress.annotations');
  });
});
