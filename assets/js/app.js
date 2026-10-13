(function(){
"use strict";
/* ---------- Data (sample; replace with real partner data) ---------- */
var UNIS=[
 {id:"a",name:"Sample University A",city:"Kuala Lumpur",fields:["med","sci","biz"],hostel:"On-campus hostel",rent:450},
 {id:"b",name:"Sample University B",city:"Penang",fields:["eng","cs","sci"],hostel:"On-campus hostel",rent:380},
 {id:"c",name:"Sample College C",city:"Johor Bahru",fields:["biz","hosp","comm"],hostel:"Partner hostel, 10 minutes by shuttle",rent:520},
 {id:"d",name:"Sample University D",city:"Selangor",fields:["design","comm","cs"],hostel:"On-campus hostel",rent:480},
 {id:"e",name:"Sample College E",city:"Kuching",fields:["edu","biz","hosp"],hostel:"On-campus hostel",rent:300},
 {id:"f",name:"Sample University F",city:"Kuala Lumpur",fields:["law","biz","edu"],hostel:"No hostel. Eduplan helps you find a rented room nearby",rent:null}
];
/* Interest quiz: questions, options and faculty points are in assets/js/quiz-data.js. */
var QUIZ=window.EDUPLAN_QUIZ||{questions:[],rules:{}};
/* Another page layout can host this app (lab/lab-host.js): it draws its own pages for the routes it owns,
   and both share the browser storage. Without a host (the main website) nothing below changes. */
var HOST=window.EDUPLAN_HOST||null;
/* The student's exam results ("My results") and the entry-requirement matching: assets/js/results.js. */
var RX=window.EDUPLAN_RESULTS;

/* ---------- Helpers ---------- */
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
var SCH=window.EDUPLAN_SCHOLARSHIPS||{types:[]};
var FAC=window.EDUPLAN_FACULTIES||{fields:[]};
function facField(code){for(var i=0;i<FAC.fields.length;i++){if(FAC.fields[i].code===code)return FAC.fields[i];}return null;}
function facCourse(f,id){for(var i=0;i<f.courses.length;i++){if(f.courses[i].id===id)return f.courses[i];}return null;}
function schType(id){for(var i=0;i<SCH.types.length;i++){if(SCH.types[i].id===id)return SCH.types[i];}return null;}
function opts(map,sel,first){var h=first?'<option value="">'+esc(first)+'</option>':"";Object.keys(map).forEach(function(k){h+='<option value="'+esc(k)+'"'+(k===sel?" selected":"")+'>'+esc(map[k])+'</option>';});return h;}
function rm(n){return 'RM '+Number(n).toLocaleString('en-MY');}
function years(y){return y+(y===1?" year":" years");}
var ARROW='<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 12h16M14 6l6 6-6 6"></path></svg>';
function store(k,v){try{if(v===undefined){var r=localStorage.getItem(k);return r?JSON.parse(r):null;}localStorage.setItem(k,JSON.stringify(v));}catch(e){}return null;}

/* ---------- Pure logic ---------- */
/* Adds up the faculty points of the chosen options (plus the tie-break bonus) and applies QUIZ.rules:
   picks = best faculty, plus the 2nd and 3rd when they reach keepRatio of the top score (00 is never ranked);
   close = top two within closeGap (ask the tie-break question);
   open = scores low or spread out, or "not sure" chosen in the check question (suggest 00);
   mismatch = the check question's faculty is not among the picks. */
function guidedScore(answers,tie){
 var R=QUIZ.rules,s={},check=null;
 answers.forEach(function(ai,qi){var q=QUIZ.questions[qi];if(ai==null||!q)return;var pts=q.a[ai][2];
  Object.keys(pts).forEach(function(k){s[k]=(s[k]||0)+pts[k];});if(q.check)check=Object.keys(pts)[0];});
 if(tie)s[tie]=(s[tie]||0)+R.tieBonus;
 var order=Object.keys(s).filter(function(k){return k!=="00";}).sort(function(a,b){return s[b]-s[a]||(a<b?-1:1);});
 var top=s[order[0]]||0;
 var picks=order.slice(0,1).concat(order.slice(1,3).filter(function(k){return s[k]>=top*R.keepRatio;}));
 return {scores:s,order:order,picks:picks,check:check,
  close:!tie&&order.length>1&&top-s[order[1]]<=R.closeGap,
  open:check==="00"||top<R.lowTop||top-(s[order[3]]||0)<=R.spreadGap,
  mismatch:!!check&&check!=="00"&&picks.indexOf(check)<0};
}
window.__eduplan={guidedScore:guidedScore};

/* ---------- State ---------- */
var S={guide:store("eduplan-quiz")||{step:0,answers:[]},
       cons:store("eduplan-consult")||{},consDone:null,
       schType:null};

/* ---------- Views ---------- */
var V={};
V.home=function(){return ''+
 '<section class="stack"><h1>Specific Tools for Study Further</h1><p class="lead">Three ways to find your course and university. Free of charge.</p></section>'+
 '<section class="section"><div class="tools">'+
  '<a class="tool t1" href="#scholarships"><span class="k">Option 1 · Scholarship based</span><span class="t">Don\'t Let Fees Decide Your Future: Match With a Scholarship</span><span class="go">Find my scholarships '+ARROW+'</span></a>'+
  '<a class="tool t2" href="#faculty"><span class="k">Option 2 · Interest based</span><span class="t">From Interest to Career: Courses Matched to You in any field</span><span class="go">Match my interests '+ARROW+'</span></a>'+
  '<a class="tool t3" href="#guided"><span class="k">Option 3 · Guidance based</span><span class="t">From "I Don\'t Know" to "I\'m Enrolled", One Step at a Time</span><span class="go">Start the 12 questions '+ARROW+'</span></a>'+
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
 return '<div class="founder"><div class="avatar">'+(f.photo?'<img src="'+esc(asset(f.photo))+'" alt="'+esc(f.name)+', '+esc(f.role)+' of Eduplan">'
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
  '<div class="item" data-reveal style="--i:2"><h3>Guidance based</h3><p>For students who are still unsure. Twelve short questions, then a counsellor walks you through each step.</p><a class="textlink" href="#guided">Open the tool '+ARROW+'</a></div>'+
 '</div></section>'+
 '<section class="panel" data-reveal><h2>Ready to talk?</h2><p class="muted">A counsellor will go through your options with you and your family.</p><div><a class="btn" href="#consultation">Book a free consultation</a></div></section>';
};
/* Universities: Page 1 lists every published institution from the school sheets, Page 2 shows one
   institution and its study levels, Page 3 lists that level's programmes by sub-level and faculty.
   Routes: #universities, #universities/xmum, #universities/xmum/undergraduate. */
var UNIV=[];   /* institutions from the sheet data (applyApi); each has .progs */
var LEVELS=[["foundation","Foundation",["Foundation"]],["undergraduate","Undergraduate",["Certificate","Diploma","Bachelor's Degree"]],
 ["postgraduate","Postgraduate",["Master's Degree","PhD","Professional Certificate"]]];
/* The three routes and their pages. Each ends with Ask more, Apply and Accommodation (see the Journey section). */
var FLOWS={
 faculty:["Faculty","Courses","University & programme","Ask more","Apply","Accommodation"],
 universities:["Universities","University","Programme","Ask more","Apply","Accommodation"],
 scholarships:["Scholarship","Scholarship type","Requirements","University","Programme","Ask more","Apply","Accommodation"]
};
/* University pages are pages 1-3 of their own route, or pages 4-5 when the student came from a scholarship. */
function uniStepper(step){return S.flow==="scholarships"?stepper(FLOWS.scholarships,step===3?5:4):stepper(FLOWS.universities,step);}
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
 return '<section class="stack">'+uniStepper(1)+'<div><a class="btn ghost" href="'+(S.flow==="scholarships"?esc(sget("eduplan-schback")||"#scholarships"):"#home")+'">Back</a></div>'+
 '<span class="eyebrow">Universities</span><h1>Partner universities and colleges</h1><p class="lead">Choose a university to see its programmes by level: foundation, undergraduate and postgraduate.</p></section>'+
 (UNIV.length?'<section class="grid">'+UNIV.map(function(u){var n=uniScholarships(u);
  return '<a class="item pick" href="#universities/'+esc(u.id.toLowerCase())+'"><span class="name">'+esc(u.name)+'</span>'+(u.fullName!==u.name?'<span class="desc">'+esc(u.fullName)+'</span>':'')+
   '<span class="meta">'+[u.type,u.place].filter(Boolean).map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</span>'+
   '<span class="meta"><span class="pill brand">'+u.progs.length+' programme'+(u.progs.length===1?'':'s')+'</span>'+(n?'<span class="pill ok">'+n+' scholarship'+(n===1?'':'s')+'</span>':'')+'</span>'+
   '<span class="textlink">View university '+ARROW+'</span></a>';}).join("")+'</section>'
  :'<div class="empty">The university list is being prepared.</div>');
};
function uniHead(u,step,back){
 return '<section class="stack">'+uniStepper(step)+'<div><a class="btn ghost" href="'+back+'">Back</a></div><span class="eyebrow">Universities</span>';
}
/* Type and location pills for an institution. */
function uniMeta(u){return '<div class="meta">'+[u.type,u.place].filter(Boolean).map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</div>';}
/* Campus banner: the institution's campus photo (CAMPUS_PHOTOS, files in assets/img/campus) or an animated
   background, plus a button for its 3D virtual tour (Institutions "virtual_tour_url"). Tour sites usually refuse
   to be embedded in other pages, so the tour opens in a new tab. */
var CAMPUS_PHOTOS={xmum:"assets/img/campus/xmum.jpg"};
function asset(p){return p&&HOST&&HOST.assetBase&&!/^(data:|https?:)/.test(p)?HOST.assetBase+p:p;}
function uniPhoto(u){return asset(CAMPUS_PHOTOS[String(u.id).toLowerCase()]||"");}
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
 (ps.length?'<div class="row foldall"><span class="hint">'+ps.length+' programme'+(ps.length===1?'':'s')+'. Tap a programme to see fees, entry requirements and scholarships.</span>'+
  '<button type="button" class="btn ghost" data-foldall="open">Expand all</button><button type="button" class="btn ghost" data-foldall="close">Collapse all</button></div>'+facNav(ps):'')+
 (ps.length?subs.map(function(sl){
  var sp=ps.filter(function(p){return uniLevel(p.level)[1]===sl;});if(!sp.length)return '';
  var byFac={},order=[];sp.forEach(function(p){var f=facOfCourse(p.course_id),k=f?f.code:"--";if(!byFac[k]){byFac[k]={f:f,list:[]};order.push(k);}byFac[k].list.push(p);});
  order.sort();
  return '<section class="section">'+(sl!==L[1]?'<h2>'+esc(sl)+'</h2>':'')+order.map(function(k){var g=byFac[k];
   return '<div class="facgroup" data-fac="'+esc(k)+'">'+facBand(g.f,g.list.length,"h3")+'<div class="progs">'+g.list.map(progFold).join("")+'</div></div>';}).join("")+'</section>';}).join("")
  :'<div class="empty">No '+L[1].toLowerCase()+' programmes listed for '+esc(u.name)+' yet.</div>')+
 '<p class="hint">Information is for reference only. Please confirm with the university’s official website.</p>';
}
/* Faculty header for a group of programmes: code badge, name, Chinese name and programme count. */
function facBand(f,n,tag){
 return '<div class="facband"><span class="faccode" aria-hidden="true">'+esc(f?f.code:"--")+'</span><div class="facname"><'+tag+'>'+(f?'Faculty '+esc(f.code)+' · '+esc(f.name):'Other')+'</'+tag+'>'+(f&&f.zh?'<span class="hint">'+esc(f.zh)+'</span>':'')+'</div>'+
  '<span class="pill brand">'+n+' programme'+(n===1?'':'s')+'</span></div>';
}
/* Faculty overview above a university's programme list: one tile per faculty, tapping it scrolls to that group. */
function facNav(ps){
 var c={},order=[];ps.forEach(function(p){var f=facOfCourse(p.course_id),k=f?f.code:"--";if(!c[k]){c[k]={f:f,n:0};order.push(k);}c[k].n++;});
 if(order.length<2)return '';
 order.sort();
 return '<nav class="facnav" aria-label="Faculties">'+order.map(function(k){var g=c[k];
  return '<button type="button" class="facjump" data-jump="'+esc(k)+'"><span class="faccode" aria-hidden="true">'+esc(k)+'</span><span class="facname"><span class="name">'+(g.f?esc(g.f.name):'Other')+'</span>'+(g.f&&g.f.zh?'<span class="hint">'+esc(g.f.zh)+'</span>':'')+'</span>'+
   '<span class="count">'+g.n+'</span></button>';}).join("")+'</nav>';
}
/* Scholarship-based: Page 1 is the entry button, Page 2 picks the type, Page 3 shows that type.
   Page 3 is only reachable after a type is chosen on Page 2 (see route()). */
function stepper(names,step){
 return '<ol class="stepper" aria-label="Progress">'+names.map(function(n,k){var cur=k+1===step;return '<li'+(cur?' aria-current="step"':(k+1<step?' class="done"':''))+'><span aria-hidden="true">'+(k+1)+'</span>Page '+(k+1)+': '+esc(n)+'</li>';}).join("")+'</ol>';
}
/* Scholarship pages: 1 home card, 2 type, 3 choosing a scholarship and its requirements (both pages), then universities (4) and programmes (5). */
function schStepper(step){return stepper(FLOWS.scholarships,Math.min(step,3));}
function schUni(t,id){if(!t||!t.universities||!id)return null;id=String(id).toLowerCase();for(var i=0;i<t.universities.length;i++){if(String(t.universities[i].id).toLowerCase()===id)return t.universities[i];}return null;}
function schItem(t,id){if(!t||!t.items||!id)return null;id=String(id).toLowerCase();for(var i=0;i<t.items.length;i++){if(t.items[i].name&&String(t.items[i].id).toLowerCase()===id)return t.items[i];}return null;}
function schTierCell(r){return r.waiver!=null?r.waiver+'%':r.amount!=null?rm(r.amount):'See official information';}
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
 '<section class="panel"><h2>Next: choose a university</h2><p class="muted">Find a university and programme to apply to with this scholarship.</p>'+
  '<div class="row"><a class="btn" href="#universities" data-flow="scholarships">Choose a university '+ARROW+'</a><a class="btn ghost" href="#consultation" data-topic="Scholarships" data-note="'+esc("Interested in: "+it.name+".")+'">Ask a counsellor</a></div></section>';
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
var SCH_QUALS=["SPM","IGCSE","O-Level","UEC","STPM","A-Level"],SCH_PREU=["Foundation","Matriculation","Diploma"],SCH_SECONDARY=["SPM","IGCSE","O-Level"],
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
   return '<tr><td>'+esc(opt&&opt.head?r.min||r.result:r.result)+own.map(function(c){return '<br><span class="hint">'+esc(c)+'</span>';}).join("")+'</td><td>'+(r.waiver==null&&r.amount==null?'<span class="hint">'+esc(schTierCell(r))+'</span>':'<span class="big">'+esc(schTierCell(r))+'</span>')+'</td></tr>';}).join("")+'</tbody></table>'+
 facts([["Applies to",byLevel?"":applies.join("; ")],["Application deadline",dl.join("; ")]])+
 (cond.length?'<h3>Conditions</h3>'+reqList(cond):'')+'</section>';
}
function schGroupBy(tiers){var g={},order=[];tiers.forEach(function(r){var k=(r.scheme||"")+"|"+(r.applies||"");if(!g[k]){g[k]={name:r.scheme||"",tiers:[]};order.push(k);}g[k].tiers.push(r);});return order.map(function(k){return g[k];});}
/* Three tabs: Foundation and Undergraduate (by qualification and result), and Others for awards that are not tied to a
   study level or a result (grants, sports, talent, financial aid ...). */
function schFilter(u){
 var staged=u.tiers.filter(schLevel),others=u.tiers.filter(function(r){return !schLevel(r);});
 var levels=SCH_LEVELS.concat(others.length?[["others","Others"]]:[]);
 var quals=uniq(SCH_QUALS.concat(staged.map(function(r){return r.qual;})).filter(function(q){return q&&SCH_PREU.indexOf(q)<0&&q!=="Other";}))
  .filter(function(q){return SCH_SECONDARY.indexOf(q)>=0||staged.some(function(r){return r.qual===q;});});
 var q=quals.indexOf(S.schQ)>=0?S.schQ:quals[0],L=levels.some(function(l){return l[0]===S.schL;})?S.schL:"foundation",lv=levels.filter(function(l){return l[0]===L;})[0];
 var tabs='<h3>Study level</h3><div class="chips" role="group" aria-label="Study level">'+levels.map(function(l){return '<button type="button" class="chip" data-schl="'+l[0]+'" aria-pressed="'+(l[0]===L)+'">'+l[1]+'</button>';}).join("")+'</div>';
 if(L==="others")return '<section class="panel"><h2>Find your scholarship</h2>'+tabs+'<p class="muted">Other scholarships, grants and financial aid at '+esc(u.name)+'.</p></section>'+
  '<div aria-live="polite">'+schGroupBy(others).map(function(g){return schPanel(g);}).join("")+'</div>';
 var rows=staged.filter(function(r){return schLevel(r)===L&&r.qual===q;}),preu=false;
 if(!rows.length&&L==="undergraduate"&&SCH_SECONDARY.indexOf(q)>=0){rows=staged.filter(function(r){return schLevel(r)===L&&SCH_PREU.indexOf(r.qual)>=0;});preu=rows.length>0;}
 var head=preu?"Result":q+" result";
 return '<section class="panel"><h2>Find your scholarship</h2>'+
  '<h3>Your qualification</h3><div class="chips" role="group" aria-label="Qualification">'+quals.map(function(x){return '<button type="button" class="chip" data-schq="'+esc(x)+'" aria-pressed="'+(x===q)+'">'+esc(x)+'</button>';}).join("")+'</div>'+tabs+'</section>'+
 '<div aria-live="polite">'+
 (preu?'<div class="empty">'+esc(q)+' holders start a degree after Foundation, Matriculation or Diploma. At undergraduate level the scholarship is based on that result. <button type="button" class="chip" data-schl="foundation">See Foundation level for '+esc(q)+'</button></div>':'')+
 (rows.length?schGroupBy(rows).map(function(g){return schPanel(g,{head:head});}).join("")
  :'<div class="empty">'+esc(u.name)+'’s scholarship table lists no '+esc(lv?lv[1]:L)+' programme award for '+esc(q)+'. <button type="button" class="chip" data-schl="'+(L==="foundation"?"undergraduate":"foundation")+'">See '+(L==="foundation"?"Undergraduate":"Foundation")+' level</button></div>')+
 '</div>';
}
function schDetails(t,u){
 var site=u.website||(u.tiers.filter(function(r){return r.url;})[0]||{}).url;
 return schHead(4,t,"#scholarships-"+esc(t.id))+'<h1>'+esc(u.name)+'</h1>'+(u.fullName&&u.fullName!==u.name?'<p class="lead">'+esc(u.fullName)+'</p>':'')+
 ((u.type||u.place)?'<div class="meta">'+[u.type,u.place].filter(Boolean).map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</div>':'')+'</section>'+
 (u.tiers.some(schLevel)?schFilter(u):schGroupBy(u.tiers).map(function(g){return schPanel(g);}).join(""))+
 '<section class="panel">'+facts([["Last updated",u.lastUpdated]])+
  '<div class="row">'+(site?'<a class="btn" href="'+esc(site)+'" target="_blank" rel="noopener">Official website '+ARROW+'</a>':'<span class="hint">Official website link to be added.</span>')+'</div>'+SCH_NOTE+'</section>'+
 '<section class="panel"><h2>Next: choose your programme at '+esc(u.name)+'</h2><p class="muted">Not sure which tier you reach? A counsellor can check with you.</p>'+
  '<div class="row">'+(univ(u.id)?'<a class="btn" href="#universities/'+esc(String(u.id).toLowerCase())+'" data-flow="scholarships">See '+esc(u.name)+' programmes '+ARROW+'</a>':'')+
  '<a class="btn ghost" href="#consultation" data-topic="Scholarships" data-note="'+esc("Campus Scholarship: "+u.name)+'">Ask a counsellor</a></div></section>';
}
SCH.types.forEach(function(t){V["scholarships-"+t.id]=function(){return schPage3(t);};});

/* Interest-based: Page 1 is the entry button, Page 2 picks a faculty (00-10), Page 3 lists its courses,
   Page 4 lists the universities offering the chosen course. Routes: #faculty, #faculty/05, #faculty/05/biotechnology. */
var FAC_STEPS=FLOWS.faculty;
V.faculty=function(){
 var f=S.fac&&S.fac.field,c=S.fac&&S.fac.course;
 if(c)return facUnis(f,c);
 if(f)return facCourses(f);
 return '<section class="stack">'+stepper(FAC_STEPS,1)+'<div><a class="btn ghost" href="#home">Back</a></div>'+
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
 return '<section class="stack">'+stepper(FAC_STEPS,2)+'<div><a class="btn ghost" href="#faculty">Back</a></div>'+
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
var ENTRY=[["entry","SPM"],["uec","UEC"],["olevel","O-Level / IGCSE"],["stpm","STPM"],["entry_other","Others"]];
/* Entry requirements are written one rule per line; a line ending in ":" heads a group (an exam or a track). */
function entryLine(x){var h=/[:：]$/.test(x);return '<span class="line'+(h?' lhead':'')+'">'+(h?'':'• ')+esc(x.replace(/^[•·*▪◦–-]\s*/,""))+'</span>';}
/* The student's results (My results) against this programme's entry requirements. */
function entryMatch(u){
 if(!RX.taken().length)return '<p class="hint"><a href="#portfolio">Add your results</a> to see if you meet these requirements.</p>';
 var b=RX.badge(RX.match({spm:u.entry,uec:u.uec,olevel:u.olevel,stpm:u.stpm,other:u.entry_other}));
 return b?'<p class="ematch '+b[0]+'">'+esc(b[1])+'</p>':'<p class="hint">These requirements cannot be checked against your results automatically. Ask a counsellor.</p>';
}
/* fold: the university pages list many programmes, so each card starts closed and opens to show the details. */
function progCard(u,fold){
 var sch=progScholarships(u),meta=[u.level,u.years!=null?years(u.years):"",u.mode].filter(Boolean);
 /* Postgraduate brochures give a yearly fee, not a whole-programme total: a notes line "Annual fee: ..." is shown as the fee. */
 var annual=lines(u.notes).filter(function(x){return /^Annual fee: /.test(x);}).map(function(x){return x.replace(/^Annual fee: /,"");}),notes=lines(u.notes).filter(function(x){return !/^Annual fee: /.test(x);});
 return (fold?'<details class="prog fold"><summary>':'<article class="prog">')+'<div class="stack"><span class="eyebrow">'+esc(u.name)+'</span><h3 class="fname">'+esc(u.programme||u.name)+'</h3>'+
  (meta.length?'<div class="meta">'+meta.map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</div>':'')+'</div>'+
  (fold?'<span class="foldhint"><span class="closed">Show details</span><span class="opened">Hide details</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg></span></summary><div class="progbody">':'')+
  '<dl class="facts">'+
   (u.fee==null&&annual.length?'<dt>Tuition fee (per year)</dt><dd>'+annual.map(function(x){return '<span class="line">'+esc(x)+'</span>';}).join("")+'</dd>':
   '<dt>Tuition fee (whole programme)</dt><dd>'+(u.fee!=null?esc(rm(u.fee)):'<span class="hint">To be confirmed</span>')+'</dd>')+
   '<dt>Location</dt><dd>'+(u.campus||u.place?esc(u.campus||u.place):'<span class="hint">To be confirmed</span>')+'</dd>'+
   (u.intakes?'<dt>Intakes</dt><dd>'+esc(u.intakes)+'</dd>':'')+(u.deadline?'<dt>Application deadline</dt><dd>'+esc(u.deadline)+'</dd>':'')+
   (u.english?'<dt>English requirement</dt><dd>'+esc(u.english)+'</dd>':'')+(u.mqa?'<dt>MQA</dt><dd>'+esc(u.mqa)+'</dd>':'')+'</dl>'+
  '<div class="stack"><h4>Entry requirements</h4>'+entryMatch(u)+'<dl class="facts entry">'+ENTRY.map(function(e){var l=lines(u[e[0]]);
   return '<dt>'+esc(e[1])+'</dt><dd>'+(l.length?l.map(entryLine).join(""):'<span class="hint">Not listed by the institution</span>')+'</dd>';}).join("")+'</dl></div>'+
  '<div class="stack"><h4>Scholarships you can apply for</h4>'+
   (sch.length?'<ul class="schlinks">'+sch.map(function(g){return '<li><a href="'+esc(g.href)+'"><span class="name">'+esc(g.name)+'</span>'+(g.best!=null?'<span class="pill brand">Up to '+g.best+'% tuition waiver</span>':'')+'</a></li>';}).join("")+'</ul>'
    :'<p class="hint">No campus scholarship listed for this level yet.</p>')+
   '<a class="textlink" href="#scholarships-foundation">Other scholarships open to all students '+ARROW+'</a></div>'+
  (notes.length?'<div class="stack"><h4>Notes</h4>'+notes.map(function(x){return '<p class="muted">'+esc(x)+'</p>';}).join("")+'</div>':'')+
  '<div class="row">'+(u.url?'<a class="btn ghost" href="'+esc(u.url)+'" target="_blank" rel="noopener">Programme page '+ARROW+'</a>':'')+
   (u.id?saveBtn(u.id)+'<a class="btn" href="#next/'+esc(u.id)+'">Choose this programme '+ARROW+'</a>':'<a class="btn" href="#consultation" data-topic="Choosing a university" data-note="Interested in: '+esc(u.programme||u.name)+' ('+esc(u.name)+').">Ask a counsellor about this course</a>')+'</div>'+(fold?'</div></details>':'</article>');
}
function progFold(u){return progCard(u,true);}
function facUnis(f,c){
 var list=c.universities||[];
 return '<section class="stack">'+stepper(FAC_STEPS,3)+'<div><a class="btn ghost" href="#faculty/'+esc(f.code)+'">Back</a></div>'+
 '<span class="eyebrow">Faculty '+esc(f.code)+' · '+esc(f.name)+'</span><h1>'+esc(c.name)+'</h1><p class="lead">'+esc(c.desc)+'</p></section>'+
 '<section class="section"><h2>Universities offering this course</h2>'+
 (list.length?'<div class="progs">'+list.map(function(u){return progCard(u);}).join("")+'</div>'
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
 var g=S.guide,Q=QUIZ.questions,n=Q.length;
 var head='<section class="stack"><span class="eyebrow">Option 3 · Guidance based</span><h1>Not sure yet? Start here</h1><p class="lead">Twelve short questions about what you enjoy. There are no wrong answers.</p></section>';
 if(g.step>=n){
  var r=guidedScore(g.answers,g.tie);
  if(r.close)return head+guideTie(r);
  return head+guideResult(r);
 }
 var q=Q[g.step],cur=g.answers[g.step];
 return head+'<section class="panel" style="max-width:720px"><div class="steps" aria-hidden="true">'+Q.map(function(_,k){return '<span class="'+(k<=g.step?"on":"")+'"></span>';}).join("")+'</div>'+
  '<p class="muted">Question '+(g.step+1)+' of '+n+'</p><h2 id="guide-q">'+esc(q.q)+'</h2>'+
  '<div class="opts" role="group" aria-labelledby="guide-q">'+q.a.map(function(a,k){return '<button type="button" class="opt" data-ans="'+k+'" aria-pressed="'+(cur===k)+'">'+esc(a[0])+'</button>';}).join("")+'</div>'+
  '<div class="row"><button type="button" class="btn ghost" id="guide-back"'+(g.step===0?" disabled":"")+'>Back</button><button type="button" class="btn" id="guide-next"'+(cur==null?" disabled":"")+'>'+(g.step===n-1?"See my result":"Next")+'</button></div></section>';
};
function facLabel(code){var f=facField(code);return f?'Faculty '+f.code+' · '+f.name:'Faculty '+code;}
/* Top two faculties are close: one forced choice decides the order. */
function guideTie(r){
 var two=r.order.slice(0,2);
 return '<section class="panel" style="max-width:720px"><div class="note">Two areas came out very close.</div>'+
  '<h2 id="tie-q">If you could only choose one of these and do it for the next 3 years, which would you pick?</h2>'+
  '<div class="opts" role="group" aria-labelledby="tie-q">'+two.map(function(c){var f=facField(c);
   return '<button type="button" class="opt" data-tie="'+esc(c)+'"><strong>'+esc(f?f.name:c)+'</strong>'+(f&&f.zh?'<br><span class="hint">'+esc(f.zh)+'</span>':'')+'</button>';}).join("")+'</div>'+
  '<div class="row"><button type="button" class="btn ghost" id="guide-back">Back</button></div></section>';
}
function guideResult(r){
 var names=r.picks.map(facLabel);
 return '<section class="panel"><div class="note">You answered all twelve questions.</div><h2>Faculties that suit your interests</h2>'+
  '<div class="progs">'+r.picks.map(function(code,i){var f=facField(code);if(!f)return '';
   return '<article class="prog"><div class="stack"><span class="eyebrow">'+(i===0?'Best match':'Also a good fit')+'</span>'+
    '<h3 class="fname">'+esc(facLabel(code))+'</h3><p class="muted">'+esc(f.zh)+'</p></div>'+
    '<div class="stack"><h4>Courses in this faculty</h4><div class="grid">'+f.courses.map(function(c){var k=(c.universities||[]).length;
     return '<a class="item pick" href="#faculty/'+esc(f.code)+'/'+esc(c.id)+'"><span class="name">'+esc(c.name)+'</span><span class="desc">'+esc(c.desc)+'</span>'+(k?'<span class="meta"><span class="pill brand">'+k+' programme'+(k===1?'':'s')+'</span></span>':'')+'</a>';}).join("")+'</div></div>'+
    '<div class="row"><a class="btn ghost" href="#faculty/'+esc(f.code)+'">Explore '+esc(facLabel(code))+' '+ARROW+'</a></div></article>';}).join("")+'</div>'+
  (r.mismatch?'<div class="empty">Your own choice in the last question was <strong>'+esc(facLabel(r.check))+'</strong>, which is different from your other answers. That is worth talking through with a counsellor.</div>':'')+
  (r.open?'<article class="prog"><div class="stack"><span class="eyebrow">Also worth considering</span><h3 class="fname">'+esc(facLabel("00"))+'</h3>'+
   '<p class="muted">Your interests are still open or spread across several areas. A foundation or general programme lets you explore before you choose a degree.</p></div>'+
   '<div class="row"><a class="btn ghost" href="#faculty/00">Explore '+esc(facLabel("00"))+' '+ARROW+'</a></div></article>':'')+
  '<p class="muted">This quiz looks at interests only. Ability, budget, physical requirements and family considerations still need to be discussed with a counsellor.</p>'+
  '<div class="row"><a class="btn" href="#consultation" data-topic="I am not sure what to study" data-note="Interest quiz result: '+esc(names.join(", "))+(r.open?' (interests still open)':'')+'.">Book my free consultation</a><button type="button" class="btn ghost" id="guide-restart">Start again</button></div></section>';
}

V.consultation=function(){
 if(S.consDone){
  return '<section class="stack">'+(S.pick?flowStep("Ask more"):'')+'<span class="eyebrow">Free Consultation</span><h1>Your request is ready to send</h1><p class="lead">Copy the summary and send it to Eduplan by WhatsApp or email. A counsellor replies to arrange a time.</p></section>'+
  '<section class="panel" style="max-width:720px"><pre class="summary" id="cons-summary">'+esc(S.consDone)+'</pre>'+
  '<div class="row"><button type="button" class="btn" id="cons-copy">Copy summary</button><button type="button" class="btn ghost" id="cons-edit">Edit my answers</button></div>'+
  '<p class="muted" id="cons-copied" aria-live="polite"></p>'+
  '<p class="muted">Send to: WhatsApp [YOUR PHONE NUMBER] or email [YOUR EMAIL].</p>'+
  (findProg(S.pick)?'<div class="row"><a class="btn" href="#apply/'+esc(S.pick)+'">Continue to the application form '+ARROW+'</a></div>':'')+'</section>';
 }
 var c=S.cons,e=S.consErr||{};
 function f(id,label,type,hint,req){return '<div class="field"><label for="'+id+'">'+label+(req?"":' <span class="hint">(optional)</span>')+'</label><input type="'+type+'" id="'+id+'" value="'+esc(c[id]||"")+'"'+(e[id]?' aria-invalid="true" aria-describedby="'+id+'-err"':"")+'>'+(hint?'<span class="hint">'+hint+'</span>':"")+(e[id]?'<span class="err" id="'+id+'-err">'+esc(e[id])+'</span>':"")+'</div>';}
 var topics=["Scholarships","Choosing a course","Choosing a university","Accommodation","I am not sure what to study"];
 var quals=["SPM","UEC","STPM","A-Level","Foundation or Matriculation","Diploma","Other"];
 return '<section class="stack">'+(S.pick?flowStep("Ask more"):'')+'<span class="eyebrow">Free Consultation</span><h1>Book a free consultation</h1><p class="lead">Tell us a little about yourself. It takes about a minute.</p></section>'+
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

/* ---------- Journey: Ask more -> Apply -> Accommodation ----------
   Every route ends the same way once a programme is chosen:
     #next/<programme_id>  Ask more (AI assistant or free consultation, or go straight to the form)
     #apply                the application form, with document uploads
     #stay                 accommodation help, then the application is sent to Eduplan
   S.flow remembers which route the student came from, so these pages show that route's progress bar.
   Answers are kept in sessionStorage only (they include NRIC numbers) and uploaded files only in memory. */
function flowStep(name){var f=FLOWS[S.flow];if(!f)return "";var i=f.indexOf(name);return i<0?"":stepper(f,i+1);}
function setFlow(f){S.flow=f;try{sessionStorage.setItem("eduplan-flow",f||"");}catch(e){}}
function sget(k){try{return sessionStorage.getItem(k)||"";}catch(e){return "";}}
function sset(k,v){try{sessionStorage.setItem(k,v||"");}catch(e){}}

var APPLY_STEPS=["Programme","About you","Contact","Family","Education","Documents"];
var APPLY_KEY="eduplan-apply",QUALS=["SPM","IGCSE","O-Level","UEC","STPM","A-Level","Foundation","Matriculation","Diploma","Bachelor's degree","Other"];
/* The application's "Highest qualification" as an exam in My results ("Foundation / Matriculation" was one choice before). */
function applyExam(){var q=S.app.v.h_type;if(q==="Foundation / Matriculation")q="Foundation";return RX.exam(q)?q:null;}
var MY_STATES=["Johor","Kedah","Kelantan","Melaka","Negeri Sembilan","Pahang","Perak","Perlis","Pulau Pinang","Sabah","Sarawak","Selangor","Terengganu","Kuala Lumpur","Labuan","Putrajaya"];
/* Documents to upload: [id, label, how many files, required when]. Photos are made smaller before sending. */
var UPLOADS=[["ic","NRIC or passport (front and back)",2,"always"],["results","Results slip (SPM / UEC / O-Level or equivalent)",3,"actual"],
 ["photo","Passport-size photo",1,""],["eng","English language certificate",2,""],["sch","Scholarship application form",2,""],["fee","Proof of application fee payment",1,""]];
var FILE_MAX=5*1024*1024,FILES_TOTAL=20*1024*1024;
function applyLoad(){var a=null;try{a=JSON.parse(sessionStorage.getItem(APPLY_KEY));}catch(e){}
 a=a||{};a.v=a.v||{nationality:"Malaysian",residence:"Malaysia",country:"Malaysia",perm_same:true,em_same:true,disability:"No"};a.step=a.step||1;a.edu=a.edu||2;a.eng=a.eng||1;a.files={};return a;}
function applySave(){try{sessionStorage.setItem(APPLY_KEY,JSON.stringify({v:S.app.v,step:S.app.step,edu:S.app.edu,eng:S.app.eng,complete:S.app.complete,sent:S.app.sent}));}catch(e){}pfTouch("apply");}
function allProgs(){var out=[];UNIV.forEach(function(u){u.progs.forEach(function(p){out.push({u:u,p:p});});});return out;}
function findProg(id){id=String(id||"").toLowerCase();return id?allProgs().filter(function(x){return String(x.p.id).toLowerCase()===id;})[0]||null:null;}
function applyProg(){return findProg(S.app.v.prog);}
/* Academic tracks come from the programme's notes line "Academic tracks: A, B, C." in the school sheet. */
function progTracks(p){var m=String(p&&p.notes||"").match(/Academic tracks?:\s*([^\n]+?)\.?\s*(?:\n|$)/i);return m?m[1].split(/\s*,\s*/).filter(Boolean):[];}
function applyAge(dob){var d=new Date(dob);if(!dob||isNaN(d))return null;var n=new Date(),a=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))a--;return a;}
function needFile(u){return u[3]==="always"||(u[3]==="actual"&&S.app.v.h_status==="Actual");}

function af(id,label,o){
 o=o||{};var v=S.app.v[id],e=(S.app.err||{})[id],req=!o.opt,inv=e?' aria-invalid="true" aria-describedby="'+id+'-err"':'';
 var lab='<label for="ap-'+id+'">'+label+(req?'':' <span class="hint">(optional)</span>')+'</label>',ctl;
 if(o.opts)ctl='<select id="ap-'+id+'" name="'+id+'"'+inv+(o.rerender?' data-rerender':'')+'>'+(o.first?'<option value="">'+esc(o.first)+'</option>':'')+
   o.opts.map(function(x){var val=typeof x==="string"?x:x[0],t=typeof x==="string"?x:x[1];return '<option value="'+esc(val)+'"'+(String(v||"")===val?' selected':'')+'>'+esc(t)+'</option>';}).join("")+'</select>';
 else if(o.area)ctl='<textarea id="ap-'+id+'" name="'+id+'" rows="'+(o.rows||3)+'"'+inv+'>'+esc(v||"")+'</textarea>';
 else ctl='<input id="ap-'+id+'" name="'+id+'" type="'+(o.type||"text")+'" value="'+esc(v||"")+'"'+(o.list?' list="'+o.list+'"':'')+(o.auto?' autocomplete="'+o.auto+'"':'')+(o.mode?' inputmode="'+o.mode+'"':'')+inv+'>';
 return '<div class="field'+(o.full?' full':'')+'">'+lab+ctl+(o.hint?'<span class="hint">'+o.hint+'</span>':'')+(e?'<span class="err" id="'+id+'-err">'+esc(e)+'</span>':'')+'</div>';
}
function acheck(id,label,o){o=o||{};var e=(S.app.err||{})[id];
 return '<div class="field full"><label class="check"><input type="checkbox" name="'+id+'" id="ap-'+id+'"'+(S.app.v[id]?' checked':'')+(o.rerender?' data-rerender':'')+(e?' aria-invalid="true" aria-describedby="'+id+'-err"':'')+'><span>'+label+'</span></label>'+(e?'<span class="err" id="'+id+'-err">'+esc(e)+'</span>':'')+'</div>';}
function agroup(title,body){return '<fieldset class="fgroup"><legend>'+title+'</legend><div class="fgrid">'+body+'</div></fieldset>';}
function kb(n){return n>1048576?(n/1048576).toFixed(1)+" MB":Math.max(1,Math.round(n/1024))+" KB";}
function uploadBox(u){
 var list=S.app.files[u[0]]||[],e=(S.app.err||{})["f_"+u[0]],req=needFile(u);
 return '<div class="field full upload"><label for="ap-f_'+u[0]+'">'+esc(u[1])+(req?'':' <span class="hint">(optional)</span>')+'</label>'+
  (list.length?'<ul class="files">'+list.map(function(f,k){return '<li><span class="fname">'+esc(f.name)+'</span><span class="hint">'+kb(f.size)+'</span><button type="button" class="chip" data-apply="rmfile" data-file="'+u[0]+':'+k+'" aria-label="Remove '+esc(f.name)+'">Remove</button></li>';}).join("")+'</ul>':'')+
  (list.length<u[2]?'<input type="file" id="ap-f_'+u[0]+'" data-upload="'+u[0]+'" accept="image/*,application/pdf"'+(u[2]-list.length>1?' multiple':'')+(e?' aria-invalid="true" aria-describedby="f_'+u[0]+'-err"':'')+'>'+
   '<span class="hint">Photo or PDF'+(u[2]>1?', up to '+u[2]+' files':'')+'.</span>':'')+
  (e?'<span class="err" id="f_'+u[0]+'-err">'+esc(e)+'</span>':'')+'</div>';
}

function applyStep(n){
 var v=S.app.v,x=applyProg();
 if(n===1){
  var byU=UNIV.filter(function(u){return u.progs.length;}).map(function(u){
   return '<optgroup label="'+esc(u.name)+'">'+u.progs.map(function(p){return '<option value="'+esc(p.id)+'"'+(v.prog===p.id?' selected':'')+'>'+esc(p.programme)+'</option>';}).join("")+'</optgroup>';}).join("");
  var e=(S.app.err||{}).prog,tr=x?progTracks(x.p):[];
  return agroup("Programme",
   '<div class="field full"><label for="ap-prog">Programme</label><select id="ap-prog" name="prog" data-rerender'+(e?' aria-invalid="true" aria-describedby="prog-err"':'')+'><option value="">Choose a programme</option>'+byU+'</select>'+
    (x?'<span class="hint">'+esc(x.u.fullName||x.u.name)+(x.p.level?' · '+esc(x.p.level):'')+'</span>':'<span class="hint">Not sure yet? <a href="#consultation">Book a free consultation</a> first.</span>')+(e?'<span class="err" id="prog-err">'+esc(e)+'</span>':'')+'</div>'+
   (tr.length?af("track","Academic track",{opts:tr,first:"Choose a track"}):'')+
   af("intake","Intake (month and year)",{type:"month",hint:x&&x.p.intakes?"Intakes: "+esc(x.p.intakes):"Example: 2026-04"}));
 }
 if(n===2)return agroup("Personal details",
   af("name_en","Full name (as on NRIC/passport)",{full:true,auto:"name",hint:"In capital letters, for example TAN WEI MING."})+
   af("name_zh","Chinese name",{opt:true})+af("ic","NRIC / passport no.",{hint:"Example: 080101-14-1234"})+
   af("dob","Date of birth",{type:"date",auto:"bday"})+af("gender","Gender",{opts:["Male","Female"],first:"Choose"})+
   af("marital","Marital status",{opts:["Single","Married"],first:"Choose"})+af("race","Race")+af("religion","Religion")+
   af("nationality","Nationality")+af("residence","Country of permanent residence"));
 if(n===3)return agroup("Contact details",
   af("mobile","Mobile",{type:"tel",auto:"tel",hint:"Example: 012-345 6789"})+af("email","Email",{type:"email",auto:"email"})+af("tel","Home telephone",{type:"tel",opt:true})+
   af("addr","Correspondence address",{area:true,rows:2,full:true,auto:"street-address"})+af("town","Town / city")+af("postcode","Postcode",{mode:"numeric",auto:"postal-code"})+
   af("state","State",{list:"my-states"})+af("country","Country")+
   acheck("perm_same","My permanent address is the same",{rerender:true})+
   (v.perm_same?'':af("p_addr","Permanent address",{area:true,rows:2,full:true})+af("p_town","Town / city")+af("p_postcode","Postcode",{mode:"numeric"})+
    af("p_state","State",{list:"my-states"})+af("p_country","Country")+af("p_tel","Home telephone (permanent address)",{type:"tel",opt:true}))+
   '<datalist id="my-states">'+MY_STATES.map(function(s){return '<option value="'+s+'">';}).join("")+'</datalist>');
 if(n===4)return agroup("Parent / guardian",
   af("g_name","Full name",{full:true})+af("g_name_zh","Chinese name",{opt:true})+af("g_rel","Relationship",{hint:"Father, mother, guardian …"})+
   af("g_mobile","Mobile",{type:"tel"})+af("g_email","Email",{type:"email",opt:true})+af("g_job","Occupation",{opt:true})+af("g_tel","Home telephone",{type:"tel",opt:true}))+
  agroup("Emergency contact",acheck("em_same","Same as parent / guardian",{rerender:true})+
   (v.em_same?'':af("e_name","Full name",{full:true})+af("e_name_zh","Chinese name",{opt:true})+af("e_rel","Relationship")+af("e_mobile","Mobile",{type:"tel"})+af("e_tel","Home telephone",{type:"tel",opt:true})));
 if(n===5){
  var rows="";for(var i=1;i<=S.app.edu;i++)rows+='<div class="rowset"><span class="rowno">'+i+'</span>'+af("ed"+i+"_school","School / institution and location",{full:true,opt:i>1})+
   af("ed"+i+"_from","From",{type:"month",opt:i>1})+af("ed"+i+"_to","To",{type:"month",opt:i>1})+af("ed"+i+"_qual","Qualification",{opts:QUALS,first:"Choose",opt:i>1,full:true})+'</div>';
  var eng="";for(var j=1;j<=S.app.eng;j++)eng+='<div class="rowset"><span class="rowno">'+j+'</span>'+af("en"+j+"_type","Test",{opt:true,hint:"MUET, IELTS, TOEFL, SPM English …"})+af("en"+j+"_score","Score / band",{opt:true})+af("en"+j+"_date","Date taken or to be taken",{type:"month",opt:true})+'</div>';
  return agroup("Education background",'<div class="field full"><span class="hint">Start with your most recent school. Add every school from secondary school onwards.</span></div>'+rows+
    (S.app.edu<5?'<div class="field full"><button type="button" class="btn ghost" data-apply="add-edu">Add another school</button></div>':''))+
   agroup("Highest qualification",af("h_type","Qualification",{opts:QUALS,first:"Choose",rerender:true})+af("h_status","Results",{opts:[["Actual","Actual results"],["Forecast","Forecast / not out yet"]],first:"Choose"})+
    af("h_school","Institution",{full:true})+af("h_start","Year started",{type:"month"})+af("h_end","Year completed",{type:"month"})+
    (applyExam()?'<div class="field full"><span class="legend">'+(RX.exam(applyExam()).cgpa?'Your CGPA':'Subjects and grades')+'</span>'+
      '<span class="hint">Saved to My results, and used to match programmes and scholarships for you.</span>'+RX.editor(applyExam())+
      ((S.app.err||{}).h_results?'<span class="err" id="h_results-err">'+esc(S.app.err.h_results)+'</span>':'')+'</div>'
     :af("h_results","Subjects and grades",{area:true,rows:5,full:true,hint:"One subject per line, for example: Mathematics A+"})))+
   agroup("English language",'<div class="field full"><span class="hint">Any English test you have taken or will take.</span></div>'+eng+
    (S.app.eng<3?'<div class="field full"><button type="button" class="btn ghost" data-apply="add-eng">Add another test</button></div>':''))+
   agroup("Others",af("disability","Do you have a disability?",{opts:["No","Yes"],rerender:true})+(v.disability==="Yes"?af("dis_info","Please give details",{area:true,rows:2,full:true}):''));
 }
 var age=applyAge(v.dob),xm=x&&x.u.id==="XMUM";
 return agroup("Upload your documents",'<div class="field full"><span class="hint">Take a clear photo of each document, or choose a PDF. Each file can be up to 5 MB. Files stay on this page until you send your application, so add them again if you reload.'+
   (xm?' XMUM scholarship and study grant form: <a href="http://www.xmu.edu.my/14698/list.htm" target="_blank" rel="noopener">xmu.edu.my</a>.':'')+'</span></div>'+UPLOADS.map(uploadBox).join(""))+
  agroup("Declaration",acheck("decl","I declare that the information in this application is true, correct and complete. I understand that the university may change or withdraw a decision made on incorrect or incomplete information. I agree that Eduplan keeps my application and documents and shares them with the university to process this application, as set out in their personal data protection notices.")+
   (age!==null&&age<18?'<div class="field full"><span class="hint">You are under 18, so your parent or legal guardian must also agree.</span></div>'+
    acheck("decl_g","I am the applicant’s parent or legal guardian. I consent to this application and understand that the university’s fees and charges are payable by the dates it sets.")+
    af("decl_g_name","Parent / guardian name",{full:true}):''));
}

function applyErrors(n){
 var v=S.app.v,e={},x=applyProg();
 function need(id,msg){if(!String(v[id]==null?"":v[id]).trim())e[id]=msg||"Please fill this in.";}
 function phone(id){var d=String(v[id]||"").replace(/\D/g,"");if(d&&(d.length<9||d.length>13))e[id]="Enter a phone number with 9 to 13 digits.";}
 function mail(id){var m=String(v[id]||"").trim();if(m&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m))e[id]="Enter an email like name@example.com.";}
 if(n===1){need("prog","Choose a programme.");if(x&&progTracks(x.p).length)need("track","Choose an academic track.");need("intake","Enter the intake month and year.");}
 if(n===2){["name_en","ic","dob","gender","marital","race","religion","nationality","residence"].forEach(function(k){need(k);});
  var a=applyAge(v.dob);if(v.dob&&(a===null||a<10||a>80))e.dob="Check the date of birth.";}
 if(n===3){["mobile","email","addr","town","postcode","state","country"].forEach(function(k){need(k);});
  if(!v.perm_same)["p_addr","p_town","p_postcode","p_state","p_country"].forEach(function(k){need(k);});
  phone("mobile");phone("tel");phone("p_tel");mail("email");}
 if(n===4){["g_name","g_rel","g_mobile"].forEach(function(k){need(k);});phone("g_mobile");phone("g_tel");mail("g_email");
  if(!v.em_same){["e_name","e_rel","e_mobile"].forEach(function(k){need(k);});phone("e_mobile");}}
 if(n===5){var hx=applyExam();if(hx)v.h_results=RX.text(hx);
  ["ed1_school","ed1_from","ed1_to","ed1_qual","h_type","h_status","h_school","h_start","h_end"].forEach(function(k){need(k);});
  need("h_results",hx?(RX.exam(hx).cgpa?"Enter your CGPA.":"Add at least one subject and its grade."):null);
  if(v.disability==="Yes")need("dis_info");}
 if(n===6){UPLOADS.forEach(function(u){if(needFile(u)&&!(S.app.files[u[0]]||[]).length)e["f_"+u[0]]="Please add this document.";});
  if(!v.decl)e.decl="Please tick to confirm.";var a2=applyAge(v.dob);if(a2!==null&&a2<18){if(!v.decl_g)e.decl_g="Your parent or guardian must tick to agree.";need("decl_g_name");}}
 return e;
}

function applySummary(){
 var v=S.app.v,x=applyProg(),L=[];
 function sec(t){L.push("","== "+t+" ==");}
 function row(label,val){val=String(val==null?"":val).trim();if(val)L.push(label+": "+val);}
 L.push("EDUPLAN APPLICATION");
 sec("Programme");row("University",x?(x.u.fullName||x.u.name):"");row("Programme",x?x.p.programme:"");row("Level",x?x.p.level:"");row("Academic track",v.track);row("Intake",v.intake);
 sec("Personal details");row("Name (as on NRIC/passport)",String(v.name_en||"").toUpperCase());row("Chinese name",v.name_zh);row("NRIC / passport no.",v.ic);row("Date of birth",v.dob);
 row("Gender",v.gender);row("Marital status",v.marital);row("Race",v.race);row("Religion",v.religion);row("Nationality",v.nationality);row("Country of permanent residence",v.residence);
 sec("Contact details");row("Mobile",v.mobile);row("Email",v.email);row("Home telephone",v.tel);
 row("Correspondence address",[v.addr,v.postcode+" "+v.town,v.state,v.country].join(", ").replace(/\s*\n\s*/g,", "));
 row("Permanent address",v.perm_same?"Same as correspondence address":[v.p_addr,v.p_postcode+" "+v.p_town,v.p_state,v.p_country].join(", ").replace(/\s*\n\s*/g,", "));row("Home telephone (permanent)",v.perm_same?"":v.p_tel);
 sec("Parent / guardian");row("Name",v.g_name);row("Chinese name",v.g_name_zh);row("Relationship",v.g_rel);row("Mobile",v.g_mobile);row("Email",v.g_email);row("Occupation",v.g_job);row("Home telephone",v.g_tel);
 sec("Emergency contact");if(v.em_same)L.push("Same as parent / guardian");else{row("Name",v.e_name);row("Chinese name",v.e_name_zh);row("Relationship",v.e_rel);row("Mobile",v.e_mobile);row("Home telephone",v.e_tel);}
 sec("Education background");for(var i=1;i<=S.app.edu;i++){if(v["ed"+i+"_school"])L.push(i+". "+v["ed"+i+"_school"]+" | "+(v["ed"+i+"_from"]||"?")+" to "+(v["ed"+i+"_to"]||"?")+" | "+(v["ed"+i+"_qual"]||"-"));}
 sec("Highest qualification");row("Qualification",v.h_type);row("Results",v.h_status);row("Institution",v.h_school);row("Started",v.h_start);row("Completed",v.h_end);
 L.push("Subjects and grades:");String(v.h_results||"").split(/\r?\n/).filter(function(s){return s.trim();}).forEach(function(s){L.push("  "+s.trim());});
 sec("English language");var any=false;for(var j=1;j<=S.app.eng;j++){if(v["en"+j+"_type"]){any=true;L.push(v["en"+j+"_type"]+" | "+(v["en"+j+"_score"]||"-")+" | "+(v["en"+j+"_date"]||"-"));}}if(!any)L.push("None yet");
 sec("Others");row("Disability",v.disability==="Yes"?"Yes: "+(v.dis_info||""):"No");
 sec("Documents");UPLOADS.forEach(function(u){var l=S.app.files[u[0]]||[];L.push((l.length?"[x] ":"[ ] ")+u[1]+(l.length?" ("+l.length+" file"+(l.length===1?"":"s")+")":""));});
 sec("Accommodation");if(v.acc==="Yes"){L.push("Needs help: Yes");row("Type",v.acc_type);row("Room",v.acc_room);row("Budget per month (RM)",v.acc_budget);row("Move-in",v.acc_move);row("Notes",v.acc_notes);}else L.push("Needs help: "+(v.acc||"Not answered"));
 sec("Declaration");L.push("Applicant agreed: Yes");if(v.decl_g)L.push("Parent / guardian agreed: Yes ("+v.decl_g_name+")");
 return L.join("\n");
}

/* Photos are resized (longest side 1800 px, JPEG) so they upload quickly; PDFs and anything that cannot be read as an image are kept as they are. */
function readUpload(file){
 return new Promise(function(done,fail){
  if(file.size>FILE_MAX*3)return fail(new Error("big"));
  var rd=new FileReader();
  rd.onerror=function(){fail(new Error("read"));};
  rd.onload=function(){
   var url=rd.result,keep=function(){if(file.size>FILE_MAX)return fail(new Error("big"));done({name:file.name,type:file.type||"application/octet-stream",size:file.size,data:url.split(",")[1]});};
   if(!/^image\/(jpeg|png|webp|heic|heif)$/i.test(file.type))return keep();
   var img=new Image();
   img.onload=function(){try{var k=Math.min(1,1800/Math.max(img.width,img.height)),c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
     c.getContext("2d").drawImage(img,0,0,c.width,c.height);var out=c.toDataURL("image/jpeg",0.82),b=out.split(",")[1],size=Math.round(b.length*3/4);
     if(size>FILE_MAX)return fail(new Error("big"));done({name:file.name.replace(/\.\w+$/,"")+".jpg",type:"image/jpeg",size:size,data:b});}catch(e){keep();}};
   img.onerror=keep;img.src=url;
  };
  rd.readAsDataURL(file);
 });
}
function filesTotal(){var t=0;Object.keys(S.app.files).forEach(function(k){S.app.files[k].forEach(function(f){t+=f.size;});});return t;}

function progSummary(x){
 return '<div class="pickcard"><span class="eyebrow">'+esc(x.u.fullName||x.u.name)+'</span><h2>'+esc(x.p.programme)+'</h2>'+
  '<div class="meta">'+[x.p.level,x.p.years!=null?years(x.p.years):"",x.p.campus||x.u.place].filter(Boolean).map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</div></div>';
}
/* Ask more (#next/<id>): the step between choosing a programme and applying. */
V.next=function(){
 var x=findProg(S.pick);
 if(!x)return '<section class="stack"><h1>Choose a programme first</h1><p class="lead">Find a programme by faculty, university or scholarship, then come back here.</p><div class="row"><a class="btn" href="#faculty">Browse faculties</a><a class="btn ghost" href="#universities">Browse universities</a></div></section>';
 var note="Interested in: "+x.p.programme+" ("+x.u.name+").";
 return '<section class="stack">'+flowStep("Ask more")+'<div><a class="btn ghost" href="'+esc(sget("eduplan-last")||"#universities")+'">Back</a></div><span class="eyebrow">Your choice</span>'+progSummary(x)+'<div class="row">'+saveBtn(x.p.id)+'</div>'+
  '<h1>Any questions before you apply?</h1><p class="lead">Ask our AI study assistant, talk to a counsellor for free, or go straight to the application form.</p></section>'+
  '<section class="grid">'+
   '<button type="button" class="item pick" data-ask="'+esc("I am interested in "+x.p.programme+" at "+x.u.name+". ")+'"><span class="name">Ask the AI study assistant</span><span class="desc">Quick answers about fees, entry requirements and scholarships, any time.</span><span class="textlink">Open the chat '+ARROW+'</span></button>'+
   '<a class="item pick" href="#consultation" data-topic="Choosing a university" data-note="'+esc(note)+'"><span class="name">Book a free consultation</span><span class="desc">A counsellor goes through your options with you and your family.</span><span class="textlink">Book a time '+ARROW+'</span></a>'+
   '<a class="item pick" href="#apply/'+esc(x.p.id)+'"><span class="name">I am ready to apply</span><span class="desc">Fill in one form and upload your documents. About 10 minutes.</span><span class="textlink">Start the application '+ARROW+'</span></a>'+
  '</section>';
};

V.apply=function(){
 var a=S.app,n=APPLY_STEPS.length;
 return '<section class="stack">'+flowStep("Apply")+'<span class="eyebrow">Apply with Eduplan</span><h1>Application form</h1>'+
  '<p class="lead">One form for your university application. It takes about 10 minutes. '+(PF.s?'Your answers are saved to your portfolio as you type.':'Your answers stay on this device until you close the tab. <a href="#portfolio">Sign in</a> to save them and continue later.')+'</p></section>'+
  '<section class="panel" style="max-width:760px"><div class="formstep"><span>Part '+a.step+' of '+n+': '+esc(APPLY_STEPS[a.step-1])+'</span><span class="bar" aria-hidden="true"><i style="width:'+Math.round(a.step/n*100)+'%"></i></span></div>'+
  '<form class="fields" id="apply-form" novalidate>'+applyStep(a.step)+
  '<div class="row">'+(a.step>1?'<button type="button" class="btn ghost" data-apply="back">Back</button>':'')+
  '<button type="submit" class="btn">'+(a.step<n?'Next':'Continue')+'</button></div></form></section>';
};

/* Accommodation (#stay), then send. */
V.stay=function(){
 var a=S.app,v=a.v;
 var head='<section class="stack">'+flowStep("Accommodation")+'<span class="eyebrow">Apply with Eduplan</span>';
 if(a.sent)return head+'<h1>Application sent</h1><p class="lead">Thank you. Your reference number is <strong>'+esc(a.sent)+'</strong>. A counsellor will contact you about signatures, the application fee and the next steps.</p></section>'+
  '<section class="panel" style="max-width:760px"><div class="row"><button type="button" class="btn ghost" data-apply="clear">Start a new application</button><a class="btn ghost" href="#home">Back to home</a></div></section>';
 if(!a.complete)return head+'<h1>Finish your application first</h1><p class="lead">Accommodation help is the last step of the application.</p><div class="row"><a class="btn" href="#apply">Go to the application form</a></div></section>';
 var x=applyProg();
 return head+'<h1>Do you need help with accommodation?</h1><p class="lead">Eduplan can help you find a hostel or a room near '+esc(x?x.u.name:"your campus")+'.</p></section>'+
  '<section class="panel" style="max-width:760px"><form class="fields" id="stay-form" novalidate>'+
   agroup("Accommodation",af("acc","Do you need accommodation help?",{opts:[["Yes","Yes, please help me"],["No","No, I have arranged it"]],first:"Choose",rerender:true,full:true})+
    (v.acc==="Yes"?af("acc_type","Type",{opts:["On-campus hostel","Rented room near campus","Not sure yet"],first:"Choose"})+af("acc_room","Room",{opts:["Single room","Shared room","No preference"],first:"Choose"})+
     af("acc_budget","Budget per month (RM)",{opt:true,mode:"numeric"})+af("acc_move","Move-in month",{type:"month",opt:true})+af("acc_notes","Anything else",{area:true,rows:2,full:true,opt:true}):''))+
   '<div class="row"><button type="button" class="btn ghost" data-apply="edit">Back to the form</button><button type="submit" class="btn" id="stay-send"'+(a.sending?' disabled':'')+'>'+(a.sending?'Sending…':'Send my application to Eduplan')+'</button></div>'+
   '<p class="muted" id="stay-msg" aria-live="polite">'+(a.sendMsg?esc(a.sendMsg):'')+'</p>'+
  '</form></section>'+(a.fallback?applyFallback():'');
};
/* When the application cannot be sent from this page: share to WhatsApp (phones), or copy / print and send the photos separately. */
function applyFallback(){
 var share=navigator.canShare&&window.File;
 return '<section class="panel" style="max-width:760px"><h2>Send it yourself</h2><p class="muted">Send this summary and your document photos to Eduplan by WhatsApp [YOUR PHONE NUMBER] or email [YOUR EMAIL].</p>'+
  '<pre class="summary" id="apply-summary">'+esc(applySummary())+'</pre>'+
  '<div class="row noprint">'+(share?'<button type="button" class="btn" data-apply="share">Share with documents</button>':'')+
  '<button type="button" class="btn'+(share?' ghost':'')+'" data-apply="copy">Copy summary</button><button type="button" class="btn ghost" data-apply="print">Print or save as PDF</button></div>'+
  '<p class="muted noprint" id="apply-copied" aria-live="polite"></p></section>';
}
function applyFilesForShare(){var out=[];Object.keys(S.app.files).forEach(function(k){S.app.files[k].forEach(function(f){var bin=atob(f.data),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);out.push(new File([u],k+"-"+f.name,{type:f.type}));});});return out;}
/* Sends to the Apps Script (apps-script/Apply.gs), which stores the application in Eduplan's private Google Drive. */
function applySend(){
 var a=S.app,url=window.EDUPLAN_API_URL,files=[];
 Object.keys(a.files).forEach(function(k){a.files[k].forEach(function(f){files.push({doc:k,name:f.name,type:f.type,data:f.data});});});
 var fb=function(msg){a.sending=false;a.fallback=true;a.sendMsg=msg;rerender("stay-msg");};
 if(!url||!window.fetch||window.EDUPLAN_SHEET_DATA)return fb("This preview cannot send files. Please send your application yourself below.");
 a.sending=true;a.sendMsg="";rerender();
 var x=applyProg(),v=a.v;
 fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"apply",summary:applySummary(),files:files,
  fields:{institution:x?x.u.id:"",name:String(v.name_en||"").toUpperCase(),ic:v.ic,mobile:v.mobile,email:v.email,university:x?x.u.name:"",programme:x?x.p.programme:"",track:v.track||"",intake:v.intake,accommodation:v.acc||""}})})
  .then(function(r){return r.json();})
  .then(function(d){if(!d||!d.ref)throw new Error(d&&d.error||"failed");a.sending=false;a.sent=d.ref;a.files={};applySave();rerender();window.scrollTo(0,0);})
  .catch(function(){fb("Your application could not be sent just now. Please send it yourself below, or try again later.");});
}

/* ---------- My portfolio: sign in with an emailed code, and autosave ----------
   Saved programmes, the interest quiz and the consultation request are kept in this browser (localStorage) and the
   application in this tab (sessionStorage), signed in or not. Once the student signs in (#portfolio), every change is
   also saved to their portfolio on Eduplan's server (apps-script/Account.gs), so they can continue on any device.
   Each section (saved, quiz, consult, apply) has its own "changed at" time; the newer copy wins when devices differ.
   Uploaded documents are never saved in the portfolio. Signing out removes the student's details from this browser. */
var PF_KEY="eduplan-session",PF_AT="eduplan-at",PF_SECTIONS=["saved","quiz","consult","apply","results"];
var PF={s:store(PF_KEY),at:store(PF_AT)||{},step:"email",email:"",consent:false,msg:"",err:"",busy:false,dirty:false,saving:false,timer:null,loaded:0,del:false};
if(PF.s&&!(PF.s.token&&PF.s.exp>Date.now()))PF.s=null;
/* The website opens with the sign-in page (pfGate). Guests are let in only when sign-in cannot work: the artifact
   preview, or Eduplan's daily email limit reached / server unreachable (PF.guestOk), so students are never locked out. */
PF.guest=sget("eduplan-guest")==="1";
var SAVED=store("eduplan-saved")||[];
var PF_ERR={bad_email:"Enter an email like name@example.com.",consent:"Please tick to agree first.",code:"Enter the 6-digit code from the email.",
 wait:"A code was sent less than a minute ago. Check your inbox and spam folder, or wait a minute and ask again.",
 too_many:"Too many codes were asked for this email. Please try again in a few hours.",daily_limit:"Sign-in is very busy today. Please try again tomorrow.",
 bad_code:"That code is not right. Use the latest code Eduplan emailed you.",expired:"This code has expired. Ask for a new code.",
 busy:"Eduplan is busy right now. Please try again in a moment.",net:"Eduplan could not be reached. Check your connection and try again.",
 bad_request:"Something went wrong. Please try again."};
var STAR='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z"></path></svg>';

/* Sign-in needs the live website's Apps Script; the Claude artifact preview keeps everything in the browser. */
function pfGate(){return !PF.s&&!PF.guest&&!(HOST&&HOST.noGate);}
function pfLive(){return !!(window.EDUPLAN_API_URL&&window.fetch&&!window.EDUPLAN_SHEET_DATA);}
function pfPost(body,keep){
 return fetch(window.EDUPLAN_API_URL,{method:"POST",keepalive:!!keep,headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)})
  .then(function(r){if(!r.ok)throw new Error("net");return r.json();});
}
function pfQuizResult(){var g=S.guide;if(g.step<QUIZ.questions.length)return "";var r=guidedScore(g.answers,g.tie);return r.close?"":r.picks.map(facLabel).join(", ");}
function pfDoc(){var a=PF.at;return {
 saved:{ids:SAVED.slice(),at:a.saved||0},
 quiz:{step:S.guide.step,answers:S.guide.answers,tie:S.guide.tie||null,result:pfQuizResult(),at:a.quiz||0},
 consult:{f:S.cons,at:a.consult||0},
 apply:{v:S.app.v,step:S.app.step,edu:S.app.edu,eng:S.app.eng,complete:!!S.app.complete,sent:S.app.sent||null,at:a.apply||0},
 results:{exams:RX.get().exams,at:a.results||0}};}
/* Takes the server's sections that are newer than this browser's. union: first sign-in on this device, so the
   programmes saved before signing in are added to the portfolio's. Returns true when something changed. */
function pfUse(d,union){
 d=d||{};var a=PF.at,ch=false;
 function newer(k){return d[k]&&typeof d[k]==="object"&&(Number(d[k].at)||0)>(a[k]||0);}
 if(union&&d.saved&&Array.isArray(d.saved.ids)){var u=uniq(SAVED.concat(d.saved.ids));
  if(u.length!==SAVED.length||u.length!==d.saved.ids.length){SAVED=u;store("eduplan-saved",SAVED);a.saved=Date.now();ch=true;}}
 else if(newer("saved")){SAVED=(d.saved.ids||[]).slice();store("eduplan-saved",SAVED);a.saved=d.saved.at;ch=true;}
 if(newer("quiz")){S.guide={step:d.quiz.step||0,answers:d.quiz.answers||[],tie:d.quiz.tie||null};store("eduplan-quiz",S.guide);a.quiz=d.quiz.at;ch=true;}
 if(newer("results")){RX.use({exams:d.results.exams||{}});a.results=d.results.at;ch=true;}
 if(newer("consult")){S.cons=d.consult.f||{};S.consDone=null;store("eduplan-consult",S.cons);a.consult=d.consult.at;ch=true;}
 if(newer("apply")){var x=d.apply,files=S.app.files;
  try{sessionStorage.setItem(APPLY_KEY,JSON.stringify({v:x.v,step:x.step,edu:x.edu,eng:x.eng,complete:x.complete,sent:x.sent}));}catch(e){}
  S.app=applyLoad();S.app.files=files;a.apply=x.at;ch=true;}
 store(PF_AT,a);
 /* Sections changed here since the portfolio was last saved are sent up. */
 PF_SECTIONS.forEach(function(k){if((a[k]||0)>((d[k]&&Number(d[k].at))||0))PF.dirty=true;});
 return ch;
}
/* Called whenever a section changes; saving waits until the student pauses for a moment. */
function pfTouch(k){
 PF.at=store(PF_AT)||PF.at;   /* another page may have changed it */
 PF.at[k]=Date.now();store(PF_AT,PF.at);
 if(!PF.s||!pfLive())return;
 PF.dirty=true;clearTimeout(PF.timer);PF.timer=setTimeout(pfFlush,1500);
}
function pfFlush(keep){
 clearTimeout(PF.timer);
 if(!PF.s||!PF.dirty||!pfLive())return;
 if(PF.saving){PF.timer=setTimeout(pfFlush,1500);return;}
 PF.saving=true;PF.dirty=false;pfStatus("Saving…");
 pfPost({action:"account_save",token:PF.s.token,data:pfDoc()},keep).then(function(d){
  PF.saving=false;
  if(d&&d.error==="signed_out")return pfSignedOut();
  if(d&&d.error==="too_large")return pfStatus("Your portfolio is too large to save. Please contact Eduplan.",true);
  if(!d||!d.ok)throw new Error("net");
  if(pfUse(d.data)&&S.view==="portfolio")rerender();
  if(PF.dirty)PF.timer=setTimeout(pfFlush,1500);else pfStatus("Saved to your portfolio");
 }).catch(function(){PF.saving=false;PF.dirty=true;pfStatus("Not saved yet. Trying again…",true);PF.timer=setTimeout(pfFlush,15000);});
}
var pfBox=null;
function pfStatus(t,warn){
 if(!pfBox){pfBox=document.createElement("div");pfBox.className="pfstatus";pfBox.setAttribute("role","status");document.body.appendChild(pfBox);}
 pfBox.textContent=t;pfBox.classList.toggle("warn",!!warn);pfBox.classList.add("on");
 clearTimeout(pfBox.hideTimer);if(!warn&&t!=="Saving…")pfBox.hideTimer=setTimeout(function(){pfBox.classList.remove("on");},2500);
 var el=document.getElementById("pf-sync");if(el)el.textContent=t;
}
/* Removes everything personal from this browser (sign out, delete, or a shared computer). */
function pfForget(){
 PF.s=null;PF.dirty=false;PF.del=false;clearTimeout(PF.timer);
 try{["eduplan-session","eduplan-at","eduplan-saved","eduplan-quiz","eduplan-consult","eduplan-results"].forEach(function(k){localStorage.removeItem(k);});sessionStorage.removeItem(APPLY_KEY);}catch(e){}
 RX.use({});
 PF.at={};SAVED=[];S.guide={step:0,answers:[]};S.cons={};S.consDone=null;S.app=applyLoad();
}
/* The session ended on the server (expired, deleted, or signed out on another device): keep the local copy. */
function pfSignedOut(){
 PF.s=null;PF.dirty=false;clearTimeout(PF.timer);try{localStorage.removeItem(PF_KEY);}catch(e){}
 PF.err="You were signed out. Sign in again to keep saving to your portfolio.";
 pfStatus("Signed out",true);if(S.view==="portfolio")rerender();
}
function pfStart(){
 if(!PF.s||!pfLive())return;
 PF.loaded=Date.now();
 pfPost({action:"account_load",token:PF.s.token}).then(function(d){
  if(d&&d.error==="signed_out")return pfSignedOut();
  if(!d||!d.data)return;
  var ch=pfUse(d.data);
  if(PF.dirty)pfFlush();
  var f=document.activeElement;
  if(ch&&!(f&&app.contains(f)&&/^(INPUT|TEXTAREA|SELECT)$/.test(f.tagName)))rerender();
 }).catch(function(){});
}
/* My results changed (assets/js/results.js): save it to the portfolio, fill the application's results, redraw. */
window.addEventListener("eduplan:results",function(){
 pfTouch("results");
 var hx=applyExam();if(hx){S.app.v.h_results=RX.text(hx);if(S.app.err)delete S.app.err.h_results;applySave();}
 if(app.querySelector("#rx,.prog"))render(true);
});
document.addEventListener("visibilitychange",function(){
 if(document.visibilityState==="hidden")pfFlush(true);
 else if(PF.s&&Date.now()-PF.loaded>60000)pfStart();
});

function pfSendCode(email,consent){
 PF.email=String(email||"").trim().toLowerCase();PF.err="";PF.msg="";
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(PF.email)){PF.err=PF_ERR.bad_email;return rerender("pf-email");}
 PF.consent=!!consent;
 if(!PF.consent){PF.err=PF_ERR.consent;return rerender("pf-consent");}
 PF.busy=true;rerender();
 pfPost({action:"account_code",email:PF.email}).then(function(d){
  PF.busy=false;
  if(d&&d.ok){PF.step="code";PF.msg="We emailed a 6-digit code to "+PF.email+". It expires in 10 minutes.";return rerender("pf-code");}
  if(d&&d.error==="wait")PF.step="code";
  if(d&&(d.error==="daily_limit"||d.error==="busy"))PF.guestOk=true;
  PF.err=PF_ERR[d&&d.error]||PF_ERR.bad_request;rerender(PF.step==="code"?"pf-code":"pf-email");
 }).catch(function(){PF.busy=false;PF.guestOk=true;PF.err=PF_ERR.net;rerender(PF.step==="code"?"pf-code":"pf-email");});
}
function pfVerify(code){
 code=String(code||"").replace(/\D/g,"");PF.err="";
 if(code.length!==6){PF.err=PF_ERR.code;return rerender("pf-code");}
 PF.busy=true;rerender();
 pfPost({action:"account_verify",email:PF.email,code:code}).then(function(d){
  PF.busy=false;
  if(!d||!d.token){PF.err=PF_ERR[d&&d.error]||PF_ERR.bad_request;return rerender("pf-code");}
  PF.s={token:d.token,email:d.email,exp:Date.now()+(d.days||30)*864e5};store(PF_KEY,PF.s);
  PF.step="email";PF.msg="";PF.loaded=Date.now();
  pfUse(d.data,true);
  if(PF.dirty)PF.timer=setTimeout(pfFlush,300);
  pfStatus("Signed in. Your progress is saved automatically.");rerender();window.scrollTo(0,0);
 }).catch(function(){PF.busy=false;PF.err=PF_ERR.net;rerender("pf-code");});
}
function pfAction(act){
 if(act==="guest"){PF.guest=true;sset("eduplan-guest","1");PF.err="";rerender();window.scrollTo(0,0);return;}
 if(act==="again"){pfSendCode(PF.email,true);return;}
 if(act==="other"){PF.step="email";PF.err="";PF.msg="";rerender("pf-email");return;}
 if(act==="quiz-restart"){S.guide={step:0,answers:[],tie:null};quizSave();location.hash="#guided";return;}
 if(act==="delete"){PF.del=true;rerender("pf-del-yes");return;}
 if(act==="keep"){PF.del=false;rerender();return;}
 if(act==="logout"){var t=PF.s&&PF.s.token;pfFlush(true);if(t&&pfLive())pfPost({action:"account_logout",token:t}).catch(function(){});
  pfForget();PF.msg="You have signed out. Your details were removed from this browser and stay in your portfolio for next time.";rerender();window.scrollTo(0,0);return;}
 if(act==="delete-yes"){if(!PF.s)return;PF.busy=true;rerender();
  pfPost({action:"account_delete",token:PF.s.token}).then(function(d){PF.busy=false;
   if(!d||!(d.ok||d.error==="signed_out"))throw new Error("net");
   pfForget();PF.msg="Your portfolio was deleted. Applications you already sent stay with Eduplan so a counsellor can process them.";rerender();window.scrollTo(0,0);
  }).catch(function(){PF.busy=false;PF.err=PF_ERR.net;rerender();});}
}
function quizSave(){store("eduplan-quiz",S.guide);pfTouch("quiz");}

/* Save / Saved toggle on programme cards. */
function saveBtn(id){var on=SAVED.indexOf(id)>=0;return '<button type="button" class="btn ghost save" data-save="'+esc(id)+'" aria-pressed="'+on+'">'+STAR+'<span>'+(on?"Saved":"Save")+'</span></button>';}
function toggleSave(id){
 var i=SAVED.indexOf(id),on=i<0;if(on)SAVED.push(id);else SAVED.splice(i,1);
 store("eduplan-saved",SAVED);pfTouch("saved");
 if(S.view==="portfolio")return rerender();
 Array.prototype.forEach.call(app.querySelectorAll("[data-save]"),function(b){if(b.getAttribute("data-save")!==id)return;
  b.setAttribute("aria-pressed",String(on));b.querySelector("span").textContent=on?"Saved":"Save";});
 if(!PF.s)pfStatus(on?"Saved in this browser. Sign in to keep it on any device.":"Removed from your saved programmes");
}

function pfLogin(gate){
 var err=PF.err?'<span class="err" id="pf-err">'+esc(PF.err)+'</span>':'',inv=PF.err?' aria-invalid="true" aria-describedby="pf-err"':'',dis=PF.busy?' disabled':'';
 var msg=PF.msg?'<p class="note" role="status">'+esc(PF.msg)+'</p>':'';
 var guest=gate&&PF.guestOk?'<div class="row"><button type="button" class="btn ghost" data-pf="guest">Continue without signing in</button></div>':'';
 if(!pfLive())return '<section class="panel pflogin"><h2>Sign in</h2><p class="muted">Sign-in works on the live Eduplan website. In this preview, your saved programmes and quiz result stay in this browser.</p>'+
  (gate?'<div class="row"><button type="button" class="btn" data-pf="guest">Continue to the preview</button></div>':'')+'</section>';
 if(PF.step==="code")return '<section class="panel pflogin"><h2>Enter your code</h2>'+msg+
  '<form class="fields" id="pf-code-form" novalidate><div class="field"><label for="pf-code">6-digit code</label>'+
  '<input id="pf-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6"'+inv+'>'+err+'<span class="hint">Sent to <span data-notr>'+esc(PF.email)+'</span>. Check your spam folder if it is not in your inbox.</span></div>'+
  '<div class="row"><button type="submit" class="btn"'+dis+'>'+(PF.busy?'Checking…':'Sign in')+'</button>'+
  '<button type="button" class="btn ghost" data-pf="again"'+dis+'>Send a new code</button><button type="button" class="btn ghost" data-pf="other">Use another email</button></div></form>'+guest+'</section>';
 return '<section class="panel pflogin"><h2>'+(gate?'Sign in to continue':'Sign in or create your portfolio')+'</h2>'+msg+
  '<form class="fields" id="pf-email-form" novalidate><div class="field"><label for="pf-email">Email</label>'+
  '<input id="pf-email" type="email" autocomplete="email" value="'+esc(PF.email)+'"'+(PF.err&&PF.err!==PF_ERR.consent?inv:'')+'>'+(PF.err&&PF.err!==PF_ERR.consent?err:'')+
  '<span class="hint">No password needed. Each time you sign in, we email you a 6-digit code.</span></div>'+
  '<div class="field"><label class="check"><input type="checkbox" id="pf-consent"'+(PF.consent?' checked':'')+(PF.err===PF_ERR.consent?inv:'')+'><span>I agree that Eduplan keeps my portfolio (saved programmes, quiz result, consultation request and application details) to guide me with my studies. I can delete it at any time.</span></label>'+(PF.err===PF_ERR.consent?err:'')+'</div>'+
  '<div class="row"><button type="submit" class="btn"'+dis+'>'+(PF.busy?'Sending…':'Email me a code')+'</button></div></form>'+guest+'</section>';
}
/* The first page of the website until the student signs in. The page they asked for opens after signing in. */
V.gate=function(){
 var intro=!PF.gateShown;PF.gateShown=true;   /* animate only the first time it appears */
 return '<section class="gate'+(intro?' intro':'')+'"><div class="gatecopy stack"><span class="eyebrow">Welcome to Eduplan</span><h1>Find your course, university and scholarship</h1>'+
  '<p class="lead">Sign in with your email to start. It is free, there is no password, and your progress is saved so you can continue on any device.</p>'+
  '<ul class="gatelist">'+["Courses, fees and entry requirements from partner universities","Scholarships you can apply for","An AI study assistant and free counsellors","One application form for your chosen university"]
   .map(function(t,k){return '<li style="--i:'+k+'">'+esc(t)+'</li>';}).join("")+'</ul></div>'+pfLogin(true)+'</section>';
};
function pfCard(title,body){return '<section class="panel pfcard"><h2>'+title+'</h2>'+body+'</section>';}
V.portfolio=function(){
 var head='<section class="stack"><span class="eyebrow">My portfolio</span><h1>'+(PF.s?'Your Eduplan portfolio':'Save your progress')+'</h1>'+
  (PF.s?'<p class="lead">Signed in as <strong data-notr>'+esc(PF.s.email)+'</strong>. Everything you do on Eduplan is saved automatically.</p>'
   :'<p class="lead">Keep your saved programmes, quiz result, consultation request and application in one place, and continue on any device.</p>')+'</section>';
 /* Saved programmes */
 var saved=pfCard("Saved programmes",SAVED.length?'<div class="pfsaved">'+SAVED.map(function(id){var x=findProg(id);
   if(!x)return '<div class="item"><span class="name" data-notr>'+esc(id)+'</span><span class="hint">'+(UNIV.length?'This programme is no longer listed.':'Loading…')+'</span><div class="row">'+saveBtn(id)+'</div></div>';
   return '<div class="item"><span class="eyebrow">'+esc(x.u.name)+'</span><span class="name">'+esc(x.p.programme)+'</span>'+
    '<span class="meta">'+[x.p.level,x.p.years!=null?years(x.p.years):""].filter(Boolean).map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</span>'+
    '<div class="row"><a class="btn" href="#next/'+esc(x.p.id)+'">Choose '+ARROW+'</a>'+saveBtn(id)+'</div></div>';}).join("")+'</div>'
  :'<div class="empty">No saved programmes yet. Tap <strong>Save</strong> on a programme to keep it here.</div><div class="row"><a class="btn ghost" href="#faculty">Browse faculties</a><a class="btn ghost" href="#universities">Browse universities</a></div>');
 /* Interest quiz */
 var g=S.guide,n=QUIZ.questions.length,done=g.answers.filter(function(v){return v!=null;}).length,qr=g.step>=n?guidedScore(g.answers,g.tie):null,quiz;
 if(qr&&!qr.close)quiz='<p class="muted">Faculties that suit your interests:</p><div class="chips">'+qr.picks.map(function(c){return '<a class="chip" href="#faculty/'+esc(c)+'">'+esc(facLabel(c))+'</a>';}).join("")+'</div>'+
  '<div class="row"><a class="btn ghost" href="#guided">See my full result</a><button type="button" class="btn ghost" data-pf="quiz-restart">Take the quiz again</button></div>';
 else if(done)quiz='<p class="muted">'+done+' of '+n+' questions answered.</p><div class="row"><a class="btn" href="#guided">Continue the quiz '+ARROW+'</a></div>';
 else quiz='<p class="muted">Not taken yet. Twelve short questions about what you enjoy.</p><div class="row"><a class="btn ghost" href="#guided">Start the 12 questions</a></div>';
 /* Consultation */
 var c=S.cons,cons=c["cons-name"]?facts([["Name",c["cons-name"]],["Phone",c["cons-phone"]],["Topic",c["cons-topic"]],["Notes",c["cons-msg"]]])+'<div class="row"><a class="btn ghost" href="#consultation">Open my request</a></div>'
  :'<p class="muted">No request yet.</p><div class="row"><a class="btn ghost" href="#consultation">Book a free consultation</a></div>';
 /* Application */
 var a=S.app,x=applyProg(),app2;
 if(a.sent)app2='<div class="note">Application sent. Your reference number is <strong data-notr>'+esc(a.sent)+'</strong>.</div>';
 else if(x)app2='<span class="eyebrow">'+esc(x.u.name)+'</span><h3 class="fname">'+esc(x.p.programme)+'</h3>'+
  '<div class="formstep"><span>'+(a.complete?'Ready to send':'Part '+a.step+' of '+APPLY_STEPS.length+': '+esc(APPLY_STEPS[a.step-1]))+'</span><span class="bar" aria-hidden="true"><i style="width:'+(a.complete?100:Math.round((a.step-1)/APPLY_STEPS.length*100))+'%"></i></span></div>'+
  '<div class="row"><a class="btn" href="'+(a.complete?'#stay':'#apply')+'">'+(a.complete?'Finish and send':'Continue my application')+' '+ARROW+'</a></div>'+
  '<p class="hint">Uploaded documents are not kept in your portfolio. Add them again before you send your application.</p>';
 else app2='<p class="muted">Not started. Choose a programme first, then tap <strong>Choose this programme</strong>.</p>';
 var acct=PF.s?'<section class="panel pfcard"><h2>Account</h2><p class="muted">Status: <span id="pf-sync">'+(PF.dirty||PF.saving?'Saving…':'Saved to your portfolio')+'</span></p>'+
  (PF.del?'<div class="empty"><strong>Delete your portfolio?</strong> Your saved programmes, quiz result, consultation request and unsent application will be deleted from Eduplan. Applications you already sent are not affected.</div>'+
   '<div class="row"><button type="button" class="btn" id="pf-del-yes" data-pf="delete-yes"'+(PF.busy?' disabled':'')+'>Yes, delete my portfolio</button><button type="button" class="btn ghost" data-pf="keep">Keep it</button></div>'
   :'<div class="row"><button type="button" class="btn ghost" data-pf="logout">Sign out</button><button type="button" class="btn ghost" data-pf="delete">Delete my portfolio</button></div>')+
  (PF.err?'<span class="err" role="alert">'+esc(PF.err)+'</span>':'')+
  '<p class="hint">Signing out removes your details from this browser. Please sign out on a shared computer.</p></section>':'';
 return head+(PF.s?'':pfLogin())+
  '<div class="pfgrid">'+pfCard("My results",'<p class="muted">Add your exam results once. Eduplan keeps them until you change them, and uses them to show which programmes and scholarships you qualify for.</p>'+RX.editor())+
   saved+pfCard("Interest quiz",quiz)+pfCard("Free consultation",cons)+pfCard("Application",app2)+'</div>'+
  (PF.s?'':(pfLive()?'<p class="hint">Until you sign in, these are kept in this browser only.</p>':''))+acct;
};

S.app=applyLoad();
S.flow=sget("eduplan-flow")||null;
S.pick=sget("eduplan-pick")||null;

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
 if(r.indexOf("next/")===0){
  var nx=findProg(r.split("/")[1]);
  if(nx){S.pick=nx.p.id;sset("eduplan-pick",S.pick);r="next";}
  else if(UNIV.length)r="next";
 }
 if(r==="apply"||r.indexOf("apply/")===0){
  var pid=r.split("/")[1],hit=pid?allProgs().filter(function(x){return String(x.p.id).toLowerCase()===pid.toLowerCase();})[0]:null;
  if(hit){if(S.app.v.prog!==hit.p.id){S.app.v.prog=hit.p.id;S.app.v.track="";}S.app.step=1;S.app.err={};S.app.complete=false;S.app.sent=null;applySave();r="apply";}
  else if(!pid||UNIV.length)r="apply";   /* before the sheet data arrives, keep the programme in the link */
 }
 view=r.indexOf("next")===0?"next":r.indexOf("apply")===0?"apply":r.indexOf("faculty/")===0?"faculty":r.indexOf("universities/")===0?"universities":r.indexOf("scholarships-")===0?r.split("/")[0]:r;
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
 if(HOST){
  if(HOST.owns(location.hash))return;
  /* The host page may have changed the shared state since this app last drew. */
  SAVED=store("eduplan-saved")||[];PF.s=store(PF_KEY);if(PF.s&&!(PF.s.token&&PF.s.exp>Date.now()))PF.s=null;
  S.guide=store("eduplan-quiz")||S.guide;S.cons=store("eduplan-consult")||S.cons;S.flow=sget("eduplan-flow")||S.flow;S.pick=sget("eduplan-pick")||S.pick;
 }
 var r=route();
 if(r==="faculty")setFlow("faculty");
 else if(r.indexOf("scholarships")===0)setFlow("scholarships");
 else if(r==="universities"&&S.flow!=="scholarships")setFlow("universities");
 if((r==="faculty"&&S.fac&&S.fac.course)||(r==="universities"&&S.uni&&S.uni.level))sset("eduplan-last",location.hash);
 var gate=pfGate();document.body.classList.toggle("gated",gate);
 if(gate)r="gate";
 S.view=r;
 app.innerHTML=V[r]();
 reveal();
 var navKey={"guided":"","home":""}[r];
 if(navKey===undefined)navKey=r.indexOf("scholarships-")===0?"scholarships":r;
 Array.prototype.forEach.call(document.querySelectorAll("nav.main a"),function(a){if(a.getAttribute("data-nav")===navKey)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
 if(!keepScroll){window.scrollTo(0,0);}
 if(HOST&&HOST.rendered)HOST.rendered(r);
}
function rerender(focusId){render(true);if(focusId){var el=document.getElementById(focusId);if(el)el.focus();}}
window.addEventListener("hashchange",function(){render(false);app.focus({preventScroll:true});});

/* ---------- Events (delegated) ---------- */
function readCons(){["cons-name","cons-phone","cons-email","cons-qual","cons-topic","cons-msg"].forEach(function(id){var el=document.getElementById(id);if(el)S.cons[id]=el.value;});consSave();}
function consSave(){store("eduplan-consult",S.cons);pfTouch("consult");}
/* Application form: answers are saved as they are typed; some choices show or hide fields. */
function applyField(t){if(!t.name||!t.closest("#apply-form,#stay-form"))return false;S.app.v[t.name]=t.type==="checkbox"?t.checked:t.value;if(t.name==="prog")S.app.v.track="";applySave();
 /* Clear this field's error as soon as it is answered. */
 if(S.app.err&&S.app.err[t.name]&&(t.type==="checkbox"?t.checked:String(t.value).trim())){delete S.app.err[t.name];t.removeAttribute("aria-invalid");var m=document.getElementById(t.name+"-err");if(m)m.remove();}
 return true;}
app.addEventListener("input",function(ev){applyField(ev.target);});
/* Links into the university pages from a scholarship keep the scholarship route; other links start the university route. */
document.addEventListener("click",function(ev){
 var a=ev.target.closest&&ev.target.closest('a[href^="#"]');if(!a)return;
 if(a.getAttribute("data-flow")==="scholarships"){setFlow("scholarships");sset("eduplan-schback",location.hash);return;}
 if(/^#universities/.test(a.getAttribute("href"))&&(a.closest("header,footer")||!/^#universities/.test(location.hash)))setFlow("universities");
},true);
/* Document uploads: each file is read (photos made smaller) and kept in memory until the application is sent. */
app.addEventListener("change",function(ev){
 var t=ev.target,id=t.getAttribute&&t.getAttribute("data-upload");if(!id||!t.files)return;
 var u=UPLOADS.filter(function(x){return x[0]===id;})[0],list=S.app.files[id]=S.app.files[id]||[],picked=Array.prototype.slice.call(t.files,0,u[2]-list.length),bad="";
 Promise.all(picked.map(function(f){return readUpload(f).then(function(r){if(filesTotal()+r.size>FILES_TOTAL){bad="All your files together can be up to 20 MB.";return;}list.push(r);},function(){bad="That file is too large or cannot be read. Use a photo or a PDF up to 5 MB.";});}))
  .then(function(){S.app.err=S.app.err||{};if(bad)S.app.err["f_"+id]=bad;else delete S.app.err["f_"+id];rerender(list.length<u[2]?"ap-f_"+id:null);});
});
app.addEventListener("change",function(ev){
 var t=ev.target,id=t.id;
 if(applyField(t)){if(t.hasAttribute("data-rerender"))rerender(t.id);return;}
 if(id&&id.indexOf("cons-")===0){readCons();}
});
app.addEventListener("click",function(ev){
 var t=ev.target.closest("button,a");if(!t)return;
 if(t.hasAttribute("data-save")){toggleSave(t.getAttribute("data-save"));return;}
 if(t.hasAttribute("data-pf")){pfAction(t.getAttribute("data-pf"));return;}
 if(t.hasAttribute("data-ask")){window.dispatchEvent(new CustomEvent("eduplan:ask",{detail:{text:t.getAttribute("data-ask")}}));return;}
 if(t.hasAttribute("data-apply")){var act=t.getAttribute("data-apply"),A=S.app;
  if(act==="back"){A.err={};A.step=Math.max(1,A.step-1);applySave();rerender();window.scrollTo(0,0);}
  else if(act==="add-edu"){A.edu=Math.min(5,A.edu+1);applySave();rerender("ap-ed"+A.edu+"_school");}
  else if(act==="add-eng"){A.eng=Math.min(3,A.eng+1);applySave();rerender("ap-en"+A.eng+"_type");}
  else if(act==="edit"){A.fallback=false;A.sendMsg="";location.hash="#apply";}
  else if(act==="rmfile"){var fp=t.getAttribute("data-file").split(":");(A.files[fp[0]]||[]).splice(Number(fp[1]),1);rerender("ap-f_"+fp[0]);}
  else if(act==="share"){navigator.share({title:"Eduplan application",text:applySummary(),files:applyFilesForShare()}).catch(function(){});}
  else if(act==="clear"){try{sessionStorage.removeItem(APPLY_KEY);}catch(e){}S.app=applyLoad();applySave();location.hash="#apply";}
  else if(act==="print")window.print();
  else if(act==="copy"){var out=document.getElementById("apply-copied"),fb=function(){var pre=document.getElementById("apply-summary"),rg=document.createRange();rg.selectNodeContents(pre);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(rg);out.textContent="The summary is selected. Press Ctrl+C (or long-press on a phone) to copy it.";};
   try{navigator.clipboard.writeText(applySummary()).then(function(){out.textContent="Copied. Paste it into WhatsApp or an email to Eduplan.";},fb);}catch(e){fb();}}
  return;}
 if(t.hasAttribute("data-jump")){var g=app.querySelector('.facgroup[data-fac="'+t.getAttribute("data-jump")+'"]');if(g){var hd=document.querySelector("header.site"),off=(hd&&getComputedStyle(hd).position==="sticky"?hd.offsetHeight:0)+12;
  window.scrollTo({top:g.getBoundingClientRect().top+window.pageYOffset-off,behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth"});var sm=g.querySelector("summary");if(sm)sm.focus({preventScroll:true});}return;}
 if(t.hasAttribute("data-foldall")){var o=t.getAttribute("data-foldall")==="open";Array.prototype.forEach.call(app.querySelectorAll("details.fold"),function(d){d.open=o;});return;}
 if(t.hasAttribute("data-schtype")){S.schType=t.getAttribute("data-schtype");location.hash="#scholarships-"+S.schType;return;}
 if(t.hasAttribute("data-schq")||t.hasAttribute("data-schl")){var k=t.hasAttribute("data-schq")?"schQ":"schL";S[k]=t.getAttribute(k==="schQ"?"data-schq":"data-schl");render(true);
  var f=app.querySelector('[data-'+k.toLowerCase()+'="'+S[k]+'"]');if(f)f.focus();return;}
 if(t.hasAttribute("data-ans")){S.guide.answers[S.guide.step]=Number(t.getAttribute("data-ans"));quizSave();rerender("guide-next");return;}
 if(t.id==="guide-next"){S.guide.step++;quizSave();rerender();app.focus({preventScroll:true});return;}
 if(t.hasAttribute("data-tie")){S.guide.tie=t.getAttribute("data-tie");quizSave();rerender();window.scrollTo(0,0);return;}
 if(t.id==="guide-back"){S.guide.tie=null;S.guide.step=Math.min(Math.max(0,S.guide.step-1),QUIZ.questions.length-1);quizSave();rerender();return;}
 if(t.id==="guide-restart"){S.guide={step:0,answers:[],tie:null};quizSave();rerender();window.scrollTo(0,0);return;}
 if(t.hasAttribute("data-topic")){S.cons["cons-topic"]=t.getAttribute("data-topic");var n=t.getAttribute("data-note");if(n&&!S.cons["cons-msg"])S.cons["cons-msg"]=n;S.consDone=null;consSave();return;}
 if(t.id==="cons-edit"){S.consDone=null;rerender("cons-name");return;}
 if(t.id==="cons-copy"){var txt=S.consDone,out=document.getElementById("cons-copied");
  var fallback=function(){var pre=document.getElementById("cons-summary"),rg=document.createRange();rg.selectNodeContents(pre);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(rg);out.textContent="The summary is selected. Press Ctrl+C (or long-press on a phone) to copy it.";};
  try{navigator.clipboard.writeText(txt).then(function(){out.textContent="Copied. Paste it into WhatsApp or an email to Eduplan.";},fallback);}catch(e){fallback();}
  return;}
});
app.addEventListener("submit",function(ev){
 if(ev.target.id==="apply-form"){ev.preventDefault();var A=S.app,er=applyErrors(A.step),k=Object.keys(er)[0];A.err=er;
  if(k){rerender("ap-"+k);return;}
  if(A.step<APPLY_STEPS.length){A.step++;applySave();rerender();window.scrollTo(0,0);var f=app.querySelector("#apply-form input,#apply-form select,#apply-form textarea");if(f)f.focus({preventScroll:true});}
  else{A.complete=true;applySave();location.hash="#stay";}
  return;}
 if(ev.target.id==="pf-email-form"){ev.preventDefault();var pe=document.getElementById("pf-email"),pc=document.getElementById("pf-consent");pfSendCode(pe?pe.value:"",pc&&pc.checked);return;}
 if(ev.target.id==="pf-code-form"){ev.preventDefault();var pk=document.getElementById("pf-code");pfVerify(pk?pk.value:"");return;}
 if(ev.target.id==="stay-form"){ev.preventDefault();var B=S.app,es={};
  if(!B.v.acc)es.acc="Please choose one.";if(B.v.acc==="Yes"){if(!B.v.acc_type)es.acc_type="Please choose one.";if(!B.v.acc_room)es.acc_room="Please choose one.";}
  B.err=es;var k2=Object.keys(es)[0];if(k2){rerender("ap-"+k2);return;}
  if(!B.sending)applySend();
  return;}
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
   deadline:p.application_deadline,mqa:p.mqa_reference,url:p.apply_url,notes:p.notes,course_id:p.course_id,id:p.programme_id};
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
pfStart();
if(window.EDUPLAN_API_URL&&window.fetch){
 fetch(window.EDUPLAN_API_URL).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
  .then(function(d){if(applyApi(d))render(true);})
  .catch(function(){/* keep the local data */});
}
})();
