// @vitest-environment node
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

// DEM-20261123-001 · Agente 93 (Max) — hardening estático de containers.
// Sem daemon Docker disponível, estes testes transformam as decisões de
// endurecimento do Dockerfile/docker-compose.yml em gate executável:
// build reproduzível (pins por digest), runtime não-root, healthcheck e
// portas publicadas restritas a loopback.

const dockerfile = readFileSync('Dockerfile', 'utf8');
const compose = readFileSync('docker-compose.yml', 'utf8');

describe('Dockerfile — hardening de imagem (Agente 93)', () => {
  it('usa build multi-stage (builder + runner)', () => {
    const froms = dockerfile.match(/^FROM /gim) ?? [];
    expect(froms.length).toBeGreaterThanOrEqual(2);
  });

  it('executa como usuário não-root', () => {
    expect(dockerfile).toMatch(/^USER node$/m);
    expect(dockerfile).not.toMatch(/^USER root$/m);
  });

  it('expõe HEALTHCHECK nativo', () => {
    expect(dockerfile).toMatch(/^HEALTHCHECK /m);
  });

  it('não declara ARG/ENV com nomes de segredo', () => {
    const secretPattern = /(?:ARG|ENV)\s+[A-Z0-9_]*(?:SECRET|PASSWORD|PASSWD|TOKEN|API_KEY|PRIVATE_KEY)[A-Z0-9_]*/i;
    expect(dockerfile).not.toMatch(secretPattern);
  });

  it('pin da imagem base por digest (build reproduzível)', () => {
    const fromLines = dockerfile.match(/^FROM .+$/gim) ?? [];
    expect(fromLines.length).toBeGreaterThanOrEqual(2);
    for (const line of fromLines) {
      expect(line).toMatch(/@sha256:[0-9a-f]{64}/);
    }
    // Os dois estágios devem usar exatamente a mesma imagem base pinada.
    const baseImages = fromLines.map((l) => l.replace(/^FROM\s+/i, '').split(/\s+AS\s+/i)[0]);
    expect(new Set(baseImages).size).toBe(1);
  });
});

describe('docker-compose.yml — hardening da stack local (Agente 93)', () => {
  it('toda porta publicada faz bind em 127.0.0.1', () => {
    // Linhas de porta seguem o formato "- 'HOST:CONTAINER'" ou "- HOST:CONTAINER".
    const portLines = compose.match(/^\s*-\s*['"]?[^\n]*:\d+['"]?\s*$/gm) ?? [];
    // Filtra apenas linhas dentro de blocos ports: (heurística: contêm "digits:digits"
    // e não são healthcheck/command). Para robustez, exigimos o padrão explícito.
    const published = portLines.filter((l) => /\d+:\d+/.test(l) && !/health|CMD|interval|timeout/.test(l));
    expect(published.length).toBeGreaterThan(0);
    for (const line of published) {
      expect(line).toMatch(/127\.0\.0\.1:\d+:\d+/);
    }
  });

  it('nenhuma imagem usa tag `latest` sem pin por digest', () => {
    const imageLines = compose.match(/^\s*image:\s*\S+/gm) ?? [];
    for (const line of imageLines) {
      const image = line.replace(/^\s*image:\s*/, '').trim();
      if (/:latest(\s|$)/.test(image) || image.endsWith(':latest')) {
        expect(image).toMatch(/@sha256:[0-9a-f]{64}/);
      }
    }
  });

  it('imagens de terceiros relevantes estão pinadas por digest ou semver', () => {
    expect(compose).toContain('elestio/minio:latest@sha256:');
    expect(compose).toContain('ghcr.io/berriai/litellm:main-stable@sha256:');
    expect(compose).toContain('redis:7-alpine@sha256:');
    expect(compose).toContain('getmeili/meilisearch:v1.6@sha256:');
    expect(compose).toContain('ollama/ollama:0.40.18');
    expect(compose).toContain('alpine:3.21');
  });
});
