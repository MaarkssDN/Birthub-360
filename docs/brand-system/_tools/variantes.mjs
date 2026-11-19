import fs from 'node:fs';
const dir = 'src/components/ui/';
for (const f of ['Card', 'Input', 'Badge', 'Alert', 'Toggle', 'Select', 'Tooltip', 'Table', 'Textarea', 'Skeleton']) {
  const p = dir + f + '.tsx';
  if (!fs.existsSync(p)) { console.log(f, '(nao existe)'); continue; }
  const t = fs.readFileSync(p, 'utf8');
  const res = [];
  for (const m of t.matchAll(/\b(variant|severity|padding|inputSize|size|tone): \{([\s\S]*?)\n\s{4,6}\},/g)) {
    const keys = [...m[2].matchAll(/^\s{6,10}['"]?([\w-]+)['"]?:/gm)].map((x) => x[1]);
    res.push(`${m[1]}=[${keys.join(',')}]`);
  }
  console.log(f, t.split('\n').length + 'L', res.join(' '), /useReducedMotion/.test(t) ? 'RM' : '');
}
