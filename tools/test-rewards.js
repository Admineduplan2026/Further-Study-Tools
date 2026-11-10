/* Tests for game points and gifts (apps-script/Rewards.gs) with an in-memory spreadsheet. Usage: node tools/test-rewards.js */
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
function Sheet(){const d=[];const self={d,
 getLastRow:()=>d.length,getMaxRows:()=>1000,setFrozenRows(){},setNote(){return self},
 getRange:(r,c,nr,nc)=>{nr=nr||1;nc=nc||1;const rg={
  getValues:()=>{const o=[];for(let i=0;i<nr;i++){const row=[];for(let j=0;j<nc;j++)row.push(((d[r-1+i]||[])[c-1+j])??'');o.push(row);}return o;},
  getValue:()=>((d[r-1]||[])[c-1])??'',
  setValues:v=>{v.forEach((row,i)=>{d[r-1+i]=d[r-1+i]||[];row.forEach((x,j)=>d[r-1+i][c-1+j]=x);});return rg;},
  setValue:v=>{d[r-1]=d[r-1]||[];d[r-1][c-1]=v;return rg;},setNumberFormat:()=>rg,setFontWeight:()=>rg,setBackground:()=>rg,setNote:()=>rg};return rg;}};return self;}
function Book(){const tabs={};return {tabs,getSheetByName:n=>tabs[n]||null,insertSheet:n=>(tabs[n]=Sheet())};}
const students=Book(),master=Book(),mails=[],cache=new Map();let now=Date.now();
const ctx={console:{log(){},warn(){},error:console.error},JSON,Math,String,Number,Object,Array,
 Date:class extends Date{constructor(...a){super(...(a.length?a:[now]));}static now(){return now;}},
 Utilities:{getUuid:()=>crypto.randomUUID(),formatDate:(d,tz,f)=>f==='yyyy-MM-dd'?new Date(d).toISOString().slice(0,10):new Date(d).toISOString().slice(0,16)},
 CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
 PropertiesService:{getScriptProperties:()=>({getProperty:()=>null})},MailApp:{sendEmail:m=>mails.push(m)}};
vm.createContext(ctx);vm.runInContext(fs.readFileSync('apps-script/Rewards.gs','utf8'),ctx);
vm.runInContext('statsBook_=function(){return __s;};master_=function(){return __m;};rewardsWho_=function(b){return b.token?{email:b.token}:{error:"signed_out"};};'+
 'accountSheet_=function(){return null;};accountFind_=function(){return 0;};accountData_=function(){return {profile:{f:{name:"ALI"}}};};accountCell_=function(v){return String(v||"");};ACCOUNT_COL={email:1};',Object.assign(ctx,{__s:students,__m:master}));
const call=b=>JSON.parse(JSON.stringify(ctx.accountGame_(b)));
ctx.rewardsSetup();
master.tabs.Gifts.getRange(2,1,2,8).setValues([['G1','Notebook','笔记本','1','2','','Yes',''],['G2','Hidden','','1','','','No','']]);
const play=(who,n,secs)=>{const g=call({token:who,op:'start'}).gid;now+=secs*1000;return call({token:who,op:'end',gid:g,caught:n});};
let r=play('a@x',45,31);assert.strictEqual(r.caught,45);assert.strictEqual(r.points,0);assert.strictEqual(r.progress,45);
assert.strictEqual(play('a@x',45,10).error,'too_fast','a round reported too soon does not count');
r=play('a@x',999,31);assert.strictEqual(r.added,60,'one round adds at most 60');assert.strictEqual(r.points,1);assert.strictEqual(r.new_points,1);assert.strictEqual(r.progress,5);
const g=call({token:'a@x',op:'start'}).gid;now+=31000;call({token:'a@x',op:'end',gid:g,caught:10});
assert.strictEqual(call({token:'a@x',op:'end',gid:g,caught:10}).error,'bad_game','one report per game');
assert.strictEqual(call({token:'b@x',op:'end',gid:call({token:'a@x',op:'start'}).gid,caught:10}).error,'bad_game','a game belongs to its player');
r=call({token:'a@x',op:'status'});assert.deepStrictEqual(r.gifts.map(x=>x.id),['G1'],'only active gifts');assert.strictEqual(r.gifts[0].left,2);
r=call({token:'a@x',op:'redeem',gift_id:'G1'});assert.ok(/^RW-/.test(r.redeemed));assert.strictEqual(r.points,0);assert.strictEqual(r.gifts[0].left,1);assert.strictEqual(r.mine[0].status,'Pending');
assert.strictEqual(mails.length,2,'staff and student are emailed');
assert.strictEqual(call({token:'a@x',op:'redeem',gift_id:'G1'}).error,'not_enough_points');
assert.strictEqual(call({token:'a@x',op:'redeem',gift_id:'G2'}).error,'not_found');
for(let i=0;i<12;i++)play('c@x',60,31);r=call({token:'c@x',op:'status'});assert.strictEqual(r.caught,600,'at most 600 a day');
now+=864e5;r=play('c@x',60,31);assert.strictEqual(r.caught,660,'a new day');
call({token:'c@x',op:'redeem',gift_id:'G1'});assert.strictEqual(call({token:'c@x',op:'redeem',gift_id:'G1'}).error,'out_of_stock');
assert.strictEqual(call({op:'status'}).error,'signed_out');
console.log('rewards tests passed');
