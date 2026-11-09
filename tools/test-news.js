/* Tests for the latest-news email (apps-script/News.gs) with Google's services replaced by stand-ins. Usage: node tools/test-news.js */
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),assert=require('assert');
const props={},cache=new Map(),mails=[];let triggers=[];
let data={version:1,institutions:[{institution_id:'APU',name:'Asia Pacific University',city:'KL'}],programmes:[{programme_id:'APU-1',institution_id:'APU',programme_name:'Diploma IT',level:'Diploma'}],campus_scholarships:[],foundation_scholarships:[]};
const events=[{id:'EV-1',status:'published',date:'2026-12-01',start_time:'10:00',end_time:'12:00',venue:'Hall',city:'Ipoh',state:'Perak',title:'讲座',share_page:''}];
const ctx={console:{log(){},warn(){},error:console.error},JSON,Date,Math,String,Number,Object,Array,
 Utilities:{DigestAlgorithm:{SHA_256:1},Charset:{UTF_8:1},computeDigest:(a,s)=>Array.from(crypto.createHash('sha256').update(String(s),'utf8').digest()).map(b=>b>127?b-256:b),
  formatDate:(d,tz,f)=>f==='u'?'1':'2026-11-09T10:00',getUuid:()=>crypto.randomUUID(),computeHmacSha256Signature:(v,k)=>Array.from(crypto.createHmac('sha256',k).update(v).digest()).map(b=>b>127?b-256:b),base64EncodeWebSafe:b=>Buffer.from(b.map(x=>x&255)).toString('base64url')},
 PropertiesService:{getScriptProperties:()=>({getProperty:k=>k in props?props[k]:null,setProperty:(k,v)=>{props[k]=String(v);},deleteProperty:k=>{delete props[k];}})},
 CacheService:{getScriptCache:()=>({get:k=>cache.get(k)||null,put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},
 LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},
 MailApp:{getRemainingDailyQuota:()=>100,sendEmail:m=>mails.push(m)},
 ScriptApp:{getProjectTriggers:()=>triggers,deleteTrigger:t=>{triggers=triggers.filter(x=>x!==t)},newTrigger:h=>({timeBased:()=>({after:()=>({create:()=>triggers.push({getHandlerFunction:()=>h})}),everyDays:()=>({atHour:()=>({inTimezone:()=>({create:()=>triggers.push({getHandlerFunction:()=>h})})})})})})},
 UrlFetchApp:{fetch:()=>{throw new Error('no net')}}};
vm.createContext(ctx);['Account.gs','Exhibition.gs','News.gs'].forEach(f=>vm.runInContext(fs.readFileSync('apps-script/'+f,'utf8'),ctx));
vm.runInContext('apiJson_=function(){return JSON.stringify(__d());};expoToday_=function(){return "2026-11-09";};expoStudentEmails_=function(){return ["a@x.com","B@x.com","a@x.com","c@x.com"];};'+
 'expoStore_=function(){return {table:function(n){return {all:function(){return n==="events"?__ev:n==="unsubscribed"?[{h:accountHash_("c@x.com")}]:[];}};}};};'+
 'accountStaffEmail_=function(b){return b.token==="staff"?{email:"admin@x.com"}:{error:"forbidden"};};newsWhatsAppCount_=function(){return 3;};',Object.assign(ctx,{__d:()=>data,__ev:events}));
ctx.newsSetup();
let r=ctx.accountNews_({token:'staff',op:'draft'});assert.strictEqual(r.error,'no_changes','baseline: nothing new');
assert.strictEqual(ctx.accountNews_({token:'student',op:'get'}).error,'forbidden');
data.programmes.push({programme_id:'APU-2',institution_id:'APU',programme_name:'Degree in AI',level:'Bachelor'});
events.push({id:'EV-2',status:'published',date:'2026-12-05',start_time:'09:00',end_time:'11:00',venue:'Library',city:'Penang',state:'Pulau Pinang',title:'APU讲座',title_tr:'APU Talk',tr_src:'',share_page:'x'});
r=ctx.accountNews_({token:'staff',op:'draft'});
assert.ok(r.draft&&/Degree in AI/.test(r.draft.body)&&/APU讲座/.test(r.draft.body),'draft lists the changes');
assert.ok(!/Diploma IT/.test(r.draft.body),'old items are not in it');
assert.deepStrictEqual(r.draft.counts,{ev:1,inst:0,prog:1,sch:0});assert.strictEqual(r.recipients,2);assert.strictEqual(r.whatsapp,3);assert.strictEqual(r.draft.seen,undefined);
r=ctx.accountNews_({token:'staff',op:'save',subject:'Hello',body:'Edited body'});assert.strictEqual(r.draft.body,'Edited body');
r=ctx.accountNews_({token:'staff',op:'approve'});assert.ok(r.job&&!r.job.done_at&&!r.draft);assert.strictEqual(mails.length,0,'nothing sent before the background run');
ctx.newsSendNow();
assert.deepStrictEqual(mails.map(m=>m.to).sort(),['a@x.com','b@x.com']);assert.ok(mails.every(m=>m.subject==='Hello'&&/Edited body/.test(m.body)&&/#\/unsub\//.test(m.body)));
r=ctx.accountNews_({token:'staff',op:'get'});assert.ok(r.job.done_at);assert.strictEqual(r.log[0].sent,2);
assert.strictEqual(ctx.accountNews_({token:'staff',op:'draft'}).error,'no_changes','after sending, the same items are not news again');
console.log('news tests passed');
