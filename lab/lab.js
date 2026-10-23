/* Eduplan Lab: a trial home page for signed-in students, laid out like a travel-booking site.
   One main action per page: search. The mode switch (top left) changes what the search box asks:
     interest     what to study, where, level, budget, intake  -> programme results
     scholarship  qualification, study level, university      -> scholarship results
     guidance     the 12-question interest quiz               -> faculties -> programme results
   Data: the same published sheet data as the main site (window.EDUPLAN_SHEET_DATA in the artifact, or the
   Apps Script /exec URL on the website). Nothing is invented: a fee, deadline or rating that the sheets do not
   have is shown as "to be confirmed" or left out.
   Shared with the main site (same browser storage keys, same portfolio on the server): saved programmes,
   quiz answers, application progress and the sign-in session. The lab adds "search" (last search, filled in
   again next time) and "recent" (recently viewed programmes) to the portfolio. */
(function(){
"use strict";
var FAC=window.EDUPLAN_FACULTIES||{fields:[]},QUIZ=window.EDUPLAN_QUIZ||{questions:[],rules:{}};
var MAIN=window.EDUPLAN_MAIN_URL||"../index.html",PREVIEW=!!window.EDUPLAN_SHEET_DATA;
var ARROW='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"></path></svg>';
var HEART='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7-4.4-9.2-9A5 5 0 0 1 12 6a5 5 0 0 1 9.2 5c-2.2 4.6-9.2 9-9.2 9z"></path></svg>';
var SEARCH='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-4-4"></path></svg>';
var ICONS={
 scholarship:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="9" r="6"></circle><path d="M8.5 14L7 22l5-3 5 3-1.5-8"></path></svg>',
 interest:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 7l10-4 10 4-10 4z"></path><path d="M6 9v5c0 1.7 2.7 3 6 3s6-1.3 6-3V9"></path></svg>',
 guidance:'<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"></circle><path d="M15.5 8.5l-2 5-5 2 2-5z"></path></svg>'};
var MODES=[["scholarship","Scholarship based"],["interest","Interest based"],["guidance","Guidance based"]];

/* ---------- Helpers ---------- */
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function ls(k,v){try{if(v===undefined){var r=localStorage.getItem(k);return r?JSON.parse(r):null;}if(v===null)localStorage.removeItem(k);else localStorage.setItem(k,JSON.stringify(v));}catch(e){}return null;}
function ss(k){try{return JSON.parse(sessionStorage.getItem(k));}catch(e){return null;}}
function uniq(a){return a.filter(function(x,i){return a.indexOf(x)===i;});}
function rm(n){return "RM "+Number(n).toLocaleString("en-MY");}
function years(y){return y+(y===1?" year":" years");}
function pill(t,cls){return '<span class="pill'+(cls?" "+cls:"")+'">'+esc(t)+'</span>';}
function plural(n,one,many){return n+" "+(n===1?one:many);}

/* ---------- Data ---------- */
var LEVELS=[["foundation","Foundation"],["diploma","Diploma"],["degree","Degree"],["master","Master's"],["phd","PhD"]];
var MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
var BUDGETS=[["","Any budget"],["0-30000","Up to RM 30,000"],["30000-60000","RM 30,000 – 60,000"],["60000-100000","RM 60,000 – 100,000"],["100000-","Above RM 100,000"]];
/* Exams, grades and the student's saved results ("My results"): assets/js/results.js. */
var RX=window.EDUPLAN_RESULTS,EXAMS=RX.EXAMS;
function exam(id){for(var i=0;i<EXAMS.length;i++)if(EXAMS[i].id===id)return EXAMS[i];return EXAMS[0];}
var CAMPUS_PHOTOS=window.EDUPLAN_CAMPUS_PHOTOS||{XMUM:"../assets/img/campus/xmum.jpg",UTAR:"../assets/img/campus/utar.jpg",APU:"../assets/img/campus/apu.jpg"};
var D={inst:[],progs:[],sch:[],fnd:[]};
function levelKey(l){l=l||"";return /pre-?university|foundation/i.test(l)?"foundation":/diploma/i.test(l)?"diploma":/master/i.test(l)?"master":/phd|doctor/i.test(l)?"phd":/bachelor|degree/i.test(l)?"degree":"";}
function levelName(k){for(var i=0;i<LEVELS.length;i++)if(LEVELS[i][0]===k)return LEVELS[i][1];return "";}
function intakeMonths(s){s=String(s||"");if(/monthly|every month|throughout/i.test(s))return MONTHS.map(function(_,i){return i;});
 return MONTHS.map(function(m,i){return new RegExp("\\b"+m.slice(0,3)+"(?:"+m.slice(3)+"|t)?\\b","i").test(s)?i:-1;})   /* "September", "Sep" or "Sept" */.filter(function(i){return i>=0;});}
function facOfCourse(cid){for(var i=0;i<FAC.fields.length;i++)for(var j=0;j<FAC.fields[i].courses.length;j++)if(FAC.fields[i].courses[j].id===cid)return {f:FAC.fields[i],c:FAC.fields[i].courses[j]};return null;}
function facByCode(code){for(var i=0;i<FAC.fields.length;i++)if(FAC.fields[i].code===code)return FAC.fields[i];return null;}
function useData(d){
 if(!d||d.version!==1)return false;
 var by={};
 D.inst=(d.institutions||[]).map(function(i){var o={id:i.institution_id,name:i.short_name||i.name,full:i.name,type:i.type,city:i.city,state:i.state,website:i.website,progs:0,sch:0};by[o.id]=o;return o;});
 D.progs=(d.programmes||[]).filter(function(p){return by[p.institution_id];}).map(function(p){
  var u=by[p.institution_id],fc=facOfCourse(p.course_id),notes=String(p.notes||"");
  var annual=notes.split(/\n/).filter(function(x){return /^Annual fee: /.test(x);}).map(function(x){return x.replace(/^Annual fee: /,"");});
  u.progs++;
  return {id:p.programme_id,inst:u,name:p.programme_name,level:p.level,lk:levelKey(p.level),years:p.duration_years,fee:p.tuition_fee_rm,annual:annual,
   intakes:p.intakes,months:intakeMonths(p.intakes),campus:p.campus,mqa:p.mqa_reference,url:p.apply_url,deadline:p.application_deadline,
   fac:fc?fc.f:null,course:fc?fc.c:null,also:p.also_course_ids||[],entry:[["SPM",p.entry_spm],["UEC",p.entry_uec],["O-Level / IGCSE",p.entry_olevel],["STPM",p.entry_stpm],["Others",p.entry_other]],
   english:p.english_requirement,overview:p.overview||"",structure:p.programme_structure||"",careers:p.career_prospects||"",notes:notes.split(/\n/).filter(function(x){return x.trim()&&!/^Annual fee: /.test(x);})};
 });
 D.sch=(d.campus_scholarships||[]).filter(function(s){return by[s.institution_id];}).map(function(s){by[s.institution_id].sch++;
  return {inst:by[s.institution_id],name:s.scholarship_name||"Scholarship",qual:s.qualification,min:s.minimum_result,waiver:s.waiver_percent,amount:s.fixed_amount_rm,
   applies:s.applies_to||"",cond:s.other_conditions,deadline:s.deadline,url:s.info_url};});
 D.fnd=(d.foundation_scholarships||[]).map(function(f){return {id:f.option_id,name:f.scholarship_name,org:f.organiser,award:f.award_value,deadline:f.deadline,url:f.info_url,
  req:Array.isArray(f.requirements)?f.requirements:String(f.requirements||"").split(/\n/).filter(Boolean)};});
 return true;
}
function prog(id){id=String(id||"").toLowerCase();for(var i=0;i<D.progs.length;i++)if(String(D.progs[i].id).toLowerCase()===id)return D.progs[i];return null;}
function schLevel(a){return /^foundation/i.test(a)?"foundation":/^undergraduate/i.test(a)?"undergraduate":/^postgraduate/i.test(a)?"postgraduate":"";}
/* Best tuition waiver an institution lists for a programme's level. */
function bestWaiver(p){var lv=p.lk==="foundation"?"foundation":p.lk==="degree"||p.lk==="diploma"?"undergraduate":"postgraduate",best=null;
 D.sch.forEach(function(s){if(s.inst!==p.inst)return;var l=schLevel(s.applies);if(l&&l!==lv)return;if(s.waiver!=null&&(best==null||s.waiver>best))best=s.waiver;});return best;}

/* The scholarship My results reach for a programme and the tuition left to pay (results.js, shared with the main app). */
function schRows(){return D.sch.map(function(s){return {inst:s.inst.id,instName:s.inst.name,name:s.name,applies:s.applies,qual:s.qual,min:s.min,waiver:s.waiver,amount:s.amount};});}
function payOpts(p){return {id:p.id,instId:p.inst.id,inst:p.inst.name,level:p.level,rows:schRows(),fee:p.fee,annual:p.annual,years:p.years,port:mainLink("#portfolio")};}
function payBox(p){return RX.payHtml(payOpts(p));}

/* ---------- State (browser storage shared with the main site) ---------- */
var L={mode:ls("eduplan-lab-mode")||"interest",view:"home",detail:null,showNoFee:false,mine:false,sort:"match",quizStep:null,help:false,menu:false,info:false};
if(!MODES.some(function(m){return m[0]===L.mode;}))L.mode="interest";
var SEARCH0={what:"",fac:"",where:"",level:"",budget:"",intake:""},SCH0={qual:"SPM",res:"",level:"foundation",inst:""};
var S={search:ls("eduplan-lab-search")||{},sch:ls("eduplan-lab-sch")||{},recent:ls("eduplan-lab-recent")||[],saved:ls("eduplan-saved")||[],
 quiz:ls("eduplan-quiz")||{step:0,answers:[]},session:ls("eduplan-session"),at:ls("eduplan-at")||{}};
Object.keys(SEARCH0).forEach(function(k){if(S.search[k]==null)S.search[k]=SEARCH0[k];});
Object.keys(SCH0).forEach(function(k){if(S.sch[k]==null)S.sch[k]=SCH0[k];});
if(exam(S.sch.qual).id!==S.sch.qual)S.sch.qual="SPM";
if(S.session&&!(S.session.token&&S.session.exp>Date.now()))S.session=null;
var hadSearch=!!(S.search.what||S.search.where||S.search.level||S.search.budget||S.search.intake);
function applyState(){var a=ss("eduplan-apply");return a&&a.v&&a.v.prog?a:(S.serverApply||null);}

/* Portfolio sync: the same per-section "newest wins" rule as the main site (apps-script/Account.gs). */
var API=window.EDUPLAN_API_URL,live=!!(API&&window.fetch&&!PREVIEW),dirty={},timer=null;
function touch(k){S.at=ls("eduplan-at")||S.at;S.at[k]=Date.now();ls("eduplan-at",S.at);if(!S.session||!live)return;dirty[k]=true;clearTimeout(timer);timer=setTimeout(flush,1500);}
function section(k){var at=S.at[k]||0;
 if(k==="saved")return {ids:S.saved.slice(),at:at};
 if(k==="search")return {q:S.search,sch:S.sch,mode:L.mode,at:at};
 if(k==="recent")return {ids:S.recent.slice(),at:at};
 if(k==="quiz")return {step:S.quiz.step,answers:S.quiz.answers,tie:S.quiz.tie||null,result:quizResult().map(facLabel).join(", "),at:at};}
function post(body,keep){return fetch(API,{method:"POST",keepalive:!!keep,headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)}).then(function(r){return r.json();});}
function flush(keep){var ks=Object.keys(dirty);if(!ks.length||!S.session)return;var data={};ks.forEach(function(k){data[k]=section(k);});dirty={};
 post({action:"account_save",token:S.session.token,data:data},keep).then(function(d){if(d&&d.error==="signed_out"){S.session=null;ls("eduplan-session",null);render();}})
  .catch(function(){ks.forEach(function(k){dirty[k]=true;});timer=setTimeout(flush,15000);});}
document.addEventListener("visibilitychange",function(){if(document.visibilityState==="hidden")flush(true);});
function syncLoad(){
 if(!S.session||!live)return;
 post({action:"account_load",token:S.session.token}).then(function(d){
  if(d&&d.error==="signed_out"){S.session=null;ls("eduplan-session",null);return render();}
  if(!d||!d.data)return;var x=d.data,ch=false;
  function newer(k){return x[k]&&(Number(x[k].at)||0)>(S.at[k]||0);}
  if(newer("saved")){S.saved=x.saved.ids||[];ls("eduplan-saved",S.saved);S.at.saved=x.saved.at;ch=true;}
  if(newer("recent")){S.recent=x.recent.ids||[];ls("eduplan-lab-recent",S.recent);S.at.recent=x.recent.at;ch=true;}
  if(newer("quiz")){S.quiz={step:x.quiz.step||0,answers:x.quiz.answers||[],tie:x.quiz.tie||null};ls("eduplan-quiz",S.quiz);S.at.quiz=x.quiz.at;ch=true;}
  if(newer("search")){S.search=x.search.q||S.search;S.sch=x.search.sch||S.sch;ls("eduplan-lab-search",S.search);ls("eduplan-lab-sch",S.sch);S.at.search=x.search.at;hadSearch=true;ch=true;}
  if(x.apply&&x.apply.v&&!(ss("eduplan-apply")||{}).v){S.serverApply=x.apply;ch=true;}
  ls("eduplan-at",S.at);if(ch&&L.view!=="results")render();
 }).catch(function(){});
}

/* ---------- Search ---------- */
function words(s){return String(s||"").toLowerCase().split(/[\s,\/]+/).filter(function(w){return w.length>1;});}
function hay(p){return [p.name,p.inst.name,p.inst.full,p.fac&&p.fac.name,p.fac&&p.fac.zh,p.course&&p.course.name,p.course&&p.course.desc,p.level].join(" ").toLowerCase();}
function budgetRange(b){if(!b)return null;var p=b.split("-");return [Number(p[0])||0,p[1]?Number(p[1]):Infinity];}
function matchWhere(p,w){if(!w)return true;var k=w.split(":");return k[0]==="inst"?p.inst.id===k[1]:k[0]==="state"?(p.inst.state===k[1]||p.inst.city===k[1]):true;}
function results(q){
 var ws=words(q.what),br=budgetRange(q.budget),mon=q.intake?Number(q.intake.split("-")[1])-1:null,noFee=0;
 var list=D.progs.filter(function(p){
  if(q.fac&&!(p.fac&&p.fac.code===q.fac))return false;
  if(!q.fac&&ws.length){var h=hay(p);if(!ws.every(function(w){return h.indexOf(w)>=0;}))return false;}
  if(!matchWhere(p,q.where))return false;
  if(q.level&&p.lk!==q.level)return false;
  if(mon!=null&&p.months.length&&p.months.indexOf(mon)<0)return false;
  if(br){if(p.fee==null){noFee++;return L.showNoFee;}if(p.fee<br[0]||p.fee>br[1])return false;}
  return true;});
 if(L.mine&&RX.taken().length)list=list.filter(function(p){var m=entryState(p);return m&&(m.state==="meets"||m.state==="check");});
 var key={match:function(a,b){return (b.inst.progs-a.inst.progs)||(a.name<b.name?-1:1);},fee:function(a,b){return (a.fee==null)-(b.fee==null)||(a.fee||0)-(b.fee||0);},
  short:function(a,b){return (a.years||99)-(b.years||99);}}[L.sort]||null;
 /* With My results, "Best match" puts the programmes the student qualifies for first. */
 if(L.sort==="match"&&RX.taken().length){var rk={meets:0,check:0,missing:1,none:2,no:3},st={};list.forEach(function(p){var m=entryState(p);st[p.id]=m?rk[m.state]:2;});
  var base=key;key=function(a,b){return (st[a.id]-st[b.id])||base(a,b);};}
 if(key)list.sort(key);
 return {list:list,noFee:noFee};
}
function whereOptions(){
 var states=uniq(D.inst.filter(function(u){return u.progs;}).map(function(u){return u.state;}).filter(Boolean)),
  unis=D.inst.filter(function(u){return u.progs;});
 return [["","Anywhere in Malaysia"]].concat(states.map(function(s){return ["state:"+s,s];}),unis.map(function(u){return ["inst:"+u.id,u.name+" · "+[u.city,u.state].filter(Boolean).join(", ")];}));
}
function intakeOptions(){var out=[["","Any time"]],d=new Date();for(var i=1;i<=15;i++){var m=(d.getMonth()+i)%12,y=d.getFullYear()+Math.floor((d.getMonth()+i)/12);out.push([y+"-"+("0"+(m+1)).slice(-2),MONTHS[m].slice(0,3)+" "+y]);}return out;}
function whatList(){var out=[];FAC.fields.forEach(function(f){var n=D.progs.filter(function(p){return p.fac===f;}).length;if(n)out.push(f.name);
 f.courses.forEach(function(c){if(D.progs.some(function(p){return p.course===c;}))out.push(c.name.split(" / ")[0]);});});return uniq(out);}
function sel(id,label,opts,val,attrs){return '<label class="sf" for="'+id+'"><span class="sl">'+esc(label)+'</span><select id="'+id+'"'+(attrs||"")+'>'+
 opts.map(function(o){return '<option value="'+esc(o[0])+'"'+(String(val)===String(o[0])?" selected":"")+'>'+esc(o[1])+'</option>';}).join("")+'</select></label>';}
function summary(q){var parts=[];if(q.fac){var f=facByCode(q.fac);parts.push(f?f.name:q.fac);}else if(q.what)parts.push(q.what);
 var w=whereOptions().filter(function(o){return o[0]===q.where;})[0];parts.push(w?w[1].split(" · ")[0]:"Malaysia");
 if(q.level)parts.push(levelName(q.level));if(q.budget)parts.push(BUDGETS.filter(function(b){return b[0]===q.budget;})[0][1]);
 if(q.intake)parts.push(intakeOptions().filter(function(o){return o[0]===q.intake;}).concat([[0,q.intake]])[0][1]);return parts;}

/* ---------- Quiz (same questions and scoring as the main site's #guided) ---------- */
function guidedScore(answers,tie){
 var R=QUIZ.rules,s={},check=null;
 answers.forEach(function(ai,qi){var q=QUIZ.questions[qi];if(ai==null||!q)return;var pts=q.a[ai][2];Object.keys(pts).forEach(function(k){s[k]=(s[k]||0)+pts[k];});if(q.check)check=Object.keys(pts)[0];});
 if(tie)s[tie]=(s[tie]||0)+R.tieBonus;
 var order=Object.keys(s).filter(function(k){return k!=="00";}).sort(function(a,b){return s[b]-s[a]||(a<b?-1:1);});
 var top=s[order[0]]||0;
 return {order:order,picks:order.slice(0,1).concat(order.slice(1,3).filter(function(k){return s[k]>=top*R.keepRatio;})),close:!tie&&order.length>1&&top-s[order[1]]<=R.closeGap};
}
function quizResult(){var q=S.quiz,n=QUIZ.questions.length;if(!n||q.step<n)return [];var r=guidedScore(q.answers,q.tie);return r.close?[]:r.picks;}
function facLabel(code){var f=facByCode(code);return f?f.name:"Faculty "+code;}
function quizSave(){ls("eduplan-quiz",S.quiz);touch("quiz");}

/* ---------- Pieces ---------- */
function cover(u,big){var ph=CAMPUS_PHOTOS[u.id];
 return '<span class="cover'+(big?" lg":"")+(ph?"":" art")+'" aria-hidden="true"'+(ph?' style="background-image:url(\''+esc(ph)+'\')"':' style="--h:'+(u.id.charCodeAt(0)*37%360)+'"')+'>'+(ph?"":'<b>'+esc(u.name.slice(0,6))+'</b>')+'</span>';}
function feeLine(p){
 if(p.fee!=null)return '<span class="fee"><b>'+esc(rm(p.fee))+'</b><span class="hint">whole programme</span></span>';
 if(p.annual.length)return '<span class="fee"><b>'+esc(p.annual[0].split(";")[0])+'</b><span class="hint">per year</span></span>';
 return '<span class="fee tbc">Fee to be confirmed</span>';}
function heartBtn(id){var on=S.saved.indexOf(id)>=0;return '<button type="button" class="heart" data-lsave="'+esc(id)+'" aria-pressed="'+on+'" aria-label="'+(on?"Remove from saved":"Save programme")+'">'+HEART+'</button>';}
function mainLink(hash){return hash;}   /* the main app runs in this page */
function cardFlow(){return /^inst:/.test(S.search.where||"")?"universities":"faculty";}
/* The student's results (My results) against the programme's entry requirements. */
function entryCols(p){var c={};p.entry.forEach(function(e,i){c[["spm","uec","olevel","stpm","other"][i]]=e[1];});return c;}
function entryState(p){return RX.taken().length?RX.match(entryCols(p)):null;}
function entryBadge(p,full){var m=entryState(p);if(!m||m.state==="none")return '';
 var t=m.state==="meets"?'You meet the entry requirements ('+m.exam+')':m.state==="check"?'Your '+m.exam+' grades meet the requirements':
  m.state==="missing"?'Needs '+m.need[0]+(m.need.length>1?' and '+(m.need.length-1)+' more':''):m.exam+' not accepted directly';
 return '<span class="ematch '+(m.state==="meets"||m.state==="check"?"ok":m.state==="missing"?"miss":"no")+'">'+esc(full?RX.badge(m)[1]:t)+'</span>';}
function card(p,why){
 var w=bestWaiver(p),note=esc("Interested in: "+p.name+" ("+p.inst.name+")."),list=RX.taken().length?RX.schFor(schRows(),p.inst.id,p.level).list:[],pk=RX.pickOf(p.id,list),base=RX.feeBase(p.fee,p.annual,p.years);
 return '<article class="pcard">'+cover(p.inst)+heartBtn(p.id)+
  '<div class="pbody"><span class="pinst">'+esc(p.inst.name)+(p.inst.city?' · '+esc(p.inst.city):'')+'</span>'+
  '<h3><button type="button" class="plink" data-detail="'+esc(p.id)+'">'+esc(p.name)+'</button></h3>'+
  '<div class="pills">'+pill(levelName(p.lk)||p.level)+(p.years!=null?pill(years(p.years)):"")+(p.mqa?pill("MQA registered","ok"):"")+'</div>'+
  (pk?'<span class="perk">Your scholarship: '+esc(RX.awardShort(pk.t))+'</span>':w!=null?'<span class="perk">Scholarship up to '+w+'% tuition waiver</span>':'')+(why?'<span class="why">'+esc(why)+'</span>':'')+entryBadge(p)+
  '<div class="pfoot">'+(pk&&base?'<span class="fee"><b>'+esc(rm(base.total-RX.cut(base,pk&&pk.t)))+'</b><span class="hint">'+(base.year?'a year after scholarship':'to pay after scholarship')+'</span><s class="hint">'+esc(rm(base.total))+'</s></span>':feeLine(p))+'<div class="pact"><a class="btn ghost sm" href="#consultation" data-topic="Choosing a university" data-note="'+note+'">Free consultation</a>'+
  '<a class="btn sm" href="#next/'+esc(p.id)+'" data-lflow="'+cardFlow()+'">Apply now</a></div></div></div></article>';
}

/* ---------- Views ---------- */
/* On the main app's pages the switch shows the route being followed (scholarship pages: Scholarship based). */
function shownMode(){if(L.view!=="app")return L.mode;var f="";try{f=sessionStorage.getItem("eduplan-flow")||"";}catch(e){}
 return f==="scholarships"?"scholarship":/^#guided/.test(location.hash)?"guidance":f?"interest":L.mode;}
/* The "!" next to the mode switch: how the three modes help students find their study path. */
var MODE_INFO=[["scholarship","Scholarship based","Built around scholarships: a reward to work for gives students more motivation to study."],
 ["interest","Interest based","Built around what students enjoy, so their study path has a clear direction."],
 ["guidance","Guidance based","12 reviewed key questions guide students to a clear direction for their studies."]];
function modeInfo(){
 return '<div class="mscrim" data-act="info"></div><section class="infopop" id="mode-info" role="dialog" aria-labelledby="mode-info-h">'+
  '<h2 id="mode-info-h">How to use Eduplan</h2><p class="muted">This website looks at your study path in three ways. Choose the one that fits you; you can switch at any time.</p>'+
  '<ol class="infolist">'+MODE_INFO.map(function(m){return '<li><button type="button" class="infoitem" data-mode="'+m[0]+'">'+ICONS[m[0]]+'<span><b>'+esc(m[1])+'</b><span>'+esc(m[2])+'</span></span></button></li>';}).join("")+'</ol></section>';
}
function topbar(){
 var n=S.saved.length,a=applyState(),em=S.session&&S.session.email;
 return '<div class="bar"><a class="logo" href="#home" aria-label="Eduplan home"><img src="'+esc(window.EDUPLAN_LOGO||"../assets/img/logo.png")+'" alt="Eduplan"></a>'+
  '<div class="modewrap"><span class="mqrow"><span class="mq" id="mode-q">Where does your study journey start?</span>'+
   '<button type="button" class="info" data-act="info" aria-expanded="'+L.info+'" aria-controls="mode-info" aria-label="How to use this website">!</button></span>'+
  '<div class="modes" role="radiogroup" aria-labelledby="mode-q">'+MODES.map(function(m){return '<button type="button" role="radio" data-mode="'+m[0]+'" aria-checked="'+(shownMode()===m[0])+'">'+ICONS[m[0]]+'<span>'+esc(m[1])+'</span></button>';}).join("")+'</div></div>'+
  '<nav class="tools" aria-label="Account">'+
   '<span class="cur" title="Fees are shown in Malaysian ringgit" data-notr>MYR</span>'+
   '<a class="tl" href="#saved">'+HEART+'<span class="tlt">Saved</span>'+(n?'<span class="count">'+n+'</span>':'')+'</a>'+
   '<a class="tl" href="'+esc(mainLink("#apply"))+'"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M6 3h9l4 4v14H6z"></path><path d="M14 3v5h5M9 13h7M9 17h5"></path></svg><span class="tlt">My applications</span>'+(a&&!a.sent?'<span class="count dot"></span>':'')+'</a>'+
   (em?'<a class="avatar" href="'+esc(mainLink("#portfolio"))+'" title="'+esc(em)+'" aria-label="My portfolio" data-notr>'+esc(em.charAt(0).toUpperCase())+'</a>'
    :'<a class="btn sm" href="'+esc(mainLink("#portfolio"))+'">Sign in</a>')+
  '</nav><button type="button" class="burger" data-act="menu" aria-expanded="'+L.menu+'" aria-controls="lab-menu" aria-label="Menu">'+
   '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"></path></svg></button></div>';
}
function hello(){var em=S.session&&S.session.email;return em?'Welcome back, <span data-notr>'+esc(em.split("@")[0])+'</span>':'Welcome to Eduplan';}
function searchBox(){
 if(L.mode==="scholarship"){var q=S.sch,unis=uniq(D.sch.map(function(s){return s.inst;}));
  return '<form class="sbox" id="sch-form" novalidate><div class="sfields four">'+
   examSelect(q.qual)+resultField(q)+
   sel("s-level","Study level",[["foundation","Foundation"],["undergraduate","Undergraduate degree"],["others","Others (grants, sports, financial aid)"]],q.level)+
   sel("s-inst","University",[["","All universities"]].concat(unis.map(function(u){return [u.id,u.name];})),q.inst)+
   '</div><button type="submit" class="go">'+SEARCH+'<span>Find scholarships</span></button></form>';}
 if(L.mode==="guidance")return quizBox();
 var s=S.search;
 return '<form class="sbox" id="search-form" novalidate><div class="sfields">'+
  '<label class="sf wide" for="q-what"><span class="sl">What do you want to study?</span><input id="q-what" list="q-what-list" autocomplete="off" placeholder="Business, IT, nursing …" value="'+esc(s.fac?facLabel(s.fac):s.what)+'"'+(s.fac?' data-lfac="'+esc(s.fac)+'"':'')+'>'+
  '<datalist id="q-what-list">'+whatList().map(function(t){return '<option value="'+esc(t)+'">';}).join("")+'</datalist></label>'+
  sel("q-where","Where",whereOptions(),s.where)+
  sel("q-level","Study level",[["","Any level"]].concat(LEVELS),s.level)+
  sel("q-budget","Budget",BUDGETS,s.budget)+
  sel("q-intake","Start date",intakeOptions(),s.intake)+
  '</div><button type="submit" class="go">'+SEARCH+'<span>Search</span></button></form>'+
  autoResults()+
  (hadSearch?'<p class="memo">Your last search is filled in. <button type="button" class="linkbtn" data-act="clear-search">Clear</button></p>':'');
}
/* Interest search: the exam results saved in My results (the portfolio) are filled in here, so the search can keep
   only the programmes they qualify for. Without saved results, a link to add them. */
function autoResults(){var t=RX.taken(),port=esc(mainLink("#portfolio"));
 return '<div class="automine"><span class="sl">Auto-fill my results</span>'+(t.length?
  '<span class="hint">From My results in your portfolio.</span><ul class="amres">'+t.map(function(id){var e=exam(id);return '<li><b>'+esc(e.label||id)+'</b><span>'+esc(RX.letters(id))+(RX.locked()?' 🔒':'')+'</span></li>';}).join("")+'</ul>'+
  '<div class="amrow"><label class="mine"><input type="checkbox" id="q-mine"'+(L.mine?' checked':'')+'> Only programmes my results qualify for</label><a class="hint" href="'+port+'">'+(RX.locked()?'Upload a new slip in My results':'Change in My results')+'</a></div>'
  :RX.locked()?RX.snapField("SPM",true):'<span class="hint">Your exam results are not in My portfolio yet. <a href="'+port+'">Add your exam results</a> once, and they are filled in here for you.</span>')+'</div>';}
function quizBox(){
 var Q=QUIZ.questions,n=Q.length,q=S.quiz,picks=quizResult();
 if(L.quizStep==null&&picks.length)return '<div class="sbox quiz"><span class="sl">Faculties that suit your interests</span><div class="lchips">'+picks.map(function(c){return '<button type="button" class="lchip big" data-lfac="'+esc(c)+'">'+esc(facLabel(c))+' '+ARROW+'</button>';}).join("")+'</div>'+
  '<div class="qrow"><button type="button" class="go" data-lfac="'+esc(picks[0])+'">'+SEARCH+'<span>See matching courses</span></button><button type="button" class="linkbtn" data-act="quiz-again">Take the quiz again</button></div></div>';
 if(L.quizStep==null)return '<div class="sbox quiz"><p class="qlead">Not sure what to study? Answer 12 quick questions about what you enjoy and we suggest faculties and courses.</p>'+
  '<div class="qrow"><button type="button" class="go" data-act="quiz-start">'+ICONS.guidance+'<span>'+(q.answers.filter(function(v){return v!=null;}).length&&q.step<n?"Continue the quiz":"Start the 12 questions")+'</span></button></div></div>';
 var i=L.quizStep,cur=q.answers[i],tie=i>=n;
 if(tie){var r=guidedScore(q.answers,null),two=r.order.slice(0,2);
  return '<div class="sbox quiz"><span class="sl">One last question</span><h2 class="qq">If you could only choose one of these for the next 3 years, which would you pick?</h2><div class="qopts">'+
   two.map(function(c){return '<button type="button" class="qopt" data-ltie="'+esc(c)+'">'+esc(facLabel(c))+'</button>';}).join("")+'</div></div>';}
 return '<div class="sbox quiz"><div class="qbar" aria-hidden="true"><i style="width:'+Math.round(i/n*100)+'%"></i></div><span class="sl">Question '+(i+1)+' of '+n+'</span>'+
  '<h2 class="qq" id="qq">'+esc(Q[i].q)+'</h2><div class="qopts" role="group" aria-labelledby="qq">'+Q[i].a.map(function(a,k){return '<button type="button" class="qopt" data-lans="'+k+'" aria-pressed="'+(cur===k)+'">'+esc(a[0])+'</button>';}).join("")+'</div>'+
  '<div class="qrow"><button type="button" class="btn ghost sm" data-act="quiz-back"'+(i===0?" disabled":"")+'>Back</button></div></div>';
}
/* Who is visiting: a member (signed in), a visitor (browsing only) or someone who has not chosen yet. Searching by
   "Where does your study journey start?" (scholarship, interest, guidance) is for members, to invite sign-ups.
   Sign-in needs the live website; in a preview (the published artifact) "Continue to the preview" counts as a member. */
function preview(){return !!window.EDUPLAN_SHEET_DATA||!window.EDUPLAN_API_URL;}
function access(){if(S.session)return "member";var r=ls("eduplan-role");return r==="preview"&&preview()?"member":r==="visitor"?"visitor":"new";}
function locked(){return window.EDUPLAN_MEMBERS_ONLY===true&&access()!=="member";}   /* off until Eduplan turns it on (lab-config.js) */
window.EDUPLAN_HOST.locked=function(view){return locked()&&/^(guided|scholarships|results)/.test(String(view||""));};
function roleCards(){
 function c(role,title,sub,cls){return '<button type="button" class="rolec'+(cls?' '+cls:'')+'" data-role="'+role+'"><b>'+esc(title)+'</b><span>'+esc(sub)+'</span></button>';}
 return '<div class="roles" role="group" aria-label="How do you want to use Eduplan?">'+
  c("register","Register","First time here? Create a free account in one minute.","main")+
  c("signin","Sign in","Already have an account? Sign in with your email.")+
  c("visitor","Visitor","Just looking? Browse fields of study, faculties, courses and universities.")+'</div>';}
function lockBox(){var v=access()==="visitor";
 return '<div class="sbox lockbox"><div class="lockcopy"><span class="sl">'+(v?'You are browsing as a visitor':'How do you want to use Eduplan?')+'</span>'+
  '<p>'+(v?'Register or sign in to search by scholarship, interest or guidance, match scholarships to your results and save your progress.':'Register or sign in to search by scholarship, interest or guidance. Visitors can browse fields of study, faculties, courses and universities.')+'</p></div>'+
  (v?'<div class="row"><button type="button" class="btn" data-role="register">Register</button><button type="button" class="btn ghost" data-role="signin">Sign in</button></div>':roleCards())+'</div>';}
function hero(){
 var lead={interest:"Search programmes from our partner universities.",scholarship:"Find the tuition waivers you can get with your results.",guidance:"Start from what you enjoy."}[L.mode];
 return '<section class="hero"><div class="hwrap"><h1>'+hello()+'</h1><p class="lead">'+(locked()?'Plan your studies in Malaysia: courses, universities and scholarships.':lead)+'</p>'+(locked()?lockBox():searchBox()+intsBar())+'</div></section>';
}
/* Scholarship tracker on the home page: the campus scholarships the exam results in My results qualify for
   (results.js), updated by itself when the results change. */
function schTracker(){var port=esc(mainLink("#portfolio"));
 if(!RX.taken().length)return '<section class="sec"><div class="sh"><h2>Scholarship tracker</h2></div><div class="lnote"><a href="'+port+'">Add your exam results</a> in My portfolio, and Eduplan tracks which scholarships you qualify for.</div></section>';
 var rows=D.sch.filter(function(s){return s.qual&&s.qual!=="Other";}).map(function(s){return {inst:s.inst.id,instName:s.inst.name,name:s.name,applies:s.applies,qual:s.qual,min:s.min,waiver:s.waiver,amount:s.amount};});
 return '<section class="sec"><div class="sh"><h2>Scholarship tracker</h2><a class="hint" href="'+port+'">See my scholarships '+ARROW+'</a></div>'+RX.trackerHtml(RX.scholarships(rows))+'</section>';}
function continueRow(){
 var items=[],a=applyState(),ap=a&&prog(a.v.prog);
 if(a&&ap&&!a.sent){var pct=a.complete?100:Math.round(((a.step||1)-1)/6*100);
  items.push('<a class="ccard app" href="'+esc(mainLink("#apply"))+'"><span class="ck">Unfinished application</span><span class="cn">'+esc(ap.name)+'</span><span class="ci">'+esc(ap.inst.name)+'</span>'+
   '<span class="meter" aria-hidden="true"><i style="width:'+Math.max(pct,6)+'%"></i></span><span class="cgo">'+pct+'% complete · Continue '+ARROW+'</span></a>');}
 var seen={};S.recent.concat(S.saved).forEach(function(id){if(seen[id])return;seen[id]=1;var p=prog(id);if(!p)return;var saved=S.saved.indexOf(id)>=0;
  items.push('<button type="button" class="ccard" data-detail="'+esc(p.id)+'"><span class="ck">'+(saved?"Saved":"Recently viewed")+'</span><span class="cn">'+esc(p.name)+'</span><span class="ci">'+esc(p.inst.name)+(p.years!=null?' · '+esc(years(p.years)):'')+'</span><span class="cgo">View '+ARROW+'</span></button>');});
 if(!items.length)return '';
 return '<section class="sec"><div class="sh"><h2>Continue where you left off</h2></div><div class="hscroll">'+items.slice(0,10).join("")+'</div></section>';
}
/* Under every search (interest, scholarship, guidance, and the results pages): the top 3 interests, and the
   universities with the most programmes in them (first interest counts most). A chip searches that field. */
function intsBar(){var ints=myInts();if(!ints.length)return '';var sc={};
 D.progs.forEach(function(p){var k=p.fac?ints.indexOf(p.fac.code):-1;if(k>=0)sc[p.inst.id]=(sc[p.inst.id]||0)+(3-k);});
 var top=D.inst.filter(function(u){return sc[u.id];}).sort(function(a,b){return sc[b.id]-sc[a.id];}).slice(0,4);
 return '<div class="myints"><span>Your top 3 interests:</span>'+ints.map(function(c,i){return '<button type="button" class="lchip" data-lfac="'+esc(c)+'">'+(i+1)+'. '+esc(facLabel(c))+'</button>';}).join("")+'</div>'+
  (top.length?'<div class="myints"><span>Recommended universities:</span>'+top.map(function(u){return '<a class="lchip" href="#universities/'+esc(u.id.toLowerCase())+'" data-lflow="universities">'+esc(u.name)+'</a>';}).join("")+'</div>':'');}
function popular(){
 var unis=D.inst.filter(function(u){return u.progs||u.sch;}).sort(function(a,b){return b.progs-a.progs;});
 var facs=FAC.fields.map(function(f){return {f:f,n:D.progs.filter(function(p){return p.fac===f;}).length};}).filter(function(x){return x.n;}).sort(function(a,b){return b.n-a.n;});
 return '<section class="sec"><div class="sh"><h2>Popular universities</h2><span class="hint">Malaysia</span></div><div class="hscroll">'+unis.map(function(u){
   return '<a class="dest" href="#universities/'+esc(u.id.toLowerCase())+'" data-lflow="universities">'+cover(u,true)+'<span class="dn">'+esc(u.name)+'</span><span class="dm">'+esc([u.city,u.state].filter(Boolean).join(", ")||u.type||"")+'</span>'+
    '<span class="dc"><span>'+(u.progs?plural(u.progs,"programme","programmes"):"Programmes coming soon")+'</span>'+(u.sch?' · <span>'+plural(u.sch,"scholarship tier","scholarship tiers")+'</span>':'')+'</span></a>';}).join("")+'</div></section>'+
 '<section class="sec"><div class="sh"><h2>Popular fields of study</h2></div><div class="majors">'+facs.map(function(x){var unis=uniq(D.progs.filter(function(p){return p.fac===x.f;}).map(function(p){return p.inst;})).length;
   return '<a class="major" href="#faculty/'+esc(x.f.code)+'" data-lflow="faculty" style="--h:'+((Number(x.f.code)*33+190)%360)+'"><span class="mc" aria-hidden="true">'+esc(x.f.code)+'</span><span class="mn">'+esc(x.f.name)+'</span><span class="mz">'+esc(x.f.zh)+'</span>'+
    '<span class="dc"><span>'+plural(unis,"university","universities")+'</span> · <span>'+plural(x.n,"programme","programmes")+'</span></span></a>';}).join("")+'</div></section>';
}
function daysLeft(s){var d=new Date(s);if(!s||isNaN(d))return null;return Math.ceil((d-new Date())/864e5);}
function offers(){
 var groups={},order=[];
 D.sch.forEach(function(s){var k=s.inst.id+"|"+s.name+"|"+s.applies;if(!groups[k]){groups[k]={s:s,best:null,quals:[],deadline:s.deadline};order.push(k);}var g=groups[k];
  if(s.waiver!=null&&(g.best==null||s.waiver>g.best))g.best=s.waiver;if(s.qual&&g.quals.indexOf(s.qual)<0)g.quals.push(s.qual);});
 var list=order.map(function(k){return groups[k];}).sort(function(a,b){return (b.best||0)-(a.best||0);}).slice(0,6);
 var extra=(window.EDUPLAN_OFFERS||[]);  /* early-bird, fee waivers: add real offers in lab/offers.js */
 if(!list.length&&!extra.length)return '';
 return '<section class="sec"><div class="sh"><h2>Scholarships and offers</h2><button type="button" class="linkbtn" data-mode="scholarship">See all '+ARROW+'</button></div><div class="hscroll">'+
  extra.map(function(o){var dl=daysLeft(o.deadline);return '<a class="offer" href="'+esc(o.url||"#home")+'"'+(o.url?' target="_blank" rel="noopener"':'')+'><span class="ok2">'+esc(o.tag||"Offer")+'</span><span class="on">'+esc(o.title)+'</span><span class="oi">'+esc(o.institution||"")+'</span>'+
   (dl!=null&&dl>=0?'<span class="cd">'+(dl===0?"Closes today":plural(dl,"day","days")+" left")+'</span>':'')+'</a>';}).join("")+
  list.map(function(g){var dl=daysLeft(g.deadline),lv=schLevel(g.s.applies);
   return '<a class="offer" href="#scholarships-campus/'+esc(g.s.inst.id.toLowerCase())+'"><span class="ok2">'+esc(g.s.inst.name)+'</span>'+
    '<span class="on">'+(g.best!=null?'Up to '+g.best+'% tuition waiver':esc(g.s.name))+'</span><span class="oi">'+esc(g.s.name)+(g.s.applies?' · '+esc(g.s.applies.split(" Offered")[0]):'')+'</span>'+
    '<span class="oq">'+g.quals.slice(0,4).map(function(q){return pill(q);}).join("")+'</span>'+
    (dl!=null&&dl>=0?'<span class="cd">'+(dl===0?"Closes today":plural(dl,"day","days")+" left")+'</span>':'<span class="hint">Deadline: check with the university</span>')+'</a>';}).join("")+'</div></section>';
}
function recommended(){
 var picks=quizResult(),ints=myInts(),q=S.search,scored=D.progs.map(function(p){var sc=0,why="";
   if(p.fac&&ints.indexOf(p.fac.code)>=0){sc+=2.5-ints.indexOf(p.fac.code)*0.5;why="Your interest: "+p.fac.name;}
   if(p.fac&&picks.indexOf(p.fac.code)>=0){sc+=3-picks.indexOf(p.fac.code)*0.5;why="Matches your quiz: "+p.fac.name;}
   if(q.level&&p.lk===q.level){sc+=1.5;why=why||"Your study level: "+levelName(q.level);}
   if(q.fac&&p.fac&&p.fac.code===q.fac){sc+=2;why=why||"Your last search: "+p.fac.name;}
   S.saved.forEach(function(id){var s=prog(id);if(s&&s!==p&&s.fac&&s.fac===p.fac){sc+=1;why=why||"Like the programmes you saved";}});
   if(S.saved.indexOf(p.id)>=0)sc-=5;return {p:p,sc:sc,why:why};}).filter(function(x){return x.sc>0;}).sort(function(a,b){return b.sc-a.sc;}).slice(0,6);
 if(!scored.length)return '<section class="sec"><div class="sh"><h2>Recommended for you</h2></div><div class="empty">Take the interest quiz or save a few programmes, and we will recommend courses for you here. '+
  '<button type="button" class="linkbtn" data-mode="guidance">Start the quiz '+ARROW+'</button></div></section>';
 return '<section class="sec"><div class="sh"><h2>Recommended for you</h2></div><div class="cards">'+scored.map(function(x){return card(x.p,x.why);}).join("")+'</div></section>';
}
function trust(){
 var mqa=D.progs.filter(function(p){return p.mqa;}).length,unis=D.inst.length,sch=D.sch.length+D.fnd.length;
 return '<section class="sec trust"><div class="sh"><h2>Why students plan with Eduplan</h2></div><div class="stats">'+
  [[unis,"partner universities and colleges"],[D.progs.length,"programmes listed"],[mqa,"programmes with an MQA reference"],[sch,"scholarship options"]].map(function(s){return '<div class="stat"><b>'+s[0]+'</b><span>'+esc(s[1])+'</span></div>';}).join("")+
  '<div class="stat"><b>Free</b><span>counselling for students and parents</span></div></div>'+
  '<div class="logos" aria-label="Partner institutions">'+D.inst.map(function(u){return '<span class="wm" title="'+esc(u.full)+'">'+esc(u.name)+'</span>';}).join("")+'</div>'+
  '<p class="hint">Programme facts come from each university’s published information. Please confirm details with the university before you apply.</p></section>';
}
function home(){if(locked())return hero()+'<div class="page">'+continueRow()+popular()+trust()+'</div>';
 return hero()+'<div class="page">'+recommended()+popular()+schTracker()+continueRow()+(L.mode==="guidance"?'':offers())+trust()+'</div>';}   /* recommended first, then popular, then the rest */
function resultsView(){
 var q=S.search,r=results(q);
 return '<section class="rhead"><div class="page"><div class="rbar"><button type="button" class="btn ghost sm" data-act="home">'+'Change search'+'</button>'+
  '<div class="lchips">'+summary(q).map(function(t){return '<span class="lchip">'+esc(t)+'</span>';}).join("")+'</div></div>'+intsBar()+'</div></section>'+
  '<div class="page"><div class="rtools"><h1 class="rh">'+plural(r.list.length,"programme","programmes")+'</h1>'+
  sel("r-sort","Sort by",[["match","Best match"],["short","Shortest duration"],["fee","Lowest fee"]],L.sort)+'</div>'+
  (RX.taken().length?'<label class="mine"><input type="checkbox" id="r-mine"'+(L.mine?' checked':'')+'> Only programmes my results qualify for</label>'
   :'<div class="lnote"><a href="'+esc(mainLink("#portfolio"))+'">Add your exam results</a> to see which programmes you qualify for.</div>')+
  (r.noFee&&!L.showNoFee?'<div class="lnote">'+plural(r.noFee,"programme has","programmes have")+' no fee listed yet, so the budget filter left '+(r.noFee===1?"it":"them")+' out. <button type="button" class="linkbtn" data-act="show-nofee">Show '+(r.noFee===1?"it":"them")+'</button></div>':'')+
  (r.list.length?'<div class="cards">'+r.list.map(function(p){return card(p);}).join("")+'</div>'
   :'<div class="empty">No programmes match all of these. Try another field of study, a different level, or any start date. <button type="button" class="linkbtn" data-act="home">Change search</button></div>')+'</div>';
}
/* ---------- Scholarship matching: the student types their result, the page finds the tier they reach ----------
   A tier's "minimum_result" in the sheet is read as either a number of A grades ("8As", "4As/average ...") or a
   CGPA ("CGPA 3.75 and above", "≥CGPA 3.9000", "CGPA 3.8000-3.8999"). Anything else cannot be checked automatically
   and is listed with its condition so the student can read it. */
function isCgpa(q){return !!exam(q).cgpa;}
function examSelect(v){var grps=[];EXAMS.forEach(function(e){if(grps.indexOf(e.grp)<0)grps.push(e.grp);});
 return '<label class="sf" for="s-qual"><span class="sl">Exam type</span><select id="s-qual">'+grps.map(function(g){
  return '<optgroup label="'+esc(g)+'">'+EXAMS.filter(function(e){return e.grp===g;}).map(function(e){return '<option value="'+esc(e.id)+'"'+(e.id===v?" selected":"")+'>'+esc(e.label||e.id)+'</option>';}).join("")+'</optgroup>';}).join("")+'</select></label>';}
/* A tier belongs to the student's exam when its qualification is that exam. A CGPA tier filed under "Foundation" also
   counts for matriculation or diploma when its condition names them ("Foundation/Matriculation/Diploma: CGPA ..."). */
function examMatch(s,id){if(s.qual===id)return true;var e=exam(id);
 return e.cgpa&&exam(s.qual).cgpa&&s.qual===exam(s.qual).id&&new RegExp("\\b"+id+"\\b","i").test(s.min||"");}
/* With the exam in My results, the search uses those results (kept until the student changes them there). */
function myRes(q){return RX.has(q.qual)?String(isCgpa(q.qual)?RX.cgpa(q.qual):RX.aCount(q.qual)):RX.live()?"":q.res;}
function resultField(q){
 if(RX.has(q.qual))return '<div class="sf mine"><span class="sl">'+(RX.locked()?'🔒 Read from your results slip':'From My results')+'</span><span class="mres">'+esc(RX.letters(q.qual))+(isCgpa(q.qual)?'':' → <span>'+esc(resText({qual:q.qual,res:RX.aCount(q.qual)}))+'</span>')+'</span>'+
  '<a class="hint" href="'+esc(mainLink("#portfolio"))+'">'+(RX.locked()?'Upload a new slip in My results':'Change in My results')+'</a></div>';
 /* Results come only from a photo of the slip when AI can read it (live website, or the preview with Claude). */
 if(RX.locked())return RX.snapField(q.qual);
 /* Live website: results come only from the student's slip (My results), never typed here. */
 if(isCgpa(q.qual))return '<label class="sf" for="s-res"><span class="sl">Your CGPA</span><input id="s-res" type="number" inputmode="decimal" min="0" max="4" step="0.01" placeholder="e.g. 3.85" value="'+esc(q.res==null?"":q.res)+'"></label>';
 var e=exam(q.qual),o=[["","Not out yet"]];for(var i=0;i<=e.max;i++)o.push([String(i),i+" A"+(i===1?"":"s")]);
 return sel("s-res","Number of A grades",o,q.res==null||+q.res>e.max?"":q.res).replace('</label>','<span class="hint">Counts as A: '+esc(e.a.join(", "))+'. <a href="'+esc(mainLink("#portfolio"))+'">Save your results</a></span></label>');
}
/* The same reading as My results (results.js): top 1 = A+ only, top 2 = A+ and A only, 0 = any A grade. */
function tierNeed(min){var n=RX.tierNeed(min);if(n&&!n.cgpa){n.plusOnly=n.top===1;n.aplus=n.top===2;}return n;}
/* Tiers that count only A+ (or only A+ and A) need the grades in My results; with only a total of As they are shown as conditions. */
function restricted(need){return !!(need&&(need.aplus||need.plusOnly));}
function topCount(need,qual){var e=exam(qual);return RX.has(qual)&&!e.cgpa?RX.countIn(qual,e.grades.slice(0,need.plusOnly?1:2)):null;}
/* UEC points, STPM averages and A-Level grade sets ("AAB") are checked from the grades saved in My results. */
function special(need){return !!(need&&(need.pts||need.gpa||need.combo));}
function mine(need,qual){var h=RX.has(qual)?RX.tierHave(need,qual):null;return h&&!h.few?h:null;}
function meets(res,need,qual){if(special(need)){var h=mine(need,qual);return !!(h&&h.ok);}
 if(res==null||res===""||!need)return false;
 if(restricted(need)){var c=topCount(need,qual);return c!=null&&c>=need.as;}
 res=+res;return need.cgpa?res>=need.lo&&(need.hi==null||res<=need.hi):res>=need.as;}
function awardVal(t){return t.waiver!=null?t.waiver:t.amount!=null?t.amount/1000:-1;}   /* compare tiers within one scholarship */
function awardText(t){return t.waiver!=null?t.waiver+'% tuition waiver':t.amount!=null?rm(t.amount):'See official information';}
function resText(q){return q.res==null||q.res===""?"":isCgpa(q.qual)?"CGPA "+q.res:q.res+" A"+(+q.res===1?"":"s");}
function schResults(){
 var q={qual:S.sch.qual,res:myRes(S.sch),level:S.sch.level,inst:S.sch.inst},hasRes=q.level!=="others"&&q.res!=null&&q.res!=="";
 var rows=D.sch.filter(function(s){if(q.inst&&s.inst.id!==q.inst)return false;var l=schLevel(s.applies);if(q.level==="others")return !l&&s.qual==="Other";   /* not tied to a study level or a result */
  return (l===q.level||(!l&&s.qual!=="Other"))&&examMatch(s,q.qual);});
 var groups={},order=[];rows.forEach(function(s){var k=s.inst.id+"|"+s.name+"|"+s.applies;if(!groups[k]){groups[k]={s:s,tiers:[]};order.push(k);}groups[k].tiers.push(s);});
 var list=order.map(function(k){var g=groups[k];g.best=null;g.hit=null;g.next=null;g.check=false;
  g.tiers.forEach(function(t){if(t.waiver!=null&&(g.best==null||t.waiver>g.best))g.best=t.waiver;var n=tierNeed(t.min);if(!n)g.check=true;if(special(n)&&!mine(n,q.qual))g.needRes=true;t.need=n;
   if(hasRes&&meets(q.res,n,q.qual)&&(!g.hit||awardVal(t)>awardVal(g.hit)))g.hit=t;});
  /* Next step: the closest tier not reached yet that pays more than the current one (ties: the bigger award). */
  function gapOf(t){if(special(t.need)){var h=mine(t.need,q.qual);return h?RX.gapOf(t.need,h):Infinity;}var c=restricted(t.need)?topCount(t.need,q.qual):null,d=t.need.cgpa?t.need.lo-(+q.res):t.need.as-(c!=null?c:+q.res);return restricted(t.need)&&c==null?Math.max(d,0):d;}
  if(hasRes)g.tiers.forEach(function(t){if(!t.need||gapOf(t)===Infinity||meets(q.res,t.need,q.qual)||(gapOf(t)<=0&&!restricted(t.need))||(g.hit&&awardVal(t)<=awardVal(g.hit)))return;
   if(!g.next||gapOf(t)<gapOf(g.next)||(gapOf(t)===gapOf(g.next)&&awardVal(t)>awardVal(g.next)))g.next=t;});
  return g;});
 var yes=hasRes?list.filter(function(g){return g.hit;}).sort(function(a,b){return awardVal(b.hit)-awardVal(a.hit);}):list,no=hasRes?list.filter(function(g){return !g.hit;}):[];
 function gap(t){if(!t.need)return '';
  if(special(t.need)){var h=mine(t.need,q.qual);return h?'Needs '+RX.needWords(t.need)+' for '+awardText(t)+' (you have '+(t.need.gpa?h.have.toFixed(2):h.have)+')':'Needs '+RX.needWords(t.need)+' for '+awardText(t);}if(t.need.cgpa)return 'Needs CGPA '+t.need.lo.toFixed(2)+(t.need.hi!=null?' – '+(Math.floor(t.need.hi*100+1e-6)/100).toFixed(2):' or above');
  var d=t.need.as-(+q.res);
  var c=restricted(t.need)?topCount(t.need,q.qual):null,top=exam(q.qual).grades||[];
  if(c!=null)return 'Needs '+t.need.as+' '+(t.need.plusOnly?top[0]:top.slice(0,2).join(" or "))+' for '+awardText(t)+' (you have '+c+')';
  if(t.need.plusOnly)return hasRes&&d<=0?awardText(t)+' if all '+t.need.as+' are A+':'Needs '+t.need.as+' A+ for '+awardText(t);
  if(t.need.aplus)return hasRes&&d<=0?awardText(t)+' if your As are A+ or A only':'Needs '+t.need.as+' As (A+ or A only) for '+awardText(t);
  return hasRes&&d>0?d+' more A'+(d===1?'':'s')+' for '+awardText(t):'Needs '+t.need.as+' As';}
 function card(g){var u=g.s.inst;
  return '<article class="pcard sch'+(g.hit?' won':'')+'">'+cover(u)+'<div class="pbody"><span class="pinst">'+esc(u.name)+'</span><h3>'+esc(g.s.name)+'</h3>'+(g.s.applies?'<span class="hint">'+esc(g.s.applies)+'</span>':'')+
   (g.hit?'<div class="win"><span>You qualify</span><b>'+esc(awardText(g.hit))+'</b></div>':'')+
   (g.next?'<span class="why">'+esc(g.hit?'Next: '+gap(g.next):gap(g.next))+'</span>':'')+
   '<table class="tiers"><thead><tr><th scope="col">'+(g.s.qual==="Other"?'Eligibility':esc(isCgpa(q.qual)?'CGPA':q.qual+' result'))+'</th><th scope="col">Award</th></tr></thead><tbody>'+g.tiers.map(function(t){
    return '<tr'+(t===g.hit?' class="hit"':'')+'><td>'+esc(t.min)+(t.need&&t.need.aplus?'<br><span class="hint">A+ and A only</span>':t.need&&t.need.plusOnly?'<br><span class="hint">A+ grades only</span>':'')+'</td><td><b>'+(t.waiver!=null?t.waiver+'%':t.amount!=null?esc(rm(t.amount)):'See official information')+'</b></td></tr>';}).join("")+'</tbody></table>'+
   (hasRes&&g.check?'<span class="hint">Some tiers here cannot be checked automatically. Read their conditions or ask a counsellor.</span>':'')+
   (g.needRes?'<span class="hint">Save your subject grades in <a href="'+esc(mainLink("#portfolio"))+'">My results</a> to check the tiers based on points, averages or grade sets.</span>':'')+
   '<div class="pfoot"><span class="fee">'+(g.best!=null&&!g.hit?'<b>Up to '+g.best+'%</b><span class="hint">tuition waiver</span>':'')+'</span><div class="pact"><a class="btn ghost sm" href="#consultation" data-topic="Scholarships" data-note="'+esc("Scholarship: "+g.s.name+" ("+u.name+")"+(hasRes?". My result: "+q.qual+" "+resText(q):"")+".")+'">Free consultation</a>'+
   (u.progs?'<a class="btn sm" href="#universities/'+esc(u.id.toLowerCase())+'" data-flow="scholarships">See programmes</a>':'')+'</div></div></div></article>';}
 var fnd=q.level==="foundation"||q.level==="undergraduate"?D.fnd:[];
 return '<section class="rhead"><div class="page"><div class="rbar"><button type="button" class="btn ghost sm" data-act="home">Change search</button><div class="lchips">'+
  [q.level==="others"?"":q.qual+(hasRes?' · '+resText(q):''),q.level==="foundation"?"Foundation":q.level==="others"?"Others":"Undergraduate degree",q.inst?(D.inst.filter(function(u){return u.id===q.inst;})[0]||{}).name:"All universities"].filter(Boolean).map(function(t){return '<span class="lchip">'+esc(t)+'</span>';}).join("")+'</div></div>'+intsBar()+'</div></section>'+
  '<div class="page">'+
  (hasRes?'<h1 class="rh">'+(yes.length?'You qualify for '+plural(yes.length,"scholarship","scholarships"):'No scholarship matches this result yet')+'</h1>'
   :'<h1 class="rh">'+plural(list.length,"campus scholarship","campus scholarships")+'</h1>'+(q.level!=="others"?'<p class="muted">Add your result in the search to see which tier you reach.</p>':''))+
  (yes.length?'<div class="cards">'+yes.map(card).join("")+'</div>':(hasRes?'':'<div class="empty">No campus scholarship in our data matches '+esc(q.qual)+' at this level yet. A counsellor can check other options with you. <a class="linkbtn" href="#consultation">Book a free consultation</a></div>'))+
  (no.length?'<h2 class="rh2">'+(yes.length?'Almost there':'What these scholarships need')+'</h2><div class="cards">'+no.map(card).join("")+'</div>':'')+
  (hasRes&&!list.length?'<div class="empty">No campus scholarship in our data matches '+esc(q.qual)+' at this level yet. A counsellor can check other options with you. <a class="linkbtn" href="#consultation">Book a free consultation</a></div>':'')+
  /* Foundation scholarships: the award's first line, the first requirements and a link to all of them. */
  (fnd.length?'<h2 class="rh2">Other scholarships open to all students</h2><div class="cards">'+fnd.slice(0,6).map(function(f){var aw=String(f.award||"").split(/\n/).filter(Boolean),more=f.req.length-4,href="#scholarships-foundation/"+esc(String(f.id||"").toLowerCase());
    return '<article class="pcard sch"><div class="pbody"><span class="pinst">'+esc(f.org||"Scholarship")+'</span><h3>'+esc(f.name)+'</h3>'+
    '<div class="win"><span>Award</span><b>'+esc(aw[0]||"See official information")+'</b></div><span class="sl">Requirements</span>'+
    '<ul class="req">'+f.req.slice(0,4).map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul>'+(more>0?'<span class="hint">'+plural(more,"more requirement","more requirements")+'</span>':'')+
    '<div class="pfoot"><span class="fee"></span><div class="pact"><a class="btn ghost sm" href="#consultation" data-topic="Scholarships">Ask a counsellor</a><a class="btn sm" href="'+href+'">Requirements and award</a></div></div></div></article>';}).join("")+'</div>'+
   (fnd.length>6?'<p><a class="btn ghost" href="#scholarships-foundation">See all '+fnd.length+' foundation scholarships</a></p>':''):'')+'</div>';
}
function savedView(){
 var list=S.saved.map(prog).filter(Boolean);
 return '<div class="page"><h1 class="rh">Saved programmes</h1>'+(list.length>1?'<div class="cmpbar"><span class="hint">Compare 2 or 3 of your saved programmes side by side: fees, distance, scholarships and careers.</span><a class="btn sm" href="'+esc(mainLink("#portfolio"))+'">⚖️ Compare</a></div>':'')+(list.length?'<div class="cards">'+list.map(function(p){return card(p);}).join("")+'</div>':'<div class="empty">Tap the heart on any programme to keep it here. <button type="button" class="linkbtn" data-act="home">Start searching</button></div>')+'</div>';
}
/* Menu (three lines, top right): My portfolio and About us, plus the account links that are icons on phones. */
function menu(){
 var em=S.session&&S.session.email,n=S.saved.length;
 function item(href,label,sub,act){return (act?'<button type="button" class="mitem" data-act="'+act+'">':'<a class="mitem" href="'+esc(href)+'">')+'<b>'+esc(label)+'</b>'+(sub?'<span>'+esc(sub)+'</span>':'')+(act?'</button>':'</a>');}
 return '<div class="mscrim" data-act="menu"></div><nav class="menu" id="lab-menu" aria-label="Menu">'+
  '<div class="mhead">'+(em?'<span class="avatar" aria-hidden="true" data-notr>'+esc(em.charAt(0).toUpperCase())+'</span><span class="memail" data-notr>'+esc(em)+'</span>'
   :'<span class="mguest">You are not signed in.</span><a class="btn sm" href="'+esc(mainLink("#portfolio"))+'">Sign in</a>')+'</div>'+
  item("#portfolio","My portfolio","Saved programmes, quiz result and application")+
  item("#about","About us","Who we are and how we guide you")+
  '<span class="mlabel">Explore</span>'+
  item("#faculty","Faculties","Choose a faculty, then a course")+
  item("#universities","Universities","Programmes by university and level")+
  item("#scholarships","Scholarships","Scholarship types and requirements")+
  item("#accommodation","Accommodation","")+
  '<span class="mlabel">My plan</span>'+
  item("#saved","Saved programmes",n?plural(n,"programme","programmes"):"")+
  item("#apply","My applications","")+
  item("#consultation","Book a free consultation","")+
  item("#privacy","Privacy, cookies and security","No cookies or tracking. What this browser keeps")+
  '</nav>';
}
function aboutView(){
 var A=window.EDUPLAN_ABOUT;if(!A)return '<div class="page"><div class="empty">About us is not available.</div></div>';
 var f=A.founder,photo=window.EDUPLAN_FOUNDER_PHOTO||(f.photo?"../"+f.photo:"");
 var go={"#faculty":'data-mode="interest"',"#universities":'data-mode="interest"',"#scholarships":'data-mode="scholarship"'};
 function tl(label,rows){return rows&&rows.length?'<div class="tl2"><h3>'+esc(label)+'</h3><ol>'+rows.map(function(r){return '<li><b>'+esc(r.title)+'</b><span>'+esc(r.org)+'</span><span class="hint">'+esc([r.when,r.place].filter(Boolean).join(" · "))+'</span></li>';}).join("")+'</ol></div>':'';}
 return '<section class="hero about"><div class="hwrap"><span class="ok3">About us</span><h1>We lead students to the right place to study</h1>'+
  '<p class="lead">Eduplan is an education tool that guides students to a suitable institution, from learning about it to the registration phase. The service is free of charge for students.</p></div></section>'+
  '<div class="page"><div class="pgrid"><section class="box"><span class="pinst">Our vision</span><p class="lbig">'+esc(A.vision)+'</p><ul class="vp">'+A.points.map(function(v){return '<li><b>'+esc(v[0])+'</b><span>'+esc(v[1])+'</span></li>';}).join("")+'</ul></section>'+
  '<section class="box"><span class="pinst">Our mission</span><p class="lbig">'+esc(A.mission)+'</p><ol class="jr">'+A.journey.map(function(j){var g=go[j[2]];
   return '<li>'+(g?'<button type="button" class="jlink" '+g+'>':'<a class="jlink" href="'+esc(mainLink(j[2]))+'">')+'<b>'+esc(j[0])+'</b><span>'+esc(j[1])+'</span>'+(g?'</button>':'</a>')+'</li>';}).join("")+'</ol></section></div>'+
  '<section class="sec"><div class="sh"><h2>Meet our founder</h2></div><div class="lfounder">'+(photo?'<img src="'+esc(photo)+'" alt="'+esc(f.name)+', '+esc(f.role)+' of Eduplan">':'')+
   '<div class="fbody"><span class="pinst">'+esc(f.role)+'</span><h3>'+esc(f.name)+'</h3><p class="muted">'+esc(f.bio)+'</p>'+
   '<div class="pact">'+(f.facebook?'<a class="btn ghost sm" href="'+esc(f.facebook)+'" target="_blank" rel="noopener">Facebook</a>':'')+'<a class="btn sm" href="'+esc(mainLink("#consultation"))+'">Book a free consultation</a></div></div>'+
   '<div class="fcv">'+tl("Career",f.career)+tl("Education",f.education)+'</div></div></section>'+trust()+'</div>';
}
/* Sheet text, one item per line; bullets typed by the school are dropped. */
function lines(s){return String(s||"").split(/\n/).map(function(x){return x.trim();}).filter(Boolean);}
function bare(x){return x.replace(/^[•·*▪◦–-]\s*/,"");}
/* Programme structure: a line ending in ":" starts a block (Year 1:, Semester 2:, Electives:), the lines under it are its subjects. */
function structure(s,url){
 var groups=[],g=null;
 lines(s).forEach(function(x){if(/[:：]$/.test(x)){g={h:x.replace(/[:：]$/,""),items:[]};groups.push(g);}else{if(!g){g={h:"",items:[]};groups.push(g);}g.items.push(bare(x));}});
 if(!groups.length)return '<p class="hint">The institution has not listed the programme structure yet.'+(url?' <a href="'+esc(url)+'" target="_blank" rel="noopener">See the programme page</a>.':'')+'</p>';
 return '<div class="pstruct">'+groups.map(function(g){return '<div class="psb">'+(g.h?'<b>'+esc(g.h)+'</b>':'')+(g.items.length?'<ul>'+g.items.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul>':'')+'</div>';}).join("")+'</div>';
}
function detailSheet(){
 var p=prog(L.detail);if(!p)return '';var w=bestWaiver(p);
 return '<div class="scrim" data-act="close"></div><section class="sheet" role="dialog" aria-modal="true" aria-labelledby="sheet-h" tabindex="-1">'+
  '<button type="button" class="x" data-act="close" aria-label="Close"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg></button>'+
  cover(p.inst,true)+'<div class="sbody"><span class="pinst">'+esc(p.inst.full)+'</span><h2 id="sheet-h">'+esc(p.name)+'</h2>'+
  '<div class="pills">'+pill(levelName(p.lk)||p.level)+(p.years!=null?pill(years(p.years)):"")+(p.mqa?pill("MQA "+p.mqa,"ok"):"")+'</div>'+
  (p.overview?'<p class="pover">'+esc(p.overview)+'</p>':'')+
  '<dl class="lfacts"><dt>Tuition fee</dt><dd>'+(p.fee!=null?esc(rm(p.fee))+' (whole programme)':p.annual.length?p.annual.map(esc).join("<br>")+' (per year)':'To be confirmed')+'</dd>'+
  (p.intakes?'<dt>Intakes</dt><dd>'+esc(p.intakes)+'</dd>':'')+'<dt>Location</dt><dd>'+esc(p.campus||[p.inst.city,p.inst.state].filter(Boolean).join(", ")||"To be confirmed")+'</dd>'+
  (p.english?'<dt>English requirement</dt><dd>'+esc(p.english)+'</dd>':'')+(w!=null?'<dt>Scholarship</dt><dd>Up to '+w+'% tuition waiver</dd>':'')+'</dl>'+payBox(p)+
  '<h3>Entry requirements</h3>'+entryBadge(p,true)+'<dl class="lfacts">'+p.entry.map(function(e){return '<dt>'+esc(e[0])+'</dt><dd>'+(e[1]?String(e[1]).split(/\n/).filter(function(x){return x.trim();}).map(function(x){x=x.trim();var h=/[:：]$/.test(x);
   return h?'<b>'+esc(x)+'</b>':'• '+esc(x.replace(/^[•·*▪◦–-]\s*/,""));}).join("<br>"):'<span class="hint">Not listed by the institution</span>')+'</dd>';}).join("")+'</dl>'+
  '<h3>Programme structure</h3>'+structure(p.structure,p.url)+
  (lines(p.careers).length?'<h3>Career prospects</h3><ul class="pcareer">'+lines(p.careers).map(function(x){return '<li>'+esc(bare(x))+'</li>';}).join("")+'</ul>':'')+
  (p.notes.length?'<h3>Notes</h3>'+p.notes.map(function(x){return '<p class="muted">'+esc(x)+'</p>';}).join(""):'')+
  '</div><div class="sfoot">'+heartBtn(p.id)+(p.url?'<a class="btn ghost sm" href="'+esc(p.url)+'" target="_blank" rel="noopener">Programme page</a>':'')+
  '<a class="btn ghost sm" href="#consultation" data-topic="Choosing a university" data-note="'+esc("Interested in: "+p.name+" ("+p.inst.name+").")+'">Free consultation</a><a class="btn sm" href="#next/'+esc(p.id)+'" data-lflow="'+cardFlow()+'">Apply now</a></div></section>';
}
function help(){
 var wa=window.EDUPLAN_WHATSAPP||"";
 return '<div class="help'+(L.help?" open":"")+'"><div class="hmenu" id="help-menu"'+(L.help?"":" hidden")+'>'+
  '<button type="button" class="hitem" data-act="ai"><b>Ask the AI study assistant</b><span>Answers about courses, fees and scholarships</span></button>'+
  (wa?'<a class="hitem" href="https://wa.me/'+esc(wa.replace(/\D/g,""))+'" target="_blank" rel="noopener"><b>WhatsApp a counsellor</b><span data-notr>'+esc(wa)+'</span></a>'
   :'<div class="hitem off"><b>WhatsApp a counsellor</b><span>The WhatsApp number will be added soon.</span></div>')+
  '<a class="hitem" href="'+esc(mainLink("#consultation"))+'"><b>Book a free consultation</b><span>A counsellor calls you back</span></a></div>'+
  '<button type="button" class="hfab" data-act="help" aria-expanded="'+L.help+'" aria-controls="help-menu"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"></path></svg><span>Need help?</span></button></div>';
}

/* ---------- Render and events ---------- */
var top=document.getElementById("top"),app=document.getElementById("app"),helpBox=document.getElementById("helpbox"),sheet=document.getElementById("sheet");
function route(){var h=(location.hash||"#home").slice(1);L.view=window.EDUPLAN_HOST&&!window.EDUPLAN_HOST.owns(h)?"app":({results:"results",saved:"saved",about:"about"}[h]||"home");}
function chrome(){
 S.saved=ls("eduplan-saved")||[];S.quiz=ls("eduplan-quiz")||S.quiz;S.session=ls("eduplan-session");if(S.session&&!(S.session.token&&S.session.exp>Date.now()))S.session=null;
 var lang=top.querySelector(".lang");top.innerHTML=topbar()+(L.menu?menu():"")+(L.info?modeInfo():"");if(lang)top.querySelector(".bar").appendChild(lang);
 helpBox.innerHTML=help();
}
if(window.EDUPLAN_HOST)window.EDUPLAN_HOST.rendered=function(){route();chrome();};
function render(keep){
 route();chrome();
 document.body.classList.toggle("lab-own",L.view!=="app");
 if(L.view==="app"){sheet.innerHTML="";document.body.classList.remove("locked");return;}   /* the main app draws this page */
 if(L.view==="results"&&locked())L.view="home";
 app.innerHTML=L.view==="results"?(L.mode==="scholarship"?schResults():resultsView()):L.view==="saved"?savedView():L.view==="about"?aboutView():home();
 sheet.innerHTML=L.detail?detailSheet():"";document.body.classList.toggle("locked",!!L.detail);
 if(!keep)window.scrollTo(0,0);
}
function go(view){if(location.hash==="#"+view)render();else location.hash="#"+view;}
window.addEventListener("hashchange",function(){L.detail=null;L.menu=false;render();});
function readSearch(){
 var w=document.getElementById("q-what");if(!w)return;
 var txt=w.value.trim(),fac=w.getAttribute("data-lfac");
 /* A faculty name typed or picked from the list searches that faculty exactly. */
 var f=FAC.fields.filter(function(x){return x.name.toLowerCase()===txt.toLowerCase();})[0];
 S.search={what:f?"":txt,fac:f?f.code:(fac&&txt===facLabel(fac)?fac:""),where:val("q-where"),level:val("q-level"),budget:val("q-budget"),intake:val("q-intake")};
 ls("eduplan-lab-search",S.search);hadSearch=true;touch("search");
}
function val(id){var e=document.getElementById(id);return e?e.value:"";}
function setMode(m){if(locked()){L.info=false;L.menu=false;if(L.view!=="home")go("home");else render(true);var lb=document.querySelector(".lockbox");if(lb){lb.scrollIntoView({block:"center"});lb.classList.add("nudge");}return;}
 L.info=false;L.mode=m;L.quizStep=null;ls("eduplan-lab-mode",m);touch("search");if(L.view!=="home")go("home");else render(true);}
function openDetail(id){L.detail=id;S.recent=[id].concat(S.recent.filter(function(x){return x!==id;})).slice(0,8);ls("eduplan-lab-recent",S.recent);touch("recent");render(true);
 var s=sheet.querySelector(".sheet");if(s)s.focus();}
function toggleSave(id){S.saved=ls("eduplan-saved")||[];var i=S.saved.indexOf(id);if(i<0)S.saved.push(id);else S.saved.splice(i,1);ls("eduplan-saved",S.saved);touch("saved");render(true);}
document.addEventListener("click",function(ev){
 var t=ev.target.closest("button,a,[data-act]");if(!t)return;

 /* Links into the main app's journey remember which route the student is on (its progress bar and Back button). */
 if(t.hasAttribute("data-lflow")){try{sessionStorage.setItem("eduplan-flow",t.getAttribute("data-lflow"));sessionStorage.setItem("eduplan-last",location.hash||"#home");}catch(e){}return;}
 if(t.hasAttribute("data-mode")){setMode(t.getAttribute("data-mode"));return;}
 /* Register / Sign in open the sign-in form on My portfolio; Visitor browses without searching. */
 if(t.hasAttribute("data-role")){var role=t.getAttribute("data-role");
  if(role==="visitor"){ls("eduplan-role","visitor");L.menu=false;go("home");render(true);return;}
  try{sessionStorage.setItem("eduplan-pfmode",role);}catch(e){}L.menu=false;location.hash="#portfolio";return;}
 if(t.getAttribute("data-pf")==="guest"&&preview())ls("eduplan-role","preview");
 if(t.hasAttribute("data-lsave")){toggleSave(t.getAttribute("data-lsave"));return;}
 if(t.hasAttribute("data-detail")){openDetail(t.getAttribute("data-detail"));return;}
 if(t.hasAttribute("data-where")){L.mode="interest";ls("eduplan-lab-mode","interest");S.search={what:"",fac:"",where:t.getAttribute("data-where"),level:"",budget:"",intake:""};ls("eduplan-lab-search",S.search);touch("search");L.detail=null;go("results");return;}
 if(t.hasAttribute("data-lfac")){if(L.mode==="scholarship"){L.mode="interest";ls("eduplan-lab-mode","interest");}
  S.search={what:"",fac:t.getAttribute("data-lfac"),where:"",level:"",budget:"",intake:""};ls("eduplan-lab-search",S.search);touch("search");L.detail=null;go("results");return;}
 if(t.hasAttribute("data-schinst")){L.mode="scholarship";ls("eduplan-lab-mode","scholarship");S.sch.inst=t.getAttribute("data-schinst");S.sch.level=t.getAttribute("data-schlevel");ls("eduplan-lab-sch",S.sch);go("results");return;}
 if(t.hasAttribute("data-lans")){S.quiz.answers[L.quizStep]=Number(t.getAttribute("data-lans"));var n=QUIZ.questions.length;L.quizStep++;S.quiz.step=L.quizStep;
  if(L.quizStep>=n){var r=guidedScore(S.quiz.answers,null);S.quiz.tie=null;if(!r.close){L.quizStep=null;S.quiz.step=n;}}quizSave();render(true);return;}
 if(t.hasAttribute("data-ltie")){S.quiz.tie=t.getAttribute("data-ltie");S.quiz.step=QUIZ.questions.length;L.quizStep=null;quizSave();render(true);return;}
 var act=t.getAttribute("data-act");if(!act)return;
 if(act==="close"){L.detail=null;render(true);}
 else if(act==="home")go("home");
 else if(act==="help"){L.help=!L.help;L.menu=false;render(true);}
 else if(act==="info"){L.info=!L.info;L.menu=false;L.help=false;render(true);var f=document.querySelector(L.info?".infoitem":".info");if(f)f.focus();}
 else if(act==="menu"){L.menu=!L.menu;L.help=false;L.info=false;render(true);var m=document.querySelector(".menu .mitem");if(L.menu&&m)m.focus();else{var bb=top.querySelector(".burger");if(bb)bb.focus();}}
 else if(act==="signout"){var tk=S.session&&S.session.token;flush(true);if(tk&&live)post({action:"account_logout",token:tk}).catch(function(){});
  ["eduplan-session","eduplan-at","eduplan-saved","eduplan-quiz","eduplan-consult","eduplan-lab-search","eduplan-lab-sch","eduplan-lab-recent"].forEach(function(k){ls(k,null);});
  try{sessionStorage.removeItem("eduplan-apply");}catch(e){}
  S.session=null;S.saved=[];S.recent=[];S.quiz={step:0,answers:[]};S.search=JSON.parse(JSON.stringify(SEARCH0));S.sch=JSON.parse(JSON.stringify(SCH0));S.at={};S.serverApply=null;hadSearch=false;go("home");}
 else if(act==="ai"){L.help=false;render(true);window.dispatchEvent(new CustomEvent("eduplan:ask",{detail:{text:""}}));}
 else if(act==="clear-search"){S.search=JSON.parse(JSON.stringify(SEARCH0));ls("eduplan-lab-search",S.search);hadSearch=false;touch("search");render(true);}
 else if(act==="show-nofee"){L.showNoFee=true;render(true);}
 else if(act==="quiz-start"){var a=S.quiz.answers.filter(function(v){return v!=null;}).length;L.quizStep=a&&S.quiz.step<QUIZ.questions.length?S.quiz.step:0;if(!L.quizStep){S.quiz={step:0,answers:[],tie:null};}render(true);}
 else if(act==="quiz-again"){S.quiz={step:0,answers:[],tie:null};L.quizStep=0;quizSave();render(true);}
 else if(act==="quiz-back"){L.quizStep=Math.max(0,L.quizStep-1);S.quiz.step=L.quizStep;quizSave();render(true);}
});
document.addEventListener("submit",function(ev){
 if(ev.target.id==="search-form"){ev.preventDefault();readSearch();L.showNoFee=false;go("results");}
 if(ev.target.id==="sch-form"){ev.preventDefault();var rv=val("s-res").trim(),q0=val("s-qual");
  if(rv!==""&&isCgpa(q0)){var n=parseFloat(rv);rv=isNaN(n)?"":String(Math.max(0,Math.min(4,n)));}
  S.sch={qual:q0,res:rv,level:val("s-level"),inst:val("s-inst")};ls("eduplan-lab-sch",S.sch);touch("search");go("results");}
});
/* My results changed (on the portfolio page or the application form): redraw the lab's own pages. */
window.addEventListener("eduplan:results",function(){if(L.view!=="app")render(true);});
document.addEventListener("input",function(ev){if(ev.target.id==="q-what")ev.target.removeAttribute("data-fac");});
document.addEventListener("change",function(ev){if(ev.target.id==="r-sort"){L.sort=ev.target.value;render(true);}
 if(ev.target.id==="q-mine"){L.mine=ev.target.checked;}
 if(ev.target.id==="r-mine"){L.mine=ev.target.checked;render(true);var mi=document.getElementById("r-mine");if(mi)mi.focus();}
 if(ev.target.id==="s-qual"){var q1=ev.target.value,was=isCgpa(S.sch.qual);S.sch.qual=q1;S.sch.level=exam(q1).lv;S.sch.inst=val("s-inst");
  S.sch.res=isCgpa(q1)!==was?"":val("s-res");if(!isCgpa(q1)&&+S.sch.res>exam(q1).max)S.sch.res="";render(true);var f=document.getElementById("s-res");if(f)f.focus();}});
document.addEventListener("keydown",function(ev){if(ev.key==="Escape"){if(L.detail){L.detail=null;render(true);}else if(L.info){L.info=false;render(true);var ib=top.querySelector(".info");if(ib)ib.focus();}else if(L.menu){L.menu=false;render(true);var bb=top.querySelector(".burger");if(bb)bb.focus();}else if(L.help){L.help=false;render(true);}}});

/* Cover: an animated About us screen when the website opens (once per browser tab); "Click to continue" opens the site.
   Facts come from lab-about.js and the live counts from the sheet data. */
/* Second screen: every visitor (guest or signed in) picks their top 3 fields of study, in order, from the faculties
   offered under "What do you want to study?". Saved in My profile (eduplan-profile .fields); asked until there are 3. */
function myInts(){var p=ls("eduplan-profile")||{};return (p.fields||[]).filter(function(c){return facByCode(c);});}
/* Fields with programmes; every field while the programmes are still loading (the live website waits for Apps Script),
   so the interests step is never skipped. */
function intFacs(){var all=FAC.fields.filter(function(f){return f.code!=="00";}),has=all.filter(function(f){return D.progs.some(function(p){return p.fac===f;});});
 return has.length?has:all;}
function interests(){
 var skipped=false;try{skipped=!!sessionStorage.getItem("eduplan-ints-skip");}catch(e){}
 if(skipped||myInts().length>=3||/^#(privacy|portfolio)/.test(location.hash)||document.querySelector(".ipick")||!intFacs().length)return false;
 var pick=myInts().slice(0,3),d=document.createElement("div");d.className="intro ipick";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-labelledby","ipick-h");
 function draw(){
  d.innerHTML='<div class="iblobs" aria-hidden="true"><i></i><i></i><i></i></div><div class="iwrap">'+
   '<span class="ieye">Step 3 of 3 · Your interests</span><h1 id="ipick-h"><span>What are your top 3 interests?</span></h1>'+
   '<p class="ilead">Choose three fields of study, in order: your first choice first. We use them to suggest courses and universities for you.</p>'+
   '<div class="ipgrid" role="group" aria-label="Fields of study">'+intFacs().map(function(f){var k=pick.indexOf(f.code);
    return '<button type="button" class="ipc'+(k>=0?' on':'')+'" role="checkbox" aria-checked="'+(k>=0)+'" data-ip="'+esc(f.code)+'"'+(k<0&&pick.length>=3?' disabled':'')+'>'+
     '<span class="ipn" aria-hidden="true">'+(k>=0?k+1:'')+'</span><b>'+esc(f.name)+'</b></button>';}).join("")+'</div>'+
   '<p class="ipcount" aria-live="polite">'+pick.length+' of 3 chosen</p>'+
   '<div class="ibtns"><button type="button" class="btn icta" data-ipok'+(pick.length<3?' disabled':'')+'>Continue <span aria-hidden="true">→</span></button>'+
   '<button type="button" class="iskip" data-ipskip>Skip for now</button></div></div>';}
 draw();document.body.appendChild(d);document.body.classList.add("introopen");
 d.addEventListener("click",function(ev){var b=ev.target.closest("button");if(!b)return;
  if(b.hasAttribute("data-ip")){var c=b.getAttribute("data-ip"),k=pick.indexOf(c);if(k>=0)pick.splice(k,1);else if(pick.length<3)pick.push(c);draw();
   var nb=d.querySelector('[data-ip="'+c+'"]');if(nb)nb.focus();return;}
  if(b.hasAttribute("data-ipskip")){try{sessionStorage.setItem("eduplan-ints-skip","1");}catch(e){}
   d.classList.add("out");setTimeout(function(){d.remove();document.body.classList.remove("introopen");render(true);},300);return;}
  if(b.hasAttribute("data-ipok")&&pick.length===3){var p=ls("eduplan-profile")||{};p.fields=pick.slice();ls("eduplan-profile",p);
   window.dispatchEvent(new CustomEvent("eduplan:profile"));
   d.classList.add("out");setTimeout(function(){d.remove();document.body.classList.remove("introopen");render(true);},300);}});
 setTimeout(function(){var f=d.querySelector("[data-ip]");if(f)f.focus({preventScroll:true});},50);
 return true;}
/* Second screen: sign in (or register: the first sign-in creates the account) with an email code, or continue as a
   guest. It uses the same account as My portfolio (app.js EDUPLAN_ACCOUNT): signing in here loads the portfolio, and
   My portfolio shows the student signed in. Skipped when already signed in, or once chosen in this tab. */
function account(){
 var done=false;try{done=!!sessionStorage.getItem("eduplan-acct");}catch(e){}
 if(S.session||done||/^#(privacy|portfolio)/.test(location.hash)||document.querySelector(".iacct"))return false;
 var AC=window.EDUPLAN_ACCOUNT,live=!!(AC&&AC.live()),st={step:"email",email:"",consent:false,err:"",msg:"",busy:false,errAt:""};
 var d=document.createElement("div");d.className="intro iacct";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-labelledby","iacct-h");
 function E(k){return (AC&&AC.errors[k])||"Something went wrong. Please try again.";}
 function draw(focus){
  var err=function(at){return st.err&&st.errAt===at?'<span class="err" id="ia-err" role="alert">'+esc(st.err)+'</span>':'';},dis=st.busy?' disabled':'';
  var form=!live?'<p class="iam">Signing in works on the live Eduplan website. In this preview you can try everything as a guest.</p>'+
    '<div class="row"><button type="button" class="btn" data-onb="guest">Continue to the preview</button></div>'
   :st.step==="code"?'<form class="fields" data-iaform="code" novalidate><p class="iam" role="status">'+esc(st.msg)+'</p>'+
    '<div class="field"><label for="ia-code">6-digit code</label><input id="ia-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6"'+(st.errAt==="code"?' aria-invalid="true" aria-describedby="ia-err"':'')+'>'+err("code")+
    '<span class="hint">Sent to <span data-notr>'+esc(st.email)+'</span>. Check your spam folder if it is not in your inbox.</span></div>'+
    '<div class="row"><button type="submit" class="btn"'+dis+'>'+(st.busy?'Checking…':'Sign in')+'</button>'+
    '<button type="button" class="btn ghost" data-ia="again"'+dis+'>Send a new code</button><button type="button" class="btn ghost" data-ia="other">Use another email</button></div></form>'
   :'<form class="fields" data-iaform="email" novalidate>'+
    '<div class="field"><label for="ia-email">Email</label><input id="ia-email" type="email" autocomplete="email" value="'+esc(st.email)+'"'+(st.errAt==="email"?' aria-invalid="true" aria-describedby="ia-err"':'')+'>'+err("email")+
    '<span class="hint">No password needed. We email you a 6-digit code. New here? This creates your free account.</span></div>'+
    '<div class="field"><label class="check"><input type="checkbox" id="ia-consent"'+(st.consent?' checked':'')+'><span>I agree that Eduplan keeps my portfolio (saved programmes, quiz result, results, profile, consultation request and application details) to guide me with my studies. Only Eduplan staff can see it; it goes to a university only when I submit an application. I can delete it at any time. If I am under 18, I have asked my parent or guardian.</span></label>'+err("consent")+'</div>'+
    '<div class="row"><button type="submit" class="btn"'+dis+'>'+(st.busy?'Sending…':'Email me a code')+'</button></div>'+
    '<p class="hint"><a href="#privacy" data-ia="privacy">What we ask for, and when</a></p></form>';
  var box=d.querySelector(".iform");
  if(box){box.classList.add("still");box.innerHTML=form;}   /* only the form changes: no replayed animation */
  else d.innerHTML='<div class="iblobs" aria-hidden="true"><i></i><i></i><i></i></div><div class="iwrap">'+
   '<span class="ieye">Step 2 of 3 · Sign in</span><h1 id="iacct-h"><span>Sign in or register</span></h1>'+
   '<p class="ilead">Your results, saved programmes and applications are kept in My portfolio, so you can continue on any device.</p>'+
   '<div class="iform">'+form+'</div>'+
   '<button type="button" class="iskip" data-onb="guest">Continue as guest <span aria-hidden="true">→</span></button>'+
   '<p class="ipcount">Guests can browse and search; sign in any time from My portfolio.</p></div>';
  if(focus){var el=d.querySelector(focus);if(el)el.focus({preventScroll:true});}}
 function close(guest){try{sessionStorage.setItem("eduplan-acct","1");}catch(e){}
  if(guest&&!live)ls("eduplan-role","preview");
  d.classList.add("out");setTimeout(function(){d.remove();if(!interests())document.body.classList.remove("introopen");render(true);},300);}
 function send(){var em=String(st.email||"").trim().toLowerCase();st.err="";
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em)){st.err=E("bad_email");st.errAt="email";return draw("#ia-email");}
  if(!st.consent){st.err=E("consent");st.errAt="consent";return draw("#ia-consent");}
  st.email=em;st.busy=true;draw();
  AC.sendCode(em).then(function(r){st.busy=false;
   if(r&&r.ok){st.step="code";st.msg="We emailed a 6-digit code to "+em+". It expires in 10 minutes.";return draw("#ia-code");}
   if(r&&r.error==="wait"){st.step="code";st.msg="";st.err=E("wait");st.errAt="code";return draw("#ia-code");}
   st.err=E(r&&r.error||"bad_request");st.errAt="email";draw("#ia-email");
  }).catch(function(){st.busy=false;st.err=E("net");st.errAt="email";draw("#ia-email");});}
 function verify(code){code=String(code||"").replace(/\D/g,"");st.err="";
  if(code.length!==6){st.err=E("code");st.errAt="code";return draw("#ia-code");}
  st.busy=true;draw();
  AC.verify(st.email,code).then(function(r){st.busy=false;
   if(r&&r.token){S.session=ls("eduplan-session");close(false);return;}
   st.err=E(r&&r.error||"bad_request");st.errAt="code";draw("#ia-code");
  }).catch(function(){st.busy=false;st.err=E("net");st.errAt="code";draw("#ia-code");});}
 draw();document.body.appendChild(d);document.body.classList.add("introopen");
 setTimeout(function(){var f=d.querySelector("#ia-email,[data-onb]");if(f)f.focus({preventScroll:true});},50);
 d.addEventListener("input",function(ev){if(ev.target.id==="ia-email")st.email=ev.target.value;});
 d.addEventListener("change",function(ev){if(ev.target.id==="ia-consent")st.consent=ev.target.checked;});
 d.addEventListener("submit",function(ev){ev.preventDefault();var k=ev.target.getAttribute("data-iaform");
  if(k==="email"){var e=d.querySelector("#ia-email"),c=d.querySelector("#ia-consent");st.email=e?e.value:"";st.consent=!!(c&&c.checked);send();}
  else if(k==="code"){var cd=d.querySelector("#ia-code");verify(cd?cd.value:"");}});
 d.addEventListener("click",function(ev){var b=ev.target.closest("[data-onb],[data-ia]");if(!b)return;
  if(b.getAttribute("data-onb")==="guest"){close(true);return;}
  var a=b.getAttribute("data-ia");
  if(a==="privacy"){try{sessionStorage.setItem("eduplan-acct","1");}catch(e){}d.remove();document.body.classList.remove("introopen");return;}
  if(a==="other"){st.step="email";st.err="";st.msg="";draw("#ia-email");return;}
  if(a==="again"){st.step="email";send();}});
 return true;}
window.addEventListener("eduplan:signedin",function(){S.session=ls("eduplan-session");});
function intro(){
 try{if(sessionStorage.getItem("eduplan-intro")){if(!account())interests();return;}}catch(e){}
 var A=window.EDUPLAN_ABOUT;if(!A||/^#(privacy|portfolio)/.test(location.hash))return;
 var f=A.founder,photo=window.EDUPLAN_FOUNDER_PHOTO||(f.photo?"../"+f.photo:"");
 function real(u){return !/^demo/i.test(u.id)&&!/\(demo\)/i.test(u.name);}   /* demo institutions are not counted */
 var unis=D.inst.filter(function(u){return u.progs&&real(u);}).length,stats=[[unis,"partner institutions"],[D.progs.filter(function(p){return real(p.inst);}).length,"programmes"],
  [D.sch.filter(function(x){return real(x.inst);}).length+D.fnd.length,"scholarship options"]].filter(function(x){return x[0]>0;});
 var d=document.createElement("div");d.className="intro";d.setAttribute("role","dialog");d.setAttribute("aria-modal","true");d.setAttribute("aria-labelledby","intro-h");
 d.innerHTML='<div class="iblobs" aria-hidden="true"><i></i><i></i><i></i></div><div class="iwrap">'+
  '<img class="ilogo" src="'+esc(window.EDUPLAN_LOGO||"../assets/img/logo.png")+'" alt="Eduplan">'+
  '<span class="ieye">Step 1 of 3 · About us</span>'+
  '<h1 id="intro-h"><span>We lead students to the right place to study</span></h1>'+
  '<p class="ilead">Eduplan is an education tool that guides students to a suitable institution, from learning about it to the registration phase. The service is free of charge for students.</p>'+
  '<ol class="ijr">'+A.journey.map(function(j,i){return '<li style="--i:'+i+'"><b>'+esc(j[0])+'</b><span>'+esc(j[1])+'</span></li>';}).join("")+'</ol>'+
  (stats.length?'<div class="istats">'+stats.map(function(x){return '<div><b data-count="'+x[0]+'">0</b><span>'+esc(x[1])+'</span></div>';}).join("")+'</div>':'')+
  '<div class="ifounder">'+(photo?'<img src="'+esc(photo)+'" alt="">':'')+'<div><b>'+esc(f.name)+'</b><span>'+esc(f.role)+'</span><span>Guiding students since 2015</span></div></div>'+
  '<button type="button" class="btn icta">Click to continue <span aria-hidden="true">→</span></button></div>';
 document.body.appendChild(d);document.body.classList.add("introopen");
 var btn=d.querySelector(".icta");setTimeout(function(){btn.focus({preventScroll:true});},50);
 /* Count the numbers up once the cover is in view; reduced motion shows them straight away. */
 var still=window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches;
 [].slice.call(d.querySelectorAll("[data-count]")).forEach(function(b){var n=+b.getAttribute("data-count");if(still){b.textContent=n;return;}
  var t0=null;setTimeout(function(){requestAnimationFrame(function step(t){t0=t0||t;var k=Math.min(1,(t-t0)/1200);b.textContent=Math.round(n*(1-Math.pow(1-k,3)));if(k<1)requestAnimationFrame(step);});},1500);});
 function done(){try{sessionStorage.setItem("eduplan-intro","1");}catch(e){}d.classList.add("out");
  setTimeout(function(){d.remove();if(!account()&&!interests()){document.body.classList.remove("introopen");var m=document.querySelector("main,#app");if(m&&m.focus)m.focus({preventScroll:true});}},still?0:450);}
 btn.addEventListener("click",done);
 d.addEventListener("keydown",function(ev){if(ev.key==="Tab"){ev.preventDefault();btn.focus();}});   /* keep focus on the cover */
}
if(window.EDUPLAN_SHEET_DATA)useData(window.EDUPLAN_SHEET_DATA);
render();
syncLoad();
/* One anonymous visit per browser tab for Eduplan's overview (apps-script/Stats.gs): signed in or guest, and the
   route. No cookie, no identifier; the preview does not count. */
try{if(API&&window.fetch&&!PREVIEW&&!sessionStorage.getItem("eduplan-visit")){sessionStorage.setItem("eduplan-visit","1");post({action:"visit",member:!!S.session,mode:L.mode}).catch(function(){});}}catch(e){}
intro();
if(API&&window.fetch&&!PREVIEW)fetch(API).then(function(r){return r.json();}).then(function(d){if(useData(d))render(true);}).catch(function(){});
})();
