(function(){
"use strict";
/* ---------- Data (sample; replace with real partner data) ---------- */
var FIELDS={med:"Medicine & Health",eng:"Engineering",cs:"Computer Science & IT",biz:"Business & Finance",design:"Design & Creative Arts",law:"Law",edu:"Education",sci:"Science",hosp:"Hospitality & Tourism",comm:"Communication & Media"};
var INTERESTS={help:"Helping people",build:"Building and fixing things",computers:"Computers and coding",numbers:"Numbers and money",design:"Drawing and design",argue:"Debating and arguing a case",teach:"Teaching and explaining",experiments:"Experiments and discovery",travel:"Food, travel and hosting",write:"Writing and media",lead:"Running a business"};
var COURSES=[
 {name:"Bachelor of Medicine and Surgery (MBBS)",field:"med",level:"Degree",years:5,int:["help","experiments"]},
 {name:"Diploma in Nursing",field:"med",level:"Diploma",years:3,int:["help"]},
 {name:"Bachelor of Pharmacy",field:"med",level:"Degree",years:4,int:["experiments","help"]},
 {name:"Bachelor of Civil Engineering",field:"eng",level:"Degree",years:4,int:["build","numbers"]},
 {name:"Diploma in Mechanical Engineering",field:"eng",level:"Diploma",years:2.5,int:["build"]},
 {name:"Bachelor of Computer Science",field:"cs",level:"Degree",years:3,int:["computers","numbers"]},
 {name:"Diploma in Information Technology",field:"cs",level:"Diploma",years:2,int:["computers"]},
 {name:"Bachelor of Accounting",field:"biz",level:"Degree",years:3,int:["numbers"]},
 {name:"Diploma in Business Administration",field:"biz",level:"Diploma",years:2,int:["lead","numbers"]},
 {name:"Bachelor of Graphic Design",field:"design",level:"Degree",years:3,int:["design"]},
 {name:"Diploma in Interior Design",field:"design",level:"Diploma",years:2.5,int:["design","build"]},
 {name:"Bachelor of Laws (LLB)",field:"law",level:"Degree",years:3,int:["argue","write"]},
 {name:"Bachelor of Education (TESL)",field:"edu",level:"Degree",years:4,int:["teach","write"]},
 {name:"Diploma in Early Childhood Education",field:"edu",level:"Diploma",years:2.5,int:["teach","help"]},
 {name:"Bachelor of Biotechnology",field:"sci",level:"Degree",years:3,int:["experiments"]},
 {name:"Diploma in Hotel Management",field:"hosp",level:"Diploma",years:2,int:["travel","lead"]},
 {name:"Bachelor of Culinary Arts",field:"hosp",level:"Degree",years:3,int:["travel","design"]},
 {name:"Bachelor of Mass Communication",field:"comm",level:"Degree",years:3,int:["write","design"]}
];
var UNIS=[
 {id:"a",name:"Sample University A",city:"Kuala Lumpur",fields:["med","sci","biz"],hostel:"On-campus hostel",rent:450},
 {id:"b",name:"Sample University B",city:"Penang",fields:["eng","cs","sci"],hostel:"On-campus hostel",rent:380},
 {id:"c",name:"Sample College C",city:"Johor Bahru",fields:["biz","hosp","comm"],hostel:"Partner hostel, 10 minutes by shuttle",rent:520},
 {id:"d",name:"Sample University D",city:"Selangor",fields:["design","comm","cs"],hostel:"On-campus hostel",rent:480},
 {id:"e",name:"Sample College E",city:"Kuching",fields:["edu","biz","hosp"],hostel:"On-campus hostel",rent:300},
 {id:"f",name:"Sample University F",city:"Kuala Lumpur",fields:["law","biz","edu"],hostel:"No hostel. Eduplan helps you find a rented room nearby",rent:null}
];
var QUESTIONS=[
 {q:"Which school subjects do you enjoy most?",a:[
  ["Biology and Chemistry",{med:2,sci:2}],["Maths and Physics",{eng:2,cs:2}],["Accounts and Economics",{biz:3}],["Art and Design",{design:3}],["Languages and History",{law:1,comm:2,edu:1}]]},
 {q:"On a free weekend, what would you rather do?",a:[
  ["Fix or build something",{eng:3}],["Make a video or a poster",{design:2,comm:2}],["Help out at a clinic or care home",{med:3}],["Run a small stall or sell something",{biz:2,hosp:2}],["Solve puzzles or write code",{cs:3}]]},
 {q:"How do you like to work?",a:[
  ["With people, face to face",{med:1,edu:2,hosp:2}],["With data and numbers",{biz:2,cs:1,sci:1}],["With my hands and tools",{eng:2,design:1}],["With words and arguments",{law:3,comm:1}]]},
 {q:"What matters most to you in a future job?",a:[
  ["A stable income",{biz:2,eng:2}],["Helping other people",{med:2,edu:2}],["Being creative",{design:2,comm:2}],["Solving hard problems",{cs:2,sci:2,law:1}]]},
 {q:"How long are you ready to study before you start working?",level:true,a:[
  ["About 2 years","Diploma"],["3 to 4 years","Degree"],["5 years or more","Long"],["I am not sure yet",null]]}
];

/* ---------- Helpers ---------- */
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
var SCH=window.EDUPLAN_SCHOLARSHIPS||{types:[]};
function schType(id){for(var i=0;i<SCH.types.length;i++){if(SCH.types[i].id===id)return SCH.types[i];}return null;}
function uni(id){for(var i=0;i<UNIS.length;i++){if(UNIS[i].id===id)return UNIS[i];}return null;}
function unisFor(field){return UNIS.filter(function(u){return u.fields.indexOf(field)>-1;});}
function opts(map,sel,first){var h=first?'<option value="">'+esc(first)+'</option>':"";Object.keys(map).forEach(function(k){h+='<option value="'+esc(k)+'"'+(k===sel?" selected":"")+'>'+esc(map[k])+'</option>';});return h;}
function years(y){return y+(y===1?" year":" years");}
var ARROW='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"></path></svg>';
function store(k,v){try{if(v===undefined){var r=localStorage.getItem(k);return r?JSON.parse(r):null;}localStorage.setItem(k,JSON.stringify(v));}catch(e){}return null;}

/* ---------- Pure logic ---------- */
function matchCourses(picked,level){
  return COURSES.map(function(c){
    var hit=c.int.filter(function(x){return picked.indexOf(x)>-1;}).length;
    return {c:c,hit:hit,pct:Math.round(100*hit/Math.max(1,picked.length))};
  }).filter(function(r){return r.hit>0&&(!level||r.c.level===level);})
    .sort(function(a,b){return b.pct-a.pct||b.hit-a.hit||a.c.years-b.c.years;});
}
function guidedResult(answers){
  var score={},level=null;
  answers.forEach(function(ai,qi){var q=QUESTIONS[qi];if(ai==null)return;var v=q.a[ai][1];
    if(q.level){level=v;return;}
    Object.keys(v).forEach(function(k){score[k]=(score[k]||0)+v[k];});});
  var top=Object.keys(score).sort(function(a,b){return score[b]-score[a];}).slice(0,2);
  var list=COURSES.filter(function(c){return top.indexOf(c.field)>-1;});
  var pref=list.filter(function(c){return level==="Diploma"?c.level==="Diploma":level==="Degree"?(c.level==="Degree"&&c.years<=4):level==="Long"?c.level==="Degree":true;});
  return {fields:top,level:level,courses:pref.length?pref:list};
}
window.__eduplan={matchCourses:matchCourses,guidedResult:guidedResult};

/* ---------- State ---------- */
var S={int:{picked:["computers","numbers"],level:""},
       guide:{step:0,answers:[]},
       cons:store("eduplan-consult")||{},consDone:null,
       courseField:"",
       schType:null,schPick:{}};

/* ---------- Views ---------- */
var V={};
V.home=function(){return ''+
 '<section class="stack"><h1>Specific Tools for Study Further</h1><p class="lead">Three ways to find your course and university. Free of charge.</p></section>'+
 '<section class="section"><div class="tools">'+
  '<a class="tool t1" href="#scholarship-match"><span class="k">Option 1 · Scholarship based</span><span class="t">Don\'t Let Fees Decide Your Future: Match With a Scholarship</span><span class="go">Find my scholarships '+ARROW+'</span></a>'+
  '<a class="tool t2" href="#interest-match"><span class="k">Option 2 · Interest based</span><span class="t">From Interest to Career: Courses Matched to You in any field</span><span class="go">Match my interests '+ARROW+'</span></a>'+
  '<a class="tool t3" href="#guided"><span class="k">Option 3 · Guidance based</span><span class="t">From "I Don\'t Know" to "I\'m Enrolled", One Step at a Time</span><span class="go">Start the 5 questions '+ARROW+'</span></a>'+
 '</div><div><a class="textlink" href="#courses">Others: browse all courses '+ARROW+'</a></div></section>'+
 '<section class="section"><h2>How Eduplan works</h2><div class="threeup">'+
  '<div class="stack"><span class="n">Step 1</span><h3>Tell us where you are</h3><p class="muted">Pick the tool that fits you: you need funding, you know what you like, or you are not sure yet.</p></div>'+
  '<div class="stack"><span class="n">Step 2</span><h3>See your matches</h3><p class="muted">Get a short list of courses, universities and scholarships that fit your answers.</p></div>'+
  '<div class="stack"><span class="n">Step 3</span><h3>Talk to a counsellor</h3><p class="muted">Book a free consultation. We guide you from application to registration.</p></div>'+
 '</div></section>';
};
V.about=function(){return ''+
 '<section class="stack"><span class="eyebrow">About Us</span><h1>We lead students to the right place to study</h1><p class="lead">Eduplan is an education tool that guides students to a suitable institution, from learning about it to the registration phase. The service is free of charge for students.</p></section>'+
 '<section class="section"><h2>Three ways we guide you</h2><div class="grid">'+
  '<div class="item"><h3>Scholarship based</h3><p>For students who need funding. We match your results and family income with scholarships you can apply for.</p><a class="textlink" href="#scholarship-match">Open the tool '+ARROW+'</a></div>'+
  '<div class="item"><h3>Interest based</h3><p>For students who know what they enjoy. We turn your interests into courses and universities.</p><a class="textlink" href="#interest-match">Open the tool '+ARROW+'</a></div>'+
  '<div class="item"><h3>Guidance based</h3><p>For students who are still unsure. Five short questions, then a counsellor walks you through each step.</p><a class="textlink" href="#guided">Open the tool '+ARROW+'</a></div>'+
 '</div></section>'+
 '<section class="panel"><h2>Ready to talk?</h2><p class="muted">A counsellor will go through your options with you and your family.</p><div><a class="btn" href="#consultation">Book a free consultation</a></div></section>';
};
V.courses=function(){
 var list=COURSES.filter(function(c){return !S.courseField||c.field===S.courseField;});
 return '<section class="stack"><span class="eyebrow">Courses</span><h1>Browse courses by field</h1><p class="lead">Durations are typical for Malaysia and vary by institution.</p></section>'+
 '<section class="section"><div class="field" style="max-width:340px"><label for="course-field">Field of study</label><select id="course-field">'+opts(FIELDS,S.courseField,"All fields")+'</select></div>'+
 '<p class="muted" aria-live="polite">'+list.length+' course'+(list.length===1?"":"s")+' shown</p><div class="grid">'+
 list.map(function(c){return '<div class="item"><h3>'+esc(c.name)+'</h3><div class="meta"><span class="pill brand">'+esc(FIELDS[c.field])+'</span><span class="pill">'+c.level+'</span><span class="pill">'+years(c.years)+'</span></div><p>Offered at '+unisFor(c.field).map(function(u){return esc(u.name);}).join(", ")+'.</p></div>';}).join("")+
 '</div></section>';
};
V.universities=function(){return ''+
 '<section class="stack"><span class="eyebrow">Universities</span><h1>Partner universities and colleges</h1><p class="lead">Placeholder institutions. Replace them with your real partners before launch.</p></section>'+
 '<section class="grid">'+UNIS.map(function(u){return '<div class="item"><h3>'+esc(u.name)+'</h3><p>'+esc(u.city)+'</p><div class="meta">'+u.fields.map(function(f){return '<span class="pill brand">'+esc(FIELDS[f])+'</span>';}).join("")+'</div><p>'+esc(u.hostel)+'.</p></div>';}).join("")+'</section>';
};
/* Scholarship-based: Page 1 is the entry button, Page 2 picks the type, Page 3 shows that type.
   Page 3 is only reachable after a type is chosen on Page 2 (see route()). */
function stepper(step,last){
 var names=["Scholarship-based","Scholarship type",last||"Requirements or tuition waiver"];
 return '<ol class="stepper" aria-label="Progress">'+names.map(function(n,k){var cur=k+1===step;return '<li'+(cur?' aria-current="step"':(k+1<step?' class="done"':''))+'><span aria-hidden="true">'+(k+1)+'</span>Page '+(k+1)+': '+esc(n)+'</li>';}).join("")+'</ol>';
}
function schCta(note){return '<div class="row"><a class="btn" href="#consultation" data-topic="Scholarships"'+(note?' data-note="'+esc(note)+'"':'')+'>Ask a counsellor about scholarships</a></div>';}
V.scholarships=function(){
 return '<section class="stack">'+stepper(2)+'<div><a class="btn ghost" href="#home">Back</a></div>'+
 '<span class="eyebrow">Option 1 · Scholarship based</span><h1>Choose a scholarship type</h1><p class="lead">Scholarships come from two places. Pick one to continue.</p></section>'+
 '<section class="grid">'+SCH.types.map(function(t){return '<button type="button" class="item pick" data-schtype="'+esc(t.id)+'"><span class="name">'+esc(t.label)+'</span><span class="desc">'+esc(t.desc)+'</span><span class="textlink">Continue '+ARROW+'</span></button>';}).join("")+'</section>';
};
function schPage3(t){
 var head='<section class="stack">'+stepper(3,t.kind==="waiver"?"Tuition waiver":"Requirements")+'<div><a class="btn ghost" href="#scholarships">Back</a></div><span class="eyebrow">'+esc(t.label)+'</span>';
 if(t.kind==="waiver"){
  return head+'<h1>Tuition waiver by university</h1><p class="lead">'+esc(t.desc)+'.</p></section>'+
  '<section class="grid">'+t.universities.map(function(u){return '<div class="item"><h3>'+esc(u.name)+'</h3><table class="tiers"><thead><tr><th scope="col">SPM result</th><th scope="col">Tuition waiver</th></tr></thead><tbody>'+
   u.tiers.map(function(r){return '<tr><td>'+esc(r.result)+'</td><td><span class="big">'+r.waiver+'%</span></td></tr>';}).join("")+'</tbody></table></div>';}).join("")+'</section>'+
  '<section class="panel"><h2>Not sure which tier you reach?</h2>'+schCta("Campus Scholarship: tuition waiver")+'</section>';
 }
 var pick=S.schPick[t.id],sel=null;
 t.items.forEach(function(it){if(it.id===pick&&it.name)sel=it;});
 return head+'<h1>Choose a foundation scholarship</h1><p class="lead">'+esc(t.desc)+'. Select '+t.items.map(function(it){return it.id;}).join(", ").replace(/, ([^,]*)$/," or $1")+' to see its requirements.</p></section>'+
 '<section class="two"><div class="opts" role="group" aria-label="'+esc(t.label)+' options">'+t.items.map(function(it){
   if(!it.name)return '<button type="button" class="opt" disabled>'+esc(it.id)+'. More foundation scholarships coming soon</button>';
   return '<button type="button" class="opt" data-schpick="'+esc(it.id)+'" aria-pressed="'+(sel===it)+'">'+esc(it.id)+'. '+esc(it.name)+'</button>';}).join("")+'</div>'+
 '<div class="results" aria-live="polite">'+(sel?'<div class="panel"><span class="eyebrow">Requirements</span><h2>'+esc(sel.id)+'. '+esc(sel.name)+'</h2><ul class="reqlist">'+sel.requirements.map(function(r){return '<li>'+esc(r)+'</li>';}).join("")+'</ul>'+schCta("Interested in: "+sel.name+".")+'</div>'
   :'<div class="empty">Select a scholarship to see its requirements.</div>')+'</div></section>';
}
SCH.types.forEach(function(t){V["scholarships-"+t.id]=function(){return schPage3(t);};});

V.accommodation=function(){return ''+
 '<section class="stack"><span class="eyebrow">Accommodation</span><h1>Where you will stay</h1><p class="lead">Hostel options at each institution. Monthly rent is a placeholder figure.</p></section>'+
 '<section class="grid">'+UNIS.map(function(u){return '<div class="item"><span class="big">'+(u.rent?"RM "+u.rent:"Rental help")+'</span><span class="hint">'+(u.rent?"per month, shared room":"no hostel on campus")+'</span><h3>'+esc(u.name)+'</h3><p>'+esc(u.city)+'. '+esc(u.hostel)+'.</p></div>';}).join("")+'</section>'+
 '<section class="panel"><h2>Need help choosing a hostel?</h2><div><a class="btn" href="#consultation">Ask a counsellor</a></div></section>';
};

V["interest-match"]=function(){
 var p=S.int.picked,res=p.length?matchCourses(p,S.int.level):[];
 return '<section class="stack"><span class="eyebrow">Option 2 · Interest based</span><h1>Turn what you enjoy into a course</h1><p class="lead">Pick up to three things you enjoy.</p></section>'+
 '<section class="two"><div class="panel"><div class="fields">'+
  '<div class="field"><span class="legend" id="int-legend">I enjoy ('+p.length+' of 3 picked)</span><div class="chips" role="group" aria-labelledby="int-legend">'+
   Object.keys(INTERESTS).map(function(k){var on=p.indexOf(k)>-1;return '<button type="button" class="chip" data-int="'+k+'" aria-pressed="'+on+'"'+(!on&&p.length>=3?" disabled":"")+'>'+esc(INTERESTS[k])+'</button>';}).join("")+'</div></div>'+
  '<div class="field"><label for="int-level">Level</label><select id="int-level"><option value="">Diploma or degree</option><option value="Diploma"'+(S.int.level==="Diploma"?" selected":"")+'>Diploma only</option><option value="Degree"'+(S.int.level==="Degree"?" selected":"")+'>Degree only</option></select></div>'+
 '</div></div>'+
 '<div class="results" aria-live="polite"><h2>'+(p.length?res.length+' course'+(res.length===1?"":"s")+' match':'Your matches appear here')+'</h2>'+
  (!p.length?'<div class="empty">Pick at least one interest to see matching courses.</div>'
   :res.length?res.map(function(r){var c=r.c;return '<div class="res"><div class="score"><span class="big">'+r.pct+'%</span><small>match</small></div><div class="body"><h3>'+esc(c.name)+'</h3><div class="meta"><span class="pill brand">'+esc(FIELDS[c.field])+'</span><span class="pill">'+c.level+'</span><span class="pill">'+years(c.years)+'</span></div><p>Offered at '+unisFor(c.field).map(function(u){return esc(u.name);}).join(", ")+'.</p></div></div>';}).join("")
   :'<div class="empty">No course matches at this level. Choose "Diploma or degree" to see more.</div>')+
  '<div class="row"><a class="btn" href="#consultation" data-topic="Choosing a course">Talk through these with a counsellor</a></div></div></section>';
};

V.guided=function(){
 var g=S.guide,n=QUESTIONS.length;
 var head='<section class="stack"><span class="eyebrow">Option 3 · Guidance based</span><h1>Not sure yet? Start here</h1><p class="lead">Five short questions. There are no wrong answers.</p></section>';
 if(g.step>=n){
  var r=guidedResult(g.answers);
  return head+'<section class="panel"><div class="note">You answered all five questions.</div><h2>Fields that suit your answers</h2><div class="meta">'+r.fields.map(function(f){return '<span class="pill brand" style="font-size:15px;padding:6px 14px">'+esc(FIELDS[f])+'</span>';}).join("")+'</div>'+
   '<h3>Courses to look at first</h3><div class="grid">'+r.courses.map(function(c){return '<div class="item" style="background:#fff"><h3>'+esc(c.name)+'</h3><div class="meta"><span class="pill">'+c.level+'</span><span class="pill">'+years(c.years)+'</span></div><p>Offered at '+unisFor(c.field).map(function(u){return esc(u.name);}).join(", ")+'.</p></div>';}).join("")+'</div>'+
   '<p class="muted">This is a starting point, not a final answer. The next step is a conversation with a counsellor.</p>'+
   '<div class="row"><a class="btn" href="#consultation" data-topic="I am not sure what to study" data-note="Guided questions suggested: '+esc(r.fields.map(function(f){return FIELDS[f];}).join(" and "))+'.">Book my free consultation</a><button type="button" class="btn ghost" id="guide-restart">Start again</button></div></section>';
 }
 var q=QUESTIONS[g.step],cur=g.answers[g.step];
 return head+'<section class="panel" style="max-width:720px"><div class="steps" aria-hidden="true">'+QUESTIONS.map(function(_,k){return '<span class="'+(k<=g.step?"on":"")+'"></span>';}).join("")+'</div>'+
  '<p class="muted">Question '+(g.step+1)+' of '+n+'</p><h2 id="guide-q">'+esc(q.q)+'</h2>'+
  '<div class="opts" role="group" aria-labelledby="guide-q">'+q.a.map(function(a,k){return '<button type="button" class="opt" data-ans="'+k+'" aria-pressed="'+(cur===k)+'">'+esc(a[0])+'</button>';}).join("")+'</div>'+
  '<div class="row"><button type="button" class="btn ghost" id="guide-back"'+(g.step===0?" disabled":"")+'>Back</button><button type="button" class="btn" id="guide-next"'+(cur==null?" disabled":"")+'>'+(g.step===n-1?"See my result":"Next")+'</button></div></section>';
};

V.consultation=function(){
 if(S.consDone){
  return '<section class="stack"><span class="eyebrow">Free Consultation</span><h1>Your request is ready to send</h1><p class="lead">Copy the summary and send it to Eduplan by WhatsApp or email. A counsellor replies to arrange a time.</p></section>'+
  '<section class="panel" style="max-width:720px"><pre class="summary" id="cons-summary">'+esc(S.consDone)+'</pre>'+
  '<div class="row"><button type="button" class="btn" id="cons-copy">Copy summary</button><button type="button" class="btn ghost" id="cons-edit">Edit my answers</button></div>'+
  '<p class="muted" id="cons-copied" aria-live="polite"></p>'+
  '<p class="muted">Send to: WhatsApp [YOUR PHONE NUMBER] or email [YOUR EMAIL].</p></section>';
 }
 var c=S.cons,e=S.consErr||{};
 function f(id,label,type,hint,req){return '<div class="field"><label for="'+id+'">'+label+(req?"":' <span class="hint">(optional)</span>')+'</label><input type="'+type+'" id="'+id+'" value="'+esc(c[id]||"")+'"'+(e[id]?' aria-invalid="true" aria-describedby="'+id+'-err"':"")+'>'+(hint?'<span class="hint">'+hint+'</span>':"")+(e[id]?'<span class="err" id="'+id+'-err">'+esc(e[id])+'</span>':"")+'</div>';}
 var topics=["Scholarships","Choosing a course","Choosing a university","Accommodation","I am not sure what to study"];
 var quals=["SPM","UEC","STPM","A-Level","Foundation or Matriculation","Diploma","Other"];
 return '<section class="stack"><span class="eyebrow">Free Consultation</span><h1>Book a free consultation</h1><p class="lead">Tell us a little about yourself. It takes about a minute.</p></section>'+
 '<section class="panel" style="max-width:720px"><form class="fields" id="cons-form" novalidate>'+
  f("cons-name","Full name","text","",true)+
  f("cons-phone","Phone or WhatsApp number","tel","Example: 012-345 6789",true)+
  f("cons-email","Email","email","",false)+
  '<div class="field"><label for="cons-qual">Latest qualification</label><select id="cons-qual">'+quals.map(function(q){return '<option'+(c["cons-qual"]===q?" selected":"")+'>'+q+'</option>';}).join("")+'</select></div>'+
  '<div class="field"><label for="cons-topic">What do you want to talk about?</label><select id="cons-topic">'+topics.map(function(t){return '<option'+(c["cons-topic"]===t?" selected":"")+'>'+t+'</option>';}).join("")+'</select></div>'+
  '<div class="field"><label for="cons-msg">Anything else we should know? <span class="hint">(optional)</span></label><textarea id="cons-msg">'+esc(c["cons-msg"]||"")+'</textarea></div>'+
  '<div class="row"><button type="submit" class="btn">Prepare my request</button></div>'+
 '</form></section>';
};

/* ---------- Router ---------- */
var app=document.getElementById("app");
function route(){
 var h=(location.hash||"#home").slice(1),r=h;
 if(r==="scholarship-match")r="scholarships";
 if(r.indexOf("scholarships-")===0&&S.schType!==r.slice(13))r="scholarships";
 if(!V[r])r="home";
 if(r!==h&&h)history.replaceState(null,"","#"+r);
 return r;
}
function render(keepScroll){
 var r=route();
 app.innerHTML=V[r]();
 var navKey={"interest-match":"courses","guided":"","home":""}[r];
 if(navKey===undefined)navKey=r.indexOf("scholarships-")===0?"scholarships":r;
 Array.prototype.forEach.call(document.querySelectorAll("nav.main a"),function(a){if(a.getAttribute("data-nav")===navKey)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
 if(!keepScroll){window.scrollTo(0,0);}
}
function rerender(focusId){render(true);if(focusId){var el=document.getElementById(focusId);if(el)el.focus();}}
window.addEventListener("hashchange",function(){render(false);app.focus({preventScroll:true});});

/* ---------- Events (delegated) ---------- */
function readCons(){["cons-name","cons-phone","cons-email","cons-qual","cons-topic","cons-msg"].forEach(function(id){var el=document.getElementById(id);if(el)S.cons[id]=el.value;});store("eduplan-consult",S.cons);}
app.addEventListener("change",function(ev){
 var t=ev.target,id=t.id;
 if(id==="course-field"){S.courseField=t.value;rerender(id);}
 else if(id==="int-level"){S.int.level=t.value;rerender(id);}
 else if(id&&id.indexOf("cons-")===0){readCons();}
});
app.addEventListener("click",function(ev){
 var t=ev.target.closest("button,a");if(!t)return;
 if(t.hasAttribute("data-int")){var k=t.getAttribute("data-int"),p=S.int.picked,ix=p.indexOf(k);if(ix>-1)p.splice(ix,1);else if(p.length<3)p.push(k);render(true);var b=app.querySelector('[data-int="'+k+'"]');if(b)b.focus();return;}
 if(t.hasAttribute("data-schtype")){S.schType=t.getAttribute("data-schtype");location.hash="#scholarships-"+S.schType;return;}
 if(t.hasAttribute("data-schpick")){S.schPick[S.schType]=t.getAttribute("data-schpick");render(true);var sp=app.querySelector('[data-schpick="'+S.schPick[S.schType]+'"]');if(sp)sp.focus();return;}
 if(t.hasAttribute("data-ans")){S.guide.answers[S.guide.step]=Number(t.getAttribute("data-ans"));rerender("guide-next");return;}
 if(t.id==="guide-next"){S.guide.step++;rerender();app.focus({preventScroll:true});return;}
 if(t.id==="guide-back"){S.guide.step=Math.max(0,S.guide.step-1);rerender();return;}
 if(t.id==="guide-restart"){S.guide={step:0,answers:[]};rerender();window.scrollTo(0,0);return;}
 if(t.hasAttribute("data-topic")){S.cons["cons-topic"]=t.getAttribute("data-topic");var n=t.getAttribute("data-note");if(n&&!S.cons["cons-msg"])S.cons["cons-msg"]=n;S.consDone=null;store("eduplan-consult",S.cons);return;}
 if(t.id==="cons-edit"){S.consDone=null;rerender("cons-name");return;}
 if(t.id==="cons-copy"){var txt=S.consDone,out=document.getElementById("cons-copied");
  var fallback=function(){var pre=document.getElementById("cons-summary"),rg=document.createRange();rg.selectNodeContents(pre);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(rg);out.textContent="The summary is selected. Press Ctrl+C (or long-press on a phone) to copy it.";};
  try{navigator.clipboard.writeText(txt).then(function(){out.textContent="Copied. Paste it into WhatsApp or an email to Eduplan.";},fallback);}catch(e){fallback();}
  return;}
});
app.addEventListener("submit",function(ev){
 if(ev.target.id!=="cons-form")return;ev.preventDefault();readCons();
 var c=S.cons,e={};
 if(!(c["cons-name"]||"").trim())e["cons-name"]="Enter your full name.";
 var digits=(c["cons-phone"]||"").replace(/\D/g,"");
 if(digits.length<9||digits.length>13)e["cons-phone"]="Enter a phone number with 9 to 13 digits, for example 012-345 6789.";
 var em=(c["cons-email"]||"").trim();
 if(em&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em))e["cons-email"]="Enter an email like name@example.com, or leave it empty.";
 S.consErr=e;
 var first=Object.keys(e)[0];
 if(first){rerender(first);return;}
 S.consDone=["Eduplan free consultation request","","Name: "+c["cons-name"].trim(),"Phone: "+c["cons-phone"].trim(),"Email: "+(em||"-"),"Latest qualification: "+(c["cons-qual"]||"SPM"),"Topic: "+(c["cons-topic"]||"Scholarships"),"Notes: "+((c["cons-msg"]||"").trim()||"-")].join("\n");
 rerender("cons-copy");window.scrollTo(0,0);
});

render(false);
})();
