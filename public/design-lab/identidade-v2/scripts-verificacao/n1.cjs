const {chromium}=require('playwright');const fs=require('fs');
const base='file:///home/user/maarkssdn/land-page/mission-06/n1-final/index.html';
const O='/home/user/Birthub-360/public/design-lab/identidade-v2/08-referencia-n1/evidencias/';
(async()=>{const b=await chromium.launch();const res={};
for(const [name,vp] of [['desktop',{width:1440,height:900}],['mobile',{width:390,height:844}]])for(const theme of['dark','light']){
 const ctx=await b.newContext({viewport:vp});const pg=await ctx.newPage();const errs=[],fails=[];
 pg.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,120))});pg.on('requestfailed',r=>fails.push(r.url().slice(-60)));
 await pg.goto(base+'?theme='+theme);await pg.waitForTimeout(2600);
 const r=await pg.evaluate(()=>{const cs=getComputedStyle(document.body);const h=document.querySelector('h1');
  const an=document.getAnimations().length;
  const hc=getComputedStyle(h).color;
  return{ovf:document.documentElement.scrollWidth>innerWidth+1,bg:cs.backgroundColor,h1Color:hc,h1Font:getComputedStyle(h).fontFamily.slice(0,20),bodyFont:cs.fontFamily.slice(0,20),runningInfinite:document.getAnimations().filter(a=>a.effect.getComputedTiming().iterations===Infinity).length,fonts:[...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family).filter((v,i,a)=>a.indexOf(v)===i),title:document.title}});
 res[`${name}-${theme}`]={...r,errs,fails};await pg.screenshot({path:`${O}n1-${name}-${theme}.png`});await ctx.close();}
// reduced motion
const ctx=await b.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const pg=await ctx.newPage();await pg.goto(base);await pg.waitForTimeout(1500);
res.reduced=await pg.evaluate(()=>({running:document.getAnimations().filter(a=>a.playState==='running'&&a.effect.getComputedTiming().duration>0).length}));await ctx.close();
await b.close();fs.writeFileSync(O+'n1-verificacao.json',JSON.stringify(res,null,1));console.log(JSON.stringify(res,null,1).slice(0,2500));})();
