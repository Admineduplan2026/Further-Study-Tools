/* Eduplan "My results": the student's exam results, kept until they change them, and the matching that uses them.
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
function has(id){var x=R.exams[id];return !!(x&&((x.g&&x.g.length)||(x.cgpa!==""&&x.cgpa!=null)));}
function taken(){return EXAMS.filter(function(e){return has(e.id);}).map(function(e){return e.id;});}
function grades(id){var x=R.exams[id];return x&&x.g?x.g:[];}
function cgpa(id){var x=R.exams[id];return x&&x.cgpa!==""&&x.cgpa!=null?Number(x.cgpa):null;}
/* How many subjects have one of these grades. */
function countIn(id,list){return grades(id).filter(function(s){return list.indexOf(s[1])>=0;}).length;}
function aCount(id){var e=exam(id);return e&&!e.cgpa&&has(id)?countIn(id,e.a):null;}
/* Short summary: "8 A+ · 1 A · 1 B" or "CGPA 3.50". */
function summary(id){var e=exam(id);if(!e||!has(id))return "";if(e.cgpa)return "CGPA "+R.exams[id].cgpa;
 return e.grades.map(function(g){var n=countIn(id,[g]);return n?n+" "+g:"";}).filter(Boolean).join(" · ");}
/* Plain text for the application: one subject per line. */
function text(id){var e=exam(id);if(!e||!has(id))return "";if(e.cgpa)return "CGPA "+R.exams[id].cgpa;
 return grades(id).slice().sort(function(a,b){return e.grades.indexOf(a[1])-e.grades.indexOf(b[1]);}).map(function(s){return s[0]+" "+s[1];}).join("\n");}
function setGrade(id,subj,g){subj=String(subj||"").trim();if(!subj)return;var x=R.exams[id]=R.exams[id]||{g:[]};x.g=(x.g||[]).filter(function(s){return norm(s[0])!==norm(subj);});
 if(g)x.g.push([subj,g]);save();}
function setCgpa(id,v){var n=parseFloat(v);R.exams[id]={cgpa:isNaN(n)?"":String(Math.max(0,Math.min(4,n)))};save();}
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
function editor(fixed){
 var list=taken(),id=fixed||UI.cur||(list[0]||"SPM"),e=exam(id);if(!e)return "";
 UI.cur=id;
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
 var sum=has(id)?'<p class="rxsum"><strong>'+esc(e.id)+':</strong> '+esc(summary(id))+(e.cgpa?'':' · <strong>'+aCount(id)+' A'+(aCount(id)===1?'':'s')+'</strong>')+'</p>':'';
 return '<div class="rx" id="rx">'+tabs+body+sum+
  (has(id)&&!fixed?'<div class="row"><button type="button" class="btn ghost sm" data-rx-remove="'+esc(id)+'">Remove my '+esc(e.id)+' results</button></div>':'')+'</div>';
}
function refocus(sel){var el=document.querySelector(sel);if(el)el.focus();}
document.addEventListener("click",function(ev){
 var t=ev.target.closest&&ev.target.closest("[data-rx-exam],[data-rx-del],[data-rx-remove],[data-rx-otherok]");if(!t)return;
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
function awardText(t){return t.waiver!=null?t.waiver+"% tuition waiver":t.amount!=null?"RM "+Number(t.amount).toLocaleString("en-MY"):"See official information";}
/* "1 more A for 50% tuition waiver" / "Needs 8 A+ for 100% tuition waiver (you have 7)" / "Needs CGPA 3.90 for …". */
function nextText(s){var n=s.next,e=exam(s.exam);if(!n)return "";
 if(n.need.cgpa)return "Needs CGPA "+n.need.lo.toFixed(2)+" for "+awardText(n.t);
 if(n.need.pts||n.need.gpa||n.need.combo)return "Needs "+needWords(n.need)+" for "+awardText(n.t)+" (you have "+(n.need.gpa?n.have.toFixed(2):n.have)+")";
 if(n.need.top)return "Needs "+n.need.as+" "+e.grades.slice(0,n.need.top).join(" or ")+" for "+awardText(n.t)+" (you have "+n.have+")";
 return n.gap+" more A"+(n.gap===1?"":"s")+" for "+awardText(n.t);}
/* One line about the student's results, for the AI study assistant. */
function forChat(){return taken().map(function(id){var e=exam(id);return id+": "+(e.cgpa?summary(id):summary(id)+" ("+aCount(id)+" A grades; "+text(id).replace(/\n/g,", ")+")");}).join("; ");}

window.EDUPLAN_RESULTS={scholarships:scholarships,awardText:awardText,nextText:nextText,forChat:forChat,tierNeed:tierNeed,tierHave:tierHave,needWords:needWords,gapOf:gapOf,EXAMS:EXAMS,exam:exam,get:function(){return R;},use:use,has:has,taken:taken,grades:grades,cgpa:cgpa,countIn:countIn,aCount:aCount,
 summary:summary,text:text,editor:editor,groupsFor:groupsFor,checkExam:checkExam,match:match,badge:badge,current:function(){return UI.cur;},setCurrent:function(id){UI.cur=id;}};
})();
