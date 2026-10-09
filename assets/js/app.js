(function(){
"use strict";
/* ---------- Data (sample; replace with real partner data) ---------- */
var FIELDS={med:"Medicine & Health",eng:"Engineering",cs:"Computer Science & IT",biz:"Business & Finance",design:"Design & Creative Arts",law:"Law",edu:"Education",sci:"Science",hosp:"Hospitality & Tourism",comm:"Communication & Media"};
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
var FAC=window.EDUPLAN_FACULTIES||{fields:[]};
function facField(code){for(var i=0;i<FAC.fields.length;i++){if(FAC.fields[i].code===code)return FAC.fields[i];}return null;}
function facCourse(f,id){for(var i=0;i<f.courses.length;i++){if(f.courses[i].id===id)return f.courses[i];}return null;}
function schType(id){for(var i=0;i<SCH.types.length;i++){if(SCH.types[i].id===id)return SCH.types[i];}return null;}
function uni(id){for(var i=0;i<UNIS.length;i++){if(UNIS[i].id===id)return UNIS[i];}return null;}
function unisFor(field){return UNIS.filter(function(u){return u.fields.indexOf(field)>-1;});}
function opts(map,sel,first){var h=first?'<option value="">'+esc(first)+'</option>':"";Object.keys(map).forEach(function(k){h+='<option value="'+esc(k)+'"'+(k===sel?" selected":"")+'>'+esc(map[k])+'</option>';});return h;}
function rm(n){return 'RM '+Number(n).toLocaleString('en-MY');}
function years(y){return y+(y===1?" year":" years");}
var ARROW='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"></path></svg>';
function store(k,v){try{if(v===undefined){var r=localStorage.getItem(k);return r?JSON.parse(r):null;}localStorage.setItem(k,JSON.stringify(v));}catch(e){}return null;}

/* ---------- Pure logic ---------- */
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
window.__eduplan={guidedResult:guidedResult};

/* ---------- State ---------- */
var S={guide:{step:0,answers:[]},
       cons:store("eduplan-consult")||{},consDone:null,
       schType:null};

/* ---------- Views ---------- */
var V={};
V.home=function(){return ''+
 '<section class="stack"><h1>Specific Tools for Study Further</h1><p class="lead">Three ways to find your course and university. Free of charge.</p></section>'+
 '<section class="section"><div class="tools">'+
  '<a class="tool t1" href="#scholarships"><span class="k">Option 1 · Scholarship based</span><span class="t">Don\'t Let Fees Decide Your Future: Match With a Scholarship</span><span class="go">Find my scholarships '+ARROW+'</span></a>'+
  '<a class="tool t2" href="#faculty"><span class="k">Option 2 · Interest based</span><span class="t">From Interest to Career: Courses Matched to You in any field</span><span class="go">Match my interests '+ARROW+'</span></a>'+
  '<a class="tool t3" href="#guided"><span class="k">Option 3 · Guidance based</span><span class="t">From "I Don\'t Know" to "I\'m Enrolled", One Step at a Time</span><span class="go">Start the 5 questions '+ARROW+'</span></a>'+
 '</div><div><a class="textlink" href="#faculty">Others: browse all faculties '+ARROW+'</a></div></section>'+
 '<section class="section"><h2>How Eduplan works</h2><div class="threeup">'+
  '<div class="stack"><span class="n">Step 1</span><h3>Tell us where you are</h3><p class="muted">Pick the tool that fits you: you need funding, you know what you like, or you are not sure yet.</p></div>'+
  '<div class="stack"><span class="n">Step 2</span><h3>See your matches</h3><p class="muted">Get a short list of courses, universities and scholarships that fit your answers.</p></div>'+
  '<div class="stack"><span class="n">Step 3</span><h3>Talk to a counsellor</h3><p class="muted">Book a free consultation. We guide you from application to registration.</p></div>'+
 '</div></section>';
};
/* About Us: founder profile, from his Facebook profile. photo is an image path (empty shows a placeholder); honours are shown as pills. */
var FOUNDER={name:"Jason Ng Jiann Sheng, PJM",role:"Founder & CEO",photo:"assets/img/founder.jpg",
 bio:"Founder and CEO of Eduplan, where he has led student guidance as Chief Education Advisor since May 2020. He has worked in higher education recruitment and student guidance since 2015, at BERJAYA University College, Xiamen University Malaysia and FSI Center 升学情报.",
 honours:[],
 career:[
  {title:"Chief Education Advisor",org:"Eduplan",when:"May 2020 – Present"},
  {title:"Manager",org:"FSI Center 升学情报",when:"Oct 2017 – Apr 2020",place:"Kajang, Malaysia"},
  {title:"Student Recruitment",org:"Xiamen University Malaysia",when:"Jul 2016 – Sep 2017",place:"Sepang"},
  {title:"Sales/Marketing",org:"BERJAYA University College",when:"Dec 2015 – Jul 2016",place:"Kuala Lumpur"}],
 education:[{title:"Business Administration",org:"Universiti Tunku Abdul Rahman (UTAR)",when:"Class of 2008"}],
 facebook:"https://www.facebook.com/jiannsheng/"};
function timeline(label,rows){
 return rows&&rows.length?'<div class="stack tl"><h3>'+esc(label)+'</h3><ol class="timeline">'+rows.map(function(r,k){
  return '<li data-reveal style="--i:'+k+'"><span class="tl-title">'+esc(r.title)+'</span><span class="tl-org">'+esc(r.org)+'</span><span class="hint">'+esc([r.when,r.place].filter(Boolean).join(" · "))+'</span></li>';}).join("")+'</ol></div>':'';
}
function founderCard(f){
 return '<div class="founder"><div class="avatar">'+(f.photo?'<img src="'+esc(f.photo)+'" alt="'+esc(f.name)+', '+esc(f.role)+' of Eduplan">'
   :'<svg viewBox="0 0 24 24" width="56" height="56" aria-hidden="true"><circle cx="12" cy="8" r="4" fill="currentColor"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" fill="currentColor"/></svg>')+'</div>'+
  '<div class="stack"><span class="eyebrow">'+esc(f.role)+'</span><h3 class="fname">'+esc(f.name)+'</h3>'+
  (f.honours&&f.honours.length?'<div class="meta">'+f.honours.map(function(h){return '<span class="pill brand">'+esc(h)+'</span>';}).join("")+'</div>':'')+
  '<p class="muted">'+esc(f.bio)+'</p>'+
  '<div class="row">'+(f.facebook?'<a class="btn ghost" href="'+esc(f.facebook)+'" target="_blank" rel="noopener">Facebook '+ARROW+'</a>':'')+
  '<a class="btn" href="#consultation">Book a free consultation</a></div></div>'+
  '<div class="founder-cv">'+timeline("Career",f.career)+timeline("Education",f.education)+'</div></div>';
}
/* About Us: mission and the journey it promises. Each step links to the tool that covers it. */
var MISSION="To help students go from discovering the field of study they aspire to, all the way to enrolling in a college or university, in the simplest and fastest way possible.";
var VISION="To be Malaysia\u2019s most trusted local education advisor, helping students save on the cost of further studies and avoid detours along the way.";
var VISION_POINTS=[["Most trusted in Malaysia","A local advisor students and parents can rely on"],["Save on study costs","Scholarships, fees and options compared before you commit"],["Avoid detours","The right course and institution from the start"]];
var JOURNEY=[["Discover","Find the field of study you aspire to","#faculty"],["Compare","See the courses and universities that offer it","#universities"],
 ["Fund","Check the scholarships you qualify for","#scholarships"],["Enrol","We guide you all the way to registration","#consultation"]];
V.about=function(){return ''+
 '<section class="stack" data-reveal><span class="eyebrow">About Us</span><h1>We lead students to the right place to study</h1><p class="lead">Eduplan is an education tool that guides students to a suitable institution, from learning about it to the registration phase. The service is free of charge for students.</p></section>'+
 '<section class="vision" data-reveal><span class="eyebrow">Our vision</span><p class="mission-text">'+esc(VISION)+'</p>'+
  '<ul class="vpoints">'+VISION_POINTS.map(function(v,k){return '<li style="--i:'+k+'"><span class="vt">'+esc(v[0])+'</span><span class="vd">'+esc(v[1])+'</span></li>';}).join("")+'</ul></section>'+
 '<section class="mission" data-reveal><span class="eyebrow">Our mission</span><p class="mission-text">'+esc(MISSION)+'</p>'+
  '<ol class="journey">'+JOURNEY.map(function(j,k){return '<li style="--i:'+k+'"><a href="'+j[2]+'"><span class="jn" aria-hidden="true"></span><span class="jt">'+esc(j[0])+'</span><span class="jd">'+esc(j[1])+'</span></a></li>';}).join("")+'</ol></section>'+
 '<section class="section" data-reveal><h2>Meet our founder</h2>'+founderCard(FOUNDER)+'</section>'+
 '<section class="section"><h2 data-reveal>Three ways we guide you</h2><div class="grid lift">'+
  '<div class="item" data-reveal style="--i:0"><h3>Scholarship based</h3><p>For students who need funding. We match your results and family income with scholarships you can apply for.</p><a class="textlink" href="#scholarships">Open the tool '+ARROW+'</a></div>'+
  '<div class="item" data-reveal style="--i:1"><h3>Interest based</h3><p>For students who know what they enjoy. We turn your interests into courses and universities.</p><a class="textlink" href="#faculty">Open the tool '+ARROW+'</a></div>'+
  '<div class="item" data-reveal style="--i:2"><h3>Guidance based</h3><p>For students who are still unsure. Five short questions, then a counsellor walks you through each step.</p><a class="textlink" href="#guided">Open the tool '+ARROW+'</a></div>'+
 '</div></section>'+
 '<section class="panel" data-reveal><h2>Ready to talk?</h2><p class="muted">A counsellor will go through your options with you and your family.</p><div><a class="btn" href="#consultation">Book a free consultation</a></div></section>';
};
/* Universities: Page 1 lists every published institution from the school sheets, Page 2 shows one
   institution and its study levels, Page 3 lists that level's programmes by sub-level and faculty.
   Routes: #universities, #universities/xmum, #universities/xmum/undergraduate. */
var UNIV=[];   /* institutions from the sheet data (applyApi); each has .progs */
var LEVELS=[["foundation","Foundation",["Foundation"]],["undergraduate","Undergraduate",["Certificate","Diploma","Bachelor's Degree"]],
 ["postgraduate","Postgraduate",["Master's Degree","PhD","Professional Certificate"]]];
var UNI_STEPS=["Universities","University","Programmes"];
/* Lists "level" value -> [study level, sub-level]. */
function uniLevel(l){
 l=l||"";
 if(/pre-?university|foundation/i.test(l))return ["foundation","Foundation"];
 if(/^certificate/i.test(l))return ["undergraduate","Certificate"];
 if(/diploma/i.test(l))return ["undergraduate","Diploma"];
 if(/bachelor|degree/i.test(l)&&!/master/i.test(l))return ["undergraduate","Bachelor's Degree"];
 if(/master/i.test(l))return ["postgraduate","Master's Degree"];
 if(/phd|doctor/i.test(l))return ["postgraduate","PhD"];
 if(/professional/i.test(l))return ["postgraduate","Professional Certificate"];
 return ["undergraduate",l||"Other"];
}
function univ(id){id=String(id||"").toLowerCase();for(var i=0;i<UNIV.length;i++){if(UNIV[i].id.toLowerCase()===id)return UNIV[i];}return null;}
function facOfCourse(cid){for(var i=0;i<FAC.fields.length;i++){for(var j=0;j<FAC.fields[i].courses.length;j++){if(FAC.fields[i].courses[j].id===cid)return FAC.fields[i];}}return null;}
function uniScholarships(u){var t=schType("campus"),c=t&&schUni(t,u.id);return c?schGroupBy(c.tiers).length:0;}
V.universities=function(){
 var x=S.uni&&univ(S.uni.id);
 if(x)return S.uni.level?uniLevelPage(x,S.uni.level):uniPage(x);
 return '<section class="stack">'+stepper(UNI_STEPS,1)+'<div><a class="btn ghost" href="#home">Back</a></div>'+
 '<span class="eyebrow">Universities</span><h1>Partner universities and colleges</h1><p class="lead">Choose a university to see its programmes by level: foundation, undergraduate and postgraduate.</p></section>'+
 (UNIV.length?'<section class="grid">'+UNIV.map(function(u){var n=uniScholarships(u);
  return '<a class="item pick" href="#universities/'+esc(u.id.toLowerCase())+'"><span class="name">'+esc(u.name)+'</span>'+(u.fullName!==u.name?'<span class="desc">'+esc(u.fullName)+'</span>':'')+
   '<span class="meta">'+[u.type,u.place].filter(Boolean).map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</span>'+
   '<span class="meta"><span class="pill brand">'+u.progs.length+' programme'+(u.progs.length===1?'':'s')+'</span>'+(n?'<span class="pill ok">'+n+' scholarship'+(n===1?'':'s')+'</span>':'')+'</span>'+
   '<span class="textlink">View university '+ARROW+'</span></a>';}).join("")+'</section>'
  :'<div class="empty">The university list is being prepared.</div>');
};
function uniHead(u,step,back){
 return '<section class="stack">'+stepper(UNI_STEPS,step)+'<div><a class="btn ghost" href="'+back+'">Back</a></div><span class="eyebrow">Universities</span>';
}
/* Type and location pills for an institution. */
function uniMeta(u){return '<div class="meta">'+[u.type,u.place].filter(Boolean).map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</div>';}
/* Campus banner: the institution's campus photo (CAMPUS_PHOTOS, files in assets/img/campus) or an animated
   background, plus a button for its 3D virtual tour (Institutions "virtual_tour_url"). Tour sites usually refuse
   to be embedded in other pages, so the tour opens in a new tab. */
var CAMPUS_PHOTOS={xmum:"assets/img/campus/xmum.jpg"};
function uniPhoto(u){return CAMPUS_PHOTOS[String(u.id).toLowerCase()]||"";}
function hasBanner(u){return !!(u.tour||uniPhoto(u));}
function uniTour(u,title,lead,meta){
 if(!hasBanner(u))return '';
 var photo=uniPhoto(u);
 return '<section class="tourhero">'+(photo?'<div class="tourphoto" aria-hidden="true" style="background-image:url(\''+esc(photo)+'\')"></div>'
   :'<div class="tourbg" aria-hidden="true"><span></span><span></span><span></span></div>')+'<div class="tourveil"></div>'+
  '<div class="tourtext">'+(u.tour?'<span class="eyebrow">3D campus tour</span>':'')+'<h1>'+esc(title)+'</h1>'+(lead?'<p class="lead">'+esc(lead)+'</p>':'')+(meta||'')+
  (u.tour?'<div class="row"><a class="btn" href="'+esc(u.tour)+'" target="_blank" rel="noopener">Explore the 3D campus tour '+ARROW+'</a></div>'+
  '<p class="hint">Opens '+esc(u.name)+'\u2019s official virtual tour in a new tab.</p>':'')+'</div></section>';
}
function uniPage(u){
 var n=uniScholarships(u);
 return uniHead(u,2,"#universities")+(hasBanner(u)?'':'<h1>'+esc(u.name)+'</h1>'+(u.fullName!==u.name?'<p class="lead">'+esc(u.fullName)+'</p>':''))+
 (hasBanner(u)?'':uniMeta(u))+'</section>'+
 uniTour(u,u.name,u.fullName!==u.name?u.fullName:"",uniMeta(u))+
 '<section class="panel">'+facts([["Website",u.website],["Admissions email",u.email],["Admissions phone",u.phone],["WhatsApp",u.whatsapp],["Last updated",u.lastUpdated]])+
  '<div class="row">'+(u.website?'<a class="btn ghost" href="'+esc(u.website)+'" target="_blank" rel="noopener">Official website '+ARROW+'</a>':'')+
  (n?'<a class="btn ghost" href="#scholarships-campus/'+esc(u.id.toLowerCase())+'">Scholarships ('+n+') '+ARROW+'</a>':'')+'</div></section>'+
 '<section class="section"><h2>Choose a study level</h2><div class="grid">'+LEVELS.map(function(L){
  var ps=u.progs.filter(function(p){return uniLevel(p.level)[0]===L[0];});
  var subs=L[2].map(function(sl){var k=ps.filter(function(p){return uniLevel(p.level)[1]===sl;}).length;return k?'<span class="pill">'+esc(sl)+' · '+k+'</span>':'';}).join("");
  return '<a class="item pick" href="#universities/'+esc(u.id.toLowerCase())+'/'+L[0]+'"><span class="name">'+L[1]+'</span>'+
   '<span class="desc">'+esc(L[2].join(" / "))+'</span>'+
   '<span class="meta"><span class="pill brand">'+ps.length+' programme'+(ps.length===1?'':'s')+'</span>'+subs+'</span>'+
   '<span class="textlink">View programmes '+ARROW+'</span></a>';}).join("")+'</div></section>';
}
function uniLevelPage(u,lv){
 var L=LEVELS.filter(function(x){return x[0]===lv;})[0],ps=u.progs.filter(function(p){return uniLevel(p.level)[0]===lv;});
 var subs=uniq(L[2].concat(ps.map(function(p){return uniLevel(p.level)[1];})));
 return uniHead(u,3,"#universities/"+esc(u.id.toLowerCase()))+(hasBanner(u)?'':'<h1>'+esc(u.name)+' · '+L[1]+'</h1><p class="lead">'+esc(L[2].join(" / "))+'</p>')+
 '<div class="chips" role="group" aria-label="Study level">'+LEVELS.map(function(x){return '<a class="chip" href="#universities/'+esc(u.id.toLowerCase())+'/'+x[0]+'"'+(x[0]===lv?' aria-current="page"':'')+'>'+x[1]+'</a>';}).join("")+'</div></section>'+
 uniTour(u,u.name+' · '+L[1],L[2].join(" / "))+
 (ps.length?subs.map(function(sl){
  var sp=ps.filter(function(p){return uniLevel(p.level)[1]===sl;});if(!sp.length)return '';
  var byFac={},order=[];sp.forEach(function(p){var f=facOfCourse(p.course_id),k=f?f.code:"--";if(!byFac[k]){byFac[k]={f:f,list:[]};order.push(k);}byFac[k].list.push(p);});
  order.sort();
  return '<section class="section">'+(sl!==L[1]?'<h2>'+esc(sl)+'</h2>':'')+order.map(function(k){var g=byFac[k];
   return '<div class="stack"><h3 class="fachead">'+(g.f?'Faculty '+esc(g.f.code)+' · '+esc(g.f.name):'Other')+'</h3><div class="progs">'+g.list.map(progCard).join("")+'</div></div>';}).join("")+'</section>';}).join("")
  :'<div class="empty">No '+L[1].toLowerCase()+' programmes listed for '+esc(u.name)+' yet.</div>')+
 '<p class="hint">Information is for reference only. Please confirm with the university’s official website.</p>';
}
/* Scholarship-based: Page 1 is the entry button, Page 2 picks the type, Page 3 shows that type.
   Page 3 is only reachable after a type is chosen on Page 2 (see route()). */
function stepper(names,step){
 return '<ol class="stepper" aria-label="Progress">'+names.map(function(n,k){var cur=k+1===step;return '<li'+(cur?' aria-current="step"':(k+1<step?' class="done"':''))+'><span aria-hidden="true">'+(k+1)+'</span>Page '+(k+1)+': '+esc(n)+'</li>';}).join("")+'</ol>';
}
function schStepper(step,t){
 var names=!t?["Scholarship-based","Scholarship type","Choose a scholarship","Details"]
  :t.kind==="waiver"?["Scholarship-based","Scholarship type","University","Scholarship details"]
  :["Scholarship-based","Scholarship type","Scholarship","Requirements"];
 return stepper(names,step);
}
function schUni(t,id){if(!t||!t.universities||!id)return null;id=String(id).toLowerCase();for(var i=0;i<t.universities.length;i++){if(String(t.universities[i].id).toLowerCase()===id)return t.universities[i];}return null;}
function schItem(t,id){if(!t||!t.items||!id)return null;id=String(id).toLowerCase();for(var i=0;i<t.items.length;i++){if(t.items[i].name&&String(t.items[i].id).toLowerCase()===id)return t.items[i];}return null;}
function schTierCell(r){return r.waiver!=null?r.waiver+'%':rm(r.amount);}
function schBest(u){var w=u.tiers.filter(function(r){return r.waiver!=null;}).map(function(r){return r.waiver;});return w.length?Math.max.apply(null,w):null;}
/* Tiers grouped by scholarship name, in sheet order; tiers without a name share one group. */
function schGroups(u){var g={},order=[];u.tiers.forEach(function(r){var k=r.scheme||"";if(!g[k]){g[k]=[];order.push(k);}g[k].push(r);});return order.map(function(k){return {name:k,tiers:g[k]};});}
function lines(v){return (Array.isArray(v)?v:String(v||"").split(/\r?\n/)).map(function(s){return String(s).trim();}).filter(Boolean);}
function uniq(a){return a.filter(function(x,i){return a.indexOf(x)===i;});}
function reqList(a){return '<ul class="reqlist">'+a.map(function(r){return '<li>'+esc(r)+'</li>';}).join("")+'</ul>';}
function schCta(note){return '<div class="row"><a class="btn" href="#consultation" data-topic="Scholarships"'+(note?' data-note="'+esc(note)+'"':'')+'>Ask a counsellor about scholarships</a></div>';}
function schHead(step,t,back){return '<section class="stack">'+schStepper(step,t)+'<div><a class="btn ghost" href="'+back+'">Back</a></div><span class="eyebrow">'+esc(t.label)+'</span>';}
var SCH_NOTE='<p class="hint">Information is for reference only. Please confirm with the university’s official website.</p>';
V.scholarships=function(){
 return '<section class="stack">'+schStepper(2)+'<div><a class="btn ghost" href="#home">Back</a></div>'+
 '<span class="eyebrow">Option 1 · Scholarship based</span><h1>Choose a scholarship type</h1><p class="lead">Scholarships come from two places. Pick one to continue.</p></section>'+
 '<section class="grid">'+SCH.types.map(function(t){return '<button type="button" class="item pick" data-schtype="'+esc(t.id)+'"><span class="name">'+esc(t.label)+'</span><span class="desc">'+esc(t.desc)+'</span><span class="textlink">Continue '+ARROW+'</span></button>';}).join("")+'</section>';
};
function schPage3(t){
 if(t.kind==="waiver")return S.schUni?schDetails(t,S.schUni):schUniList(t);
 return S.schItem?schReq(t,S.schItem):schItemList(t);
}
/* Foundation Page 3: one card per scholarship; Page 4 (#scholarships-foundation/<id>) shows its requirements. */
function schItemList(t){
 var items=t.items.filter(function(it){return it.name;});
 return schHead(3,t,"#scholarships")+'<h1>Choose a foundation scholarship</h1><p class="lead">'+esc(t.desc)+'. Tap a scholarship to see its requirements.</p></section>'+
 (items.length?'<section class="grid">'+items.map(function(it){
   return '<a class="item pick" href="#scholarships-'+esc(t.id)+'/'+esc(String(it.id).toLowerCase())+'"><span class="name">'+esc(it.name)+'</span>'+
   (it.organiser?'<span class="desc">'+esc(it.organiser)+'</span>':'')+(it.award?'<span class="meta"><span class="pill brand">'+esc(it.award)+'</span></span>':'')+
   '<span class="textlink">View requirements '+ARROW+'</span></a>';}).join("")+'</section>'
  :'<div class="empty">No foundation scholarships listed yet.</div>');
}
function schReq(t,it){
 return schHead(4,t,"#scholarships-"+esc(t.id))+'<h1>'+esc(it.name)+'</h1>'+(it.organiser?'<p class="lead">'+esc(it.organiser)+'</p>':'')+'</section>'+
 '<section class="panel"><h2>Requirements</h2>'+reqList(lines(it.requirements))+
  facts([["Award",it.award],["Application deadline",it.deadline],["Last updated",it.lastUpdated]])+
  '<div class="row">'+(it.url?'<a class="btn" href="'+esc(it.url)+'" target="_blank" rel="noopener">Official information '+ARROW+'</a>':'<span class="hint">Official website link to be added.</span>')+'</div>'+SCH_NOTE+'</section>'+
 '<section class="panel"><h2>Want help applying?</h2>'+schCta("Interested in: "+it.name+".")+'</section>';
}
function schUniList(t){
 return schHead(3,t,"#scholarships")+'<h1>Choose a university</h1><p class="lead">'+esc(t.desc)+'. Tap a university to see its scholarship details.</p></section>'+
 (t.universities.length?'<section class="grid">'+t.universities.map(function(u){
   var best=schBest(u),desc=u.description||[u.type,u.place].filter(Boolean).join(", "),n=schGroups(u).length;
   return '<a class="item pick" href="#scholarships-'+esc(t.id)+'/'+esc(String(u.id).toLowerCase())+'"><span class="name">'+esc(u.name)+'</span>'+
   (u.fullName&&u.fullName!==u.name?'<span class="desc">'+esc(u.fullName)+'</span>':'')+(desc?'<span class="desc">'+esc(desc)+'</span>':'')+
   '<span class="meta"><span class="pill">'+n+' scholarship'+(n===1?'':'s')+'</span>'+(best!=null?'<span class="pill brand">Up to '+best+'% tuition waiver</span>':'')+'</span>'+
   '<span class="textlink">View scholarship details '+ARROW+'</span></a>';}).join("")+'</section>'
  :'<div class="empty">No universities listed yet.</div>');
}
/* Campus Page 4. When tiers say which study level they apply to (applies starting "Foundation" or "Undergraduate"),
   the page shows qualification and level buttons and only the matching tiers. */
var SCH_QUALS=["SPM","O-Level","UEC","STPM","A-Level"],SCH_PREU=["Foundation","Matriculation","Diploma"],SCH_SECONDARY=["SPM","O-Level"],
 SCH_LEVELS=[["foundation","Foundation"],["undergraduate","Undergraduate"]];
function schLevel(r){var a=r.applies||"";return /^foundation/i.test(a)?"foundation":/^undergraduate/i.test(a)?"undergraduate":/^postgraduate/i.test(a)?"postgraduate":"";}
function schPanel(g,opt){
 var tr=g.tiers,spm=tr.every(function(r){return /^SPM /.test(r.result);}),waiver=tr.every(function(r){return r.waiver!=null;}),
  all=tr.map(function(r){return lines(r.conditions);}),
  cond=uniq([].concat.apply([],all)).filter(function(c){return all.every(function(l){return l.indexOf(c)>=0;});}),
  applies=uniq(tr.map(function(r){return r.applies;}).filter(Boolean)),dl=uniq(tr.map(function(r){return r.deadline;}).filter(Boolean));
 var byLevel=opt&&opt.head&&applies.length===1;
 return '<section class="panel">'+(byLevel?'<span class="eyebrow">'+esc(g.name)+'</span><h2>'+esc(applies[0])+'</h2>':'<h2>'+esc(g.name||"Scholarship tiers")+'</h2>')+
 '<table class="tiers"><thead><tr><th scope="col">'+esc(opt&&opt.head||(spm?'SPM result':'Eligibility'))+'</th><th scope="col">'+(waiver?'Tuition waiver':'Award')+'</th></tr></thead><tbody>'+
  tr.map(function(r,k){var own=all[k].filter(function(c){return cond.indexOf(c)<0;});
   return '<tr><td>'+esc(opt&&opt.head?r.min||r.result:r.result)+own.map(function(c){return '<br><span class="hint">'+esc(c)+'</span>';}).join("")+'</td><td><span class="big">'+esc(schTierCell(r))+'</span></td></tr>';}).join("")+'</tbody></table>'+
 facts([["Applies to",byLevel?"":applies.join("; ")],["Application deadline",dl.join("; ")]])+
 (cond.length?'<h3>Conditions</h3>'+reqList(cond):'')+'</section>';
}
function schGroupBy(tiers){var g={},order=[];tiers.forEach(function(r){var k=(r.scheme||"")+"|"+(r.applies||"");if(!g[k]){g[k]={name:r.scheme||"",tiers:[]};order.push(k);}g[k].tiers.push(r);});return order.map(function(k){return g[k];});}
function schFilter(u){
 var staged=u.tiers.filter(schLevel);
 var quals=uniq(SCH_QUALS.concat(staged.map(function(r){return r.qual;})).filter(function(q){return q&&SCH_PREU.indexOf(q)<0&&q!=="Other";}))
  .filter(function(q){return SCH_SECONDARY.indexOf(q)>=0||staged.some(function(r){return r.qual===q;});});
 var q=quals.indexOf(S.schQ)>=0?S.schQ:quals[0],L=S.schL||"foundation",lv=SCH_LEVELS.filter(function(l){return l[0]===L;})[0];
 var rows=staged.filter(function(r){return schLevel(r)===L&&r.qual===q;}),preu=false;
 if(!rows.length&&L==="undergraduate"&&SCH_SECONDARY.indexOf(q)>=0){rows=staged.filter(function(r){return schLevel(r)===L&&SCH_PREU.indexOf(r.qual)>=0;});preu=rows.length>0;}
 var head=preu?"Result":q+" result";
 return '<section class="panel"><h2>Find your scholarship</h2>'+
  '<h3>Your qualification</h3><div class="chips" role="group" aria-label="Qualification">'+quals.map(function(x){return '<button type="button" class="chip" data-schq="'+esc(x)+'" aria-pressed="'+(x===q)+'">'+esc(x)+'</button>';}).join("")+'</div>'+
  '<h3>Study level</h3><div class="chips" role="group" aria-label="Study level">'+SCH_LEVELS.map(function(l){return '<button type="button" class="chip" data-schl="'+l[0]+'" aria-pressed="'+(l[0]===L)+'">'+l[1]+'</button>';}).join("")+'</div></section>'+
 '<div aria-live="polite">'+
 (preu?'<div class="empty">'+esc(q)+' holders start a degree after Foundation, Matriculation or Diploma. At undergraduate level the scholarship is based on that result. <button type="button" class="chip" data-schl="foundation">See Foundation level for '+esc(q)+'</button></div>':'')+
 (rows.length?schGroupBy(rows).map(function(g){return schPanel(g,{head:head});}).join("")
  :'<div class="empty">'+esc(u.name)+'’s scholarship table lists no '+esc(lv?lv[1]:L)+' programme award for '+esc(q)+'. <button type="button" class="chip" data-schl="'+(L==="foundation"?"undergraduate":"foundation")+'">See '+(L==="foundation"?"Undergraduate":"Foundation")+' level</button></div>')+
 '</div>'+schGroupBy(u.tiers.filter(function(r){return !schLevel(r);})).map(function(g){return schPanel(g);}).join("");
}
function schDetails(t,u){
 var site=u.website||(u.tiers.filter(function(r){return r.url;})[0]||{}).url;
 return schHead(4,t,"#scholarships-"+esc(t.id))+'<h1>'+esc(u.name)+'</h1>'+(u.fullName&&u.fullName!==u.name?'<p class="lead">'+esc(u.fullName)+'</p>':'')+
 ((u.type||u.place)?'<div class="meta">'+[u.type,u.place].filter(Boolean).map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</div>':'')+'</section>'+
 (u.tiers.some(schLevel)?schFilter(u):schGroupBy(u.tiers).map(function(g){return schPanel(g);}).join(""))+
 '<section class="panel">'+facts([["Last updated",u.lastUpdated]])+
  '<div class="row">'+(site?'<a class="btn" href="'+esc(site)+'" target="_blank" rel="noopener">Official website '+ARROW+'</a>':'<span class="hint">Official website link to be added.</span>')+'</div>'+SCH_NOTE+'</section>'+
 '<section class="panel"><h2>Not sure which tier you reach?</h2>'+schCta("Campus Scholarship: "+u.name)+'</section>';
}
SCH.types.forEach(function(t){V["scholarships-"+t.id]=function(){return schPage3(t);};});

/* Interest-based: Page 1 is the entry button, Page 2 picks a faculty (00-10), Page 3 lists its courses,
   Page 4 lists the universities offering the chosen course. Routes: #faculty, #faculty/05, #faculty/05/biotechnology. */
var FAC_STEPS=["Interest-based","Faculty","Courses","Universities"];
V.faculty=function(){
 var f=S.fac&&S.fac.field,c=S.fac&&S.fac.course;
 if(c)return facUnis(f,c);
 if(f)return facCourses(f);
 return '<section class="stack">'+stepper(FAC_STEPS,2)+'<div><a class="btn ghost" href="#home">Back</a></div>'+
 '<span class="eyebrow">Option 2 · Interest based</span><h1>Choose a faculty</h1><p class="lead">Pick the field you are interested in to see its courses.</p></section>'+
 '<section class="grid">'+FAC.fields.map(function(f){return '<a class="item pick" href="#faculty/'+esc(f.code)+'"><span class="big">'+esc(f.code)+'</span><span class="name">'+esc(f.name)+'</span><span class="desc">'+esc(f.zh)+'</span><span class="hint">'+f.courses.length+' course'+(f.courses.length===1?'':'s')+'</span></a>';}).join("")+'</section>';
};
/* "1 university · 3 programmes" for a course card, empty when no programme is listed yet. */
function facCount(c){
 var l=c.universities||[];if(!l.length)return '';
 var n=uniq(l.map(function(u){return u.inst||u.name;})).length;
 return '<span class="meta"><span class="pill brand">'+n+' universit'+(n===1?'y':'ies')+'</span><span class="pill">'+l.length+' programme'+(l.length===1?'':'s')+'</span></span>';
}
function facCourses(f){
 return '<section class="stack">'+stepper(FAC_STEPS,3)+'<div><a class="btn ghost" href="#faculty">Back</a></div>'+
 '<span class="eyebrow">Faculty '+esc(f.code)+'</span><h1>'+esc(f.name)+'</h1><p class="lead">'+esc(f.zh)+'. Choose a course to see which universities offer it.</p></section>'+
 '<section class="grid">'+f.courses.map(function(c){return '<a class="item pick" href="#faculty/'+esc(f.code)+'/'+esc(c.id)+'"><span class="name">'+esc(c.name)+'</span><span class="desc">'+esc(c.desc)+'</span>'+facCount(c)+'<span class="textlink">See universities '+ARROW+'</span></a>';}).join("")+'</section>';
}
function facts(rows){
 rows=rows.filter(function(r){return r[1];});
 return rows.length?'<dl class="facts">'+rows.map(function(r){return '<dt>'+esc(r[0])+'</dt><dd>'+esc(r[1])+'</dd>';}).join("")+'</dl>':'';
}
/* Programme level (Lists "level" values) -> scholarship study level used by Campus Scholarships "applies_to". */
function progLevel(l){l=l||"";return /pre-?university|foundation/i.test(l)?"foundation":/bachelor|degree|undergraduate/i.test(l)?"undergraduate":/master|phd|doctor|postgraduate/i.test(l)?"postgraduate":"";}
/* Campus scholarships of the programme's institution that apply at its level (or to every level). */
function progScholarships(u){
 var t=schType("campus"),uni=t&&schUni(t,u.inst),lv=progLevel(u.level);
 if(!uni)return [];
 return schGroupBy(uni.tiers.filter(function(r){var l=schLevel(r);return !l||!lv||l===lv;})).map(function(g){
  var w=g.tiers.filter(function(r){return r.waiver!=null;}).map(function(r){return r.waiver;});
  return {name:g.name||"Scholarship",applies:g.tiers[0].applies,best:w.length?Math.max.apply(null,w):null,href:"#scholarships-campus/"+String(uni.id).toLowerCase()};
 });
}
var ENTRY=[["entry","SPM"],["uec","UEC"],["olevel","O-Level"],["stpm","STPM"],["entry_other","Others"]];
function progCard(u){
 var sch=progScholarships(u),meta=[u.level,u.years!=null?years(u.years):"",u.mode].filter(Boolean);
 return '<article class="prog"><div class="stack"><span class="eyebrow">'+esc(u.name)+'</span><h3 class="fname">'+esc(u.programme||u.name)+'</h3>'+
  (meta.length?'<div class="meta">'+meta.map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</div>':'')+'</div>'+
  '<dl class="facts">'+
   '<dt>Tuition fee (whole programme)</dt><dd>'+(u.fee!=null?esc(rm(u.fee)):'<span class="hint">To be confirmed</span>')+'</dd>'+
   '<dt>Location</dt><dd>'+(u.campus||u.place?esc(u.campus||u.place):'<span class="hint">To be confirmed</span>')+'</dd>'+
   (u.intakes?'<dt>Intakes</dt><dd>'+esc(u.intakes)+'</dd>':'')+(u.deadline?'<dt>Application deadline</dt><dd>'+esc(u.deadline)+'</dd>':'')+
   (u.english?'<dt>English</dt><dd>'+esc(u.english)+'</dd>':'')+(u.mqa?'<dt>MQA</dt><dd>'+esc(u.mqa)+'</dd>':'')+'</dl>'+
  '<div class="stack"><h4>Entry requirements</h4><dl class="facts entry">'+ENTRY.map(function(e){var l=lines(u[e[0]]);
   return '<dt>'+esc(e[1])+'</dt><dd>'+(l.length?l.map(function(x){return '<span class="line">'+esc(x)+'</span>';}).join(""):'<span class="hint">Not listed by the institution</span>')+'</dd>';}).join("")+'</dl></div>'+
  '<div class="stack"><h4>Scholarships you can apply for</h4>'+
   (sch.length?'<ul class="schlinks">'+sch.map(function(g){return '<li><a href="'+esc(g.href)+'"><span class="name">'+esc(g.name)+'</span>'+(g.best!=null?'<span class="pill brand">Up to '+g.best+'% tuition waiver</span>':'')+'</a></li>';}).join("")+'</ul>'
    :'<p class="hint">No campus scholarship listed for this level yet.</p>')+
   '<a class="textlink" href="#scholarships-foundation">Other scholarships open to all students '+ARROW+'</a></div>'+
  (lines(u.notes).length?'<div class="stack"><h4>Notes</h4>'+lines(u.notes).map(function(x){return '<p class="muted">'+esc(x)+'</p>';}).join("")+'</div>':'')+
  '<div class="row">'+(u.url?'<a class="btn ghost" href="'+esc(u.url)+'" target="_blank" rel="noopener">Programme page '+ARROW+'</a>':'')+
   '<a class="btn" href="#consultation" data-topic="Choosing a university" data-note="Interested in: '+esc(u.programme||u.name)+' ('+esc(u.name)+').">Ask a counsellor about this course</a></div></article>';
}
function facUnis(f,c){
 var list=c.universities||[];
 return '<section class="stack">'+stepper(FAC_STEPS,4)+'<div><a class="btn ghost" href="#faculty/'+esc(f.code)+'">Back</a></div>'+
 '<span class="eyebrow">Faculty '+esc(f.code)+' · '+esc(f.name)+'</span><h1>'+esc(c.name)+'</h1><p class="lead">'+esc(c.desc)+'</p></section>'+
 '<section class="section"><h2>Universities offering this course</h2>'+
 (list.length?'<div class="progs">'+list.map(progCard).join("")+'</div>'
  :'<div class="empty">The university list for this course is being prepared. A counsellor can tell you which universities offer it.</div>')+
 '<p class="hint">Information is for reference only. Please confirm with the university’s official website.</p>'+
 '<div class="row"><a class="btn" href="#consultation" data-topic="Choosing a university" data-note="Interested in: '+esc(c.name)+'.">Ask a counsellor about this course</a></div></section>';
}

V.accommodation=function(){return ''+
 '<section class="stack"><span class="eyebrow">Accommodation</span><h1>Where you will stay</h1><p class="lead">Hostel options at each institution. Monthly rent is a placeholder figure.</p></section>'+
 '<section class="grid">'+UNIS.map(function(u){return '<div class="item"><span class="big">'+(u.rent?"RM "+u.rent:"Rental help")+'</span><span class="hint">'+(u.rent?"per month, shared room":"no hostel on campus")+'</span><h3>'+esc(u.name)+'</h3><p>'+esc(u.city)+'. '+esc(u.hostel)+'.</p></div>';}).join("")+'</section>'+
 '<section class="panel"><h2>Need help choosing a hostel?</h2><div><a class="btn" href="#consultation">Ask a counsellor</a></div></section>';
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
 var h=(location.hash||"#home").slice(1),r=h,view;
 if(r==="scholarship-match")r="scholarships";
 if(r==="courses"||r==="interest-match")r="faculty";
 S.schUni=S.schItem=null;
 if(r.indexOf("scholarships-")===0){
  var sp=r.slice(13).split("/"),st=schType(sp[0]);
  if(!st)r="scholarships";
  else if((S.schType=st.id)&&sp[1]){var sel=st.kind==="waiver"?(S.schUni=schUni(st,sp[1])):(S.schItem=schItem(st,sp[1]));r="scholarships-"+st.id+(sel?"/"+String(sel.id).toLowerCase():"");}
  else r="scholarships-"+st.id;
 }
 S.uni=null;
 if(r.indexOf("universities/")===0){
  var up=r.split("/"),ux=univ(up[1]),ul=ux&&up[2]&&LEVELS.some(function(x){return x[0]===up[2];})?up[2]:null;
  if(ux){r="universities/"+ux.id.toLowerCase()+(ul?"/"+ul:"");S.uni={id:ux.id,level:ul};}
  else if(UNIV.length)r="universities";   /* before the sheet data arrives, keep the link as it is */
 }
 S.fac=null;
 if(r.indexOf("faculty/")===0){
  var p=r.split("/"),f=facField(p[1]),c=f&&p[2]?facCourse(f,p[2]):null;
  r=f?"faculty/"+f.code+(c?"/"+c.id:""):"faculty";
  if(f)S.fac={field:f,course:c};
 }
 view=r.indexOf("faculty/")===0?"faculty":r.indexOf("universities/")===0?"universities":r.indexOf("scholarships-")===0?r.split("/")[0]:r;
 if(!V[view])r=view="home";
 if(r!==h&&h)history.replaceState(null,"","#"+r);
 return view;
}
/* Scroll reveal for [data-reveal] blocks. Without IntersectionObserver, or with reduced motion, everything is shown at once. */
var motion=!!window.IntersectionObserver&&!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches),revealObs=null;
if(motion)document.documentElement.classList.add("motion");
function reveal(){
 if(!motion)return;
 if(revealObs)revealObs.disconnect();
 revealObs=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");revealObs.unobserve(e.target);}});},{rootMargin:"0px 0px -8% 0px"});
 Array.prototype.forEach.call(app.querySelectorAll("[data-reveal]"),function(el){revealObs.observe(el);});
}
function render(keepScroll){
 var r=route();
 app.innerHTML=V[r]();
 reveal();
 var navKey={"guided":"","home":""}[r];
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
 if(id&&id.indexOf("cons-")===0){readCons();}
});
app.addEventListener("click",function(ev){
 var t=ev.target.closest("button,a");if(!t)return;
 if(t.hasAttribute("data-schtype")){S.schType=t.getAttribute("data-schtype");location.hash="#scholarships-"+S.schType;return;}
 if(t.hasAttribute("data-schq")||t.hasAttribute("data-schl")){var k=t.hasAttribute("data-schq")?"schQ":"schL";S[k]=t.getAttribute(k==="schQ"?"data-schq":"data-schl");render(true);
  var f=app.querySelector('[data-'+k.toLowerCase()+'="'+S[k]+'"]');if(f)f.focus();return;}
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

/* ---------- School data API (Google Sheet) ---------- */
function applyApi(d){
 if(!d||d.version!==1)return false;
 var inst={},courses={};
 (d.institutions||[]).forEach(function(i){inst[i.institution_id]=i;});
 FAC.fields.forEach(function(f){f.courses.forEach(function(c){c.universities=[];courses[c.id]=c;});});
 UNIV=(d.institutions||[]).map(function(i){return {id:i.institution_id,name:i.short_name||i.name,fullName:i.name,type:i.type,place:[i.city,i.state].filter(Boolean).join(", "),
  website:i.website,tour:/^https:\/\//i.test(i.virtual_tour_url||"")?i.virtual_tour_url:"",email:i.admissions_email,phone:i.admissions_phone,whatsapp:i.whatsapp,lastUpdated:i.last_updated,progs:[]};})
  .sort(function(a,b){return a.name<b.name?-1:1;});
 (d.programmes||[]).forEach(function(p){
  var i=inst[p.institution_id];if(!i)return;
  var prog={inst:p.institution_id,name:i.short_name||i.name,place:[i.city,i.state].filter(Boolean).join(", "),campus:p.campus,programme:p.programme_name,level:p.level,mode:p.study_mode,
   years:p.duration_years,intakes:p.intakes,fee:p.tuition_fee_rm,entry:p.entry_spm,uec:p.entry_uec,olevel:p.entry_olevel,stpm:p.entry_stpm,entry_other:p.entry_other,english:p.english_requirement,
   deadline:p.application_deadline,mqa:p.mqa_reference,url:p.apply_url,notes:p.notes,course_id:p.course_id};
  var u=univ(p.institution_id);if(u)u.progs.push(prog);
  uniq([p.course_id].concat(p.also_course_ids||[])).forEach(function(id){if(courses[id])courses[id].universities.push(prog);});
 });
 var campus=schType("campus"),fnd=schType("foundation");
 if(campus){
  var byInst={},order=[];
  (d.campus_scholarships||[]).forEach(function(s){
   var i=inst[s.institution_id];if(!i)return;
   if(!byInst[s.institution_id]){
    var local=schUni(campus,s.institution_id)||{};
    byInst[s.institution_id]={id:s.institution_id,name:i.short_name||i.name,fullName:i.name,type:i.type,place:[i.city,i.state].filter(Boolean).join(", "),
     website:i.website,lastUpdated:i.last_updated,description:local.description,tiers:[]};
    order.push(s.institution_id);
   }
   var bu=byInst[s.institution_id];
   if(s.last_updated&&(!bu.lastUpdated||s.last_updated>bu.lastUpdated))bu.lastUpdated=s.last_updated;
   bu.tiers.push({scheme:s.scholarship_name,applies:s.applies_to,qual:s.qualification,min:s.minimum_result,result:s.qualification==="Other"?s.minimum_result:s.qualification+" "+s.minimum_result,waiver:s.waiver_percent,amount:s.fixed_amount_rm,conditions:s.other_conditions,deadline:s.deadline,url:s.info_url});
  });
  campus.universities=order.map(function(k){return byInst[k];});
 }
 if(fnd)fnd.items=(d.foundation_scholarships||[]).map(function(f){return {id:f.option_id,name:f.scholarship_name,requirements:f.requirements,organiser:f.organiser,award:f.award_value,deadline:f.deadline,url:f.info_url,lastUpdated:f.last_updated};});
 return true;
}

/* A snapshot of the sheet data embedded in the page (used by the Claude artifact, which cannot call the API). */
if(window.EDUPLAN_SHEET_DATA)applyApi(window.EDUPLAN_SHEET_DATA);
render(false);
if(window.EDUPLAN_API_URL&&window.fetch){
 fetch(window.EDUPLAN_API_URL).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
  .then(function(d){if(applyApi(d))render(true);})
  .catch(function(){/* keep the local data */});
}
})();
