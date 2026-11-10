/* Tests for the Billplz registration fee (apps-script/Payments.gs) with a fake Billplz and spreadsheet. Usage: node tools/test-billplz.js */
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
function Sheet(){const d=[];const self={d,
 getLastRow:()=>d.length,setFrozenRows(){},appendRow:r=>d.push(r.slice()),
 getRange:(r,c,nr,nc)=>{nr=nr||1;nc=nc||1;const rg={
  getValues:()=>{const o=[];for(let i=0;i<nr;i++){const row=[];for(let j=0;j<nc;j++)row.push(((d[r-1+i]||[])[c-1+j])??'');o.push(row);}return o;},
  getValue:()=>((d[r-1]||[])[c-1])??'',setValue:v=>{d[r-1]=d[r-1]||[];d[r-1][c-1]=v;return rg;}};return rg;}};return self;}
const tab=Sheet();tab.d.push(['Time','Reference']);const mails=[],bills={},calls=[];let props={PAY_GATEWAY:'billplz',BILLPLZ_API_KEY:'k',BILLPLZ_COLLECTION_ID:'col1',BILLPLZ_SANDBOX:'yes',PAY_REG_FEE:'50'};
const res=(code,o)=>({getResponseCode:()=>code,getContentText:()=>JSON.stringify(o)});
const ctx={console:{log(){},warn(){},error(){}},JSON,Math,String,Number,Object,Array,Date,RegExp,encodeURIComponent,
 Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:()=>'20261110',base64Encode:s=>Buffer.from(s).toString('base64')},
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>props[k]??null})},
 ScriptApp:{getService:()=>({getUrl:()=>'https://script.example/exec'})},MailApp:{sendEmail:m=>mails.push(m)},
 UrlFetchApp:{fetch:(url,o)=>{calls.push([url,o]);assert.ok(url.startsWith('https://www.billplz-sandbox.com/api/v3/'));
  if(o.method==='post'){const id='bill000'+(Object.keys(bills).length+1);bills[id]={id,url:'https://pay/'+id,amount:Number(o.payload.amount),paid:false,state:'due'};return res(200,bills[id]);}
  const b=bills[url.split('/').pop()];return b?res(200,b):res(404,{error:{type:'RecordNotFound'}});}}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps-script/Payments.gs','utf8'),ctx);
let receipts=0;
vm.runInContext('payTab_=function(){return __t;};accountSheet_=function(){return {getRange:function(){return {getValue:function(){return "stu@x.my";}};}};};'+
 'accountSession_=function(sh,t){return t==="ok"?{row:2}:null;};accountCell_=function(v){return String(v||"");};accountEmail_=function(v){return String(v||"");};ACCOUNT_COL={email:1};statsActive_=function(){};'+
 'expoSite_=function(){return "https://site.example/Further-Study-Tools/exhibition/";};payReceipt_=function(t,r){__r();t.getRange(r,PAY_COL.receipt).setValue("https://drive/folders/F1");};'+
 'DriveApp={getFolderById:function(){return {getFilesByType:function(){return {hasNext:function(){return false;}};}};}};MimeType={PDF:"pdf"};',
 Object.assign(ctx,{__t:tab,__r:()=>receipts++}));
const J=x=>JSON.parse(JSON.stringify(x));
assert.deepStrictEqual(J(ctx.payInfo_()),{reg_fee:50,online:true,sandbox:true});
assert.strictEqual(ctx.payCreate_({plan:'registration',token:'bad'}).error,'signed_out');
let r=J(ctx.payCreate_({plan:'registration',token:'ok',amount:1,total:1}));
assert.ok(r.ok&&r.url==='https://pay/bill0001','returns the Billplz page');
const sent=calls[0][1].payload;assert.strictEqual(sent.amount,'5000','the server fee in sen, not the browser amount');
assert.strictEqual(sent.collection_id,'col1');assert.strictEqual(sent.reference_1,r.ref);
assert.strictEqual(sent.callback_url,'https://script.example/exec');assert.strictEqual(sent.redirect_url,'https://site.example/Further-Study-Tools/');
assert.strictEqual(tab.d[1][10],'bill0001','bill id kept in Transaction ID');assert.strictEqual(tab.d[1][8],'Sent to payment page');
assert.strictEqual(J(ctx.payBillplzCheck_('bill0001')).paid,false,'unpaid bill stays unpaid');assert.strictEqual(tab.d[1][8],'Sent to payment page');
bills.bill0001.paid=true;bills.bill0001.state='paid';bills.bill0001.paid_amount=4000;
assert.strictEqual(J(ctx.payBillplzCheck_('bill0001')).paid,false,'a short payment is not marked paid');
bills.bill0001.paid_amount=5000;r=J(ctx.payBillplzCheck_('bill0001'));assert.ok(r.paid);assert.strictEqual(r.amount,50);
assert.strictEqual(tab.d[1][8],'Paid');assert.strictEqual(receipts,1);assert.strictEqual(mails.length,1);assert.strictEqual(mails[0].to,'stu@x.my');
ctx.payBillplzCheck_('bill0001');assert.strictEqual(receipts,1,'callback and return page together give one receipt');assert.strictEqual(mails.length,1);
assert.strictEqual(ctx.payBillplzCheck_('zz-unknown').error,'gateway');assert.strictEqual(ctx.payBillplzCheck_('../x').error,'bad_request');
// tuition plans stay a request even with Billplz on
r=J(ctx.payCreate_({plan:'full',method:'fpx',token:'ok',amount:1000,total:1000}));assert.ok(r.pending&&!r.url);
props.PAY_REG_FEE='';assert.strictEqual(ctx.payCreate_({plan:'registration',token:'ok'}).error,'not_set');
console.log('billplz tests passed');
