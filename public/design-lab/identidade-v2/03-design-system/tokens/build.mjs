#!/usr/bin/env node
/**
 * Birthub 360° — Design System V2.0 (RASCUNHO, NÃO HOMOLOGADO)
 * Gerador de tokens. Fonte canônica: tokens.json (W3C-like). Sem dependências.
 *
 *   node tokens/build.mjs          (a partir de 03-design-system/)
 *
 * Gera:   tokens.css            custom properties (importa ../../shared/core.css, nunca o edita)
 *         tokens.contract.json  lista id→valor para cruzar com o Brandbook
 * Injeta: regiões <!--GEN:nome-->…<!--/GEN--> em ../index.html (documentação)
 * Falha (exit 1) se algum token marcado "herdado-core" divergir de shared/core.css.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '..');
const corePath = path.resolve(root, '../shared/core.css');
const tokens = JSON.parse(fs.readFileSync(path.join(here, 'tokens.json'), 'utf8'));

/* ---------- flatten ---------- */
const leaves = [];
(function walk(node, trail) {
  for (const [k, v] of Object.entries(node)) {
    if (k.startsWith('$')) continue;
    if (v && typeof v === 'object' && '$value' in v) {
      const ext = v.$extensions?.birthub ?? {};
      const id = [...trail, k].join('.');
      const theme = trail[0] === 'theme' ? trail[1] : null;
      leaves.push({ id, theme, key: theme ? [...trail.slice(2), k].join('.') : null, type: v.$type, value: v.$value, desc: v.$description, status: ext.status, css: ext.css, ext });
    } else walk(v, [...trail, k]);
  }
})(tokens, []);
const byId = new Map(leaves.map((l) => [l.id, l]));
const themeLeaf = (theme, key) => byId.get(`theme.${theme}.${key}`);

/* ---------- verificação contra shared/core.css ---------- */
const coreSrc = fs.readFileSync(corePath, 'utf8');
const blocks = {};
for (const m of coreSrc.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const sel = m[1].trim();
  if (sel.startsWith('@')) continue;
  const key = sel.includes('light') ? 'light' : sel.includes('dark') ? 'dark' : 'root';
  blocks[key] ??= {};
  for (const d of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) blocks[key][d[1]] = d[2].trim();
}
const norm = (s) => String(s).replace(/\s+/g, '').replace(/"/g, "'").toLowerCase();
const problems = [];
for (const l of leaves.filter((x) => x.status === 'herdado-core' || (x.ext.source === 'shared/core.css' && x.css))) {
  const bucket = l.theme ? blocks[l.theme] : blocks.root;
  const got = bucket?.[l.css] ?? blocks.root?.[l.css];
  if (got === undefined) problems.push(`${l.id}: ${l.css} ausente em core.css`);
  else if (norm(got) !== norm(l.value)) problems.push(`${l.id}: tokens.json=${l.value} ≠ core.css(${l.css})=${got}`);
}
// o inverso: toda variável de core.css deve existir em tokens.json
const known = new Set(leaves.map((l) => l.css));
for (const [b, vars] of Object.entries(blocks)) for (const v of Object.keys(vars)) if (!known.has(v)) problems.push(`core.css ${b}: ${v} não está em tokens.json`);
if (problems.length) { console.error('DIVERGÊNCIA com shared/core.css:\n' + problems.join('\n')); process.exit(1); }
const coreChecked = leaves.filter((x) => x.ext.source === 'shared/core.css' && x.css).length;

/* ---------- verificação contra 04-motion-system/tokens/motion.css (nível operacional, primeira definição vence) ---------- */
const motionPath = path.resolve(root, '../04-motion-system/tokens/motion.css');
const motionSrc = fs.readFileSync(motionPath, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const motionVars = {};
for (const m of motionSrc.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const sel = m[1].trim();
  if (sel.startsWith('@') || !(sel.includes(':root') || sel.includes('operational')) || sel.includes('[data-reduce')) continue;
  for (const dcl of m[2].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) if (!(dcl[1] in motionVars)) motionVars[dcl[1]] = dcl[2].trim();
}
const motionProblems = [];
const motionLeaves = leaves.filter((x) => String(x.ext.source ?? '').startsWith('04-motion-system'));
for (const l of motionLeaves) {
  if (!(l.css in motionVars)) motionProblems.push(`${l.id}: ${l.css} ausente em motion.css`);
  else if (norm(motionVars[l.css]) !== norm(l.value)) motionProblems.push(`${l.id}: tokens.json=${l.value} ≠ motion.css(${l.css})=${motionVars[l.css]}`);
}
if (motionProblems.length) { console.error('DIVERGÊNCIA com motion.css:\n' + motionProblems.join('\n')); process.exit(1); }
const motionChecked = motionLeaves.length;

/* ---------- resolução de referências ---------- */
const hueVar = { blue: '--neon-blue', pink: '--neon-pink', gold: '--neon-gold', iris: '--iris' };
function resolve(value, theme) {
  if (typeof value !== 'string') return value;
  return value.replace(/\{([\w.-]+)\}/g, (_, ref) => {
    const t = byId.get(ref) ?? (theme && themeLeaf(theme, ref.replace(/^theme\./, '')));
    if (!t) throw new Error('referência inválida ' + ref);
    return resolve(t.value, theme);
  });
}

/* ---------- tokens.css ---------- */
const emit = (l) => `  ${l.css}: ${l.type === 'fontWeight' || l.type === 'number' ? l.value : l.value};`;
const needsTheme = (l) => !l.theme && typeof l.value === 'string' && l.value.includes('var(');
const skipCore = (l) => l.ext.source === 'shared/core.css' || String(l.ext.source ?? '').startsWith('04-motion-system');
const modules = leaves.filter((l) => l.id.startsWith('module.'));
const plain = leaves.filter((l) => l.css && !l.theme && !l.id.startsWith('module.') && !skipCore(l) && !needsTheme(l));
const themed = leaves.filter((l) => l.css && needsTheme(l));
const header = `/* GERADO por tokens/build.mjs a partir de tokens.json — NÃO editar à mão.
   Birthub 360° Design System V2.0 — RASCUNHO, NÃO HOMOLOGADO.
   Estende shared/core.css (fonte de verdade: paleta, superfícies, ink, c-* e fontes). Nunca edita core.css.
   Tokens "herdado-core" NÃO são redeclarados aqui (coerência verificada pelo build: ${coreChecked} valores idênticos).
   Tokens de motion (--dur-*, --ease-*) vêm de ../../04-motion-system/tokens/motion.css (fonte única; ${motionChecked} valores verificados), não são redeclarados.
   REGRA DE ESCOPO: tokens de tema vivem em [data-theme]; cada bloco recalcula var() no seu escopo,
   então um contêiner light dentro de um root dark resolve corretamente (não declare aliases só em :root). */
@import url("../../shared/core.css");
@import url("../../04-motion-system/tokens/motion.css");
`;
const themeBlock = (theme) => {
  const sel = theme === 'dark' ? '[data-theme="dark"],:root' : '[data-theme="light"]';
  const own = leaves.filter((l) => l.theme === theme && !skipCore(l)).map((l) => emit({ ...l, value: l.value }));
  const shared = themed.map(emit);
  return `${sel} {\n  color-scheme: ${theme};\n${own.join('\n')}\n${shared.join('\n')}\n}\n`;
};
const modCss = modules.map((l) => {
  const h = l.ext.hue;
  return `[data-module="${l.id.split('.')[1]}"] { /* ${l.ext.code} ${l.ext.name} (${l.ext.nameStatus}) — PROPOSTA provisória */\n  --module-accent: var(--c-${h});\n  --module-accent-fill: var(${hueVar[h]});\n  --module-accent-tint: var(--tint-${h});\n  --module-accent-on: var(--on-neon);\n}`;
}).join('\n');
const COMM = { 'display-xl': 'display', display: 'h1', h1: 'h1', h2: 'h2', h3: 'h3', h4: 'h4', 'body-lg': 'body', body: 'body', 'body-sm': 'support', data: 'data' };
const commCss = `/* Nível COMERCIAL/LEITURA: mesma chave do 04-motion-system ([data-motion="commercial"]). Remapeia a escala operacional (padrão, corpo 14px)
   para a escala do brandbook (BB-TIPO-06/07: display 72, H1 48, H2 36, H3 24, H4 18, corpo 16px). Fora desse escopo vale a escala operacional. */
[data-motion="commercial"] {
${Object.entries(COMM).map(([op, c]) => `  --text-${op}: var(--text-c-${c}); --lh-${op}: var(--lh-c-${c}); --fw-${op}: var(--fw-c-${c});`).join('\n')}
}
`;
const css = `${header}
:root {
${plain.map(emit).join('\n')}
  --neon-iris: var(--iris);
  --module-accent: var(--c-blue);
  --module-accent-fill: var(--neon-blue);
  --module-accent-tint: var(--tint-blue);
  --module-accent-on: var(--on-neon);
}
${themeBlock('dark')}
${themeBlock('light')}
/* Um acento por módulo — PROPOSTA provisória, ver 03-design-system/index.html#modulos */
${modCss}

${commCss}`;
fs.writeFileSync(path.join(here, 'tokens.css'), css);

/* ---------- contrato ---------- */
const contract = { meta: { name: 'Birthub 360° Design System V2.0 — contrato de tokens', draft: true, note: 'RASCUNHO, NÃO HOMOLOGADO. tokens = id→valor resolvido; cssVar = id→custom property; status = id→proveniência (confirmado | herdado-core | derivado | provisorio).', generatedBy: 'tokens/build.mjs', coreCssChecked: coreChecked }, tokens: {}, cssVar: {}, status: {} };
for (const l of leaves) {
  let v;
  try { v = l.id.startsWith('module.') ? `${l.ext.hue}:${resolve(l.value)}` : resolve(l.value, l.theme); } catch { v = String(l.value); }
  contract.tokens[l.id] = v; contract.cssVar[l.id] = l.css ?? null; contract.status[l.id] = l.status;
  if (l.id.startsWith('module.')) contract.status[l.id + '.nameStatus'] = l.ext.nameStatus;
}
contract.meta.count = leaves.length;
const stat = {}; for (const l of leaves) stat[l.status] = (stat[l.status] ?? 0) + 1;
contract.meta.byStatus = stat;
fs.writeFileSync(path.join(here, 'tokens.contract.json'), JSON.stringify(contract, null, 2));

/* ---------- contraste ---------- */
const hex = (s) => [1, 3, 5].map((i) => parseInt(s.slice(i, i + 2), 16) / 255);
const lin = (c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const lum = (s) => { const [r, g, b] = hex(s).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const tv = (theme, k) => themeLeaf(theme, k).value;
const neonFill = { blue: '#00D4FF', pink: '#FF2D9B', gold: '#FFC107', iris: '#8B7DFF', success: tokens.color.status.success.$value, warn: tokens.color.status.warn.$value, danger: tokens.color.status.danger.$value, info: tokens.color.status.info.$value };
const surfaces = ['bg', 'surface', 'surface-2', 'surface-3'];
const pairs = [];
for (const th of ['dark', 'light']) {
  for (const s of surfaces) for (const t of ['ink', 'ink-muted']) pairs.push({ th, fg: t, bg: s, min: 4.5, kind: 'texto' });
  for (const t of ['c-blue', 'c-pink', 'c-gold', 'c-iris', 'c-success', 'c-warn', 'c-danger', 'c-info']) for (const s of surfaces) pairs.push({ th, fg: t, bg: s, min: 4.5, kind: 'texto' });
  for (const f of Object.keys(neonFill)) pairs.push({ th, fg: 'on-neon', bgHex: neonFill[f], bg: 'fill ' + f, min: 4.5, kind: 'texto' });
  for (const t of ['focus-ring', 'field-border']) for (const s of surfaces) pairs.push({ th, fg: t, bg: s, min: 3, kind: 'não-texto' });
}
for (const p of pairs) {
  const fg = tv(p.th, p.fg), bg = p.bgHex ?? tv(p.th, p.bg);
  p.fgHex = fg; p.bgHexResolved = bg; p.ratio = ratio(fg, bg); p.ok = p.ratio >= p.min;
}
const fails = pairs.filter((p) => !p.ok);

/* ---------- regiões HTML ---------- */
const esc = (s) => String(s).replace(/ — /g, ': ').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const stTag = (s) => ({ 'oficial-existente': ['OFICIAL (identidade-visual)', 'ok'], 'herdado-motion': ['HERDADO motion.css', 'ok'], confirmado: ['CONFIRMADO', 'ok'], 'herdado-core': ['HERDADO core.css', 'ok'], derivado: ['DERIVADO', 'info'], provisorio: ['PROVISÓRIO', 'warn'] }[s] ?? [s, 'info']);
const tag = (s) => { const [t, k] = stTag(s); return `<span class="tag tag-${k}">${t}</span>`; };
const regions = {};
const g = (id) => byId.get(id);

regions['swatch-primitives'] = ['color.neon.blue', 'color.neon.pink', 'color.neon.gold', 'color.neon.iris', 'color.base.dark', 'color.base.light', 'color.status.success', 'color.status.warn', 'color.status.danger', 'color.status.info']
  .map((id) => { const l = g(id); const fillHex = l.value; const on = ratio(fillHex, '#0D0D0D') >= ratio(fillHex, '#F4F7FB') ? '#0D0D0D' : '#F4F7FB'; return `<li class="swatch"><span class="swatch-chip" style="background:${fillHex};color:${on}"><span class="swatch-on">${id.startsWith('color.base') ? 'base' : 'Aa ' + ratio(fillHex, '#0D0D0D').toFixed(1) + ':1'}</span></span><span class="swatch-meta"><code>${l.css}</code><span class="swatch-val">${fillHex}</span><span class="swatch-desc">${esc(l.desc)}</span>${tag(l.status)}</span></li>`; }).join('\n');

const themeKeys = leaves.filter((l) => l.theme === 'dark').map((l) => l.key);
regions['theme-table'] = `<table class="spec"><caption class="sr-only">Tokens de tema Dark e Light</caption><thead><tr><th scope="col">Token</th><th scope="col">Dark</th><th scope="col">Light</th><th scope="col">Papel</th><th scope="col">Status</th></tr></thead><tbody>` +
  themeKeys.map((k) => { const d = themeLeaf('dark', k), l = themeLeaf('light', k); return `<tr><th scope="row"><code>${d.css}</code></th><td><span class="dot" style="background:${d.value}"></span><code>${esc(d.value)}</code></td><td><span class="dot" style="background:${l.value}"></span><code>${esc(l.value)}</code></td><td>${esc(d.desc)}</td><td>${tag(d.status)}</td></tr>`; }).join('') + `</tbody></table>`;

regions['contrast-table'] = `<table class="spec"><caption class="sr-only">Contraste calculado entre pares de tokens</caption><thead><tr><th scope="col">Tema</th><th scope="col">Par (primeiro plano sobre fundo)</th><th scope="col">Tipo</th><th scope="col">Razão</th><th scope="col">Meta</th><th scope="col">Resultado</th></tr></thead><tbody>` +
  pairs.map((p) => `<tr data-ok="${p.ok}"><td>${p.th}</td><td><span class="dot" style="background:${p.fgHex}"></span>${p.fg} sobre <span class="dot" style="background:${p.bgHexResolved}"></span>${p.bg}</td><td>${p.kind}</td><td class="num">${p.ratio.toFixed(2)}:1</td><td class="num">${p.min}:1</td><td>${p.ok ? '<span class="tag tag-ok">PASSA</span>' : '<span class="tag tag-danger">NÃO PASSA — restrição de uso</span>'}</td></tr>`).join('') + `</tbody></table>`;

const typeTable = (prefix, cap) => {
  const keys = [...new Set(leaves.filter((l) => l.id.startsWith(prefix)).map((l) => l.id.slice(prefix.length).split('.')[0]))];
  return `<table class="spec"><caption class="sr-only">${cap}</caption><thead><tr><th scope="col">Papel</th><th scope="col">Amostra</th><th scope="col">Tamanho / linha / peso</th><th scope="col">Uso</th></tr></thead><tbody>` +
  keys.map((k) => { const sz = g(`${prefix}${k}.size`), lh = g(`${prefix}${k}.line-height`), w = g(`${prefix}${k}.weight`); const fam = /^(display|h\d)/.test(k) ? 'display' : ['data', 'data-lg', 'code'].includes(k) ? 'mono' : 'ui'; const sample = fam === 'mono' ? 'R$ 1.450.000,00' : fam === 'display' ? 'Previsão do trimestre' : 'Oportunidade qualificada para proposta'; return `<tr><th scope="row"><code>${sz.css}</code></th><td><span class="spec-sample" style="font-family:var(--font-${fam});font-size:${sz.value};line-height:${lh.value};font-weight:${w.value}">${sample}</span></td><td class="num">${sz.value} / ${lh.value} / ${w.value}</td><td>${esc(sz.desc)}</td></tr>`; }).join('') + `</tbody></table>`;
};
regions['type-scale'] = typeTable('typography.scale.', 'Escala tipográfica operacional');
regions['type-scale-commercial'] = typeTable('typography.scale-commercial.', 'Escala tipográfica comercial e de leitura (brandbook)');

regions['spacing'] = `<ul class="bars">` + leaves.filter((l) => l.id.startsWith('spacing.')).sort((a, b) => parseFloat(a.value) - parseFloat(b.value)).map((l) => `<li><code>${l.css}</code><span class="bar" style="inline-size:${l.value}"></span><span class="num">${l.value}</span></li>`).join('') + `</ul>`;
regions['radius'] = `<ul class="radii">` + leaves.filter((l) => l.id.startsWith('radius.')).map((l) => `<li><span class="radius-box" style="border-radius:${l.value}"></span><code>${l.css}</code><span class="num">${l.value}</span>${tag(l.status)}<span class="swatch-desc">${esc(l.desc)}</span></li>`).join('') + `</ul>`;
regions['shadow'] = `<ul class="shadows">` + leaves.filter((l) => l.id.startsWith('shadow.') || l.id.startsWith('glow.')).map((l) => `<li><span class="shadow-box" style="box-shadow:var(${l.css})"></span><code>${l.css}</code><span class="swatch-desc">${esc(l.desc)}</span><code class="val">${esc(l.value)}</code></li>`).join('') + `</ul>`;
regions['z'] = `<table class="spec"><caption class="sr-only">Escala de z-index</caption><thead><tr><th scope="col">Token</th><th scope="col" class="num">Valor</th></tr></thead><tbody>` + leaves.filter((l) => l.id.startsWith('z.')).map((l) => `<tr><th scope="row"><code>${l.css}</code></th><td class="num">${l.value}</td></tr>`).join('') + `</tbody></table>`;
regions['breakpoints'] = `<table class="spec"><caption class="sr-only">Breakpoints, containers e grid</caption><thead><tr><th scope="col">Token</th><th scope="col" class="num">Valor</th><th scope="col">Nota</th></tr></thead><tbody>` + leaves.filter((l) => /^(breakpoint|container|grid)\./.test(l.id)).map((l) => `<tr><th scope="row"><code>${l.css}</code></th><td class="num">${l.value}</td><td>${esc(l.desc)}</td></tr>`).join('') + `</tbody></table>`;
regions['sizes'] = `<table class="spec"><caption class="sr-only">Dimensões de componentes</caption><thead><tr><th scope="col">Token</th><th scope="col" class="num">Valor</th><th scope="col">Uso</th></tr></thead><tbody>` + leaves.filter((l) => l.id.startsWith('size.')).map((l) => `<tr><th scope="row"><code>${l.css}</code></th><td class="num">${l.value}</td><td>${esc(l.desc)}</td></tr>`).join('') + `</tbody></table>`;
regions['motion'] = `<table class="spec"><caption class="sr-only">Motion provisório</caption><thead><tr><th scope="col">Token</th><th scope="col" class="num">Valor</th><th scope="col">Uso</th><th scope="col">Status</th></tr></thead><tbody>` + leaves.filter((l) => l.id.startsWith('motion.')).map((l) => `<tr><th scope="row"><code>${l.css}</code></th><td class="num">${esc(l.value)}</td><td>${esc(l.desc)}</td><td>${tag(l.status)}</td></tr>`).join('') + `</tbody></table>`;
const modTag = (s) => ({ 'confirmado-00': '<span class="tag tag-ok">NOME CONFIRMADO PELO 00</span>', 'encontrado-na-fonte': '<span class="tag tag-warn">NOME NA FONTE — NÃO CONFIRMADO</span>', pendente: '<span class="tag tag-danger">PENDENTE</span>' }[s]);
regions['modules'] = modules.map((l) => { const id = l.id.split('.')[1]; return `<li class="module-item" data-module="${id}"><button type="button" class="module-btn" data-pick-module="${id}" aria-pressed="false"><span class="module-chip" aria-hidden="true"></span><span class="module-code">${l.ext.code}</span><span class="module-name">${esc(l.ext.name)}</span><span class="module-hue">${l.ext.hue}</span></button><span class="module-why">${esc(l.desc.replace(/^.*?\)\.\s*/, ''))}</span>${modTag(l.ext.nameStatus)}</li>`; }).join('\n');
regions['counts'] = `${leaves.length}`;
regions['counts-detail'] = Object.entries(stat).map(([k, v]) => `${v} ${k}`).join(' · ');

/* ---------- injeção ---------- */
const indexPath = path.join(root, 'index.html');
// Lê direto e trata ENOENT, em vez de existsSync + read (janela de corrida entre checar e usar).
let indexHtml = null;
try { indexHtml = fs.readFileSync(indexPath, 'utf8'); } catch (err) { if (err.code !== 'ENOENT') throw err; }
if (indexHtml !== null) {
  let html = indexHtml;
  let n = 0;
  html = html.replace(/<!--GEN:([\w-]+)-->[\s\S]*?<!--\/GEN-->/g, (m, name) => { if (!(name in regions)) { console.warn('região desconhecida', name); return m; } n++; return `<!--GEN:${name}-->${regions[name]}<!--/GEN-->`; });
  fs.writeFileSync(indexPath, html);
  console.log(`index.html: ${n} regiões injetadas`);
}
console.log(`tokens: ${leaves.length} (${JSON.stringify(stat)}) | core.css verificado: ${coreChecked} | motion.css verificado: ${motionChecked} | pares de contraste: ${pairs.length}, falhas: ${fails.length}`);
for (const p of fails) console.log(`  NÃO PASSA ${p.th} ${p.fg} sobre ${p.bg}: ${p.ratio.toFixed(2)} < ${p.min}`);
