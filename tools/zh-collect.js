/* List the course-detail text that still shows in English when the site is switched to 中文.
   node tools/zh-collect.js <built artifact .html> <out.json>   (needs Playwright; see tools/content-zh.md) */
const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();const fs=require('fs');
const p=await b.newPage({viewport:{width:1280,height:900}});await p.route(/script\.google\.com/,r=>r.abort());
const F='file://'+process.argv[2];
await p.goto(F+'#home');await p.evaluate(()=>{localStorage.setItem("eduplan-session",JSON.stringify({token:"t",email:"demo@example.com",exp:Date.now()+864e5}));localStorage.setItem("eduplan-lang","zh");});
await p.reload();await p.waitForTimeout(800);
const ids=await p.evaluate(()=>window.EDUPLAN_SHEET_DATA.programmes.map(x=>x.programme_id));
const out={};
const grab=sel=>p.evaluate(sel=>{const r=[];document.querySelectorAll(sel).forEach(root=>{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);let n;while((n=w.nextNode())){const t=n.nodeValue.trim();if(t&&/[A-Za-z]{2}/.test(t)&&!/[一-鿿]/.test(t)&&!n.parentElement.closest('[data-notr],script,style'))r.push(t);}});return r;},sel);
for(const id of ids){
 await p.evaluate(id=>{location.hash='#next/'+id;},id);await p.waitForTimeout(120);
 for(const t of await grab('.pickcard'))(out[t]=out[t]||[]).push(id);
 await p.evaluate(id=>{const x=document.createElement('button');x.setAttribute('data-detail',id);document.body.appendChild(x);x.click();x.remove();},id);await p.waitForTimeout(120);
 for(const t of await grab('.sheet'))(out[t]=out[t]||[]).push(id);
 await p.evaluate(()=>{const c=document.querySelector('.sheet .x');c&&c.click();});
}
fs.writeFileSync(process.argv[3],JSON.stringify(out,null,0));console.log(ids.length,Object.keys(out).length);await b.close();})();
