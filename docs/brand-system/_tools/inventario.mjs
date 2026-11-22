// Gera inventarios rastreaveis do brand-system (somente leitura sobre src/ e Desktop).
// Uso: node docs/brand-system/_tools/inventario.mjs "<pasta-desktop-identidade>"
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const out = path.join(root, 'docs/brand-system/_inventarios');
fs.mkdirSync(out, { recursive: true });
const desktop = process.argv[2];

const walk = (d, acc = []) => {
  if (!fs.existsSync(d)) return acc;
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    if (['node_modules', 'dist', '.git'].includes(e.name)) continue;
    const p = path.join(d, e.name);
    e.isDirectory() ? walk(p, acc) : acc.push(p);
  }
  return acc;
};
const rel = (p) => path.relative(root, p).replaceAll('\\', '/');
const read = (p) => fs.readFileSync(p, 'utf8');
const sha = (p) => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex').slice(0, 12);
const csv = (f, rows) => fs.writeFileSync(path.join(out, f), rows.map((r) => r.map((c) => `"${String(c).replaceAll('"', '""')}"`).join(',')).join('\n'));

// 1. Rotas (src/App.tsx)
const app = read(path.join(root, 'src/App.tsx')).split('\n');
const routes = [['linha', 'path', 'elemento']];
app.forEach((l, i) => {
  const m = l.match(/<Route\s+(?:index|path="([^"]*)")[^>]*?(?:element=\{(.+?)\})?\s*\/?>/);
  if (m) routes.push([i + 1, m[1] ?? '(index)', (m[2] ?? '').slice(0, 80)]);
});
csv('rotas.csv', routes);

// 2. Componentes UI/brand/layout
const comps = [['arquivo', 'linhas', 'usa_framer_motion', 'usa_reduced_motion', 'cores_hex_hardcoded', 'tem_story', 'tem_teste']];
const srcFiles = walk(path.join(root, 'src'));
const allNames = srcFiles.map(rel);
for (const f of srcFiles.filter((p) => /src\/components\/(ui|brand|layout|icons|charts)\//.test(rel(p)) && /\.tsx$/.test(p) && !/\.(stories|test)\./.test(p))) {
  const t = read(f);
  const base = rel(f).replace(/\.tsx$/, '');
  comps.push([rel(f), t.split('\n').length, /framer-motion|motion\/react/.test(t), /useReducedMotion|prefers-reduced-motion/.test(t), (t.match(/#[0-9a-fA-F]{6}\b/g) || []).length, allNames.some((n) => n.startsWith(base + '.stories')), allNames.some((n) => n.includes('__tests__') && n.includes(path.basename(base)))]);
}
csv('componentes.csv', comps);

// 3. Hex hardcoded por frequencia (src/**/*.tsx|ts|css)
const hex = {};
for (const f of srcFiles.filter((p) => /\.(tsx?|css)$/.test(p) && !/\.(test|stories)\./.test(p))) {
  for (const h of read(f).match(/#[0-9a-fA-F]{6}\b/g) || []) { const k = h.toUpperCase(); hex[k] = (hex[k] || 0) + 1; }
}
csv('cores-hex-hardcoded.csv', [['hex', 'ocorrencias'], ...Object.entries(hex).sort((a, b) => b[1] - a[1])]);

// 4. Motion
const motion = [['metrica', 'valor']];
const tsx = srcFiles.filter((p) => /\.tsx?$/.test(p));
let fm = 0, rm = 0, css_rm = 0;
for (const f of tsx) { const t = read(f); if (/from 'framer-motion'|from "framer-motion"|motion\/react/.test(t)) fm++; if (/useReducedMotion|MotionConfig[^>]*reducedMotion/.test(t)) rm++; }
for (const f of srcFiles.filter((p) => p.endsWith('.css'))) if (/prefers-reduced-motion/.test(read(f))) css_rm++;
motion.push(['arquivos_ts_tsx_com_framer_motion', fm], ['arquivos_com_useReducedMotion', rm], ['arquivos_css_com_prefers-reduced-motion', css_rm]);
csv('motion-metricas.csv', motion);

// 5. Assets: Desktop vs repo identidade-visual (hash)
if (desktop) {
  const repoAssets = new Map(walk(path.join(root, 'identidade-visual')).map((p) => [sha(p), rel(p)]));
  const rows = [['origem_desktop', 'extensao', 'bytes', 'sha12', 'equivalente_no_repo']];
  for (const f of walk(desktop)) {
    const s = sha(f);
    rows.push([path.relative(desktop, f).replaceAll('\\', '/'), path.extname(f), fs.statSync(f).size, s, repoAssets.get(s) ?? '']);
  }
  csv('assets-desktop.csv', rows);
}

// 6. SVGs do repo (viewBox + cores)
const svg = [['arquivo', 'viewBox', 'cores']];
for (const f of walk(path.join(root, 'identidade-visual')).filter((p) => p.endsWith('.svg'))) {
  const t = read(f);
  svg.push([rel(f), (t.match(/viewBox="([^"]+)"/) || [])[1] ?? '', [...new Set((t.match(/#[0-9a-fA-F]{6}\b/g) || []).map((c) => c.toUpperCase()))].slice(0, 8).join(' ')]);
}
csv('svgs-repo.csv', svg);
console.log('ok', { rotas: routes.length - 1, componentes: comps.length - 1, hex: Object.keys(hex).length });
