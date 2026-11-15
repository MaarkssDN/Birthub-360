// Gera 06-conformidade/index.html + resultado.json a partir dos artefatos reais. Rodar: node 06-conformidade/gerar.mjs (na raiz identidade-v2/)
import fs from 'node:fs';import cp from 'node:child_process';import path from 'node:path';
const J=f=>JSON.parse(fs.readFileSync(f,'utf8'));const T=f=>fs.readFileSync(f,'utf8');
const sh=c=>{try{return cp.execSync(c,{encoding:'utf8',cwd:path.resolve('../../..')}).trim()}catch(e){return (e.stdout||'')+''}};
const checks=[];const add=(id,restricao,ok,evid,fonte)=>checks.push({id,restricao,ok,evid,fonte});
const dsJson=T('03-design-system/tokens/tokens.json'),core=T('shared/core.css'),dsCss=T('03-design-system/tokens/tokens.css'),moCss=T('04-motion-system/tokens/motion.css');
const pages=['01-auditoria','02-brandbook','03-design-system','04-motion-system','05-biblioteca','08-referencia-n1','09-decisoes-humanas','07-relatorio-mestre'];
const html=Object.fromEntries(pages.map(p=>[p,T(`${p}/index.html`)]));
const n1v=J('08-referencia-n1/evidencias/n1-verificacao.json');
add('N1-ACESSO','N1: repositório analisado (commit 0d08b31) e impedimento da página publicada registrado',/0d08b31/.test(html['08-referencia-n1'])&&/403/.test(html['08-referencia-n1']),'08-referencia-n1/index.html','Missão V2.1');
add('N1-RENDER','N1 renderizado em Chromium (4 combinações): sem overflow, fundos oficiais, reduzido sem animação',['desktop-dark','desktop-light','mobile-dark','mobile-light'].every(k=>!n1v[k].ovf)&&n1v.reduced.running===0&&n1v['desktop-dark'].bg==='rgb(13, 13, 13)'&&n1v['desktop-light'].bg==='rgb(244, 247, 251)','n1-verificacao.json','Missão V2.1');
add('DEC-HUM','Decisões humanas separadas, com alternativas e recomendação (H-01 a H-14)',(html['09-decisoes-humanas'].match(/class="dec"/g)||[]).length===14,(html['09-decisoes-humanas'].match(/class="dec"/g)||[]).length+' decisões','Missão V2.1');
add('ERRATA-N1','Nenhuma página afirma que o N1 está "não localizado" sem a errata V2.1',pages.every(p=>!/NÃO LOCALIZADO nas fontes/.test(html[p])),'grep','Coerência');
const hex=['#00D4FF','#FF2D9B','#FFC107','#8B7DFF','#0D0D0D','#F4F7FB'];
for(const h of hex){const inDs=(dsJson).toLowerCase().includes(h.toLowerCase()),inCore=core.toLowerCase().includes(h.toLowerCase());add('C02-'+h,`Cor oficial ${h} presente em core.css (herdado pelo DS) e em tokens.json do DS`,inDs&&inCore,`core:${inCore} tokens.json:${inDs}`,'C02');}
const bb=J('02-brandbook/regras.json');const c02=bb.filter(r=>/#00D4FF/i.test(r.regra)&&/#FF2D9B/i.test(r.regra)||/BB-COR/.test(r.id));
add('C02-BB','Brandbook declara as cores C02 (regras BB-COR)',c02.length>=6,`${c02.length} regras BB-COR`,'C02');
const qa=J('07-relatorio-mestre/qa-00.json');const pure=Object.values(qa).reduce((a,v)=>a+v.pureHeads,0);
add('C04','Nenhum h1–h3 renderizado em #FFF/#000 (5 páginas × 2 temas × 2 larguras)',pure===0,`${pure} títulos puros em ${Object.keys(qa).length} combinações`,'C04');
add('QA-ERR','Sem erro de console nem requisição falha',Object.values(qa).every(v=>!v.errs.length&&!v.fails.length),'qa-00.json','Quality gate');
add('QA-OVF','Sem overflow horizontal (1440 e 390)',Object.values(qa).every(v=>!v.overflow),'qa-00.json','Quality gate');
add('QA-LNK','Âncoras internas íntegras e imagens carregadas',Object.values(qa).every(v=>!v.badA.length&&!v.imgs.length),'qa-00.json','Quality gate');
add('C03','Sora, Inter e IBM Plex Mono carregadas em todas as páginas',Object.values(qa).every(v=>['Sora','Inter','IBM Plex Mono'].every(f=>v.fonts.includes(f))),'document.fonts','C03');
add('DARKLIGHT','Dark #0D0D0D e Light #F4F7FB como fundo base em todas as páginas',Object.entries(qa).every(([k,v])=>v.bg===(k.includes('|dark|')?'rgb(13, 13, 13)':'rgb(244, 247, 251)')),'body bg computado','C02');
const cdn=pages.filter(p=>/(src|href)=["']https?:\/\//.test(html[p]));
add('NOCDN','Nenhuma página carrega recurso externo (CDN)',cdn.length===0,cdn.join(',')||'0 páginas com URL externa','Quality gate');
add('RM','Todas as páginas tratam prefers-reduced-motion',pages.every(p=>/prefers-reduced-motion/.test(html[p]+T('shared/core.css')+(fs.existsSync(`${p}/brandbook.css`)?T(`${p}/brandbook.css`):'')+(p==='03-design-system'?T('03-design-system/docs.css')+T('03-design-system/components.css'):'')+(p==='05-biblioteca'?T('05-biblioteca/lib.css'):'')+(p==='04-motion-system'?moCss:''))),'grep','C08');
const logoCmp=['birthhub360-icone.svg','birthhub360-logo-horizontal.svg','birthhub360-simbolo.svg'].every(f=>sh(`cmp identidade-visual/birthhub360/logos/${f} public/design-lab/identidade-v2/assets/logos/${f} && echo ok`)==='ok');
add('C06-LOGO','Logos em assets/ idênticos aos oficiais (cmp byte a byte)',logoCmp,'cmp ×3','C06');
const st=sh('git status --porcelain');const outside=st.split('\n').filter(l=>l&&!l.includes('public/design-lab/identidade-v2/'));
add('LIMITES','Nenhum arquivo fora de identidade-v2/ modificado (src, landing, login, assets oficiais)',outside.length===0,outside.join('; ')||'git status: só identidade-v2/','Limites §11');
add('C09','Personagens: 29 SVGs oficiais intactos',sh('diff -rq public/brand/characters identidade-visual/birthhub360/characters | wc -l')==='0'&&sh('ls public/brand/characters | wc -l')==='29','diff -rq + ls','C09/C06');
// colisão de tokens DS×Motion
const vars=t=>Object.fromEntries([...t.matchAll(/(--[a-z0-9-]+)\s*:\s*([^;]+);/gi)].map(m=>[m[1],m[2].trim()]));
const a=vars(dsCss),b=vars(moCss);const col=Object.keys(a).filter(k=>k in b&&a[k]!==b[k]);const same=Object.keys(a).filter(k=>k in b&&a[k]===b[k]);
add('DS-MOTION','Tokens motion×DS sem colisão de nomes com valores divergentes',col.length===0,`divergentes: ${col.join(',')||'nenhum'}; mesmos nomes e valores: ${same.length}`,'Coerência');
// semânticas DS vs brandbook
const sem=['#22C55E','#EF4444','#FFC107'];add('DS-BB-SEM','Semânticas de estado do DS usam #22C55E/#EF4444/#FFC107 (alinhado ao brandbook)',sem.every(h=>dsCss.toLowerCase().includes(h.toLowerCase())),'tokens.css','Coerência');
const tipo=bb.filter(r=>/BB-TIPO/.test(r.id)&&/(Operacion|14\s?px)/i.test(r.regra));add('DS-BB-TIPO','Brandbook declara escala Operacional (corpo 14px) coerente com o DS',tipo.length>0,`${tipo.length} regras`,'Coerência');
const prov=bb.filter(r=>r.status==='PROVISÓRIA').length,conf=bb.filter(r=>r.status==='CONFIRMADA').length;
add('HOMOL','Nenhuma página se apresenta como homologada; selo RASCUNHO presente',pages.every(p=>/RASCUNHO/i.test(html[p])),'grep RASCUNHO','Limites §11');
const ent=J('01-auditoria/matriz-conformidade-entrada.json').restricoes,dec=J('01-auditoria/decisoes.json').decisoes;
const out={geradoEm:new Date().toISOString(),totalChecagens:checks.length,aprovadas:checks.filter(c=>c.ok).length,falhas:checks.filter(c=>!c.ok).map(c=>c.id),brandbook:{total:bb.length,confirmadas:conf,provisorias:prov},restricoesEntrada:ent.length,decisoes:dec.reduce((m,d)=>(m[d.status]=(m[d.status]||0)+1,m),{}),checks};
fs.writeFileSync('06-conformidade/resultado.json',JSON.stringify(out,null,1));
const e=s=>String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;');
const rows=checks.map(c=>`<tr><td><code>${e(c.id)}</code></td><td>${e(c.restricao)}</td><td>${e(c.fonte)}</td><td class="${c.ok?'ok':'bad'}">${c.ok?'PASSOU':'FALHOU'}</td><td>${e(c.evid)}</td></tr>`).join('');
const drows=dec.map(d=>`<tr><td><code>${e(d.id)}</code></td><td>${e(d.decisao)}</td><td><b class="s-${d.status}">${d.status}</b></td><td>${e(d.dono_homologacao||'')}</td></tr>`).join('');
const erows=ent.map(r=>`<tr><td><code>${e(r.id)}</code></td><td>${e(r.restricao)}</td><td>${e(r.severidade||'')}</td><td>${e(r.status_decisao||'')}</td><td><code>${e(r.como_verificar)}</code></td></tr>`).join('');
fs.writeFileSync('06-conformidade/index.html',`<!doctype html><html lang="pt-BR" data-theme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Matriz de conformidade — Birthub 360° V2.0 (rascunho)</title><link rel="stylesheet" href="../shared/core.css"><style>
body{margin:0;background:var(--bg);color:var(--ink);font:400 15px/1.6 var(--font-ui)}main{max-width:1200px;margin:0 auto;padding:24px 20px 80px}
h1{font:700 clamp(28px,5vw,44px)/1.1 var(--font-display);color:var(--c-blue);margin:.4em 0}h2{font:600 22px var(--font-display);color:var(--c-pink);margin:2em 0 .5em}
.sel{display:inline-block;padding:4px 10px;border:1px solid var(--c-gold);color:var(--c-gold);border-radius:8px;font:500 13px var(--font-mono)}
.wrap{overflow-x:auto;border:1px solid var(--line);border-radius:12px}table{border-collapse:collapse;width:100%;min-width:760px}th,td{padding:10px 12px;border-bottom:1px solid var(--line);text-align:left;vertical-align:top;font-size:14px}th{background:var(--surface-2);font:600 13px var(--font-mono);color:var(--ink-muted)}
code{font:400 13px var(--font-mono);color:var(--ink-muted);overflow-wrap:anywhere}.ok{color:var(--c-blue);font-weight:600}.bad{color:var(--c-pink);font-weight:700}.s-CONFIRMADA{color:var(--c-blue)}.s-PROVISÓRIA{color:var(--c-gold)}.s-PENDENTE{color:var(--c-pink)}
button{background:var(--surface-2);color:var(--ink);border:1px solid var(--line);border-radius:10px;padding:8px 14px;font:500 14px var(--font-ui);cursor:pointer}button:focus-visible,a:focus-visible{outline:2px solid var(--c-iris);outline-offset:2px}a{color:var(--c-blue)}
.kpi{display:flex;gap:28px;flex-wrap:wrap;margin:16px 0}.kpi b{display:block;font:600 28px var(--font-mono)}.kpi span{color:var(--ink-muted);font-size:13px}
</style></head><body><main><p><span class="sel">V2.0 — RASCUNHO, NÃO HOMOLOGADO</span> <button id="t" type="button">Alternar tema</button> · <a href="../index.html">Índice</a></p>
<h1>Matriz de conformidade</h1><p>Gerada por <code>gerar.mjs</code> a partir dos artefatos reais (brandbook, design system, motion, auditoria). Cada linha automática cita a evidência. Gerada em ${out.geradoEm}.</p>
<div class="kpi"><div><b>${out.aprovadas}/${out.totalChecagens}</b><span>checagens automáticas aprovadas</span></div><div><b>${conf}/${prov}</b><span>regras do brandbook confirmadas/provisórias</span></div><div><b>${ent.length}</b><span>restrições de entrada (auditoria)</span></div></div>
<h2>1. Checagens automáticas entre Brandbook, Design System, Motion e restrições</h2><div class="wrap"><table><thead><tr><th>ID</th><th>Restrição</th><th>Fonte</th><th>Resultado</th><th>Evidência</th></tr></thead><tbody>${rows}</tbody></table></div>
<h2>2. Matriz de decisões (da auditoria)</h2><div class="wrap"><table><thead><tr><th>ID</th><th>Decisão</th><th>Status</th><th>Homologa</th></tr></thead><tbody>${drows}</tbody></table></div>
<h2>3. Restrições oficiais e como verificar (entrada da auditoria)</h2><p>Itens não cobertos pelas checagens automáticas acima dependem de revisão humana ou do Agente 24; nenhum foi marcado como aprovado sem evidência.</p><div class="wrap"><table><thead><tr><th>ID</th><th>Restrição</th><th>Sev.</th><th>Decisão</th><th>Como verificar</th></tr></thead><tbody>${erows}</tbody></table></div>
</main><script>document.getElementById('t').onclick=()=>{const r=document.documentElement;r.dataset.theme=r.dataset.theme==='dark'?'light':'dark'}</script></body></html>`);
console.log(`${out.aprovadas}/${out.totalChecagens} aprovadas; falhas:`,out.falhas.join(',')||'nenhuma');
