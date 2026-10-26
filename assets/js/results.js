/* EDUPLAN "My results": the student's exam results, kept until they change them, and the matching that uses them.
   - Stored in this browser as "eduplan-results" and in the student's portfolio as the section "results".
   - Scholarships use the number of A grades (and A+ / A* for tiers that count only those).
   - Programmes use the entry requirements in the school sheets, written one rule per line (docs/entry-requirements.md).
   Used by assets/js/app.js (My portfolio, application form, programme pages) and lab/lab.js (search results). */
(function(){
"use strict";
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}

/* grades: best first. a: grades that count as an A. credit / pass: the lowest grade that is a credit / a pass.
   letter: what a plain letter in a rule means (UEC "B" = B6 or better). col: the school sheet column with its rules. */
var SEC_SUBJ=["English","Mathematics","Additional Mathematics","Physics","Chemistry","Biology","Combined Science","Economics","Business Studies","Accounting",
 "Computer Science","Geography","History","Chinese","Malay","Literature in English","Art and Design"];
var EXAMS=[
 {id:"SPM",grp:"Secondary school",grades:["A+","A","A-","B+","B","C+","C","D","E","G"],a:["A+","A","A-"],credit:"C",pass:"E",col:"spm",max:12,lv:"foundation",
  subjects:["Bahasa Melayu","English","Mathematics","Additional Mathematics","History (Sejarah)","Science","Physics","Chemistry","Biology","Islamic Education",
   "Moral Education","Principles of Accounting","Economics","Business","Geography","Chinese Language","Tamil Language","Literature in English","Computer Science","Visual Arts"]},
 {id:"IGCSE",grp:"Secondary school",grades:["A*","A","B","C","D","E","F","G","U"],a:["A*","A"],credit:"C",pass:"G",col:"olevel",max:14,lv:"foundation",subjects:SEC_SUBJ},
 {id:"O-Level",grp:"Secondary school",grades:["A*","A","B","C","D","E","U"],a:["A*","A"],credit:"C",pass:"E",col:"olevel",max:12,lv:"foundation",subjects:SEC_SUBJ},
 {id:"UEC",label:"UEC (Senior Middle 3)",grp:"Secondary school",grades:["A1","A2","B3","B4","B5","B6","C7","C8","F9"],a:["A1","A2"],credit:"B6",pass:"C8",
  letter:{A:"A2",B:"B6",C:"C8"},col:"uec",max:12,lv:"undergraduate",
  subjects:["Chinese","Malay","English","Mathematics","Advanced Mathematics","Physics","Chemistry","Biology","History","Geography",
   "Bookkeeping and Accounting","Commerce","Economics","Computing and Information Technology","Art"]},
 {id:"STPM",grp:"Pre-university",grades:["A","A-","B+","B","B-","C+","C","C-","D+","D","F"],a:["A","A-"],credit:"C",pass:"C",col:"stpm",max:5,lv:"undergraduate",
  subjects:["General Studies (Pengajian Am)","Mathematics (T)","Mathematics (M)","Physics","Chemistry","Biology","Economics","Accounting","Business Studies",
   "Geography","History","Chinese Literature","Malay Literature","Literature in English","ICT"]},
 {id:"A-Level",grp:"Pre-university",grades:["A*","A","B","C","D","E","U"],a:["A*","A"],credit:"C",pass:"E",col:"other",max:5,lv:"undergraduate",
  subjects:["Mathematics","Further Mathematics","Physics","Chemistry","Biology","Economics","Accounting","Business","Computer Science","Psychology",
   "Literature in English","History","Geography","Chinese","Law","Sociology"]},
 {id:"Foundation",grp:"Foundation, matriculation or diploma (CGPA)",cgpa:true,col:"other",lv:"undergraduate"},
 {id:"Matriculation",grp:"Foundation, matriculation or diploma (CGPA)",cgpa:true,col:"other",lv:"undergraduate"},
 {id:"Diploma",grp:"Foundation, matriculation or diploma (CGPA)",cgpa:true,col:"other",lv:"undergraduate"}];
function exam(id){for(var i=0;i<EXAMS.length;i++)if(EXAMS[i].id===id)return EXAMS[i];return null;}
/* Exam names as they appear in a sheet's group heading ("A-Level:", "Foundation / Matriculation:"). */
var HEADS=[[/\bA[\s-]?Levels?\b/i,"A-Level"],[/\bFoundation\b/i,"Foundation"],[/\bMatric/i,"Matriculation"],[/\bDiploma\b/i,"Diploma"],[/\bSTPM\b/i,"STPM"],
 [/\bUEC\b/i,"UEC"],[/\bSPM\b/i,"SPM"],[/\bIGCSE\b/i,"IGCSE"],[/\bO[\s-]?Levels?\b/i,"O-Level"]];

/* ---------- The student's results ---------- */
var KEY="eduplan-results";
function load(){var r=null;try{r=JSON.parse(localStorage.getItem(KEY));}catch(e){}r=r&&typeof r==="object"?r:{};r.exams=r.exams&&typeof r.exams==="object"?r.exams:{};return r;}
var R=load(),UI={cur:null,other:null};
function save(){try{localStorage.setItem(KEY,JSON.stringify(R));}catch(e){}window.dispatchEvent(new CustomEvent("eduplan:results"));}
/* On the live website, results count only when they were read from the student's results slip (apps-script/Results.gs);
   the preview (published artifact) cannot reach the server, so typed results are allowed there to try the website. */
function live(){return !!(window.EDUPLAN_API_URL&&window.fetch&&!window.EDUPLAN_SHEET_DATA);}
/* In the preview, Claude reads the slip through the artifact's own "sample" capability (images); results can be typed
   there only when that is not available either. */
var AI={ok:null};
function checkAI(){if(AI.p)return AI.p;var c=window.claude;if(live()||!c||typeof c.use!=="function"){AI.ok=false;return AI.p=Promise.resolve(false);}
 return AI.p=c.use("sample").then(function(sm){if(!sm||!sm.limits)return false;AI.sm=sm;return sm.limits().then(function(l){return !!(l&&l.images);},function(){return false;});},function(){return false;})
  .then(function(ok){AI.ok=ok;if(ok){save();window.dispatchEvent(new CustomEvent("eduplan:ai"));}return ok;});}
function locked(){return live()||AI.ok===true;}   /* results only from a slip */
function has(id){var x=R.exams[id];return !!(x&&(!locked()||x.v)&&((x.g&&x.g.length)||(x.cgpa!==""&&x.cgpa!=null)));}
/* Grades counted by letter: "5A · 2B · 1C" (SPM A+, A and A- are all A; UEC A1, A2 are A; B3 to B6 are B). */
function letters(id){var e=exam(id);if(!e||!has(id))return "";if(e.cgpa)return "CGPA "+R.exams[id].cgpa;var n={},order=[];
 grades(id).forEach(function(s){var l=String(s[1]).charAt(0);if(!n[l]){n[l]=0;order.push(l);}n[l]++;});
 order.sort(function(a,b){return "ABCDEFGU".indexOf(a)-"ABCDEFGU".indexOf(b);});return order.map(function(l){return n[l]+l;}).join(" · ");}
function taken(){return EXAMS.filter(function(e){return has(e.id);}).map(function(e){return e.id;});}
function grades(id){var x=R.exams[id];return x&&x.g?x.g:[];}
function cgpa(id){var x=R.exams[id];return x&&x.cgpa!==""&&x.cgpa!=null?Number(x.cgpa):null;}
/* How many subjects have one of these grades. */
function countIn(id,list){return grades(id).filter(function(s){return list.indexOf(s[1])>=0;}).length;}
function aCount(id){var e=exam(id);return e&&!e.cgpa&&has(id)?countIn(id,e.a):null;}
/* Short summary: "8 A+ · 1 A · 1 B" or "CGPA 3.50". */
function summary(id){var e=exam(id);if(!e||!has(id))return "";if(e.cgpa)return "CGPA "+R.exams[id].cgpa;
 return e.grades.map(function(g){var n=countIn(id,[g]);return n?n+" "+g:"";}).filter(Boolean).join(" · ");}
/* Result conclusion: how many subjects at every grade of the exam (grades with none are dimmed), then the totals. */
function tally(id,e){var all=grades(id).length,ci=e.grades.indexOf(e.credit),pi=e.grades.indexOf(e.pass);
 var cr=grades(id).filter(function(s){var k=e.grades.indexOf(s[1]);return k>=0&&k<=ci;}).length,ps=grades(id).filter(function(s){var k=e.grades.indexOf(s[1]);return k>=0&&k<=pi;}).length;
 return '<section class="rxtally" aria-labelledby="rxt-h"><h3 id="rxt-h"><span>Result conclusion</span> · <span data-notr>'+esc(e.id)+'</span></h3>'+
  '<ul class="rxtg">'+e.grades.map(function(g){var n=countIn(id,[g]);return '<li class="'+(n?'on':'')+'"><b data-notr>'+n+'</b><span data-notr>'+esc(g)+'</span></li>';}).join("")+'</ul>'+
  '<p class="rxtt"><span><b data-notr>'+all+'</b> <span>subjects</span></span><span><b data-notr>'+aCount(id)+'</b> <span>A grades</span> <span class="hint" data-notr>('+esc(e.a.join(", "))+')</span></span>'+
  (ci>=0?'<span><b data-notr>'+cr+'</b> <span>credits</span> <span class="hint">(<span data-notr>'+esc(e.credit)+'</span> <span>or better</span>)</span></span>':'')+
  (pi>=0?'<span><b data-notr>'+ps+'</b> <span>passes</span></span>':'')+'</p></section>';}
/* Plain text for the application: one subject per line. */
function text(id){var e=exam(id);if(!e||!has(id))return "";var v=R.exams[id].v,vt=v?"\nVerified by AI from the "+(v.kind==="Trial"?"trial":"official")+" results slip ("+day(v.at)+")":"";if(e.cgpa)return "CGPA "+R.exams[id].cgpa+vt;
 return grades(id).slice().sort(function(a,b){return e.grades.indexOf(a[1])-e.grades.indexOf(b[1]);}).map(function(s){return s[0]+" "+s[1];}).join("\n")+vt;}
function setGrade(id,subj,g){subj=String(subj||"").trim();if(!subj||locked())return;var x=R.exams[id]=R.exams[id]||{g:[]};x.g=(x.g||[]).filter(function(s){return norm(s[0])!==norm(subj);});
 if(g)x.g.push([subj,g]);save();}
function setCgpa(id,v){if(locked())return;var n=parseFloat(v);R.exams[id]={cgpa:isNaN(n)?"":String(Math.max(0,Math.min(4,n)))};save();}
function removeExam(id){delete R.exams[id];if(UI.cur===id)UI.cur=null;save();}
/* Another device's newer copy (portfolio sync). */
function use(d){R=d&&typeof d==="object"?d:{};R.exams=R.exams||{};try{localStorage.setItem(KEY,JSON.stringify(R));}catch(e){}}

/* ---------- Entry requirement rules ----------
   One rule per line. A line ending in ":" starts a group: an exam ("A-Level:") or a track ("Physical Science track:").
   Groups are alternatives: meeting any one of them is enough. Lines that are not rules are shown as conditions to check. */
function norm(s){var t=String(s||"").toLowerCase().replace(/\([^)]*\)/g," ").replace(/[^a-z0-9+ ]+/g," ").replace(/\s+/g," ").trim();
 return {"english language":"english","bahasa inggeris":"english","malay language":"bahasa melayu","malay":"bahasa melayu","bm":"bahasa melayu","sejarah":"history",
  "maths":"mathematics","math":"mathematics","modern mathematics":"mathematics","add maths":"additional mathematics","chinese language":"chinese"}[t]||t;}
function gradeOf(e,tok){tok=String(tok||"").trim();if(/^credit$/i.test(tok))return e.credit;if(/^pass$/i.test(tok))return e.pass;
 var up=tok.toUpperCase();if(e.grades.indexOf(up)>=0)return up;if(e.letter&&e.letter[up])return e.letter[up];return null;}
function atLeast(e,g,min){var a=e.grades.indexOf(g),b=e.grades.indexOf(min);return a>=0&&b>=0&&a<=b;}
function gradeWord(e,g){return g===e.credit&&e.credit!==e.pass?"credit ("+g+")":g===e.pass?"pass ("+g+")":g;}
var EXAM_RE="(SPM|UEC|IGCSE|O-Level|STPM|A-Level)";
function parseLine(l,eid){
 var e=exam(eid),m;
 if(/^not (?:accepted|applicable)\b/i.test(l))return {t:"no",text:l};
 /* Other routes and footnotes: shown, but not a condition. */
 if(/^(?:or\b|other (?:relevant |equivalent )|for other equivalent|note\b|\*)/i.test(l))return {t:"info",text:l};
 if((m=l.match(/^(?:min(?:imum)?\s+)?CGPA\s*[:：]?\s*(\d(?:\.\d+)?)\s*(?:or (?:above|higher|better))?$/i)))return {t:"cgpa",min:+m[1],text:l};
 if(!e||e.cgpa)return {t:"note",text:l};
 if((m=l.match(/^(\d+)\s*credits?$/i)||l.match(/^credits?\s*[:：]\s*(\d+)$/i)))return {t:"count",n:+m[1],g:e.credit,text:l};
 if((m=l.match(/^(\d+)\s*principals?(?:\s+passes)?$/i)))return {t:"count",n:+m[1],g:e.credit,text:l};
 if((m=l.match(/^(\d+)\s*pass(?:es)?$/i)))return {t:"count",n:+m[1],g:e.pass,text:l};
 if((m=l.match(/^(\d+)\s*subjects?\s*[:：]\s*(?:grade\s*)?(\S+?)(?:\s*or (?:better|above))?$/i))){var g=gradeOf(e,m[2]);if(g)return {t:"count",n:+m[1],g:g,text:l};}
 if((m=l.match(new RegExp("^(?:"+EXAM_RE+"\\s+)?(.+?)\\s*[:：]\\s*(?:grade\\s*)?(credit|pass|[A-G][1-9]?[+*-]?)(?:\\s*or (?:better|above))?$","i")))){
  var ex=m[1]?exam({spm:"SPM",uec:"UEC",igcse:"IGCSE","o-level":"O-Level",stpm:"STPM","a-level":"A-Level"}[m[1].toLowerCase()]):e;
  if(ex&&!ex.cgpa){var g2=gradeOf(ex,m[3]);
   if(g2)return {t:"subj",ex:ex.id,all:m[2].split(/\s*(?:,|\band\b|&)\s*/i).filter(Boolean).map(function(p){return p.split(/\s*(?:\/|\bor\b)\s*/i).filter(Boolean);}),g:g2,text:l};}}
 return {t:"note",text:l};
}
function groupsFor(cols,eid){
 var e=exam(eid);if(!e)return [];
 var raw=String(cols[e.col]||"").replace(/\r/g,"");if(!raw.trim())return [];
 var gs=[],cur={head:null,ex:null,lines:[]};gs.push(cur);
 raw.split("\n").forEach(function(l){l=l.replace(/^[\s•·*▪◦–-]+/,"").trim();if(!l)return;
  if(/[:：]$/.test(l)&&l.length<90){var h=l.replace(/[:：]$/,""),ex=HEADS.filter(function(x){return x[0].test(h);}).map(function(x){return x[1];});
   cur={head:h,ex:ex.length?ex:null,lines:[]};gs.push(cur);return;}
  cur.lines.push(l);});
 /* In the "Others" column only groups named after this exam count; elsewhere a group without an exam name is a track. */
 /* A group headed "Also required" adds its lines to every other group in the column. */
 var also=[];gs.forEach(function(g){if(g.head&&/^also\b/i.test(g.head)){also=also.concat(g.lines);g.lines=[];}});
 return gs.filter(function(g){if(!g.lines.length)return false;if(g.ex)return g.ex.indexOf(eid)>=0;return e.col!=="other";})
  .map(function(g){return {head:g.head,ex:g.ex,rules:g.lines.concat(also).map(function(l){return parseLine(l,eid);})};});
}
/* One rule against the student's results: ok / fail (with what is missing) / note (cannot be checked). */
function checkRule(r,eid){
 var e=exam(eid);
 if(r.t==="info")return {s:"info"};
 if(r.t==="note")return {s:"note",text:r.text};
 if(r.t==="no")return {s:"no",text:r.text};
 if(r.t==="cgpa"){var c=cgpa(eid);if(c==null)return {s:"note",text:r.text};return c>=r.min?{s:"ok"}:{s:"fail",need:"CGPA "+r.min.toFixed(2)+" (you have "+c.toFixed(2)+")"};}
 if(r.t==="count"){var n=grades(eid).filter(function(s){return atLeast(e,s[1],r.g);}).length;
  return n>=r.n?{s:"ok"}:{s:"fail",need:r.n+" subjects at "+gradeWord(e,r.g)+" or better (you have "+n+")"};}
 if(r.t==="subj"){var ex=exam(r.ex),miss=[];
  if(!has(r.ex))return {s:"fail",need:(r.ex!==eid?r.ex+" ":"")+r.all.map(function(a){return a.join(" or ");}).join(" and ")+" at "+gradeWord(ex,r.g)+" (add your "+r.ex+" results)"};
  r.all.forEach(function(alts){var ok=alts.some(function(name){return grades(r.ex).some(function(s){return norm(s[0])===norm(name)&&atLeast(ex,s[1],r.g);});});if(!ok)miss.push(alts.join(" or "));});
  return miss.length?{s:"fail",need:(r.ex!==eid?r.ex+" ":"")+miss.join(", ")+" at "+gradeWord(ex,r.g)+" or better"}:{s:"ok"};}
 return {s:"note",text:r.text};
}
/* A programme's entry requirements against one exam.
   state: meets (every rule met) · check (grades met, other conditions to check) · missing · no (not accepted) · none (no rules). */
var RANK={meets:4,check:3,missing:2,no:1,none:0};
function checkExam(cols,eid){
 var gs=groupsFor(cols,eid);if(!gs.length)return {exam:eid,state:"none"};
 var best=null;
 gs.forEach(function(g){var res=g.rules.map(function(r){return checkRule(r,eid);}),st;
  if(res.some(function(x){return x.s==="no";}))st="no";
  else if(res.some(function(x){return x.s==="fail";}))st="missing";
  else if(res.some(function(x){return x.s==="note";}))st="check";
  else st="meets";
  var o={exam:eid,state:st,track:g.head&&!g.ex?g.head:"",need:res.filter(function(x){return x.s==="fail";}).map(function(x){return x.need;}),
   notes:res.filter(function(x){return x.s==="note"||x.s==="no";}).map(function(x){return x.text;}),
   checked:res.filter(function(x){return x.s==="ok"||x.s==="fail";}).length};
  if(!best||RANK[st]>RANK[best.state]||(st===best.state&&o.need.length<best.need.length))best=o;});
 return best;
}
/* The best result over every exam the student has. cols = {spm, uec, olevel, stpm, other}. */
function match(cols){
 var out=null;taken().forEach(function(id){var r=checkExam(cols,id);if(r.state!=="none"&&(!out||RANK[r.state]>RANK[out.state]))out=r;});
 return out;
}
/* One line for a card: [state, text]. */
function badge(m){if(!m)return null;
 if(m.state==="meets")return ["ok","Your "+m.exam+" results meet the entry requirements"+(m.track?" ("+m.track+")":"")];
 if(m.state==="check")return ["ok","Your "+m.exam+" grades meet the requirements. Also check: "+m.notes.join("; ")];
 if(m.state==="missing")return ["miss","Not yet with your "+m.exam+" results: needs "+m.need.join("; ")];
 if(m.state==="no")return ["no",m.exam+" is not accepted directly for this programme"];
 return null;}

/* ---------- Editor (My portfolio and the application form) ----------
   fixed: show one exam only (the application form's "Highest qualification"). */
var MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function day(t){var d=new Date(t);return d.getDate()+" "+MON[d.getMonth()]+" "+d.getFullYear();}
function session(){try{var x=JSON.parse(localStorage.getItem("eduplan-session"));return x&&x.token&&x.exp>Date.now()?x:null;}catch(e){return null;}}
var RX_ERR={id_not_configured:"Reading IC photos is not available yet. Please ask a counsellor.",id_first:"Verify your name with your IC first (My portfolio, My profile). The name on your results slip must match your IC.",
 no_name:"Your name could not be read on this slip. Upload a clear photo that shows your name and your grades.",
 name_mismatch:"The name on this slip does not match the name on your IC. Upload your own results slip.",not_id:"This does not look like the front of an IC (MyKad or MyKid) or a passport photo page. Take a clear photo of the front of your IC.",not_slip:"This does not look like a results slip. Upload a clear photo or PDF of your results slip.",
 wrong_exam:"This slip is for a different exam. Choose the right exam above, or upload the right slip.",
 not_official:"This looks like a trial or school report, not the official results. Choose Trial results, or upload the official slip.",
 unreadable:"The grades could not be read clearly. Upload a sharper photo with the whole slip in view.",
 too_large:"The file is larger than 5 MB. Upload a smaller photo or PDF.",signed_out:"Please sign in again, then upload your slip.",
 server:"EDUPLAN's server had a problem. Please try again in a few minutes. If it keeps happening, please tell EDUPLAN.",
 daily_limit:"Too many slips were checked today. Please try again tomorrow, or ask a counsellor.",busy:"The checker is busy. Please try again in a minute.",
 not_configured:"Reading results slips is not available yet. Please ask a counsellor.",net:"Could not reach EDUPLAN. Check your connection and try again.",bad_request:"Choose a photo (JPG, PNG) or PDF of your slip."};
/* The name verified from the student's IC (My profile; signed by Identity.gs on the live website), or null. */
function icName(){try{var p=JSON.parse(localStorage.getItem("eduplan-profile"))||{},v=p.idv;return v&&v.name&&(!live()||v.sig)?v:null;}catch(e){return null;}}
/* The same name, ignoring case, punctuation, spacing and word order (as Results.gs resultsSameName_). */
function nameKey(s){return String(s||"").toUpperCase().replace(/[^A-Z\u00C0-\u024F\u4E00-\u9FFF]+/g," ").trim().split(/\s+/).filter(Boolean).sort().join(" ");}
function sameName(a,b){var x=nameKey(a);return !!x&&x===nameKey(b);}
function idFirst(){return '<p class="hint rxid">The name on your results slip must match your IC, so verify your name with your IC first: <a href="#portfolio">My portfolio, My profile</a>.</p>';}
/* Live website: the student uploads the slip and Claude reads it (Results.gs); the grades are shown, not editable. */
function slipBox(id,e){var x=R.exams[id],v=x&&x.v,ok=has(id);
 var shown=!ok?'':'<div class="rxver"><span class="rxbadge">✓ Verified by AI from your '+(v.kind==="Trial"?'trial':'official')+' results slip · '+esc(day(v.at))+'</span>'+
  (v.name?'<span class="hint">Name on the slip: <span data-notr>'+esc(v.name)+'</span>'+(v.icMatch?' <span class="pill ok">✓ Matches your IC</span>':'')+'</span>':'')+
  (v.listed&&v.listed>grades(id).length?'<p class="ematch miss" role="alert"><span>Only</span> <b data-notr>'+grades(id).length+' / '+v.listed+'</b> <span>subjects could be read from this photo. Upload a straight, sharp photo of the whole slip to read all of them.</span></p>':'')+
  (e.cgpa?'<p class="rxsum"><strong>CGPA '+esc(x.cgpa)+'</strong></p>':'<ul class="rxlist">'+grades(id).map(function(sg){return '<li><span>'+esc(sg[0])+'</span><b data-notr>'+esc(sg[1])+'</b></li>';}).join("")+'</ul>')+
  '<p class="hint">These grades come from your slip and cannot be typed in or changed here. Upload a new slip to replace them, for example when your official results come out. If something was read wrongly, ask a counsellor.</p></div>';
if(live()&&!session())return shown+'<p class="hint">'+(ok?'':'Your '+esc(e.id)+' results are read from your results slip by AI, so they cannot be typed in. ')+'<a href="#portfolio">Sign in</a> to upload your slip.</p>';
 if(UI.busy)return shown+'<p class="note" role="status">Reading your slip… This takes up to a minute.</p>';
 if(!icName())return shown+idFirst();
 return shown+'<div class="rxup"><span class="sl">'+(ok?'Upload a new slip':'Upload your '+esc(e.id)+' results slip')+'</span>'+
  '<div class="field"><label for="rx-kind">Which results slip?</label><select id="rx-kind"><option value="Official"'+(UI.kind!=="Trial"?' selected':'')+'>Official results</option><option value="Trial"'+(UI.kind==="Trial"?' selected':'')+'>Trial results (school trial exam)</option></select></div>'+
  '<div class="field"><label for="rx-file">Photo or PDF of the slip</label><input id="rx-file" type="file" accept="'+(live()?'image/jpeg,image/png,image/webp,application/pdf':'image/*')+'" capture="environment"><span class="hint">Max 5 MB. AI reads your grades; the slip itself is not stored.</span></div>'+
  (UI.err?'<p class="err" role="alert">'+esc(UI.err)+'</p>':'')+'<div class="row"><button type="button" class="btn" data-rx-read="'+esc(id)+'">Read my results</button></div></div>';}
/* Reads a results slip: on the live website through EDUPLAN's server (signed, Results.gs); in the preview through
   Claude in the artifact. Either way the grades are checked against the exam's grade list and then locked. */
var SLIP_PROMPT="You read a Malaysian student's exam results slip for EDUPLAN, a study guidance service. Read exactly what is printed; never guess. "+
 "Reply with JSON only: {\"is_results_slip\":boolean,\"exam\":\"SPM|UEC|STPM|IGCSE|O-Level|A-Level|Foundation|Matriculation|Diploma|Other\",\"slip_kind\":\"official|trial|unclear\","+
 "\"candidate_name\":string,\"year\":string,\"subjects\":[{\"subject\":string,\"grade\":string}],\"subject_count\":number,\"cgpa\":number|null,\"problems\":string}. "+
 "is_results_slip is true only for a results slip, statement or transcript of an exam. slip_kind official = results from the examining body, including the official SPM slip headed KEMENTERIAN PENDIDIKAN / LEMBAGA PEPERIKSAAN, SIJIL PELAJARAN MALAYSIA TAHUN <year>, with NAMA, ANGKA GILIRAN, grades with their descriptions (CEMERLANG TERTINGGI ...) and LAYAK MENDAPAT SIJIL, even as a photo, scan or printout; trial = a school's own trial, mock or end-of-year report (PEPERIKSAAN PERCUBAAN, TRIAL, a school as issuer, marks or class position). "+
 "Give every subject with the grade exactly as printed (SPM: A+, A, A-, B+, B, C+, C, D, E, G, TH), subject names in English. subject_count = how many subjects the slip lists (SPM: JUMLAH MATA PELAJARAN), 0 if unknown. The grades are a column on the right in the same order as the subject rows; in an angled photo the column can look shifted, so pair the 1st grade with the 1st subject and so on; grade descriptions confirm grades (CEMERLANG TERTINGGI A+, CEMERLANG TINGGI A, CEMERLANG A-, KEPUJIAN TERTINGGI B+, KEPUJIAN TINGGI B, KEPUJIAN ATAS C+, KEPUJIAN C, LULUS ATAS D, LULUS E, GAGAL G). cgpa only for foundation, matriculation or diploma transcripts. Leave out a subject only when its grade cannot be read or paired, and say so in problems.";
function useSlip(id,kind,r,signed){var e=exam(id);
 if(!r||!r.is_results_slip)return {error:"not_slip"};
 if(r.exam!==id)return {error:"wrong_exam"};
 if(kind==="Official"&&r.slip_kind!=="official")return {error:"not_official"};
 var ic=icName(),onSlip=String(r.candidate_name||"").trim();
 if(!ic)return {error:"id_first"};
 if(!onSlip)return {error:"no_name"};
 if(!sameName(onSlip,ic.name))return {error:"name_mismatch",found:onSlip};
 var x={v:{kind:kind,at:Date.now(),name:onSlip.slice(0,120),year:String(r.year||"").slice(0,20),icMatch:true}};var lc=Math.round(Number(r.subject_count)||0);if(lc>0&&lc<=20)x.v.listed=lc;
 if(e.cgpa){var c=Number(r.cgpa);if(!(c>=0&&c<=4))return {error:"unreadable"};x.cgpa=Math.round(c*100)/100;}
 else{x.g=(r.subjects||[]).map(function(t){return [String(t.subject||"").trim().slice(0,80),String(t.grade||"").trim().toUpperCase()];})
   .filter(function(t){return t[0]&&e.grades.indexOf(t[1])>-1;});if(!x.g.length)return {error:"unreadable"};}
 return {x:x};}
/* Phone photos are often larger than 5 MB or in a format the server does not take (HEIC): a photo is redrawn as a
   JPEG of at most 2000 px before it is sent. PDFs, small JPEG/PNG/WebP photos, and photos the browser cannot open are
   sent as they are. */
function shrink(file){
 if(!file||!/^image\//.test(file.type)||(/^image\/(jpeg|png|webp)$/.test(file.type)&&file.size<=1.5*1024*1024)||!window.URL||!document.createElement("canvas").toBlob)return Promise.resolve(file);
 return new Promise(function(res){var url=URL.createObjectURL(file),img=new Image();
  img.onload=function(){var k=Math.min(1,2000/Math.max(img.naturalWidth,img.naturalHeight)),c=document.createElement("canvas");
   c.width=Math.round(img.naturalWidth*k);c.height=Math.round(img.naturalHeight*k);c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);
   c.toBlob(function(b){res(b?new File([b],(file.name||"photo").replace(/\.\w+$/,"")+".jpg",{type:"image/jpeg"}):file);},"image/jpeg",0.85);};
  img.onerror=function(){URL.revokeObjectURL(url);res(file);};img.src=url;});}
function readFile(id,file,kind){
 if(!file){UI.err="Choose a photo or PDF of your slip first.";UI.kind=kind;UI.cur=id;return save();}
 shrink(file).then(function(f){readSlipFile(id,f,kind);});}
function readSlipFile(id,file,kind){UI.err="";UI.kind=kind;UI.cur=id;
 if(file.size>5*1024*1024){UI.err=RX_ERR.too_large;return save();}
 function done(x){R.exams[id]=x;UI.busy=false;UI.err="";save();}
 function fail(code,found){UI.busy=false;UI.err=RX_ERR[code]||RX_ERR.busy;
  if(code==="name_mismatch"){var ic=icName();UI.err="The name on this slip ("+(found||"?")+") does not match the name on your IC ("+(ic?ic.name:"?")+"). Upload your own results slip.";}
  save();}
 if(!icName())return fail("id_first");
 if(!live()){if(!AI.sm||!/^image\//.test(file.type))return fail(AI.sm?"bad_request":"not_configured");
  UI.busy=true;save();
  AI.sm.json(SLIP_PROMPT+" The student says this is their "+kind.toLowerCase()+" "+id+" results.",{images:[file],modelTier:"complex",cache:false})
   .then(function(r){var u=useSlip(id,kind,r);if(u.error)return fail(u.error,u.found);done(u.x);},function(err){fail(err&&err.code==="rate_limited"?"daily_limit":err&&err.code==="image_rejected"?"bad_request":"busy");});
  return;}
 var ss=session();if(!ss)return fail("signed_out");
 var rd=new FileReader();rd.onload=function(){var data=String(rd.result).split(",")[1]||"";UI.busy=true;save();
  fetch(window.EDUPLAN_API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"results_read",token:ss.token,exam:id,kind:kind,idv:icName(),file:{type:file.type,data:data}})})
   .then(function(r){return r.json();}).then(function(d){if(!d||!d.ok)return fail(d&&d.error,d&&d.found);
    var x={v:{kind:d.kind,at:d.at,sig:d.sig,name:d.name||"",year:d.year||"",icMatch:true}};if(d.listed)x.v.listed=d.listed;if(d.g)x.g=d.g;if(d.cgpa!=null)x.cgpa=d.cgpa;done(x);})
   .catch(function(){fail("net");});};
 rd.readAsDataURL(file);}
function readSlip(id){var f=document.getElementById("rx-file"),k=document.getElementById("rx-kind");readFile(id,f&&f.files&&f.files[0],k?k.value:"Official");}
/* Name check (Identity.gs): Claude reads the front of the student's MyKad / MyKid / passport. Only the name and the
   last 4 characters of the number are kept; the photo and the full number are not. Resolves {v} or {error}. */
var ID_PROMPT="You read the front of an identity document for EDUPLAN, a study guidance service in Malaysia, to confirm the student's name. "+
 "Reply with JSON only: {\"is_id_document\":boolean,\"card_type\":\"MyKad|MyKid|passport|other\",\"name\":string,\"id_number\":string,\"address\":string,\"postcode\":string,\"town\":string,\"state\":string,\"religion\":string,\"problems\":string}. religion = the religion printed on the card (ISLAM on a Muslim MyKad), \"\" if none. "+
 "address = the address lines printed on a MyKad or MyKid without postcode, town and state, joined with \", \"; postcode = the 5 digits; town = the town after it; state = the state at the end (Johor, Kedah, Kelantan, Kuala Lumpur, Labuan, Melaka, Negeri Sembilan, Pahang, Penang, Perak, Perlis, Putrajaya, Sabah, Sarawak, Selangor or Terengganu); \"\" when not printed. "+
 "is_id_document is true only for the front of a Malaysian MyKad or MyKid, or the photo page of a passport. name: the holder's full name exactly as printed. "+
 "id_number: the IC number (000000-00-0000) or passport number exactly as printed. Leave a field \"\" if you cannot read it with certainty.";
function idCheck(r){if(!r||!r.is_id_document||r.card_type==="other")return {error:"not_id"};
 var name=String(r.name||"").replace(/\s+/g," ").trim(),num=String(r.id_number||"").replace(/[\s-]/g,"").toUpperCase(),m;
 if(name.length<3||name.length>120)return {error:"unreadable"};
 if(r.card_type==="passport"){if(!/^[A-Z0-9]{6,12}$/.test(num))return {error:"unreadable"};}
 else if(!(m=num.match(/^(\d{2})(\d{2})(\d{2})\d{6}$/))||+m[2]<1||+m[2]>12||+m[3]<1||+m[3]>31)return {error:"unreadable"};
var IDPOB={1:"Johor",2:"Kedah",3:"Kelantan",4:"Melaka",5:"Negeri Sembilan",6:"Pahang",7:"Penang",8:"Perak",9:"Perlis",10:"Selangor",11:"Terengganu",12:"Sabah",13:"Sarawak",14:"Kuala Lumpur",15:"Labuan",16:"Putrajaya",
 21:"Johor",22:"Johor",23:"Johor",24:"Johor",25:"Kedah",26:"Kedah",27:"Kedah",28:"Kelantan",29:"Kelantan",30:"Melaka",31:"Negeri Sembilan",59:"Negeri Sembilan",32:"Pahang",33:"Pahang",34:"Penang",35:"Penang",
 36:"Perak",37:"Perak",38:"Perak",39:"Perak",40:"Perlis",41:"Selangor",42:"Selangor",43:"Selangor",44:"Selangor",45:"Terengganu",46:"Terengganu",47:"Sabah",48:"Sabah",49:"Sabah",50:"Sarawak",51:"Sarawak",
 52:"Sarawak",53:"Sarawak",54:"Kuala Lumpur",55:"Kuala Lumpur",56:"Kuala Lumpur",57:"Kuala Lumpur",58:"Labuan"};
 var form={ic:r.card_type==="passport"?num:num.slice(0,6)+"-"+num.slice(6,8)+"-"+num.slice(8)};if(r.card_type!=="passport"){form.gender=(+num.slice(-1))%2?"Male":"Female";
  var yy=+num.slice(0,2),cy=new Date().getFullYear()%100;form.dob=(yy>cy?"19":"20")+num.slice(0,2)+"-"+num.slice(2,4)+"-"+num.slice(4,6);if(IDPOB[+num.slice(6,8)])form.pob=IDPOB[+num.slice(6,8)];
  form.nationality="Malaysian";form.residence="Malaysia";if(/^islam$/i.test(String(r.religion||"").trim()))form.religion="Islam";var pc=String(r.postcode||"").replace(/\D/g,"");if(/^\d{5}$/.test(pc))form.postcode=pc;
  if(r.address)form.address=String(r.address).replace(/\s+/g," ").trim().slice(0,300);if(r.town)form.town=String(r.town).trim().slice(0,80);if(r.state)form.state=String(r.state).trim();}
 return {v:{name:name,last4:num.slice(-4),at:Date.now(),type:r.card_type},form:form};}
function readId(file){
 if(!file)return Promise.resolve({error:"bad_request"});
 return shrink(file).then(readIdFile).then(function(r){if(r&&r.error==="not_configured")r.error="id_not_configured";return r;});}
function readIdFile(file){
 if(file.size>5*1024*1024)return Promise.resolve({error:"too_large"});
 if(!live()){if(!AI.sm||!/^image\//.test(file.type))return Promise.resolve({error:AI.sm?"bad_request":"not_configured"});
  return AI.sm.json(ID_PROMPT,{images:[file],modelTier:"complex",cache:false}).then(idCheck,function(err){return {error:err&&err.code==="rate_limited"?"daily_limit":"busy"};});}
 var ss=session();if(!ss)return Promise.resolve({error:"signed_out"});
 return new Promise(function(res){var rd=new FileReader();rd.onload=function(){
  fetch(window.EDUPLAN_API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"id_verify",token:ss.token,file:{type:file.type,data:String(rd.result).split(",")[1]||""}})})
   .then(function(r){return r.json();}).then(function(d){res(d&&d.ok?{v:{name:d.name,last4:d.last4,at:d.at,type:d.type,sig:d.sig},form:d.form||{}}:{error:(d&&d.error)||"busy"});},function(){res({error:"net"});});};
  rd.readAsDataURL(file);});}
/* The photo box in the search forms: take or choose a photo of the slip; the grades fill in and lock. */
function snapField(id,pick){var e=exam(id)||exam("SPM"),grade=EXAMS.filter(function(x){return !x.cgpa;});
 if(live()&&!session())return '<div class="sf snap"><span class="sl">Your results</span><span class="hint">Your grades are read from a photo of your results slip. <a href="#portfolio">Sign in</a> to upload it.</span></div>';
 if(!icName()&&!(UI.busy))return '<div class="sf snap"><span class="sl">Your results</span><span class="hint">Your grades are read from a photo of your results slip, and the name on it must match your IC. Verify your name with your IC first in <a href="#portfolio">My portfolio</a>.</span></div>';
 return '<div class="sf snap"><span class="sl">Your results</span>'+
  (UI.busy?'<span class="note" role="status">Reading your slip… This takes up to a minute.</span>':
  '<div class="snaprow">'+(pick?'<select data-snap-exam aria-label="Exam">'+grade.map(function(x){return '<option value="'+esc(x.id)+'"'+(x.id===e.id?' selected':'')+'>'+esc(x.label||x.id)+'</option>';}).join("")+'</select>':'')+
  '<select data-snap-kind aria-label="Which results slip?"><option value="Official"'+(UI.kind!=="Trial"?' selected':'')+'>Official results</option><option value="Trial"'+(UI.kind==="Trial"?' selected':'')+'>Trial results</option></select>'+
  '<label class="btn sm snapbtn">📷 Photo of my results slip<input type="file" accept="'+(live()?'image/*,application/pdf':'image/*')+'" capture="environment" data-snap="'+esc(e.id)+'" hidden></label></div>'+
  '<span class="hint">AI reads your grades and fills them in. They are locked: they cannot be typed in or changed.</span>')+
  (UI.err&&!UI.busy?'<span class="err" role="alert">'+esc(UI.err)+'</span>':'')+'</div>';}
document.addEventListener("change",function(ev){var t=ev.target;if(!t.hasAttribute||!t.hasAttribute("data-snap"))return;var box=t.closest(".snap"),k=box&&box.querySelector("[data-snap-kind]"),x=box&&box.querySelector("[data-snap-exam]");
 readFile(x?x.value:t.getAttribute("data-snap"),t.files&&t.files[0],k?k.value:"Official");});
function editor(fixed){
 var list=taken(),id=fixed||UI.cur||(list[0]||"SPM"),e=exam(id);if(!e)return "";
 UI.cur=id;
 if(locked()){var tb=fixed?'':'<div class="rxtabs" role="group" aria-label="Exam">'+EXAMS.map(function(x){return '<button type="button" class="chip" data-rx-exam="'+esc(x.id)+'" aria-pressed="'+(x.id===id)+'">'+esc(x.label||x.id)+(has(x.id)?' ✓':'')+'</button>';}).join("")+'</div>';
  return '<div class="rx" id="rx">'+tb+(has(id)&&!e.cgpa?tally(id,e):'')+slipBox(id,e)+(has(id)&&!fixed?'<div class="row"><button type="button" class="btn ghost sm" data-rx-remove="'+esc(id)+'">Remove my '+esc(e.id)+' results</button></div>':'')+'</div>';}
 var tabs=fixed?'':'<div class="rxtabs" role="group" aria-label="Exam">'+EXAMS.map(function(x){return '<button type="button" class="chip" data-rx-exam="'+esc(x.id)+'" aria-pressed="'+(x.id===id)+'">'+esc(x.label||x.id)+(has(x.id)?' ✓':'')+'</button>';}).join("")+'</div>';
 var body;
 if(e.cgpa){var c=R.exams[id]&&R.exams[id].cgpa;
  body='<div class="field"><label for="rx-cgpa">Your CGPA (out of 4.00)</label><input id="rx-cgpa" type="number" inputmode="decimal" min="0" max="4" step="0.01" value="'+esc(c==null?"":c)+'" placeholder="e.g. 3.50" data-rx-cgpa="'+esc(id)+'"></div>';}
 else{var mine=grades(id),usedN=mine.map(function(s){return norm(s[0]);}),free=e.subjects.filter(function(s){return usedN.indexOf(norm(s))<0;});
  body='<p class="hint">For each grade, add the subjects you got that grade in. Counts as A in '+esc(e.id)+': '+esc(e.a.join(", "))+'.</p><div class="rxgrid">'+e.grades.map(function(g){
   var subs=mine.filter(function(s){return s[1]===g;});
   return '<div class="rxrow'+(subs.length?' on':'')+'"><span class="rxg" data-notr>'+esc(g)+'</span><div class="rxchips">'+subs.map(function(s){
     return '<button type="button" class="rxchip" data-rx-del="'+esc(s[0])+'" aria-label="Remove '+esc(s[0])+' ('+esc(g)+')">'+esc(s[0])+' <span aria-hidden="true">×</span></button>';}).join("")+
    (UI.other===g?'<span class="rxother"><input id="rx-other" type="text" placeholder="Subject name" aria-label="Other subject with grade '+esc(g)+'"><button type="button" class="btn sm" data-rx-otherok="'+esc(g)+'">Add</button></span>':
     '<select class="rxadd" data-rx-add="'+esc(g)+'" aria-label="Add a subject with grade '+esc(g)+'"><option value="">+ Add subject</option>'+free.map(function(s){return '<option value="'+esc(s)+'">'+esc(s)+'</option>';}).join("")+
     '<option value="__other">Other subject…</option></select>')+'</div></div>';}).join("")+'</div>';}
 var sum=has(id)?(e.cgpa?'<p class="rxsum"><strong>'+esc(e.id)+':</strong> '+esc(summary(id))+'</p>':tally(id,e)):'';
 return '<div class="rx" id="rx">'+tabs+sum+(AI.ok===null?'':'<p class="hint">Preview: type your results here to try the website. On the live EDUPLAN website, results are read from your results slip by AI and cannot be typed in.</p>')+body+
  (has(id)&&!fixed?'<div class="row"><button type="button" class="btn ghost sm" data-rx-remove="'+esc(id)+'">Remove my '+esc(e.id)+' results</button></div>':'')+'</div>';
}
function refocus(sel){var el=document.querySelector(sel);if(el)el.focus();}
document.addEventListener("click",function(ev){
 var t=ev.target.closest&&ev.target.closest("[data-rx-exam],[data-rx-del],[data-rx-remove],[data-rx-otherok],[data-rx-read]");if(!t)return;
 if(t.hasAttribute("data-rx-read")){if(!UI.busy)readSlip(t.getAttribute("data-rx-read"));return;}
 if(t.hasAttribute("data-rx-exam")){UI.cur=t.getAttribute("data-rx-exam");UI.other=null;save();refocus('[data-rx-exam="'+UI.cur+'"]');}
 else if(t.hasAttribute("data-rx-del")){setGrade(UI.cur,t.getAttribute("data-rx-del"),null);refocus("#rx select");}
 else if(t.hasAttribute("data-rx-remove")){removeExam(t.getAttribute("data-rx-remove"));refocus("#rx button");}
 else if(t.hasAttribute("data-rx-otherok")){var g=t.getAttribute("data-rx-otherok"),inp=document.getElementById("rx-other");UI.other=null;
  if(inp&&inp.value.trim())setGrade(UI.cur,inp.value,g);else save();refocus('[data-rx-add="'+g+'"]');}
});
document.addEventListener("change",function(ev){
 var t=ev.target;
 if(t.hasAttribute&&t.hasAttribute("data-rx-add")){var g=t.getAttribute("data-rx-add");
  if(t.value==="__other"){UI.other=g;save();refocus("#rx-other");return;}
  if(t.value){setGrade(UI.cur,t.value,g);refocus('[data-rx-add="'+g+'"]');}}
 if(t.hasAttribute&&t.hasAttribute("data-rx-cgpa"))setCgpa(t.getAttribute("data-rx-cgpa"),t.value);
});
document.addEventListener("keydown",function(ev){if(ev.key==="Enter"&&ev.target.id==="rx-other"){ev.preventDefault();var b=document.querySelector("[data-rx-otherok]");if(b)b.click();}
 if(ev.key==="Escape"&&ev.target.id==="rx-other"){UI.other=null;save();}});

/* ---------- Campus scholarships for the student's results ----------
   A tier's minimum_result is read as a number of A grades ("5As", "8A+", "8As (A+ and A only)") or a CGPA
   ("CGPA 3.75 and above", "≥CGPA 3.9000", "CGPA 3.8000-3.8999"). A tier counts for an exam when its qualification is
   that exam; a CGPA tier filed under Foundation also counts for Matriculation or Diploma when its text names them. */
function tierNeed(min){var m=String(min||""),r;
 if((r=m.match(/CGPA\s*([\d.]+)\s*[-–]\s*([\d.]+)/i)))return {cgpa:true,lo:+r[1],hi:+r[2]};
 if((r=m.match(/(?:≥|>=)\s*CGPA\s*([\d.]+)/i)||m.match(/CGPA\s*([\d.]+)\s*(?:and above|or above|\+|or higher)/i)||m.match(/CGPA\s*(?:of\s*)?([\d.]+)/i)))return {cgpa:true,lo:+r[1],hi:null};
 /* Checked from the grades in My results (see tierHave): "12 points or fewer in 6 subjects" / "13-18 points in 6 subjects"
    (UEC: A1=1 … B6=6, best subjects added up), "3.70 and above in 3 subjects" (STPM grade points, best subjects averaged),
    and grade sets such as "AAB" or "ABB or AAC" (A-Level, best grades). */
 if((r=m.match(/(?:\d+\s*[-–]\s*)?(\d+)\s*points?\b(?:\s*(?:or fewer|or less|and below|or below|& below))?\s*in\s*(?:the\s*)?(?:best\s*)?(\d+)\s*subjects/i)))return {pts:true,max:+r[1],n:+r[2]};
 if((r=m.match(/(\d\.\d+)\s*(?:and above|or above|& above|\+)?\s*in\s*(?:the\s*)?(?:best\s*)?(\d+)\s*subjects/i)))return {gpa:true,lo:+r[1],n:+r[2]};
 if(/^\s*[A-E](?:\*?[A-E]){1,4}\*?(?:\s*(?:or|\/|,)\s*[A-E](?:\*?[A-E]){1,4}\*?)*\s*$/.test(m)){var sets=m.trim().split(/\s*(?:or|\/|,)\s*/);return {combo:sets,n:sets[0].replace(/\*/g,"").length};}
 if((r=m.match(/(\d+)\s*(A[+\-*]?(?:\s*(?:\/|,|&|and|or)\s*A[+\-*]?)*)/i))){
  /* The grades named after the number: "8A+" = A+ only; "8A+/A" or "8As (A+ and A only)" = A+ and A;
     "8A-", "8A+/A/A-", "8A" or "8As" = any A grade. */
  var g=r[2].split(/\s*(?:\/|,|&|and|or)\s*/i),plus=g.some(function(x){return /^A[+*]$/.test(x);}),
   minus=g.some(function(x){return x==="A-";}),plain=g.some(function(x){return /^A$/i.test(x);});
  if(/A\+\s*and\s*A\s*only/i.test(m))return {as:+r[1],top:2};
  return {as:+r[1],top:minus||!plus?0:plain?2:1};}
 return null;}
function tierFor(qual,min,eid){if(qual===eid)return true;var e=exam(eid),q=exam(qual);
 return !!(e&&e.cgpa&&q&&q.cgpa&&new RegExp("\\b"+eid+"\\b","i").test(min||""));}
/* How many As (or top grades) the student has towards a tier, and whether it is reached. */
function tierHave(need,eid){var e=exam(eid);if(!need||!has(eid))return null;
 if(need.cgpa){var c=cgpa(eid);return c==null?null:{have:c,ok:c>=need.lo&&(need.hi==null||c<=need.hi)};}
 if(e.cgpa)return null;
 if(need.pts||need.gpa||need.combo)return special(need,eid,e);
 var n=need.top?countIn(eid,e.grades.slice(0,need.top)):aCount(eid);return {have:n,ok:n>=need.as};}
var STPM_GP={"A":4,"A-":3.67,"B+":3.33,"B":3,"B-":2.67,"C+":2.33,"C":2,"C-":1.67,"D+":1.33,"D":1,"F":0};
/* The best n subjects (STPM General Studies left out), as indexes into the exam's grade list, best first. */
function best(eid,e,n){var g=grades(eid).filter(function(s){return !/pengajian am|general studies/i.test(s[0]);})
  .map(function(s){return e.grades.indexOf(s[1]);}).filter(function(i){return i>=0;}).sort(function(a,b){return a-b;});return g.length>=n?g.slice(0,n):null;}
function special(need,eid,e){var b=best(eid,e,need.n);if(!b)return {have:null,ok:false,few:true};
 if(need.pts){if(eid!=="UEC")return null;var sum=b.reduce(function(t,i){return t+i+1;},0);return {have:sum,ok:sum<=need.max};}
 if(need.gpa){if(eid!=="STPM")return null;var avg=Math.round(b.reduce(function(t,i){return t+STPM_GP[e.grades[i]];},0)/need.n*100)/100;return {have:avg,ok:avg>=need.lo};}
 var mine=b.map(function(i){return e.grades[i];}).join("");
 return {have:mine,ok:need.combo.some(function(set){var req=(set.match(/[A-E]\*?/g)||[]).map(function(x){return e.grades.indexOf(x);}).sort(function(a,b){return a-b;});
  return req.every(function(r,k){return r>=0&&b[k]<=r;});})};}
/* How far a tier is: points to drop, average to gain, or 1 for a grade set not reached. */
function gapOf(need,h){return need.pts?h.have-need.max:need.gpa?Math.round((need.lo-h.have)*100)/100:need.combo?1:need.cgpa?need.lo-h.have:need.as-h.have;}
/* What a tier asks for, in words: "12 points or fewer in your best 6 subjects", "an average of 3.70 in 3 subjects", "AAB or AAC". */
function needWords(need){return need.pts?need.max+" points or fewer in your best "+need.n+" subjects":need.gpa?"an average of "+need.lo.toFixed(2)+" in your best "+need.n+" subjects":need.combo?need.combo.join(" or "):"";}
function award(t){return t.waiver!=null?t.waiver:t.amount!=null?t.amount/1000:-1;}
/* rows: [{inst, instName, name, applies, qual, min, waiver, amount}]. Returns one entry per scholarship the student
   can match: hit = best tier reached (or null), next = the closest better tier, exam = the exam used. */
function scholarships(rows){
 var out=[];
 taken().forEach(function(eid){
  var g={},order=[];
  rows.forEach(function(r){if(!tierFor(r.qual,r.min,eid))return;var k=r.inst+"|"+r.name+"|"+(r.applies||"");if(!g[k]){g[k]={exam:eid,inst:r.inst,instName:r.instName,name:r.name,applies:r.applies,tiers:[]};order.push(k);}g[k].tiers.push(r);});
  order.forEach(function(k){var s=g[k];s.hit=null;s.next=null;
   s.tiers.forEach(function(t){var h=tierHave(tierNeed(t.min),eid);if(h&&h.ok&&(!s.hit||award(t)>award(s.hit)))s.hit=t;});
   s.tiers.forEach(function(t){var nd=tierNeed(t.min),h=tierHave(nd,eid);if(!h||h.ok||h.few||(s.hit&&award(t)<=award(s.hit)))return;
    var gap=gapOf(nd,h);if(gap<=0)return;   /* e.g. a CGPA band the student is above */
    if(!s.next||gap<s.next.gap||(gap===s.next.gap&&award(t)>award(s.next.t)))s.next={t:t,gap:gap,need:nd,have:h.have};});
   if(s.hit||s.next)out.push(s);});
 });
 return out.sort(function(a,b){return (b.hit?award(b.hit):-2)-(a.hit?award(a.hit):-2);});
}
/* Scholarship tracker: from the list scholarships() gives, how many the student qualifies for, the highest award
   and how many are one step away. Updated whenever My results change (the pages redraw on "eduplan:results"). */
function tracker(list){var seen={},yes=0,near=0,w=null,a=null,by={};
 list.forEach(function(s){var k=s.inst+"|"+s.name+"|"+(s.applies||"");if(s.hit){by[s.exam]=(by[s.exam]||0)+1;
   if(s.hit.waiver!=null&&(w==null||s.hit.waiver>w))w=s.hit.waiver;if(s.hit.amount!=null&&(a==null||s.hit.amount>a))a=s.hit.amount;}
  if(seen[k]==null)seen[k]=!!s.hit;else seen[k]=seen[k]||!!s.hit;});
 Object.keys(seen).forEach(function(k){if(seen[k])yes++;else near++;});
 return {yes:yes,near:near,waiver:w,amount:a,by:by};}
function trackerHtml(list){var t=tracker(list),ex=taken();
 function st(b,l){return '<div class="st"><b>'+esc(b)+'</b><span>'+esc(l)+'</span></div>';}
 return '<div class="sctrack" role="group" aria-label="Scholarship tracker">'+st(String(t.yes),t.yes===1?"scholarship you qualify for":"scholarships you qualify for")+
  (t.waiver!=null?st("Up to "+t.waiver+"%","tuition waiver"):'')+(t.amount!=null?st("Up to RM "+Number(t.amount).toLocaleString("en-MY"),"scholarship award"):'')+
  st(String(t.near),"almost there: one step away")+'</div>'+
  '<p class="hint">Checked automatically with your '+esc(ex.join(", "))+' results in My results'+(t.yes?': '+ex.filter(function(id){return t.by[id];}).map(function(id){return id+" "+t.by[id];}).join(" · "):'')+'. Each scholarship checks other conditions too.</p>';}
/* ---------- A chosen programme: the scholarship My results reach there, and the tuition left to pay ----------
   Used by the Lab's programme cards and details and by the main app's "Your choice" card. rows: campus scholarship
   tiers {inst,instName,name,applies,qual,min,waiver,amount}. The pick (one scholarship per programme) is kept in
   this browser so every page shows the same one. */
function lvOf(l){l=String(l||"");return /pre-?university|foundation/i.test(l)?"foundation":/master|phd|doctor|postgrad/i.test(l)?"postgraduate":"undergraduate";}
function appliesLv(a){return /^foundation/i.test(a)?"foundation":/^undergraduate/i.test(a)?"undergraduate":/^postgraduate/i.test(a)?"postgraduate":"";}
function schFor(rows,inst,level){var lv=lvOf(level),by={},keys=[];
 rows=rows.filter(function(r){var l=appliesLv(r.applies);return r.inst===inst&&r.qual&&r.qual!=="Other"&&(!l||l===lv);});
 scholarships(rows).forEach(function(x){if(!x.hit)return;var k=x.name+"|"+(x.applies||"");if(!by[k]||award(x.hit)>award(by[k].t)){if(!by[k])keys.push(k);by[k]={key:k,name:x.name,applies:x.applies,exam:x.exam,t:x.hit};}});
 return {any:rows.length>0,list:keys.map(function(k){return by[k];}).sort(function(a,b){return award(b.t)-award(a.t);})};}
var PK_KEY="eduplan-sch-pick",PAY={};
function picks(){try{return JSON.parse(localStorage.getItem(PK_KEY))||{};}catch(e){return {};}}
function pickOf(id,list){var k=picks()[id];if(k==="none")return null;return list.filter(function(x){return x.key===k;})[0]||list[0]||null;}
/* Tuition: the whole-programme fee, or the yearly fee ("RM 17,000 ...") times the duration (an estimate). */
function rmText(n){return "RM "+Number(n).toLocaleString("en-MY");}
function feeBase(fee,annual,yrs){if(fee!=null&&fee!=="")return {total:+fee,how:"whole programme"};
 var m=annual&&annual.length&&String(annual[0]).match(/RM\s*([\d,]+)/),a=m?Number(m[1].replace(/,/g,"")):null;
 if(a!=null&&yrs)return {total:Math.round(a*yrs),how:rmText(a)+" a year × "+yrs+(+yrs===1?" year":" years"),est:true};return a!=null?{total:a,how:"per year",year:true}:null;}
function cut(base,t){return !base||!t?0:t.waiver!=null?Math.round(base.total*t.waiver/100):t.amount!=null?Math.min(+t.amount,base.total):0;}
function awardShort(t){return t.waiver!=null?t.waiver+"% tuition waiver":t.amount!=null?rmText(t.amount):"Scholarship";}
/* o: {id, inst (short name), level, rows, fee, annual, years, port (link to My portfolio), head (heading tag)} */
function payHtml(o){PAY[o.id]=o;var h=o.head||"h3",top='<div class="paybox" data-paybox="'+esc(o.id)+'"><'+h+'>Your scholarship and what you pay</'+h+'>';
 if(!taken().length)return top+'<p class="hint"><a href="'+esc(o.port)+'">Add your exam results</a> in My portfolio to see the scholarships you qualify for here and the tuition you would pay.</p></div>';
 var r=schFor(o.rows,o.instId,o.level),list=r.list,pk=pickOf(o.id,list),base=feeBase(o.fee,o.annual,o.years),off=cut(base,pk&&pk.t),nm="rxpick-"+o.id;
 var tot=base?'<dl class="paytot"><dt>Tuition fee</dt><dd>'+esc(rmText(base.total))+' <span class="hint">('+esc(base.how)+')</span></dd>'+
   (pk?'<dt>Scholarship</dt><dd>− '+esc(rmText(off))+' <span class="hint">('+esc(awardShort(pk.t))+')</span></dd>':'')+
   '<dt>Total you pay</dt><dd><b>'+esc(rmText(base.total-off))+'</b>'+(base.year?' per year':'')+'</dd></dl>'+
   '<p class="hint">Estimate of tuition only'+(base.est?', from the yearly fee':'')+'. Other fees (registration, hostel and others) are not included. Each scholarship has its own conditions, so confirm with '+esc(o.inst)+' before you apply.</p>'
  :'<p class="hint">The fee for this programme is not listed yet, so the total cannot be worked out.</p>';
 if(!list.length)return top+'<p class="hint">'+(r.any?'Your results in My results do not reach a scholarship tier at '+esc(o.inst)+' for this level yet.':'No results-based scholarship is listed for this level at '+esc(o.inst)+' yet.')+'</p>'+tot+'</div>';
 return top+'<fieldset class="picks"><legend class="hint">Your results qualify for these. Choose one to see the total.</legend>'+
  list.map(function(x){return '<label class="pickr"><input type="radio" name="'+esc(nm)+'" data-rxpick="'+esc(o.id)+'" value="'+esc(x.key)+'"'+(pk===x?' checked':'')+'>'+
   '<span><b>'+esc(awardShort(x.t))+'</b><span>'+esc(x.name)+'</span>'+(x.applies?'<span class="hint">'+esc(x.applies)+'</span>':'')+'<span class="hint">With your '+esc(x.exam)+' results</span></span></label>';}).join("")+
  '<label class="pickr"><input type="radio" name="'+esc(nm)+'" data-rxpick="'+esc(o.id)+'" value="none"'+(pk?'':' checked')+'><span><b>No scholarship</b></span></label></fieldset>'+tot+'</div>';}
/* Picking a scholarship: remember it, redraw that box in place and tell the pages (their cards show the pick). */
document.addEventListener("change",function(ev){var t=ev.target;if(!t.hasAttribute||!t.hasAttribute("data-rxpick"))return;var id=t.getAttribute("data-rxpick"),pk=picks();pk[id]=t.value;
 try{localStorage.setItem(PK_KEY,JSON.stringify(pk));}catch(e){}
 var bx=t.closest(".paybox");if(bx&&PAY[id]){var v=t.value;bx.outerHTML=payHtml(PAY[id]);
  [].slice.call(document.querySelectorAll('[data-rxpick]')).forEach(function(r){if(r.getAttribute("data-rxpick")===id&&r.value===v)r.focus();});}
 window.dispatchEvent(new CustomEvent("eduplan:schpick",{detail:{id:id}}));});
function awardText(t){return t.waiver!=null?t.waiver+"% tuition waiver":t.amount!=null?"RM "+Number(t.amount).toLocaleString("en-MY"):"See official information";}
/* "1 more A for 50% tuition waiver" / "Needs 8 A+ for 100% tuition waiver (you have 7)" / "Needs CGPA 3.90 for …". */
function nextText(s){var n=s.next,e=exam(s.exam);if(!n)return "";
 if(n.need.cgpa)return "Needs CGPA "+n.need.lo.toFixed(2)+" for "+awardText(n.t);
 if(n.need.pts||n.need.gpa||n.need.combo)return "Needs "+needWords(n.need)+" for "+awardText(n.t)+" (you have "+(n.need.gpa?n.have.toFixed(2):n.have)+")";
 if(n.need.top)return "Needs "+n.need.as+" "+e.grades.slice(0,n.need.top).join(" or ")+" for "+awardText(n.t)+" (you have "+n.have+")";
 return n.gap+" more A"+(n.gap===1?"":"s")+" for "+awardText(n.t);}
/* One line about the student's results, for the AI study assistant. */
function forChat(){return taken().map(function(id){var e=exam(id);return id+": "+(e.cgpa?summary(id):summary(id)+" ("+aCount(id)+" A grades; "+text(id).replace(/\n/g,", ")+")");}).join("; ");}

window.EDUPLAN_RESULTS={live:live,readId:readId,errText:function(c){return RX_ERR[c]||RX_ERR.busy;},canRead:function(){return live()||AI.ok===true;},locked:locked,letters:letters,snapField:snapField,checkAI:checkAI,schFor:schFor,pickOf:pickOf,feeBase:feeBase,cut:cut,awardShort:awardShort,payHtml:payHtml,scholarships:scholarships,tracker:tracker,trackerHtml:trackerHtml,awardText:awardText,nextText:nextText,forChat:forChat,tierNeed:tierNeed,tierHave:tierHave,needWords:needWords,gapOf:gapOf,EXAMS:EXAMS,exam:exam,get:function(){return R;},use:use,has:has,taken:taken,grades:grades,cgpa:cgpa,countIn:countIn,aCount:aCount,
 summary:summary,text:text,editor:editor,groupsFor:groupsFor,checkExam:checkExam,match:match,badge:badge,current:function(){return UI.cur;},setCurrent:function(id){UI.cur=id;}};
checkAI();
})();
