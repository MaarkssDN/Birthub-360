import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT_DIR = process.cwd();

function readUtf8(relPath: string): string {
  return fs.readFileSync(path.join(ROOT_DIR, relPath), 'utf8');
}

describe('Brand Hygiene & Active Identity Gate (Issue #134)', () => {
  it('garante que chrome-extension usa exclusivamente o endpoint e a marca Birth Hub 360', () => {
    const manifest = JSON.parse(readUtf8('chrome-extension/manifest.json'));
    const apiJs = readUtf8('chrome-extension/src/api.js');
    const sidepanelHtml = readUtf8('chrome-extension/src/sidepanel.html');
    const readme = readUtf8('chrome-extension/README.md');

    expect(manifest.name).toContain('Birth Hub 360');
    expect(manifest.host_permissions).toContain('https://app.birthhub360.com.br/*');
    expect(JSON.stringify(manifest)).not.toMatch(/prospector-atlas/i);

    expect(apiJs).toContain("DEFAULT_API_BASE_URL = 'https://app.birthhub360.com.br'");
    expect(apiJs).not.toMatch(/prospector-atlas/i);

    expect(sidepanelHtml).toContain('#00d4ff');
    expect(sidepanelHtml).not.toContain('#ff5618');
    expect(readme).not.toMatch(/prospector-atlas\.onrender\.com/i);
  });

  it('garante que manifests de deploy, Helm, ArgoCD, Dockerfile e CD workflows apontam para charts/birthhub-360', () => {
    const dockerfile = readUtf8('Dockerfile');
    const cdHomolog = readUtf8('.github/workflows/cd-homolog.yml');
    const argoProd = readUtf8('argocd/application-production.yaml');
    const argoHomolog = readUtf8('argocd/application-homolog.yaml');
    const chartYaml = readUtf8('charts/birthhub-360/Chart.yaml');

    expect(dockerfile).toContain('charts/birthhub-360/templates/migration-job.yaml');
    expect(dockerfile).not.toMatch(/charts\/prospector-atlas/i);

    expect(cdHomolog).toContain('charts/birthhub-360/values.yaml');
    expect(cdHomolog).not.toMatch(/charts\/prospector-atlas/i);

    expect(argoProd).toContain('path: charts/birthhub-360');
    expect(argoHomolog).toContain('path: charts/birthhub-360');
    expect(chartYaml).toContain('name: birthhub-360');
  });

  it('garante que os servicos de backend e metricas usam os identificadores birthhub-360', () => {
    const prismaTs = readUtf8('src/lib/prisma.ts');
    const whatsappTs = readUtf8('src/features/integrations/whatsapp/whatsapp.service.ts');
    const sonarProps = readUtf8('sonar-project.properties');

    expect(prismaTs).toContain('birthhub-360.database.ativos-hoje');
    expect(prismaTs).not.toMatch(/prospector-atlas\.database/i);

    expect(whatsappTs).toContain('birthhub-360-worker');
    expect(whatsappTs).not.toMatch(/prospector-atlas-worker/i);

    expect(sonarProps).toContain('Birthub-360');
    expect(sonarProps).not.toMatch(/prospector-atlas/i);
  });
});
