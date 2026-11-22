/**
 * Gera identidade-visual/birthhub360/preview-29.html — página estática de
 * evidência visual dos 29 personagens (estados via ?state=, tema via ?theme=).
 * Uso: npx tsx scripts/build-character-preview.ts
 */
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CHARACTER_CATALOG, CHARACTER_STATES } from '../src/features/characters/characterCatalog.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'identidade-visual', 'birthhub360', 'preview-29.html');

const LAYER_LABEL: Record<string, string> = {
  pillar: 'Pilares (9 originais)',
  'commercial-agent': 'Agentes Comerciais (15)',
  'channel-agent': 'Canais e Voz (4)',
  orchestration: 'Orquestração (1)',
};

const cards = CHARACTER_CATALOG.map((c) => {
  const states = c.states.join(' ');
  return `    <figure class="card" data-char="${c.id}">
      <div class="avatar bh-character-avatar" data-state="idle" data-states="${states}"
           style="background:linear-gradient(135deg, ${c.palette.primary}33, ${c.palette.secondary}1f); box-shadow:${c.palette.halo}">
        <img src="characters/${c.id}.svg" alt="${c.ariaLabel.replace(/"/g, '&quot;')}" width="56" height="56">
      </div>
      <figcaption>
        <strong style="color:${c.palette.heading}">${c.name}</strong>
        <span class="id">${c.id}</span>
        <span class="meta">${LAYER_LABEL[c.layer]}${c.linkedAgentId ? ` · ${c.linkedAgentId}` : ''}</span>
      </figcaption>
    </figure>`;
}).join('\n');

const stateButtons = CHARACTER_STATES.map(
  (s) => `<button data-s="${s}">${s}</button>`,
).join('');

const html = `<!doctype html>
<html lang="pt-BR" data-theme="dark">
<head>
<meta charset="utf-8">
<title>Birth Hub 360° — Preview 29 Personagens</title>
<link rel="stylesheet" href="tokens/characters.css">
<style>
  * { box-sizing: border-box; margin: 0; }
  body { font-family: Inter, system-ui, sans-serif; background: #0D0D0D; color: #F8F9FF; padding: 32px; }
  html[data-theme="light"] body { background: #F4F6FB; color: #0F172A; }
  h1 { font-family: Sora, sans-serif; color: #FFC107; font-size: 26px; margin-bottom: 4px; }
  .sub { color: #94A3B8; font-size: 13px; margin-bottom: 20px; font-family: 'IBM Plex Mono', monospace; }
  .controls { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 24px; }
  .controls button { background: #14141A; color: #F8F9FF; border: 1px solid rgba(0,212,255,.3); border-radius: 999px; padding: 6px 14px; font: 12px 'IBM Plex Mono', monospace; cursor: pointer; }
  .controls button.on { background: rgba(0,212,255,.2); border-color: #00D4FF; color: #00D4FF; }
  html[data-theme="light"] .controls button { background: #fff; color: #0F172A; border-color: rgba(2,132,199,.3); }
  .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 18px; }
  .card { background: rgba(20,20,26,.85); border: 1px solid rgba(0,212,255,.18); border-radius: 18px; padding: 18px 12px; display: flex; flex-direction: column; align-items: center; gap: 10px; }
  html[data-theme="light"] .card { background: #fff; border-color: rgba(2,132,199,.2); }
  .avatar { width: 72px; height: 72px; }
  figcaption { text-align: center; display: flex; flex-direction: column; gap: 2px; }
  figcaption strong { font-family: Sora, sans-serif; font-size: 14px; }
  .id { font: 10px 'IBM Plex Mono', monospace; color: #00D4FF; }
  .meta { font: 10px 'IBM Plex Mono', monospace; color: #94A3B8; }
  section { margin-bottom: 28px; }
  section h2 { font-family: Sora, sans-serif; color: #00D4FF; font-size: 17px; margin-bottom: 12px; }
</style>
</head>
<body>
<h1>Birth Hub 360° — 29 Personagens Oficiais</h1>
<p class="sub">preview-29.html · evidência visual · states: ${CHARACTER_STATES.join('/')} · gerado de characterCatalog.ts</p>
<div class="controls" id="states">${stateButtons}<button data-s="__theme">alternar tema</button></div>
${['pillar', 'commercial-agent', 'channel-agent', 'orchestration']
  .map(
    (layer) => `<section><h2>${LAYER_LABEL[layer]}</h2><div class="grid">${CHARACTER_CATALOG.filter((c) => c.layer === layer)
      .map((c) => cards.split('\n').find(() => false) ?? '')
      .join('')}</div></section>`,
  )
  .join('\n')}
<script>
  // Agrupa os cards já renderizados por camada via data-layer injetado abaixo.
</script>
</body>
</html>`;

// Montagem por camada (mais simples que o template acima): refaz o body das sections.
const sections = (['pillar', 'commercial-agent', 'channel-agent', 'orchestration'] as const)
  .map((layer) => {
    const items = CHARACTER_CATALOG.filter((c) => c.layer === layer)
      .map((c) => `    <figure class="card" data-char="${c.id}">
      <div class="avatar bh-character-avatar" data-state="idle" data-states="${c.states.join(' ')}"
           style="background:linear-gradient(135deg, ${c.palette.primary}33, ${c.palette.secondary}1f); box-shadow:${c.palette.halo}">
        <img src="characters/${c.id}.svg" alt="${c.ariaLabel.replace(/"/g, '&quot;')}" width="56" height="56">
      </div>
      <figcaption>
        <strong style="color:${c.palette.heading}">${c.name}</strong>
        <span class="id">${c.id}</span>
        <span class="meta">${LAYER_LABEL[c.layer]}${c.linkedAgentId ? ` · ${c.linkedAgentId}` : ''}</span>
      </figcaption>
    </figure>`)
      .join('\n');
    return `<section data-layer="${layer}"><h2>${LAYER_LABEL[layer]}</h2><div class="grid">\n${items}\n    </div></section>`;
  })
  .join('\n');

const finalHtml = html.replace(
  /<div class="controls"[\s\S]*?<\/body>/,
  `<div class="controls" id="states">${stateButtons}<button data-s="__theme">alternar tema</button></div>\n${sections}\n<script>
  const params = new URLSearchParams(location.search);
  const state = params.get('state');
  const theme = params.get('theme');
  if (theme === 'light') document.documentElement.dataset.theme = 'light';
  if (state && state !== '__theme') {
    document.querySelectorAll('.avatar').forEach((a) => { a.dataset.state = state; });
    document.querySelectorAll('#states button').forEach((b) => b.classList.toggle('on', b.dataset.s === state));
  }
  document.getElementById('states').addEventListener('click', (e) => {
    const s = e.target.dataset && e.target.dataset.s;
    if (!s) return;
    if (s === '__theme') {
      document.documentElement.dataset.theme = document.documentElement.dataset.theme === 'light' ? 'dark' : 'light';
      return;
    }
    document.querySelectorAll('.avatar').forEach((a) => { a.dataset.state = s; });
    document.querySelectorAll('#states button').forEach((b) => b.classList.toggle('on', b.dataset.s === s));
  });
</script>\n</body>`,
);

writeFileSync(OUT, finalHtml, 'utf8');
console.log(`OK — ${OUT}`);
