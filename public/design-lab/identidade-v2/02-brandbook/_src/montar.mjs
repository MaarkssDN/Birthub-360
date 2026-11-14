// Monta index.html e regras.json a partir de _src/*.html. Uso: node _src/montar.mjs (a partir de 02-brandbook/)
import fs from 'node:fs';
const D = new URL('../', import.meta.url).pathname;
const L = h => { h = h.replace('#', ''); const c = [0, 2, 4].map(i => parseInt(h.substr(i, 2), 16) / 255).map(v => v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4)); return .2126 * c[0] + .7152 * c[1] + .0722 * c[2]; };
const ratio = (a, b) => { const x = L(a), y = L(b); return (Math.max(x, y) + .05) / (Math.min(x, y) + .05); };
const fmt = r => r.toFixed(2).replace('.', ',');
const lvl = r => r >= 7 ? 'AAA' : r >= 4.5 ? 'AA' : r >= 3 ? 'AA grande' : 'falha';

const MODS = [
  ['P01', 'Hub Comercial', 'CRM, pipeline, propostas', 'gold', 'hub', 'orbit'],
  ['P02', 'Inteligência de Mercado', 'Prospecção, ICP, dossiês', 'blue', 'intel', 'nexus'],
  ['P03', 'Orquestração de Vendas', 'Cadências, playbooks, plano diário', 'iris', 'orch', 'aria'],
  ['P04', 'Performance Comercial', 'Relatórios, win/loss, metas', 'pink', 'perf', 'vanguard'],
  ['P05', 'Previsibilidade', 'Forecast e pipeline ponderado', 'gold', 'forecast', 'oracle'],
  ['P06', 'Inteligência Artificial', 'Agentes, aprovações, conhecimento', 'iris', 'ai', 'core'],
  ['P07', 'Automação e Conectividade', 'Regras, integrações, webhooks', 'blue', 'auto', 'spark'],
  ['P08', 'Voice e WhatsApp', 'Voz, telefonia, mensagens', 'pink', 'voice', 'echo'],
  ['M09', 'Administração', 'Acesso por módulo, RBAC, LGPD', 'gold', 'admin', 'sudo'],
  ['M10', 'Field Sales', 'Reuniões em campo, offline', 'blue', 'field', null],
  ['M11', 'Social Selling', 'Sinais sociais e abordagem', 'pink', 'social', null],
];
const CV = { gold: 'var(--c-gold)', blue: 'var(--c-blue)', pink: 'var(--c-pink)', iris: 'var(--c-iris)' };
const CAST = [
  ['Pilares (9)', 'big', [['orbit', 'Orbit', 'Guardião do CRM'], ['nexus', 'Nexus', 'Analista de Dados'], ['aria', 'Aria', 'Maestrina de Fluxos'], ['vanguard', 'Vanguard', 'Estrategista de Metas'], ['oracle', 'Oracle', 'Visionário de Forecast'], ['core', 'Core', 'Mente Principal'], ['spark', 'Spark', 'Engenheiro de Integrações'], ['echo', 'Echo', 'Especialista em Voz'], ['sudo', 'Sudo', 'Controlador de Sistema']]],
  ['Agentes comerciais (15)', '', [['axiom', 'Axiom', 'Guardião de Dados LDR'], ['beacon', 'Beacon', 'Prospector Outbound'], ['meridian', 'Meridian', 'Qualificador SDR'], ['forge', 'Forge', 'Closer Copilot'], ['relay', 'Relay', 'Coordenador de Vendas'], ['helm', 'Helm', 'Gerente Comercial IA'], ['apex', 'Apex', 'Diretor Executivo IA'], ['ledger', 'Ledger', 'Auditor de Faturamento'], ['anchor', 'Anchor', 'Guardião de Retenção'], ['seal', 'Seal', 'Guardião Contratual'], ['cipher', 'Cipher', 'Guardião Bitrix24'], ['harbinger', 'Harbinger', 'Oráculo de Receita'], ['scout', 'Scout', 'Detetive de Conta'], ['pledge', 'Pledge', 'Guardião de Promessas'], ['tribunal', 'Tribunal', 'Advogado do Diabo']]],
  ['Agentes de canal (4)', '', [['vox', 'Vox', 'Discador Autônomo'], ['scope', 'Scope', 'Diagnóstico de Leads'], ['tracker', 'Tracker', 'Scanner de Mercado'], ['tempo', 'Tempo', 'Assistente Tático']]],
  ['Orquestração (1)', '', [['aegis', 'Aegis', 'Supervisor Central']]],
];
const ic = n => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;

let html = fs.readdirSync(D + '_src').filter(f => /^\d\d-.*\.part$/.test(f)).sort().map(f => fs.readFileSync(D + '_src/' + f, 'utf8')).join('\n');

// regras
const rules = [];
const esc = s => s.replace(/&/g, '&amp;');
html = html.replace(/@@rule (BB-[A-Z0-9]+-\d+) ([CP]) origem: (.*)\n([\s\S]*?)\n@@end/g, (_, id, st, orig, txt) => {
  const conf = st === 'C';
  rules.push({ id, txt, orig, conf });
  return `<li class="rule" id="${id}" data-status="${conf ? 'confirmada' : 'provisoria'}"><a class="rid" href="#${id}">${id}</a><p>${txt}<span class="orig">Origem: ${orig}</span></p><span class="st ${conf ? 'st-c' : 'st-p'}">${conf ? 'CONFIRMADA' : 'PROVISÓRIA'}</span></li>`;
});
// secao de cada regra
const secOf = {};
{ let cur = ''; const re = /<section[^>]*data-secao="([^"]+)"|<li class="rule" id="([^"]+)"/g; let m; while ((m = re.exec(html))) { if (m[1]) cur = m[1]; else secOf[m[2]] = cur; } }
const strip = t => t.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/\s+/g, ' ').trim();
const ids = new Set(); rules.forEach(r => { if (ids.has(r.id)) throw new Error('ID duplicado ' + r.id); ids.add(r.id); });
const nC = rules.filter(r => r.conf).length;

// macros
html = html.replace(/\{\{range (BB-[A-Z]+)\}\}/g, (_, p) => { const rs = rules.filter(r => r.id.startsWith(p + '-')).sort((a, b) => a.id.localeCompare(b.id)); const c = rs.filter(r => r.conf).length; return `Regras ${rs[0].id} a ${rs[rs.length - 1].id} · ${c} confirmadas · ${rs.length - c} provisórias`; });
html = html.replace(/\{\{cr (#\w+) (#\w+)\}\}/g, (_, a, b) => fmt(ratio(a, b)));
html = html.replace(/\{\{cell (#\w+) (#\w+)\}\}/g, (_, a, b) => { const r = ratio(a, b); return `<td class="${r < 3 ? 'fail' : ''}" style="--cfg:${a};--cbg:${b}" data-cr="${a}|${b}"><span class="s">Aa</span><span class="n">${fmt(r)}:1</span><span class="l">${lvl(r)}</span></td>`; });
html = html.replace('{{count_all}}', rules.length).replace('{{count_c}}', nC).replace('{{count_p}}', rules.length - nC);
html = html.replace('{{dial}}', () => {
  const pos = (a, r) => [50 + r * Math.cos(a * Math.PI / 180), 50 + r * Math.sin(a * Math.PI / 180)].map(v => v.toFixed(2));
  let ticks = ''; for (let a = 0; a < 360; a += 5) { const big = a % 30 === 0; const [x1, y1] = pos(a, big ? 43 : 44.5), [x2, y2] = pos(a, 47); ticks += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="${big ? .5 : .25}" opacity="${big ? .9 : .55}"/>`; }
  const nodes = MODS.map((m, i) => { const [x, y] = pos(-90 + i * 360 / 11, 39); return `<span class="nd" style="left:${x}%;top:${y}%;--nc:${CV[m[3]]}">${m[0]}</span>`; }).join('');
  const as = [45, 165, 285].map(a => { const [x, y] = pos(a, 47); return `<span class="as" style="left:${x}%;top:${y}%"></span>`; }).join('');
  return `<figure style="margin:0"><div class="dial" role="img" aria-label="Diagrama conceitual: Hub Central no centro, onze workspaces modulares P01 a M11 em anel e assistentes globais na borda"><svg class="ticks" viewBox="0 0 100 100" aria-hidden="true">${ticks}</svg><span class="orb"></span><span class="axis ax-h"></span><span class="axis ax-v"></span><span class="deg" style="left:50%;top:0;transform:translateX(-50%)">0°</span><span class="deg" style="right:0;top:50%;transform:translateY(-50%)">90°</span><span class="deg" style="left:50%;bottom:0;transform:translateX(-50%)">180°</span><span class="deg" style="left:0;top:50%;transform:translateY(-50%)">270°</span>${nodes}${as}<span class="core"><img src="../assets/logos/birthhub360-simbolo.svg" alt="" width="256" height="256"></span></div><figcaption class="dial-cap"><span><b>Centro:</b> Hub Central (símbolo original, sem alteração).</span><span><b>Anel:</b> 11 workspaces modulares, P01 a M11.</span><span><b>Borda:</b> assistentes globais (losangos). Diagrama conceitual.</span></figcaption></figure>`;
});
html = html.replace('{{cast}}', () => CAST.map(([t, c, l]) => `<div class="cast-group"><h4>${t.replace(/ \((\d+)\)/, ' <span class="num">$1 personagens</span>')}</h4><div class="cast ${c}">${l.map(([id, n, r]) => `<div class="ch-i"><img src="../../../brand/characters/${id}.svg" alt="${n}, ${r}" width="96" height="96"><b>${n}</b><span>${r}</span></div>`).join('')}</div></div>`).join(''));
html = html.replace('{{modstrip}}', `<div class="pl-mods">${MODS.map(m => `<span><b>${m[0]}</b>${m[1]}</span>`).join('')}</div>`);
html = html.replace('{{sidebar}}', `<div class="ps-s"><div class="hub"><img src="../assets/logos/birthhub360-icone.svg" alt="" width="32" height="32"><b data-brand>Birthub 360°</b></div><span class="grp">MÓDULOS</span>${MODS.map((m, i) => `<a${i === 0 ? ' class="on"' : ''}>${ic(m[4])}<span>${m[1]}</span><span class="cd">${m[0]}</span></a>`).join('')}</div>`);
html = html.replace('{{modhead}}', `<div class="pm-hd">${[0, 1, 3, 5].map(i => { const m = MODS[i]; return `<div style="--ac:${CV[m[3]]}"><span class="cd">${m[0]}</span><b>${m[1]}</b><span class="sc">${m[2]}</span></div>`; }).join('')}</div>`);
html = html.replace('{{modrows}}', MODS.map(m => `<div class="pm-r" style="--ac:${CV[m[3]]}"><span class="cd">${m[0]}</span>${ic(m[4])}<span><b>${m[1]}</b><span class="sc">${m[2]}</span></span>${m[5] ? `<img src="../../../brand/characters/${m[5]}.svg" alt="${m[5][0].toUpperCase() + m[5].slice(1)}, personagem-pilar de ${m[0]}" width="42" height="42" style="background:#0D0D0D;border-radius:50%">` : '<span class="nochar">sem personagem</span>'}</div>`).join(''));

if (/\{\{|@@/.test(html)) throw new Error('macro não resolvida: ' + (html.match(/\{\{[^}]*\}\}|@@\w+/) || [])[0]);
fs.writeFileSync(D + 'index.html', html);
fs.writeFileSync(D + 'regras.json', JSON.stringify(rules.map(r => ({ id: r.id, regra: strip(r.txt), status: r.conf ? 'CONFIRMADA' : 'PROVISÓRIA', secao: secOf[r.id], origem: r.orig })), null, 2) + '\n');
console.log(`index.html ok · regras ${rules.length} (confirmadas ${nC}, provisórias ${rules.length - nC})`);
const by = {}; rules.forEach(r => { const k = r.id.split('-')[1]; by[k] = (by[k] || 0) + 1; }); console.log(by);
