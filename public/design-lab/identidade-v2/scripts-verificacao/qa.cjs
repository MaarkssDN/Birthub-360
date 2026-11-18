const {chromium}=require('playwright');const fs=require('fs');const path=require('path');
const R='/home/user/Birthub-360/public/design-lab/identidade-v2';
const pages=['08-referencia-n1','09-decisoes-humanas','10-aceite','07-relatorio-mestre','01-auditoria','02-brandbook','03-design-system','04-motion-system','05-biblioteca'];
(async()=>{const b=await chromium.launch();const out={};
for(const p of pages){for(const theme of['dark','light']){for(const w of[1440,390]){
 const ctx=await b.newContext({viewport:{width:w,height:900}});const pg=await ctx.newPage();
 const errs=[],fails=[];pg.on('console',m=>{if(['error','warning'].includes(m.type()))errs.push(m.text().slice(0,160))});
 pg.on('pageerror',e=>errs.push('PAGEERR '+e.message.slice(0,160)));pg.on('requestfailed',r=>fails.push(r.url().slice(-80)));
 pg.on('response',r=>{if(r.status()>=400)fails.push(r.status()+' '+r.url().slice(-80))});
 await pg.goto('file://'+R+'/'+p+'/index.html');await pg.evaluate(t=>{document.documentElement.setAttribute('data-theme',t)},theme);await pg.waitForTimeout(500);
 const r=await pg.evaluate(()=>{const ids=new Set([...document.querySelectorAll('[id]')].map(e=>e.id));
  const badA=[...document.querySelectorAll('a[href^="#"]')].filter(a=>a.getAttribute('href').length>1&&!ids.has(decodeURIComponent(a.getAttribute('href').slice(1)))).map(a=>a.getAttribute('href'));
  const imgs=[...document.images].filter(i=>!i.complete||i.naturalWidth===0).map(i=>i.src.slice(-60));
  const h=[...document.querySelectorAll('h1,h2,h3')].filter(e=>{const c=getComputedStyle(e).color;return c==='rgb(255, 255, 255)'||c==='rgb(0, 0, 0)'}).length;
  return{overflow:document.documentElement.scrollWidth>innerWidth+1,badA,imgs,pureHeads:h,fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family).filter((v,i,a)=>a.indexOf(v)===i),bg:getComputedStyle(document.body).backgroundColor,title:document.title}});
 out[`${p}|${theme}|${w}`]={...r,errs:errs.slice(0,3),fails:fails.slice(0,3)};
 if(theme==='dark'&&w===1440||theme==='light'&&w===390)await pg.screenshot({path:`${R}/${p}/evidencias/00-qa-${theme}-${w}.png`});
 await ctx.close();}}}
await b.close();fs.writeFileSync(R+'/07-relatorio-mestre/qa-00.json',JSON.stringify(out,null,1));
for(const[k,v]of Object.entries(out))console.log(k,'ovf',v.overflow,'badA',v.badA.length,'img',v.imgs.length,'pureH',v.pureHeads,'err',v.errs.length,'fail',v.fails.length,v.bg,v.fonts.join(','));})();
