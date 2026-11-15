const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const out={};
for(const theme of['dark','light']){const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});const pg=await ctx.newPage();
await pg.goto('file:///home/user/Birthub-360/public/design-lab/identidade-v2/05-biblioteca/index.html');await pg.evaluate(t=>document.documentElement.setAttribute('data-theme',t),theme);
const coarse=await pg.evaluate(()=>matchMedia('(pointer: coarse)').matches);
const r=await pg.evaluate(()=>[...document.querySelectorAll('.bh-switch')].map(s=>{s.scrollIntoView({block:'center'});const bx=s.getBoundingClientRect();const cx=bx.x+bx.width/2,cy=bx.y+bx.height/2;
 const hit=(dx,dy)=>{const e=document.elementFromPoint(cx+dx,cy+dy);return e===s};
 // measure vertical hit extent
 let up=0;while(up<40&&hit(0,-(bx.height/2+up+1)))up++;let dn=0;while(dn<40&&hit(0,bx.height/2+dn+1))dn++;let lf=0;while(lf<40&&hit(-(bx.width/2+lf+1),0))lf++;let rt=0;while(rt<40&&hit(bx.width/2+rt+1,0))rt++;
 return{h:bx.height,w:bx.width,hitH:bx.height+up+dn,hitW:bx.width+lf+rt}}));
out[theme]={coarse,r};await ctx.close();}
console.log(JSON.stringify(out));await b.close()})();
