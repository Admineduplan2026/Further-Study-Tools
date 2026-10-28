(function(){
"use strict";
/* ---------- Data (sample; replace with real partner data) ---------- */
var UNIS=[
 {id:"a",name:"Sample University A",city:"Kuala Lumpur",fields:["med","sci","biz"],hostel:"On-campus hostel",rent:450},
 {id:"b",name:"Sample University B",city:"Penang",fields:["eng","cs","sci"],hostel:"On-campus hostel",rent:380},
 {id:"c",name:"Sample College C",city:"Johor Bahru",fields:["biz","hosp","comm"],hostel:"Partner hostel, 10 minutes by shuttle",rent:520},
 {id:"d",name:"Sample University D",city:"Selangor",fields:["design","comm","cs"],hostel:"On-campus hostel",rent:480},
 {id:"e",name:"Sample College E",city:"Kuching",fields:["edu","biz","hosp"],hostel:"On-campus hostel",rent:300},
 {id:"f",name:"Sample University F",city:"Kuala Lumpur",fields:["law","biz","edu"],hostel:"No hostel. EDUPLAN helps you find a rented room nearby",rent:null}
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
 '<section class="section"><h2>How EDUPLAN works</h2><div class="threeup">'+
  '<div class="stack"><span class="n">Step 1</span><h3>Tell us where you are</h3><p class="muted">Pick the tool that fits you: you need funding, you know what you like, or you are not sure yet.</p></div>'+
  '<div class="stack"><span class="n">Step 2</span><h3>See your matches</h3><p class="muted">Get a short list of courses, universities and scholarships that fit your answers.</p></div>'+
  '<div class="stack"><span class="n">Step 3</span><h3>Talk to a counsellor</h3><p class="muted">Book a free consultation. We guide you from application to registration.</p></div>'+
 '</div></section>';
};
/* About Us: founder profile, from his Facebook profile. photo is an image path (empty shows a placeholder); honours are shown as pills. */
var FOUNDER={name:"Jason Ng Jiann Sheng, PJM",role:"Founder & CEO",photo:"assets/img/founder.jpg",
 bio:"Founder and CEO of EDUPLAN, where he has led student guidance as Chief Education Advisor since May 2020. He has worked in higher education recruitment and student guidance since 2015, at BERJAYA University College, Xiamen University Malaysia and FSI Center 升学情报.",
 honours:[],
 career:[
  {title:"Chief Education Advisor",org:"EDUPLAN",when:"May 2020 – Present"},
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
 return '<div class="founder"><div class="avatar">'+(f.photo?'<img src="'+esc(asset(f.photo))+'" alt="'+esc(f.name)+', '+esc(f.role)+' of EDUPLAN">'
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
 '<section class="stack" data-reveal><span class="eyebrow">About Us</span><h1>We lead students to the right place to study</h1><p class="lead">EDUPLAN is an education tool that guides students to a suitable institution, from learning about it to the registration phase. The service is free of charge for students.</p></section>'+
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
 faculty:["Faculty","Courses","University & programme","Ask more","Apply","Accommodation","Payment"],
 universities:["Universities","University","Programme","Ask more","Apply","Accommodation","Payment"],
 scholarships:["Scholarship","Scholarship type","Requirements","University","Programme","Ask more","Apply","Accommodation","Payment"]
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
 (UNIV.length?'<section class="grid unigrid">'+UNIV.map(function(u){var n=uniScholarships(u);
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
var API_DONE=!(window.EDUPLAN_API_URL&&window.fetch&&!window.EDUPLAN_SHEET_DATA);  /* true once the live sheet data has arrived (or failed) */
var CAMPUS_PHOTOS={xmum:"assets/img/campus/xmum.jpg",utar:"assets/img/campus/utar.jpg",apu:"assets/img/campus/apu.jpg",mucm:"assets/img/campus/mucm.jpg"};
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
/* Student accommodation from the institution's own document (accommodation-data.js): rooms and rent, fees and
   refunds, facilities, how the rent is paid, rent per semester, contact and photos. "" when there is none. */
function accomData(id){var A=window.EDUPLAN_ACCOM||{};return A[String(id||"").toUpperCase()]||null;}
function accomFrom(id){var a=accomData(id);return a?Math.min.apply(null,a.rooms.map(function(r){return r.rent;})):null;}
function accomBox(id){var a=accomData(id);if(!a)return "";
 function ul(l){return '<ul class="aclist">'+l.map(function(x){return '<li>'+esc(x[0])+'</li>';}).join("")+'</ul>';}
 return '<div class="accom">'+
  '<div class="tablewrap"><table class="actable"><caption class="sr">Student accommodation</caption><thead><tr><th scope="col">Room type</th><th scope="col">Monthly rent per student</th><th scope="col">Deposit</th><th scope="col">Room size</th></tr></thead><tbody>'+
   a.rooms.map(function(r){return '<tr><th scope="row"><span>'+esc(r.name[0])+'</span><br><small>'+esc(r.note[0])+'</small></th><td data-notr>'+esc(rm(r.rent))+'</td><td data-notr>'+esc(rm(r.deposit))+'</td><td data-notr>'+r.size+' m²</td></tr>';}).join("")+'</tbody></table></div>'+
  '<div class="acgrid"><div><h4>Facilities</h4>'+ul(a.facilities)+'</div><div><h4>Fees and refunds</h4>'+ul(a.fees)+'<h4>Paying the rent</h4>'+ul(a.payment)+'</div></div>'+
  '<h4>Rent charged per semester</h4><div class="tablewrap"><table class="actable"><thead><tr><th scope="col">Programme</th><th scope="col">Semester</th><th scope="col">Rent charged</th></tr></thead><tbody>'+
   a.terms.map(function(t){return t[1].map(function(sm,i){return '<tr>'+(i?'':'<th scope="rowgroup" rowspan="'+t[1].length+'">'+esc(t[0][0])+'</th>')+'<td>'+esc(sm[0][0])+'</td><td>'+sm[1]+(sm[1]===1?' month':' months')+'</td></tr>';}).join("");}).join("")+'</tbody></table></div>'+
  '<h4>Photos</h4><div class="acphotos">'+a.photos.map(function(ph){return '<figure><img src="'+esc(asset(ph[0]))+'" alt="'+esc(ph[1][0])+'" loading="lazy"><figcaption>'+esc(ph[1][0])+'</figcaption></figure>';}).join("")+'</div>'+
  '<h4>Contact the accommodation office</h4><p><a href="mailto:'+esc(a.contact.email)+'">'+esc(a.contact.email)+'</a><br><span data-notr>'+esc(a.contact.phones)+'</span><br><span class="hint">'+esc(a.contact.hours[0])+'</span></p>'+
  '<p class="hint"><span>Source:</span> <span>'+esc(a.source[0])+'</span>. <span>Rules and fees can change. Please confirm with the university before you book.</span></p></div>';}
/* The same, folded: one line with the lowest rent, opened by a tap (several institutions can sit on one page). */
function accomFold(id,title){return accomData(id)?accItem("accom","🏠",title||"Student accommodation",'<span>from</span> <span data-notr>'+esc(rm(accomFrom(id)))+'</span> <span>a month</span>',accomBox(id)):'';}
window.EDUPLAN_ACCOMBOX=accomBox;window.EDUPLAN_ACCOMFOLD=accomFold;
function uniPage(u){
 var n=uniScholarships(u);
 return uniHead(u,2,"#universities")+(hasBanner(u)?'':'<h1>'+esc(u.name)+'</h1>'+(u.fullName!==u.name?'<p class="lead">'+esc(u.fullName)+'</p>':''))+
 (hasBanner(u)?'':uniMeta(u))+'</section>'+
 uniTour(u,u.name,u.fullName!==u.name?u.fullName:"",uniMeta(u))+
 '<section class="panel">'+facts([["Website",u.website],["Admissions email",u.email],["Admissions phone",u.phone],["WhatsApp",u.whatsapp],["Last updated",u.lastUpdated]])+
  '<div class="row">'+(u.website?'<a class="btn ghost" href="'+esc(u.website)+'" target="_blank" rel="noopener">Official website '+ARROW+'</a>':'')+
  (n?'<a class="btn ghost" href="#scholarships-campus/'+esc(u.id.toLowerCase())+'">Scholarships ('+n+') '+ARROW+'</a>':'')+'</div></section>'+
 (accomData(u.id)?'<section class="section accwrap">'+accomFold(u.id)+'</section>':'')+
 '<section class="section"><h2>Choose a study level</h2><div class="grid">'+LEVELS.map(function(L){
  var ps=u.progs.filter(function(p){return uniLevel(p.level)[0]===L[0];});
  var subs=L[2].map(function(sl){var k=ps.filter(function(p){return uniLevel(p.level)[1]===sl;}).length;return k?'<span class="pill">'+esc(sl)+' · '+k+'</span>':'';}).join("");
  return '<a class="item pick" href="#universities/'+esc(u.id.toLowerCase())+'/'+L[0]+'"><span class="name">'+L[1]+'</span>'+
   '<span class="desc">'+esc(L[2].join(" / "))+'</span>'+
   '<span class="meta"><span class="pill brand">'+ps.length+' programme'+(ps.length===1?'':'s')+'</span>'+subs+'</span>'+
   '<span class="textlink">View programmes '+ARROW+'</span></a>';}).join("")+'</div></section>';
}
/* Sub-level in the address: "Bachelor's Degree" -> "bachelor", "Master's Degree" -> "master", "PhD" -> "phd". */
function subSlug(sl){return String(sl).split(/[\s']/)[0].toLowerCase();}
/* Page 3 buttons: all programmes of the level, or one sub-level (e.g. Diploma or Bachelor's Degree). Shown when the level has more than one. */
function subChips(u,lv,all,cur){var base="#universities/"+esc(u.id.toLowerCase())+"/"+lv;
 var have=all.map(function(p){return uniLevel(p.level)[1];}),list=uniq(have);if(list.length<2)return '';
 var L=LEVELS.filter(function(x){return x[0]===lv;})[0];list.sort(function(a,b){return L[2].indexOf(a)-L[2].indexOf(b);});
 return '<div class="chips subchips" role="group" aria-label="Programme type"><a class="chip" href="'+base+'"'+(cur?'':' aria-current="page"')+'>All · '+all.length+'</a>'+
  list.map(function(sl){var n=have.filter(function(h){return h===sl;}).length;return '<a class="chip" href="'+base+'/'+subSlug(sl)+'"'+(cur===subSlug(sl)?' aria-current="page"':'')+'>'+esc(sl)+' · '+n+'</a>';}).join("")+'</div>';}
function uniLevelPage(u,lv){
 var L=LEVELS.filter(function(x){return x[0]===lv;})[0],all=u.progs.filter(function(p){return uniLevel(p.level)[0]===lv;}),cur=S.uni&&S.uni.sub;
 var ps=cur?all.filter(function(p){return subSlug(uniLevel(p.level)[1])===cur;}):all;
 var subs=uniq(L[2].concat(ps.map(function(p){return uniLevel(p.level)[1];})));
 return uniHead(u,3,"#universities/"+esc(u.id.toLowerCase()))+(hasBanner(u)?'':'<h1>'+esc(u.name)+' · '+L[1]+'</h1><p class="lead">'+esc(L[2].join(" / "))+'</p>')+
 '<div class="chips" role="group" aria-label="Study level">'+LEVELS.map(function(x){return '<a class="chip" href="#universities/'+esc(u.id.toLowerCase())+'/'+x[0]+'"'+(x[0]===lv?' aria-current="page"':'')+'>'+x[1]+'</a>';}).join("")+'</div>'+subChips(u,lv,all,cur)+'</section>'+
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
 return '<ol class="stepper" aria-label="Progress">'+names.map(function(n,k){var cur=k+1===step;return '<li'+(cur?' aria-current="step"':(k+1<step?' class="done"':''))+'><span aria-hidden="true">'+(k+1)+'</span><span class="stl">Page '+(k+1)+': '+esc(n)+'</span></li>';}).join("")+'</ol>';
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
/* Foundation Page 3: one card per scholarship with what it gives and its closing date; Page 4
   (#scholarships-foundation/<id>) lists its requirements and award. The award cell's first line is its summary;
   more lines give the details. A search box narrows the list. */
var MON=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fsDeadline(d){var m=String(d||"").match(/^(\d{4})-(\d{2})-(\d{2})$/);if(!m)return d?{t:"Closing date: "+d}:null;
 var dt=new Date(+m[1],+m[2]-1,+m[3]),txt=(+m[3])+" "+MON[+m[2]-1]+" "+m[1],now=new Date();now.setHours(0,0,0,0);
 return dt<now?{t:"Closed on "+txt,closed:true}:{t:"Closes "+txt};}
function schItemList(t){
 var items=t.items.filter(function(it){return it.name;});
 return schHead(3,t,"#scholarships")+'<h1>Choose a foundation scholarship</h1><p class="lead">'+esc(t.desc)+'. Each card shows what the scholarship gives; tap it to see who can apply and every requirement.</p>'+
 (items.length>6?'<label class="field fsq"><span>Search scholarships</span><input id="fs-q" type="search" autocomplete="off" placeholder="e.g. engineering, B40, SPM, Petronas" value="'+esc(S.fsq||"")+'"></label><p class="hint" id="fs-n" aria-live="polite"></p>':'')+'</section>'+
 (items.length?'<section class="grid">'+items.map(function(it){var aw=lines(it.award),dl=fsDeadline(it.deadline);
   var hay=[it.name,it.organiser,it.award,lines(it.requirements).join(" ")].join(" ").toLowerCase();
   return '<a class="item pick fsitem" data-hay="'+esc(hay)+'" href="#scholarships-'+esc(t.id)+'/'+esc(String(it.id).toLowerCase())+'"><span class="name">'+esc(it.name)+'</span>'+
   (it.organiser?'<span class="desc">'+esc(it.organiser)+'</span>':'')+
   '<span class="fsaward"><span class="k">Award</span><b>'+esc(aw[0]||"See official information")+'</b></span>'+
   '<span class="meta"><span class="pill">'+lines(it.requirements).length+' requirement'+(lines(it.requirements).length===1?'':'s')+'</span>'+(dl?'<span class="pill'+(dl.closed?'':' brand')+'">'+esc(dl.t)+'</span>':'')+'</span>'+
   '<span class="textlink">Requirements and award '+ARROW+'</span></a>';}).join("")+'</section>'
  :'<div class="empty">No foundation scholarships listed yet.</div>');
}
function schReq(t,it){var aw=lines(it.award),dl=fsDeadline(it.deadline);
 return schHead(4,t,"#scholarships-"+esc(t.id))+'<h1>'+esc(it.name)+'</h1>'+(it.organiser?'<p class="lead">'+esc(it.organiser)+'</p>':'')+'</section>'+
 '<section class="panel fsreq"><h2>Award: what you get</h2>'+(aw.length?reqList(aw):'<p class="muted">See official information.</p>')+'</section>'+
 '<section class="panel"><h2>Requirements</h2>'+reqList(lines(it.requirements))+
  facts([["Application deadline",dl?dl.t:""],["Last updated",it.lastUpdated]])+(t.id==="foundation"?'<p class="hint">Information is for reference only. Please confirm with the official website.</p>':'')+
  '<div class="row">'+(it.url?'<a class="btn" href="'+esc(it.url)+'" target="_blank" rel="noopener">Official information '+ARROW+'</a>':'<span class="hint">Official website link to be added.</span>')+'</div>'+(t.id==="foundation"?'':SCH_NOTE)+'</section>'+
 '<section class="panel"><h2>Next: choose a university</h2><p class="muted">Find a university and programme to apply to with this scholarship.</p>'+
  '<div class="row"><a class="btn" href="#universities" data-flow="scholarships">Choose a university '+ARROW+'</a><a class="btn ghost" href="#consultation" data-topic="Scholarships" data-note="'+esc("Interested in: "+it.name+".")+'">Ask a counsellor</a></div></section>';
}
/* Page 3 search: hide the cards that do not contain every word typed. */
function fsFilter(){var q=document.getElementById("fs-q");if(!q)return;S.fsq=q.value;var ws=q.value.toLowerCase().split(/\s+/).filter(Boolean),n=0,all=0;
 [].slice.call(document.querySelectorAll(".fsitem")).forEach(function(a){var h=a.getAttribute("data-hay")||"",ok=ws.every(function(w){return h.indexOf(w)>=0;});a.hidden=!ok;all++;if(ok)n++;});
 var o=document.getElementById("fs-n");if(o)o.textContent=ws.length?(n?n+" of "+all+" scholarships match.":"No scholarship matches. Try another word."):"";}
document.addEventListener("input",function(ev){if(ev.target&&ev.target.id==="fs-q")fsFilter();});
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
function schPanel(g,opt,open){
 var tr=g.tiers,spm=tr.every(function(r){return /^SPM /.test(r.result);}),waiver=tr.every(function(r){return r.waiver!=null;}),
  all=tr.map(function(r){return lines(r.conditions);}),
  cond=uniq([].concat.apply([],all)).filter(function(c){return all.every(function(l){return l.indexOf(c)>=0;});}),
  applies=uniq(tr.map(function(r){return r.applies;}).filter(Boolean)),dl=uniq(tr.map(function(r){return r.deadline;}).filter(Boolean));
 var byLevel=opt&&opt.head&&applies.length===1,w=tr.filter(function(r){return r.waiver!=null;}).map(function(r){return r.waiver;}),best=w.length?Math.max.apply(null,w):null;
 var hint=[tr.length+(tr.length===1?" tier":" tiers"),best!=null?"up to "+best+"% tuition waiver":""].filter(Boolean).join(" · ");
 return accItem("sch","🎓",esc(byLevel?applies[0]:g.name||"Scholarship tiers"),esc(hint),(byLevel&&g.name?'<span class="eyebrow">'+esc(g.name)+'</span>':'')+
 '<table class="tiers"><thead><tr><th scope="col">'+esc(opt&&opt.head||(spm?'SPM result':'Eligibility'))+'</th><th scope="col">'+(waiver?'Tuition waiver':'Award')+'</th></tr></thead><tbody>'+
  tr.map(function(r,k){var own=all[k].filter(function(c){return cond.indexOf(c)<0;});
   return '<tr><td>'+esc(opt&&opt.head?r.min||r.result:r.result)+own.map(function(c){return '<br><span class="hint">'+esc(c)+'</span>';}).join("")+'</td><td>'+(r.waiver==null&&r.amount==null?'<span class="hint">'+esc(schTierCell(r))+'</span>':'<span class="big">'+esc(schTierCell(r))+'</span>')+'</td></tr>';}).join("")+'</tbody></table>'+
 facts([["Applies to",byLevel?"":applies.join("; ")],["Application deadline",dl.join("; ")]])+
 (cond.length?'<h3>Conditions</h3>'+reqList(cond):''),open);
}
/* Folding scholarship sections with Expand all; the first one starts open. */
function schAccs(groups,opt){return '<div class="accwrap"><div class="accbar"><span class="hint">Tap a scholarship to see its tiers and conditions.</span><button type="button" class="linkbtn" data-accall>Expand all</button></div><div class="accs">'+
 groups.map(function(g,i){return schPanel(g,opt,i===0);}).join("")+'</div></div>';}
/* Universities whose tiers carry no study level: pick a qualification (SPM, O-Level, UEC ...) to see its tiers only. */
function schByQual(u){
 var qk=function(r){return r.qual&&r.qual!=="Other"?r.qual:"Others";},quals=uniq(u.tiers.map(qk)).sort(function(a,b){var i=SCH_QUALS.indexOf(a),j=SCH_QUALS.indexOf(b);return (i<0?99:i)-(j<0?99:j)||(a<b?-1:1);});
 if(quals.length<2)return schAccs(schGroupBy(u.tiers));
 var q=quals.indexOf(S.schQ)>=0?S.schQ:quals[0];
 return '<section class="panel"><h2>Find your scholarship</h2><h3>Your qualification</h3><div class="chips qchips" role="group" aria-label="Qualification">'+
  quals.map(function(x){return '<button type="button" class="chip" data-schq="'+esc(x)+'" aria-pressed="'+(x===q)+'">'+esc(x)+'</button>';}).join("")+'</div></section>'+
  '<div aria-live="polite">'+schAccs(schGroupBy(u.tiers.filter(function(r){return qk(r)===q;})),q==="Others"?null:{head:q+" result"})+'</div>';}
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
  '<div aria-live="polite">'+schAccs(schGroupBy(others))+'</div>';
 var rows=staged.filter(function(r){return schLevel(r)===L&&r.qual===q;}),preu=false;
 if(!rows.length&&L==="undergraduate"&&SCH_SECONDARY.indexOf(q)>=0){rows=staged.filter(function(r){return schLevel(r)===L&&SCH_PREU.indexOf(r.qual)>=0;});preu=rows.length>0;}
 var head=preu?"Result":q+" result";
 return '<section class="panel"><h2>Find your scholarship</h2>'+
  '<h3>Your qualification</h3><div class="chips" role="group" aria-label="Qualification">'+quals.map(function(x){return '<button type="button" class="chip" data-schq="'+esc(x)+'" aria-pressed="'+(x===q)+'">'+esc(x)+'</button>';}).join("")+'</div>'+tabs+'</section>'+
 '<div aria-live="polite">'+
 (preu?'<div class="empty">'+esc(q)+' holders start a degree after Foundation, Matriculation or Diploma. At undergraduate level the scholarship is based on that result. <button type="button" class="chip" data-schl="foundation">See Foundation level for '+esc(q)+'</button></div>':'')+
 (rows.length?schAccs(schGroupBy(rows),{head:head})
  :'<div class="empty">'+esc(u.name)+'’s scholarship table lists no '+esc(lv?lv[1]:L)+' programme award for '+esc(q)+'. <button type="button" class="chip" data-schl="'+(L==="foundation"?"undergraduate":"foundation")+'">See '+(L==="foundation"?"Undergraduate":"Foundation")+' level</button></div>')+
 '</div>';
}
function schDetails(t,u){
 var site=u.website||(u.tiers.filter(function(r){return r.url;})[0]||{}).url;
 return schHead(4,t,"#scholarships-"+esc(t.id))+'<h1>'+esc(u.name)+'</h1>'+(u.fullName&&u.fullName!==u.name?'<p class="lead">'+esc(u.fullName)+'</p>':'')+
 ((u.type||u.place)?'<div class="meta">'+[u.type,u.place].filter(Boolean).map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</div>':'')+'</section>'+
 (u.tiers.some(schLevel)?schFilter(u):schByQual(u))+
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
 '<section class="grid facgrid">'+FAC.fields.map(function(f){return '<a class="item pick" style="--h:'+((Number(f.code)*33+190)%360)+'" href="#faculty/'+esc(f.code)+'"><span class="big">'+esc(f.code)+'</span><span class="name">'+esc(f.name)+'</span><span class="desc">'+esc(f.zh)+'</span><span class="hint">'+f.courses.length+' course'+(f.courses.length===1?'':'s')+'</span></a>';}).join("")+'</section>';
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
/* Programme structure from the sheet: a line ending in ":" (Year 1:, Semester 2:) starts a block, the lines under it are its subjects. */
function progStructure(u){
 var groups=[],g=null;
 lines(u.structure).forEach(function(x){if(/[:：]$/.test(x)){g={h:x.replace(/[:：]$/,""),items:[]};groups.push(g);}else{if(!g){g={h:"",items:[]};groups.push(g);}g.items.push(x.replace(/^[•·*▪◦–-]\s*/,""));}});
 if(!groups.length)return '<p class="hint">The institution has not listed the programme structure yet.'+(u.url?' <a href="'+esc(u.url)+'" target="_blank" rel="noopener">See the programme page</a>.':'')+'</p>';
 return '<div class="pstruct">'+groups.map(function(g){return '<div class="psb">'+(g.h?'<b>'+esc(g.h)+'</b>':'')+(g.items.length?'<ul>'+g.items.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul>':'')+'</div>';}).join("")+'</div>';
}
/* fold: the university pages list many programmes, so each card starts closed and opens to show the details. */
/* Future pathway and careers: the next study step for the level, a professional step for some courses, and the careers.
   The institution's own career list comes first; without one, EDUPLAN's general guide for the course (career-data.js),
   always labelled as general. */
function careerData(){return window.EDUPLAN_CAREERS||{careers:{},pro:{},next:{}};}  /* read at draw time */
function careerList(cid,text){var own=lines(text).map(function(x){return x.replace(/^[•·*▪◦–-]\s*/,"");});
 if(own.length)return {list:own,general:false};var g=(careerData().careers[cid]||[]).map(function(c){return c[0];});return {list:g,general:g.length>0};}
function pathway(cid,level,text){var c=careerList(cid,text),C=careerData(),nx=C.next[level],pro=C.pro[cid],pre=/^Pre-university/.test(level||"");
 if(!c.list.length&&!nx&&!pro)return "";
 return '<div class="pway">'+(nx?'<div class="pwstep"><span class="pwi" aria-hidden="true">🎓</span><div><b>Your next study step</b><p>'+esc(nx[0])+'</p></div></div>':'')+
  (pro&&!pre?'<div class="pwstep"><span class="pwi" aria-hidden="true">🏅</span><div><b>Professional step</b><p>'+esc(pro[0])+'</p></div></div>':'')+
  (c.list.length?'<div class="pwstep"><span class="pwi" aria-hidden="true">💼</span><div><b>'+(c.general?'Common careers':'Careers listed by the institution')+'</b><ul class="pcareer pwjobs">'+c.list.map(function(x){return '<li>'+esc(x)+'</li>';}).join("")+'</ul>'+
   (c.general?'<p class="hint">General guide by EDUPLAN: common careers for this field, not a list from the institution.</p>':'')+'</div></div>':'')+'</div>';}
window.EDUPLAN_PATHWAY=pathway;
/* The programme's own details (overview, key facts, entry requirements, structure, careers): shared by the programme cards and the Ask more page. */
function progInfo(u,annual){
 return ''+
  (u.overview?'<p>'+esc(u.overview)+'</p>':'')+
  '<dl class="facts">'+
   (u.fee==null&&annual.length?'<dt>Tuition fee (per year)</dt><dd>'+annual.map(function(x){return '<span class="line">'+esc(x)+'</span>';}).join("")+'</dd>':
   '<dt>Tuition fee (whole programme)</dt><dd>'+(u.fee!=null?esc(rm(u.fee)):'<span class="hint">To be confirmed</span>')+'</dd>')+
   '<dt>Location</dt><dd>'+(u.campus||u.place?esc(u.campus||u.place):'<span class="hint">To be confirmed</span>')+'</dd>'+
   (u.intakes?'<dt>Intakes</dt><dd>'+esc(u.intakes)+'</dd>':'')+(u.deadline?'<dt>Application deadline</dt><dd>'+esc(u.deadline)+'</dd>':'')+
   (u.english?'<dt>English requirement</dt><dd>'+esc(u.english)+'</dd>':'')+(u.mqa?'<dt>MQA</dt><dd>'+esc(u.mqa)+'</dd>':'')+'</dl>'+
  '<div class="stack"><h4>Entry requirements</h4>'+entryMatch(u)+'<dl class="facts entry">'+ENTRY.map(function(e){var l=lines(u[e[0]]);
   return '<dt>'+esc(e[1])+'</dt><dd>'+(l.length?l.map(entryLine).join(""):'<span class="hint">Not listed by the institution</span>')+'</dd>';}).join("")+'</dl></div>'+
  '<div class="stack"><h4>Programme structure</h4>'+progStructure(u)+'</div>'+
  (function(h){return h?'<div class="stack"><h4>Future pathway and careers</h4>'+h+'</div>':'';})(pathway(u.course_id,u.level,u.careers));
}
function progCard(u,fold){
 var sch=progScholarships(u),meta=[u.level,u.years!=null?years(u.years):"",u.mode].filter(Boolean);
 /* Postgraduate brochures give a yearly fee, not a whole-programme total: a notes line "Annual fee: ..." is shown as the fee. */
 var annual=lines(u.notes).filter(function(x){return /^Annual fee: /.test(x);}).map(function(x){return x.replace(/^Annual fee: /,"");}),notes=lines(u.notes).filter(function(x){return !/^Annual fee: /.test(x);});
 return (fold?'<details class="prog fold"><summary>':'<article class="prog">')+'<div class="stack"><span class="eyebrow">'+esc(u.name)+'</span><h3 class="fname">'+esc(u.programme||u.name)+'</h3>'+
  (meta.length?'<div class="meta">'+meta.map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</div>':'')+'</div>'+
  (fold?'<span class="foldhint"><span class="closed">Show details</span><span class="opened">Hide details</span><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg></span></summary><div class="progbody">':'')+
  progInfo(u,annual)+
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

V.accommodation=function(){var A=window.EDUPLAN_ACCOM||{};return ''+
 '<section class="stack"><span class="eyebrow">Accommodation</span><h1>Where you will stay</h1><p class="lead">Hostel options at each institution. Monthly rent is a placeholder figure.</p></section>'+
 (Object.keys(A).length?'<section class="section accwrap"><h2>Accommodation details from the institutions</h2>'+Object.keys(A).map(function(id){var x=UNIV.filter(function(u){return u.id===id;})[0];return accomFold(id,esc(x?x.fullName||x.name:id));}).join("")+'</section>':'')+
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

/* Primary to secondary school, and extra activities: pages for the other stages a family plans (the rest of the
   website is the secondary school to university / college / TVET path). No data yet, so they say so and offer a counsellor. */
function stagePage(kind,icon,eyebrow,title,lead,topic){
 function step(n,t,d){return '<li style="--i:'+n+'"><span class="stn">'+n+'</span><b>'+t+'</b><span>'+d+'</span></li>';}
 return '<section class="stage '+kind+'"><div class="stbg" aria-hidden="true"><i></i><i></i><i></i></div><span class="sticon" aria-hidden="true">'+icon+'</span>'+
  '<span class="eyebrow">'+eyebrow+'</span><h1>'+title+'</h1><p class="lead">'+lead+'</p><span class="soon"><i aria-hidden="true"></i>Coming soon</span></section>'+
  '<section class="panel ststeps"><h2>We can already help you</h2><ol>'+
   step(1,"Message us on WhatsApp","Tell us your child\u2019s stage and what you are looking for.")+
   step(2,"A counsellor replies","Within 2 working days.")+
   step(3,"Plan together","We go through the options with you and your family.")+'</ol>'+
  '<div class="row"><a class="btn wa" href="#consultation" data-topic="'+esc(topic)+'">Ask a counsellor '+ARROW+'</a><a class="btn ghost" href="#home">Secondary school to university, college or TVET</a></div></section>';}
V.primary=function(){return stagePage("st-primary","🎒","Primary level","Primary to secondary school","Choosing a secondary school after primary school.","Primary to secondary school");};
V.activities=function(){return stagePage("st-activities","🏅","Extra activities","Extra activities","Activities outside the classroom.","Extra activities");};
/* Free consultation = a WhatsApp chat with EDUPLAN. Every "#consultation" link opens WhatsApp with a message that
   carries the link's topic and note (data-topic / data-note); the #consultation page itself is one WhatsApp button.
   The earlier request form stays at #consultform. */
var WA_NUMBER="60182494757",WA_SHOW="018-249 4757";
function waLink(topic,note){var v=idv(),lines=["Hi EDUPLAN, I would like to book a free consultation."];
 if(v)lines.push("Name: "+v.name);if(topic)lines.push("Topic: "+topic);if(note)lines.push(note);
 return "https://wa.me/"+WA_NUMBER+"?text="+encodeURIComponent(lines.join("\n"));}
/* Every consultation link becomes a real WhatsApp link (wa.me opens the app on phones), also the ones the host page
   (lab.js) and the AI chat draw later. */
function waLinks(root){Array.prototype.forEach.call((root||document).querySelectorAll('a[href="#consultation"],a[href$="/#consultation"]'),function(a){
 a.setAttribute("href",waLink(a.getAttribute("data-topic"),a.getAttribute("data-note")));a.setAttribute("target","_blank");a.setAttribute("rel","noopener");});}
if(window.MutationObserver)new MutationObserver(function(){waLinks();}).observe(document.documentElement,{childList:true,subtree:true});
document.addEventListener("DOMContentLoaded",function(){waLinks();});
V.consultation=function(){
 if(pfLive()&&!S.waSent){S.waSent=true;location.href=waLink();}   /* opened by address or the menu: straight to WhatsApp */
 return '<section class="stack"><span class="eyebrow">Free Consultation</span><h1>Book a free consultation</h1><p class="lead">Chat with an EDUPLAN counsellor on WhatsApp. Tell us what you want to study, your results and your questions; we reply to arrange a time.</p>'+
  '<div class="row"><a class="btn wa" href="'+esc(waLink())+'" target="_blank" rel="noopener"><span>Chat on WhatsApp</span> '+ARROW+'</a></div>'+
  '<p class="hint">WhatsApp <b data-notr>'+WA_SHOW+'</b></p></section>';
};
V.consultform=function(){
 if(S.consDone){
  return '<section class="stack">'+(S.pick?flowStep("Ask more"):'')+'<span class="eyebrow">Free Consultation</span><h1>Your request is ready to send</h1><p class="lead">Copy the summary and send it to EDUPLAN by WhatsApp or email. A counsellor replies to arrange a time.</p></section>'+
  '<section class="panel" style="max-width:720px"><pre class="summary" id="cons-summary">'+esc(S.consDone)+'</pre>'+
  '<div class="row"><button type="button" class="btn" id="cons-copy">Copy summary</button><button type="button" class="btn ghost" id="cons-edit">Edit my answers</button></div>'+
  '<p class="muted" id="cons-copied" aria-live="polite"></p>'+
  '<p class="muted">Send to: WhatsApp <a href="'+esc(waLink())+'" target="_blank" rel="noopener" data-notr>'+WA_SHOW+'</a>.</p>'+
  (findProg(S.pick)?'<div class="row"><a class="btn" href="#apply/'+esc(S.pick)+'">Continue to the application form '+ARROW+'</a></div>':'')+'</section>';
 }
 var c=S.cons,e=S.consErr||{},pr=S.prof||{},vid=idv();
 /* Guests (name not verified with an IC) are asked to verify first. */
 if(!vid)return '<section class="stack">'+(S.pick?flowStep("Ask more"):'')+'<span class="eyebrow">Free Consultation</span><h1>Verify your name to book a free consultation</h1>'+
  '<p class="lead">You are browsing as a guest. Free consultations are for students whose name is verified with their IC, so our counsellors know who they are speaking to.</p></section>'+
  '<section class="panel" style="max-width:720px"><h2>Verify your name</h2>'+idBox()+'</section>';
 /* The verified name; empty fields start from My profile and the signed-in email. */
 c["cons-name"]=vid.name;if(!c["cons-phone"]&&pr.phone)c["cons-phone"]=pr.phone;if(!c["cons-email"]&&PF.s)c["cons-email"]=PF.s.email;
 function f(id,label,type,hint,req){return '<div class="field"><label for="'+id+'">'+label+(req?"":' <span class="hint">(optional)</span>')+'</label><input type="'+type+'" id="'+id+'" value="'+esc(c[id]||"")+'"'+(e[id]?' aria-invalid="true" aria-describedby="'+id+'-err"':"")+'>'+(hint?'<span class="hint">'+hint+'</span>':"")+(e[id]?'<span class="err" id="'+id+'-err">'+esc(e[id])+'</span>':"")+'</div>';}
 var topics=["Scholarships","Choosing a course","Choosing a university","Accommodation","I am not sure what to study"];
 var quals=["SPM","UEC","STPM","A-Level","Foundation or Matriculation","Diploma","Other"];
 return '<section class="stack">'+(S.pick?flowStep("Ask more"):'')+'<span class="eyebrow">Free Consultation</span><h1>Book a free consultation</h1><p class="lead">Tell us a little about yourself. It takes about a minute.</p></section>'+
 '<section class="panel" style="max-width:720px"><form class="fields" id="cons-form" novalidate>'+
  '<div class="field"><span class="legend">Full name</span><div class="idok"><span class="idbadge">✓ Verified with your IC</span><b data-notr>'+esc(vid.name)+'</b></div></div>'+
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
     #stay                 accommodation help, then the application is sent to EDUPLAN
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
var UPLOADS=[["ic","NRIC or passport (front and back)",2,"always"],["results","Exam results slip",3,"always"],
 ["photo","Passport-size photo",1,""],["eng","English language certificate",2,""],["sch","Scholarship application form",2,""],["fee","Proof of application fee payment",1,""]];
var FILE_MAX=5*1024*1024,FILES_TOTAL=20*1024*1024;
function applyLoad(){var a=null;try{a=JSON.parse(sessionStorage.getItem(APPLY_KEY));}catch(e){}
 a=a||{};a.v=a.v||{nationality:"Malaysian",residence:"Malaysia",country:"Malaysia",perm_same:true,em_same:true,disability:"No"};
 /* "Results" was Actual / Forecast before: it is now the kind of results slip. */
 if(a.v.h_status==="Actual")a.v.h_status="Official";if(a.v.h_status==="Forecast")a.v.h_status="Trial";a.step=a.step||1;a.edu=a.edu||2;a.eng=a.eng||1;a.files={};return a;}
function applySave(){try{sessionStorage.setItem(APPLY_KEY,JSON.stringify({v:S.app.v,step:S.app.step,edu:S.app.edu,eng:S.app.eng,complete:S.app.complete,sent:S.app.sent}));}catch(e){}pfTouch("apply");}
function allProgs(){var out=[];UNIV.forEach(function(u){u.progs.forEach(function(p){out.push({u:u,p:p});});});return out;}
function findProg(id){id=String(id||"").toLowerCase();return id?allProgs().filter(function(x){return String(x.p.id).toLowerCase()===id;})[0]||null:null;}
function applyProg(){return findProg(S.app.v.prog);}
/* The school's own application questions (assets/js/school-forms.js): UTAR foundation programmes ask for 5 preferred
   degree programmes from the list for that foundation, the preferred campus and a health declaration. */
function schoolForm(){var x=applyProg(),F=window.EDUPLAN_FORMS||{},f=x&&F[x.u.id];if(!f)return null;
 if(f.all)return {id:x.u.id,f:f,all:true,x:x};
 var route=Object.keys(f.routes).filter(function(k){return new RegExp(k,"i").test(x.p.programme);})[0];return route?{id:x.u.id,f:f,route:route,list:f.routes[route]}:null;}
function sfDegree(sf,code){var hit=null;sf.list.forEach(function(g){g[1].forEach(function(d){if(d[1]===code)hit=d;});});return hit;}
function sfLabel(sf,d){var c=d[2].replace("*",""),w=c&&sf.f.flags[c];return d[0]+" ("+d[1]+")"+(w?" · "+w+" only":"");}
/* Campus the chosen degrees need: a "+" or "^" degree is offered from one campus only. */
function sfCampusNeed(sf){var need={};for(var i=1;i<=5;i++){var d=S.app.v["u_pref"+i]&&sfDegree(sf,S.app.v["u_pref"+i]),c=d&&d[2].replace("*","");if(c&&sf.f.flags[c])need[sf.f.flags[c]]=d;}return need;}
/* APU-style forms (all: true): level of study from the programme ("Degree Level 2" = direct entry with a diploma),
   the specialism from "... with a specialism in X", and international students answer parts E and F. */
function sfLevel(sf){var p=sf.x.p,l=String(p.level||"")+" "+p.programme;
 return /foundation|pre-?university/i.test(l)?(/ODL|online/i.test(l)?"Foundation-ODL":"Foundation"):/certificate/i.test(l)?"APIIT Certificate":/diploma/i.test(l)?"Diploma":(S.app.v.a_level||"Degree Level 1");}
function sfSpecialism(sf){var m=String(sf.x.p.programme).match(/with a specialism in (.+)$/i);return m?m[1]:"";}
function sfIntl(){var n=String(S.app.v.nationality||"").trim();return !!n&&!/malaysia/i.test(n);}
function sfAllGroup(sf){var v=S.app.v,deg=!/^(Foundation|Foundation-ODL|APIIT Certificate|Diploma)$/.test(sfLevel(sf));
 return agroup(esc(sf.id)+" application form",
  '<div class="field full"><span class="hint">'+esc(sf.id)+' '+esc(sf.f.title)+': these questions are on '+esc(sf.id)+'&#39;s own form. Level of study: '+esc(deg?"Degree":sfLevel(sf))+(sfSpecialism(sf)?' · Specialism: '+esc(sfSpecialism(sf)):'')+'.</span></div>'+
  af("a_title","Title",{opts:sf.f.titles,first:"Choose",rerender:true})+(v.a_title==="Others"?af("a_title_other","Title (other)"):'')+
  (deg?af("a_level","Level of study",{opts:[["Degree Level 1","Degree Level 1"],["Degree Level 2","Degree Level 2 (direct entry with a diploma)"]],first:"Choose"}):'')+
  af("a_med","Do you have any special or medical condition that needs the university's attention?",{opts:["No","Yes"],first:"Choose",rerender:true,full:true})+
  (v.a_med==="Yes"?af("a_med_info","Which condition? ("+sf.f.conditions.join(", ")+")",{area:true,rows:2,full:true}):'')+
  af("a_mental","Have you had any history of mental or psychiatric conditions?",{opts:["No","Yes"],first:"Choose",rerender:true,full:true})+
  (v.a_mental==="Yes"?af("a_mental_info","Please give details",{area:true,rows:2,full:true}):'')+
  af("a_cope","Have you been diagnosed with any condition that may affect your ability to cope with university studies?",{opts:["No","Yes"],first:"Choose",full:true}));
}
function sfIntlGroup(sf){var v=S.app.v;
 return agroup(esc(sf.id)+": international applicants",
  af("a_eng_instr","Was English the language of instruction in your previous studies?",{opts:["Yes","No"],first:"Choose",full:true})+
  af("a_visa","Do you hold a Malaysian immigration pass or visa now?",{opts:["No","Yes"],first:"Choose",rerender:true,full:true})+
  (v.a_visa==="Yes"?af("a_visa_type","Type of pass / visa",{opts:sf.f.passes,first:"Choose"})+af("a_visa_exp","Expiry date",{type:"date"}):''));
}
function sfGroup(sf){if(sf.all)return sfAllGroup(sf);var v=S.app.v,prefs="";
 for(var i=1;i<=5;i++){var e=(S.app.err||{})["u_pref"+i];
  prefs+='<div class="field full"><label for="ap-u_pref'+i+'">Choice '+i+(i>1?' <span class="hint">(optional)</span>':'')+'</label><select id="ap-u_pref'+i+'" name="u_pref'+i+'" data-rerender'+(e?' aria-invalid="true" aria-describedby="u_pref'+i+'-err"':'')+'><option value="">'+(i===1?'Choose a degree programme':'None')+'</option>'+
   sf.list.map(function(g){return '<optgroup label="'+esc(g[0])+'">'+g[1].map(function(d){return '<option value="'+esc(d[1])+'"'+(v["u_pref"+i]===d[1]?' selected':'')+'>'+esc(sfLabel(sf,d))+'</option>';}).join("")+'</optgroup>';}).join("")+'</select>'+
   (e?'<span class="err" id="u_pref'+i+'-err">'+esc(e)+'</span>':'')+'</div>';}
 var need=Object.keys(sfCampusNeed(sf)),arch=[1,2,3,4,5].some(function(i){var d=v["u_pref"+i]&&sfDegree(sf,v["u_pref"+i]);return d&&d[2].indexOf("*")>=0;});
 return agroup(esc(sf.id)+" application form",
  '<div class="field full"><span class="hint">'+esc(sf.f.title)+'. Choose up to 5 degree programmes you would like to study after the '+esc(sf.route)+', in order of preference. You are offered a degree on condition that you enrol in and pass the foundation programme.</span></div>'+
  af("u_prev","Have you applied to "+sf.id+" before?",{opts:["No","Yes"],first:"Choose",rerender:true})+(v.u_prev==="Yes"?af("u_id",sf.id+" ID no.",{hint:"Example: 12UKB03456"}):'')+
  prefs+
  af("u_campus","Preferred campus for the foundation programme",{opts:sf.f.campuses,first:"Choose",full:true,hint:need.length?"Your choices need "+need.join(" and ")+".":"The university may assign you to another campus."})+
  (arch?'<div class="field full"><span class="hint">'+esc(sf.f.portfolio)+'</span></div>':'')+
  af("u_health","Are you in good physical and mental health?",{opts:["Yes","No"],first:"Choose",rerender:true})+(v.u_health==="No"?af("u_health_info","Please give details",{area:true,rows:2,full:true}):''));
}
/* Academic tracks come from the programme's notes line "Academic tracks: A, B, C." in the school sheet. */
function progTracks(p){var m=String(p&&p.notes||"").match(/Academic tracks?:\s*([^\n]+?)\.?\s*(?:\n|$)/i);return m?m[1].split(/\s*,\s*/).filter(Boolean):[];}
function applyAge(dob){var d=new Date(dob);if(!dob||isNaN(d))return null;var n=new Date(),a=n.getFullYear()-d.getFullYear();if(n.getMonth()<d.getMonth()||(n.getMonth()===d.getMonth()&&n.getDate()<d.getDate()))a--;return a;}
function needFile(u){return u[3]==="always";}
/* The results slip is official (SPM, UEC ... results) or trial (school trial exam, while the official results are not out). */
var SLIPS=[["Official","Official results slip"],["Trial","Trial exam results slip"]];
function slipName(){var k=SLIPS.filter(function(x){return x[0]===S.app.v.h_status;})[0];return k?k[1]:"";}
/* The highest exam in My results, to fill "Highest qualification" when it is empty. */
function rxHighest(){var t=RX.taken();return t.length?t[t.length-1]:"";}

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
 var list=S.app.files[u[0]]||[],e=(S.app.err||{})["f_"+u[0]],req=needFile(u),slip=u[0]==="results";
 return (slip?af("h_status","Which results slip are you sending?",{opts:SLIPS,first:"Choose",rerender:true,full:true,hint:"Trial: your school’s trial exam, while the official results are not out yet. Send the official slip when it comes out."}):'')+
  '<div class="field full upload"><label for="ap-f_'+u[0]+'">'+esc(slip&&slipName()?slipName()+(S.app.v.h_type?" ("+S.app.v.h_type+")":""):u[1])+(req?'':' <span class="hint">(optional)</span>')+'</label>'+
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
   af("intake","Intake (month and year)",{type:"month",hint:x&&x.p.intakes?"Intakes: "+esc(x.p.intakes):"Example: 2026-04"}))+
   (schoolForm()?sfGroup(schoolForm()):'');
 }
 if(n===2){var iv=idv();if(iv&&S.app.v.name_en!==iv.name){S.app.v.name_en=iv.name;applySave();}}
 if(n===2)return agroup("Personal details",
   (idv()&&!((S.prof||{}).icform||{}).ic?'<div class="field full"><p class="ematch miss"><span>Your IC was verified before EDUPLAN could fill in the form from it.</span> <a href="#portfolio">Upload your IC again in My portfolio</a> <span>to fill in your IC number, date of birth, place of birth, gender and address here.</span></p></div>':'')+
   (idv()?'<div class="field full"><label for="ap-name_en">Full name (as on NRIC/passport)</label><input id="ap-name_en" name="name_en" value="'+esc(idv().name)+'" readonly aria-readonly="true">'+
    '<span class="hint">✓ From your IC (verified). Your results slip and scholarship use the same name.</span></div>'
   :af("name_en","Full name (as on NRIC/passport)",{full:true,auto:"name",hint:"In capital letters, exactly as on your IC, for example TAN WEI MING. Verify your name with your IC in My portfolio to fill it in for you."}))+
   af("name_zh","Chinese name",{opt:true})+af("ic","NRIC / passport no.",{hint:"Example: 080101-14-1234"})+
   af("dob","Date of birth",{type:"date",auto:"bday"})+af("a_pob","Place of birth (state)",{opt:true})+af("gender","Gender",{opts:["Male","Female"],first:"Choose"})+
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
   af("g_mobile","Mobile",{type:"tel"})+af("g_email","Email",{type:"email",opt:true})+af("g_job","Occupation",{opt:true})+af("g_tel","Home telephone",{type:"tel",opt:true})+
   (schoolForm()&&schoolForm().all?af("a_g_ic","NRIC / passport no.",{hint:schoolForm().id+" asks for this."}):''))+
  agroup("Emergency contact",acheck("em_same","Same as parent / guardian",{rerender:true})+
   (v.em_same?'':af("e_name","Full name",{full:true})+af("e_name_zh","Chinese name",{opt:true})+af("e_rel","Relationship")+af("e_mobile","Mobile",{type:"tel"})+af("e_tel","Home telephone",{type:"tel",opt:true})));
 if(n===5){
  if(!v.h_type&&rxHighest()){v.h_type=rxHighest();applySave();}
  var rows="";for(var i=1;i<=S.app.edu;i++)rows+='<div class="rowset"><span class="rowno">'+i+'</span>'+af("ed"+i+"_school","School / institution and location",{full:true,opt:i>1})+
   af("ed"+i+"_from","From",{type:"month",opt:i>1})+af("ed"+i+"_to","To",{type:"month",opt:i>1})+af("ed"+i+"_qual","Qualification",{opts:QUALS,first:"Choose",opt:i>1,full:true})+'</div>';
  var eng="";for(var j=1;j<=S.app.eng;j++)eng+='<div class="rowset"><span class="rowno">'+j+'</span>'+af("en"+j+"_type","Test",{opt:true,hint:"MUET, IELTS, TOEFL, SPM English …"})+af("en"+j+"_score","Score / band",{opt:true})+af("en"+j+"_date","Date taken or to be taken",{type:"month",opt:true})+'</div>';
  return agroup("Education background",'<div class="field full"><span class="hint">Start with your most recent school. Add every school from secondary school onwards.</span></div>'+rows+
    (S.app.edu<5?'<div class="field full"><button type="button" class="btn ghost" data-apply="add-edu">Add another school</button></div>':''))+
   agroup("Highest qualification",af("h_type","Qualification",{opts:QUALS,first:"Choose",rerender:true})+af("h_status","Results",{opts:[["Official","Official results"],["Trial","Trial results"]],first:"Choose"})+
    af("h_school","Institution",{full:true})+af("h_start","Year started",{type:"month"})+af("h_end","Year completed",{type:"month"})+
    (applyExam()?applyResults(applyExam())
     :af("h_results","Subjects and grades",{area:true,rows:5,full:true,hint:"One subject per line, for example: Mathematics A+"})))+
   agroup("English language",'<div class="field full"><span class="hint">Any English test you have taken or will take.</span></div>'+eng+
    (S.app.eng<3?'<div class="field full"><button type="button" class="btn ghost" data-apply="add-eng">Add another test</button></div>':''))+
   agroup("Others",af("disability","Do you have a disability?",{opts:["No","Yes"],rerender:true})+(v.disability==="Yes"?af("dis_info","Please give details",{area:true,rows:2,full:true}):''))+
   (schoolForm()&&schoolForm().all&&sfIntl()?sfIntlGroup(schoolForm()):'');
 }
 var age=applyAge(v.dob),xm=x&&x.u.id==="XMUM";
 return agroup("Upload your documents",'<div class="field full"><span class="hint">Take a clear photo of each document, or choose a PDF. Each file can be up to 5 MB. Files stay on this page until you send your application, so add them again if you reload.'+
   (xm?' XMUM scholarship and study grant form: <a href="http://www.xmu.edu.my/14698/list.htm" target="_blank" rel="noopener">xmu.edu.my</a>.':'')+'</span></div>'+UPLOADS.map(uploadBox).join(""))+
  agroup("Declaration",acheck("decl","I declare that the information in this application is true, correct and complete. I understand that the university may change or withdraw a decision made on incorrect or incomplete information. I agree that EDUPLAN keeps my application and documents and shares them with the university to process this application, as set out in their personal data protection notices.")+
   (age!==null&&age<18?'<div class="field full"><span class="hint">You are under 18, so your parent or legal guardian must also agree.</span></div>'+
    acheck("decl_g","I am the applicant’s parent or legal guardian. I consent to this application and understand that the university’s fees and charges are payable by the dates it sets.")+
    af("decl_g_name","Parent / guardian name",{full:true}):''));
}

/* Subjects and grades come from My results (the portfolio): shown read-only, with a button to change them here.
   With nothing saved yet for this exam, the editor is shown, and what the student enters is saved to My results. */
function applyResults(hx){
 var cg=RX.exam(hx).cgpa,e=(S.app.err||{}).h_results,saved=RX.has(hx),body;
 if(!saved)S.app.rxEdit=true;   /* stay in the editor while the first grades are being entered */
 if(saved&&!S.app.rxEdit)body='<span class="hint">Filled in from My results in your portfolio. You do not need to enter them again.</span>'+
   '<ul class="rxfill">'+RX.text(hx).split("\n").map(function(l){var m=l.match(/^(.*) (\S+)$/);return '<li>'+(m&&!cg?'<span>'+esc(m[1])+'</span><b>'+esc(m[2])+'</b>':'<b>'+esc(l)+'</b>')+'</li>';}).join("")+'</ul>'+
   (cg?'':'<span class="hint">'+esc(RX.summary(hx))+'</span>')+
   '<div class="row"><button type="button" class="btn ghost" data-apply="rx-edit">Change my results</button></div>';
 else body='<span class="hint">'+(saved?'Changes are saved to My results in your portfolio.':'Enter them once: they are saved to My results in your portfolio and filled in for you next time.')+'</span>'+RX.editor(hx)+
   (saved?'<div class="row"><button type="button" class="btn ghost" data-apply="rx-done">Done</button></div>':'');
 return '<div class="field full"><span class="legend">'+(cg?'Your CGPA':'Subjects and grades')+'</span>'+body+(e?'<span class="err" id="h_results-err">'+esc(e)+'</span>':'')+'</div>';
}

function applyErrors(n){
 var v=S.app.v,e={},x=applyProg();
 function need(id,msg){if(!String(v[id]==null?"":v[id]).trim())e[id]=msg||"Please fill this in.";}
 function phone(id){var d=String(v[id]||"").replace(/\D/g,"");if(d&&(d.length<9||d.length>13))e[id]="Enter a phone number with 9 to 13 digits.";}
 function mail(id){var m=String(v[id]||"").trim();if(m&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(m))e[id]="Enter an email like name@example.com.";}
 if(n===1){need("prog","Choose a programme.");if(x&&progTracks(x.p).length)need("track","Choose an academic track.");need("intake","Enter the intake month and year.");
  var sf=schoolForm();if(sf&&sf.all){need("a_title");if(v.a_title==="Others")need("a_title_other");if(!/^(Foundation|Foundation-ODL|APIIT Certificate|Diploma)$/.test(sfLevel(sf)))need("a_level");
   need("a_med");if(v.a_med==="Yes")need("a_med_info");need("a_mental");if(v.a_mental==="Yes")need("a_mental_info");need("a_cope");}
  else if(sf){need("u_prev");if(v.u_prev==="Yes")need("u_id");need("u_pref1","Choose at least one degree programme.");need("u_campus");need("u_health");if(v.u_health==="No")need("u_health_info");
   var seen={};for(var i=1;i<=5;i++){var c=v["u_pref"+i];if(c&&!sfDegree(sf,c))e["u_pref"+i]="Choose again: this programme is not on the list for the "+sf.route+".";else if(c&&seen[c])e["u_pref"+i]="You chose this programme already.";if(c)seen[c]=1;}
   var nd=sfCampusNeed(sf),nk=Object.keys(nd);if(nk.length>1)e.u_campus="Your choices are offered at different campuses ("+nk.join(", ")+"). Keep only one campus's programmes.";
   else if(nk.length&&v.u_campus&&v.u_campus!==nk[0])e.u_campus=nd[nk[0]][0]+" needs "+nk[0]+".";}}
 if(n===2){["name_en","ic","dob","gender","marital","race","religion","nationality","residence"].forEach(function(k){need(k);});
  var a=applyAge(v.dob);if(v.dob&&(a===null||a<10||a>80))e.dob="Check the date of birth.";}
 if(n===3){["mobile","email","addr","town","postcode","state","country"].forEach(function(k){need(k);});
  if(!v.perm_same)["p_addr","p_town","p_postcode","p_state","p_country"].forEach(function(k){need(k);});
  phone("mobile");phone("tel");phone("p_tel");mail("email");}
 if(n===4){["g_name","g_rel","g_mobile"].forEach(function(k){need(k);});phone("g_mobile");phone("g_tel");mail("g_email");
  if(!v.em_same){["e_name","e_rel","e_mobile"].forEach(function(k){need(k);});phone("e_mobile");}
  var sf4=schoolForm();if(sf4&&sf4.all)need("a_g_ic");}
 if(n===5){var hx=applyExam();if(hx)v.h_results=RX.text(hx);
  ["ed1_school","ed1_from","ed1_to","ed1_qual","h_type","h_status","h_school","h_start","h_end"].forEach(function(k){need(k);});
  need("h_results",hx?(RX.exam(hx).cgpa?"Enter your CGPA.":"Add at least one subject and its grade."):null);
  if(v.disability==="Yes")need("dis_info");
  var sf5=schoolForm();if(sf5&&sf5.all&&sfIntl()){need("a_eng_instr");need("a_visa");if(v.a_visa==="Yes"){need("a_visa_type");need("a_visa_exp");}}}
 if(n===6){need("h_status","Choose official or trial.");UPLOADS.forEach(function(u){if(needFile(u)&&!(S.app.files[u[0]]||[]).length)e["f_"+u[0]]="Please add this document.";});
  if(!v.decl)e.decl="Please tick to confirm.";var a2=applyAge(v.dob);if(a2!==null&&a2<18){if(!v.decl_g)e.decl_g="Your parent or guardian must tick to agree.";need("decl_g_name");}}
 return e;
}

function applySummary(){
 var v=S.app.v,x=applyProg(),L=[];
 function sec(t){L.push("","== "+t+" ==");}
 function row(label,val){val=String(val==null?"":val).trim();if(val)L.push(label+": "+val);}
 L.push("EDUPLAN APPLICATION");
 sec("Programme");row("University",x?(x.u.fullName||x.u.name):"");row("Programme",x?x.p.programme:"");row("Level",x?x.p.level:"");row("Academic track",v.track);row("Intake",v.intake);
 var sfm=schoolForm();if(sfm&&sfm.all){sec(sfm.id+" application form");row("Title",v.a_title==="Others"?v.a_title_other:v.a_title);
  row("Level of study",sfLevel(sfm));row("Specialism",sfSpecialism(sfm));row("Parent / guardian NRIC / passport no.",v.a_g_ic);
  row("Special or medical condition",v.a_med==="Yes"?"Yes: "+(v.a_med_info||""):v.a_med);row("History of mental or psychiatric conditions",v.a_mental==="Yes"?"Yes: "+(v.a_mental_info||""):v.a_mental);
  row("Condition that may affect coping with studies",v.a_cope);
  if(sfIntl()){row("English was the language of instruction",v.a_eng_instr);row("Malaysian immigration pass / visa",v.a_visa==="Yes"?"Yes: "+(v.a_visa_type||"")+(v.a_visa_exp?", expires "+v.a_visa_exp:""):v.a_visa);}}
 else if(sfm){sec(sfm.id+" application form");row("Applied to "+sfm.id+" before",v.u_prev==="Yes"?"Yes ("+(v.u_id||"")+")":v.u_prev);
  for(var pi=1;pi<=5;pi++){var pd=v["u_pref"+pi]&&sfDegree(sfm,v["u_pref"+pi]);if(pd)row("Degree choice "+pi,pd[0]+" ("+pd[1]+")");}
  row("Preferred campus",v.u_campus);row("Good physical and mental health",v.u_health==="No"?"No: "+(v.u_health_info||""):v.u_health);}
 sec("Personal details");row("Name (as on NRIC/passport)",String(v.name_en||"").toUpperCase());row("Name verified with IC",idv()&&sameNameApp(idv().name,v.name_en)?"Yes, by EDUPLAN (IC ending "+idv().last4+")":"No");row("Chinese name",v.name_zh);row("NRIC / passport no.",v.ic);row("Date of birth",v.dob);
 row("Place of birth",v.a_pob);row("Gender",v.gender);row("Marital status",v.marital);row("Race",v.race);row("Religion",v.religion);row("Nationality",v.nationality);row("Country of permanent residence",v.residence);
 sec("Contact details");row("Mobile",v.mobile);row("Email",v.email);row("Home telephone",v.tel);
 row("Correspondence address",[v.addr,v.postcode+" "+v.town,v.state,v.country].join(", ").replace(/\s*\n\s*/g,", "));
 row("Permanent address",v.perm_same?"Same as correspondence address":[v.p_addr,v.p_postcode+" "+v.p_town,v.p_state,v.p_country].join(", ").replace(/\s*\n\s*/g,", "));row("Home telephone (permanent)",v.perm_same?"":v.p_tel);
 sec("Parent / guardian");row("Name",v.g_name);row("Chinese name",v.g_name_zh);row("Relationship",v.g_rel);row("Mobile",v.g_mobile);row("Email",v.g_email);row("Occupation",v.g_job);row("Home telephone",v.g_tel);
 sec("Emergency contact");if(v.em_same)L.push("Same as parent / guardian");else{row("Name",v.e_name);row("Chinese name",v.e_name_zh);row("Relationship",v.e_rel);row("Mobile",v.e_mobile);row("Home telephone",v.e_tel);}
 sec("Education background");for(var i=1;i<=S.app.edu;i++){if(v["ed"+i+"_school"])L.push(i+". "+v["ed"+i+"_school"]+" | "+(v["ed"+i+"_from"]||"?")+" to "+(v["ed"+i+"_to"]||"?")+" | "+(v["ed"+i+"_qual"]||"-"));}
 sec("Highest qualification");row("Qualification",v.h_type);row("Results",v.h_status?v.h_status+" results":"");row("Institution",v.h_school);row("Started",v.h_start);row("Completed",v.h_end);
 L.push("Subjects and grades:");String(v.h_results||"").split(/\r?\n/).filter(function(s){return s.trim();}).forEach(function(s){L.push("  "+s.trim());});
 sec("English language");var any=false;for(var j=1;j<=S.app.eng;j++){if(v["en"+j+"_type"]){any=true;L.push(v["en"+j+"_type"]+" | "+(v["en"+j+"_score"]||"-")+" | "+(v["en"+j+"_date"]||"-"));}}if(!any)L.push("None yet");
 sec("Others");row("Disability",v.disability==="Yes"?"Yes: "+(v.dis_info||""):"No");
 sec("Documents");UPLOADS.forEach(function(u){var l=S.app.files[u[0]]||[];L.push((l.length?"[x] ":"[ ] ")+(u[0]==="results"&&slipName()?slipName():u[1])+(l.length?" ("+l.length+" file"+(l.length===1?"":"s")+")":""));});
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

/* Ask more: the programme's details as folding sections (At a glance open), with Expand all / Collapse all. */
function accItem(key,icon,title,hint,body,open){
 return '<details class="acc"'+(open?' open':'')+' data-acc="'+key+'"><summary><span class="acci" aria-hidden="true">'+icon+'</span><span class="acct"><b>'+title+'</b>'+(hint?'<span class="hint">'+hint+'</span>':'')+'</span>'+
  '<svg class="accv" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"></path></svg></summary><div class="accb">'+body+'</div></details>';}
function progAccordion(u,annual,notes){
 var exams=ENTRY.filter(function(e){return lines(u[e[0]]).length;}),careers=lines(u.careers),blocks=lines(u.structure).filter(function(x){return /[:：]$/.test(x);}).length,sch=progScholarships(u);
 var best=sch.reduce(function(m,g){return g.best!=null&&(m==null||g.best>m)?g.best:m;},null);
 var facts='<dl class="facts">'+
   (u.fee==null&&annual.length?'<dt>Tuition fee (per year)</dt><dd>'+annual.map(function(x){return '<span class="line">'+esc(x)+'</span>';}).join("")+'</dd>':
   '<dt>Tuition fee (whole programme)</dt><dd>'+(u.fee!=null?esc(rm(u.fee)):'<span class="hint">To be confirmed</span>')+'</dd>')+
   '<dt>Location</dt><dd>'+(u.campus||u.place?esc(u.campus||u.place):'<span class="hint">To be confirmed</span>')+'</dd>'+
   (u.intakes?'<dt>Intakes</dt><dd>'+esc(u.intakes)+'</dd>':'')+(u.deadline?'<dt>Application deadline</dt><dd>'+esc(u.deadline)+'</dd>':'')+
   (u.english?'<dt>English requirement</dt><dd>'+esc(u.english)+'</dd>':'')+(u.mqa?'<dt>MQA</dt><dd>'+esc(u.mqa)+'</dd>':'')+'</dl>';
 return '<div class="accbar"><span class="hint">Tap a section to open it.</span><button type="button" class="linkbtn" data-accall>Expand all</button></div><div class="accs">'+
  accItem("glance","📌","At a glance",u.fee!=null?esc(rm(u.fee)):"",(u.overview?'<p>'+esc(u.overview)+'</p>':'')+facts,true)+
  accItem("entry","✅","Entry requirements",exams.length?esc(exams.map(function(e){return e[1];}).join(" · ")):"Not listed by the institution",entryMatch(u)+'<dl class="facts entry">'+ENTRY.map(function(e){var l=lines(u[e[0]]);
   return '<dt>'+esc(e[1])+'</dt><dd>'+(l.length?l.map(entryLine).join(""):'<span class="hint">Not listed by the institution</span>')+'</dd>';}).join("")+'</dl>')+
  accItem("structure","📚","Programme structure",blocks?blocks+(blocks===1?" part":" parts"):"",progStructure(u))+
  (function(h,c){return h?accItem("careers","🚀","Future pathway and careers",c.list.length?c.list.length+(c.list.length===1?" career":" careers")+(c.general?" (general guide)":""):"",h):'';})(pathway(u.course_id,u.level,u.careers),careerList(u.course_id,u.careers))+
  accItem("scholarships","🎓","Scholarships",best!=null?"Up to "+best+"% tuition waiver":"",(sch.length?'<ul class="schlinks">'+sch.map(function(g){return '<li><a href="'+esc(g.href)+'"><span class="name">'+esc(g.name)+'</span>'+(g.best!=null?'<span class="pill brand">Up to '+g.best+'% tuition waiver</span>':'')+'</a></li>';}).join("")+'</ul>'
    :'<p class="hint">No campus scholarship listed for this level yet.</p>')+'<a class="textlink" href="#scholarships-foundation">Other scholarships open to all students '+ARROW+'</a>')+
  (accomData(u.inst)?accItem("accom","🏠","Accommodation",'<span>from</span> <span data-notr>'+esc(rm(accomFrom(u.inst)))+'</span> <span>a month</span>',accomBox(u.inst)):'')+
  (notes.length?accItem("notes","📝","Notes","",notes.map(function(l){return '<p class="muted">'+esc(l)+'</p>';}).join("")):'')+'</div>'+
  (u.url?'<a class="textlink" href="'+esc(u.url)+'" target="_blank" rel="noopener">Programme page '+ARROW+'</a>':'');}
/* Expand all / Collapse all, and the button follows the sections the student opens one by one. */
function accSync(box){var all=box.querySelectorAll("details.acc"),open=box.querySelectorAll("details.acc[open]").length,b=box.querySelector("[data-accall]");if(b)b.textContent=open===all.length?"Collapse all":"Expand all";}
document.addEventListener("click",function(ev){var b=ev.target.closest&&ev.target.closest("[data-accall]");if(!b)return;var box=b.closest(".pinfo,.accwrap"),all=box.querySelectorAll("details.acc"),open=box.querySelectorAll("details.acc[open]").length===all.length;
 Array.prototype.forEach.call(all,function(d){d.open=!open;});accSync(box);});
document.addEventListener("toggle",function(ev){var d=ev.target;if(d&&d.classList&&d.classList.contains("acc")){var box=d.closest(".pinfo,.accwrap");if(box)accSync(box);}},true);
/* details: the Ask more page also shows the programme's details inside the card. */
function progSummary(x,details){
 var u=x.p,annual=lines(u.notes).filter(function(l){return /^Annual fee: /.test(l);}).map(function(l){return l.replace(/^Annual fee: /,"");}),notes=lines(u.notes).filter(function(l){return !/^Annual fee: /.test(l);});
 return '<div class="pickcard"><span class="eyebrow">'+esc(x.u.fullName||x.u.name)+'</span><h2>'+esc(x.p.programme)+'</h2>'+
  '<div class="meta">'+[x.p.level,x.p.years!=null?years(x.p.years):"",x.p.campus||x.u.place].filter(Boolean).map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</div>'+
  RX.payHtml({id:x.p.id,instId:x.u.id,inst:x.u.name,level:x.p.level,rows:campusRows(),fee:x.p.fee,annual:annual,years:x.p.years,port:"#portfolio",head:"h4"})+
  (details?'<div class="pinfo">'+progAccordion(u,annual,notes)+'</div>':'')+'</div>';
}
/* Share link of a programme: opens its Ask more page straight away (no welcome screens), from where the student applies. */
function progLink(id){return (window.EDUPLAN_SITE_URL||location.href.split("#")[0])+"#next/"+encodeURIComponent(id);}
function shareBox(x){var url=progLink(x.p.id),msg=x.p.programme+" ("+x.u.name+") on EDUPLAN: "+url;
 return '<div class="sharebox"><span class="sl">🔗 <span>Share this programme</span></span><div class="shrow"><input type="text" readonly value="'+esc(url)+'" aria-label="Link to this programme" id="share-url">'+
  '<button type="button" class="btn sm" data-share="copy">Copy link</button><a class="btn ghost sm" href="https://wa.me/?text='+encodeURIComponent(msg)+'" target="_blank" rel="noopener">WhatsApp</a></div>'+
  '<p class="hint" role="status" id="share-st">Anyone who opens this link goes straight to this programme and can apply from here.</p></div>';}
document.addEventListener("click",function(ev){var b=ev.target.closest&&ev.target.closest('[data-share="copy"]');if(!b)return;var i=document.getElementById("share-url"),st=document.getElementById("share-st");
 function ok(){if(st)st.textContent="Link copied. Paste it in WhatsApp, Instagram or anywhere.";}
 function old(){i.select();try{document.execCommand("copy");ok();}catch(e){}}
 if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(i.value).then(ok,old);else old();});
/* Ask more (#next/<id>): the step between choosing a programme and applying. */
V.next=function(){
 var x=findProg(S.pick),wait=/^#next\/./.test(location.hash)&&!findProg(decodeURIComponent(location.hash.slice(6)));
 if(wait&&!API_DONE)return '<section class="stack"><h1>Opening the programme…</h1><p class="muted">Loading…</p></section>';
 if(wait)x=null;
 if(!x)return '<section class="stack"><h1>Choose a programme first</h1><p class="lead">Find a programme by faculty, university or scholarship, then come back here.</p><div class="row"><a class="btn" href="#faculty">Browse faculties</a><a class="btn ghost" href="#universities">Browse universities</a></div></section>';
 var note="Interested in: "+x.p.programme+" ("+x.u.name+").";
 return '<section class="stack">'+flowStep("Ask more")+'<div><a class="btn ghost" href="'+esc(sget("eduplan-last")||"#universities")+'">Back</a></div><span class="eyebrow">Your choice</span>'+progSummary(x,true)+shareBox(x)+'<div class="row applyrow">'+saveBtn(x.p.id)+'<a class="btn applygo" href="#apply/'+esc(x.p.id)+'"><span class="agi" aria-hidden="true">🚀</span><span>Apply now</span>'+ARROW+'</a><span class="hint">One form and your documents · about 10 minutes</span></div>'+
  '<h1>Any questions before you apply?</h1><p class="lead">Ask our AI study assistant, talk to a counsellor for free, or go straight to the application form.</p></section>'+
  '<section class="grid askcards">'+
   '<button type="button" class="item pick ask-ai" data-ask="'+esc("I am interested in "+x.p.programme+" at "+x.u.name+". ")+'"><span class="aski" aria-hidden="true">🤖</span><span class="name">Ask the AI study assistant</span><span class="desc">Quick answers about fees, entry requirements and scholarships, any time.</span><span class="textlink">Open the chat '+ARROW+'</span></button>'+
   '<a class="item pick ask-wa" href="#consultation" data-topic="Choosing a university" data-note="'+esc(note)+'"><span class="aski" aria-hidden="true">💬</span><span class="name">Book a free consultation</span><span class="desc">A counsellor goes through your options with you and your family.</span><span class="textlink">Book a time '+ARROW+'</span></a>'+
   '</section>';
};

V.apply=function(){
 var a=S.app,n=APPLY_STEPS.length,pr=S.prof||{};
 /* Empty fields start from My profile and the signed-in email; the student checks them against the IC. */
 var f=pr.icform||{},pre={name_en:pr.idv&&pr.idv.name,mobile:pr.phone,email:PF.s&&PF.s.email,
  ic:f.ic,dob:f.dob,a_pob:f.pob,gender:f.gender,nationality:f.nationality,residence:f.residence,religion:f.religion,
  addr:f.address,postcode:f.postcode,town:f.town,state:f.state,country:f.gender?"Malaysia":""},ch=false;   /* everything that can be read from the IC */
 Object.keys(pre).forEach(function(k){if(!a.v[k]&&pre[k]){a.v[k]=pre[k];ch=true;}});if(ch)applySave();
 return '<section class="stack">'+flowStep("Apply")+'<span class="eyebrow">Apply with EDUPLAN</span><h1>Application form</h1>'+
  '<p class="lead">One form for your university application. It takes about 10 minutes. '+(PF.s?'Your answers are saved to your portfolio as you type.':'Your answers stay on this device until you close the tab. <a href="#portfolio">Sign in</a> to save them and continue later.')+'</p></section>'+
  '<section class="panel" style="max-width:760px"><div class="formstep"><span>Part '+a.step+' of '+n+': '+esc(APPLY_STEPS[a.step-1])+'</span><span class="bar" aria-hidden="true"><i style="width:'+Math.round(a.step/n*100)+'%"></i></span></div>'+
  '<form class="fields" id="apply-form" novalidate>'+applyStep(a.step)+
  '<div class="row">'+(a.step>1?'<button type="button" class="btn ghost" data-apply="back">Back</button>':'')+
  '<button type="submit" class="btn">'+(a.step<n?'Next':'Continue')+'</button></div></form></section>';
};

/* Accommodation (#stay), then send. */
V.stay=function(){
 var a=S.app,v=a.v;
 var head='<section class="stack">'+flowStep("Accommodation")+'<span class="eyebrow">Apply with EDUPLAN</span>';
 if(a.sent)return head+'<h1>Application sent</h1><p class="lead">Thank you. Your reference number is <strong>'+esc(a.sent)+'</strong>. A counsellor will contact you about signatures, the application fee and the next steps.</p></section>'+
  '<section class="panel" style="max-width:760px"><h2>Next: pay your tuition fees</h2><p class="muted">Choose to pay per semester or in full, then your payment method (FPX, Touch \'n Go eWallet or PayPal).</p>'+
  '<div class="row"><a class="btn" href="#pay">Pay tuition fees '+ARROW+'</a><button type="button" class="btn ghost" data-apply="clear">Start a new application</button><a class="btn ghost" href="#home">Back to home</a></div></section>';
 if(!a.complete)return head+'<h1>Finish your application first</h1><p class="lead">Accommodation help is the last step of the application.</p><div class="row"><a class="btn" href="#apply">Go to the application form</a></div></section>';
 var x=applyProg();
 return head+'<h1>Do you need help with accommodation?</h1><p class="lead">EDUPLAN can help you find a hostel or a room near '+esc(x?x.u.name:"your campus")+'.</p>'+
  (x&&accomData(x.u.id)?'<details class="acc"><summary><span class="acci" aria-hidden="true">🏠</span><span class="acct"><b>Accommodation details from the institution</b><span class="hint"><span>from</span> <span data-notr>'+esc(rm(accomFrom(x.u.id)))+'</span> <span>a month</span></span></span></summary><div class="accb">'+accomBox(x.u.id)+'</div></details>':'')+'</section>'+
  '<section class="panel" style="max-width:760px"><form class="fields" id="stay-form" novalidate>'+
   agroup("Accommodation",af("acc","Do you need accommodation help?",{opts:[["Yes","Yes, please help me"],["No","No, I have arranged it"]],first:"Choose",rerender:true,full:true})+
    (v.acc==="Yes"?af("acc_type","Type",{opts:["On-campus hostel","Rented room near campus","Not sure yet"],first:"Choose"})+af("acc_room","Room",{opts:["Single room","Shared room","No preference"],first:"Choose"})+
     af("acc_budget","Budget per month (RM)",{opt:true,mode:"numeric"})+af("acc_move","Move-in month",{type:"month",opt:true})+af("acc_notes","Anything else",{area:true,rows:2,full:true,opt:true}):''))+
   '<div class="row"><button type="button" class="btn ghost" data-apply="edit">Back to the form</button><button type="submit" class="btn" id="stay-send"'+(a.sending?' disabled':'')+'>'+(a.sending?'Sending…':'Send my application to EDUPLAN')+'</button></div>'+
   '<p class="muted" id="stay-msg" aria-live="polite">'+(a.sendMsg?esc(a.sendMsg):'')+'</p>'+
  '</form></section>'+(a.fallback?applyFallback():'');
};
/* When the application cannot be sent from this page: share to WhatsApp (phones), or copy / print and send the photos separately. */
function applyFallback(){
 var share=navigator.canShare&&window.File;
 return '<section class="panel" style="max-width:760px"><h2>Send it yourself</h2><p class="muted">Send this summary and your document photos to EDUPLAN by WhatsApp <a href="'+esc(waLink("Application"))+'" target="_blank" rel="noopener" data-notr>'+WA_SHOW+'</a>.</p>'+
  '<pre class="summary" id="apply-summary">'+esc(applySummary())+'</pre>'+
  '<div class="row noprint">'+(share?'<button type="button" class="btn" data-apply="share">Share with documents</button>':'')+
  '<button type="button" class="btn'+(share?' ghost':'')+'" data-apply="copy">Copy summary</button><button type="button" class="btn ghost" data-apply="print">Print or save as PDF</button></div>'+
  '<p class="muted noprint" id="apply-copied" aria-live="polite"></p></section>';
}
function applyFilesForShare(){var out=[];Object.keys(S.app.files).forEach(function(k){S.app.files[k].forEach(function(f){var bin=atob(f.data),u=new Uint8Array(bin.length);for(var i=0;i<bin.length;i++)u[i]=bin.charCodeAt(i);out.push(new File([u],k+"-"+f.name,{type:f.type}));});});return out;}
/* The school's own form (school-forms.js), filled in by Apply.gs: the answers it needs, by name. */
function applyFormData(){var sf=schoolForm(),v=S.app.v;if(!sf)return null;
 if(sf.all){var edu=[];for(var i=1;i<=(S.app.edu||1);i++)if(v["ed"+i+"_school"])edu.push({qual:v["ed"+i+"_qual"]||"",school:v["ed"+i+"_school"],year:String(v["ed"+i+"_to"]||"").slice(0,4)});
  var eng=[];for(var j=1;j<=(S.app.eng||1);j++)if(v["en"+j+"_type"])eng.push({test:v["en"+j+"_type"],date:v["en"+j+"_date"]||"",score:v["en"+j+"_score"]||""});
  var em=v.em_same?{name:v.g_name,rel:v.g_rel,mobile:v.g_mobile,email:v.g_email}:{name:v.e_name,rel:v.e_rel,mobile:v.e_mobile,email:""};
  return {school:sf.id,all:true,course:sf.x.p.programme,specialism:sfSpecialism(sf),level:sfLevel(sf),intake:v.intake||"",
   title:v.a_title==="Others"?v.a_title_other||"":v.a_title||"",name:String(v.name_en||"").toUpperCase(),ic:v.ic||"",dob:v.dob||"",pob:v.a_pob||"",gender:v.gender||"",marital:v.marital||"",
   nationality:v.nationality||"",international:sfIntl(),race:v.race||"",religion:v.religion||"",address:[v.addr,v.town].filter(Boolean).join(", "),postcode:v.postcode||"",state:v.state||"",country:v.country||"",
   mobile:v.mobile||"",email:v.email||"",guardian:v.g_name||"",relation:v.g_rel||"",guardianMobile:v.g_mobile||"",guardianEmail:v.g_email||"",guardianIc:v.a_g_ic||"",
   emergency:em.name||"",emergencyRelation:em.rel||"",emergencyMobile:em.mobile||"",emergencyEmail:em.email||"",
   education:edu,highest:{qual:v.h_type||"",school:v.h_school||"",year:String(v.h_end||"").slice(0,4),status:v.h_status||""},
   medical:v.a_med||"",medicalInfo:v.a_med_info||"",mental:v.a_mental||"",mentalInfo:v.a_mental_info||"",cope:v.a_cope||"",
   englishInstruction:v.a_eng_instr||"",english:eng,visa:v.a_visa||"",visaType:v.a_visa_type||"",visaExpiry:v.a_visa_exp||"",accommodation:v.acc||""};}
 var prefs=[];for(var i=1;i<=5;i++){var d=v["u_pref"+i]&&sfDegree(sf,v["u_pref"+i]);prefs.push(d?d[0]+" ("+d[1]+")":"");}
 return {school:sf.id,route:sf.route,previous:v.u_prev||"",schoolId:v.u_id||"",prefs:prefs,campus:v.u_campus||"",health:v.u_health||"",healthInfo:v.u_health_info||"",
  name:String(v.name_en||"").toUpperCase(),ic:v.ic||"",nationality:v.nationality||"",dob:v.dob||"",gender:v.gender||"",
  address:[v.addr,v.town].filter(Boolean).join(", "),postcode:v.postcode||"",state:v.state||"",mobile:v.mobile||"",email:v.email||"",race:v.race||"",religion:v.religion||"",
  guardian:v.g_name||"",relation:v.g_rel||"",guardianMobile:v.g_mobile||"",guardianEmail:v.g_email||"",intake:v.intake||""};}
/* Sends to the Apps Script (apps-script/Apply.gs), which stores the application in EDUPLAN's private Google Drive. */
function applySend(){
 var a=S.app,url=window.EDUPLAN_API_URL,files=[];
 Object.keys(a.files).forEach(function(k){a.files[k].forEach(function(f){files.push({doc:k==="results"&&a.v.h_status?"results-"+a.v.h_status.toLowerCase():k,name:f.name,type:f.type,data:f.data});});});
 var fb=function(msg){a.sending=false;a.fallback=true;a.sendMsg=msg;rerender("stay-msg");};
 if(!url||!window.fetch||window.EDUPLAN_SHEET_DATA)return fb("This preview cannot send files. Please send your application yourself below.");
 a.sending=true;a.sendMsg="";rerender();
 var x=applyProg(),v=a.v;
 fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"apply",summary:applySummary(),files:files,
  fields:{institution:x?x.u.id:"",name:String(v.name_en||"").toUpperCase(),ic:v.ic,mobile:v.mobile,email:v.email,university:x?x.u.name:"",programme:x?x.p.programme:"",track:v.track||"",intake:v.intake,accommodation:v.acc||""},form:applyFormData()})})
  .then(function(r){return r.json();})
  .then(function(d){if(!d||!d.ref)throw new Error(d&&d.error||"failed");a.sending=false;a.sent=d.ref;a.files={};applySave();rerender();window.scrollTo(0,0);})
  .catch(function(){fb("Your application could not be sent just now. Please send it yourself below, or try again later.");});
}

/* ---------- My portfolio: sign in with an emailed code, and autosave ----------
   Saved programmes, the interest quiz and the consultation request are kept in this browser (localStorage) and the
   application in this tab (sessionStorage), signed in or not. Once the student signs in (#portfolio), every change is
   also saved to their portfolio on EDUPLAN's server (apps-script/Account.gs), so they can continue on any device.
   Each section (saved, quiz, consult, apply) has its own "changed at" time; the newer copy wins when devices differ.
   Uploaded documents are never saved in the portfolio. Signing out removes the student's details from this browser. */
S.prof=store("eduplan-profile")||{};
var PF_KEY="eduplan-session",PF_AT="eduplan-at",PF_SECTIONS=["saved","quiz","consult","apply","results","profile"];
var PF={s:store(PF_KEY),at:store(PF_AT)||{},step:"email",email:"",consent:false,msg:"",err:"",busy:false,dirty:false,saving:false,timer:null,loaded:0,del:false};
if(PF.s&&!(PF.s.token&&PF.s.exp>Date.now()))PF.s=null;
/* The website opens with the sign-in page (pfGate). Guests are let in only when sign-in cannot work: the artifact
   preview, or EDUPLAN's daily email limit reached / server unreachable (PF.guestOk), so students are never locked out. */
PF.guest=sget("eduplan-guest")==="1";
var SAVED=store("eduplan-saved")||[];
var PF_ERR={bad_email:"Enter an email like name@example.com.",consent:"Please tick to agree first.",code:"Enter the 6-digit code from the email.",
 wait:"A code was sent less than a minute ago. Check your inbox and spam folder, or wait a minute and ask again.",
 too_many:"Too many codes were asked for this email. Please try again in a few hours.",daily_limit:"Sign-in is very busy today. Please try again tomorrow.",
 bad_code:"That code is not right. Use the latest code EDUPLAN emailed you.",expired:"This code has expired. Ask for a new code.",
 busy:"EDUPLAN is busy right now. Please try again in a moment.",net:"EDUPLAN could not be reached. Check your connection and try again in a few minutes.",
 server:"EDUPLAN's server had a problem. Please try again in a few minutes. If it keeps happening, please tell EDUPLAN.",
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
 results:{exams:RX.get().exams,at:a.results||0},
 profile:{f:S.prof,at:a.profile||0}};}
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
 if(newer("profile")){S.prof=d.profile.f||{};store("eduplan-profile",S.prof);a.profile=d.profile.at;ch=true;}
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
  if(d&&d.error==="too_large")return pfStatus("Your portfolio is too large to save. Please contact EDUPLAN.",true);
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
 try{["eduplan-session","eduplan-at","eduplan-saved","eduplan-quiz","eduplan-consult","eduplan-results","eduplan-profile","eduplan-compare","eduplan-fit"].forEach(function(k){localStorage.removeItem(k);});sessionStorage.removeItem(APPLY_KEY);}catch(e){}
 RX.use({});
 PF.at={};SAVED=[];S.guide={step:0,answers:[]};S.cons={};S.prof={};S.consDone=null;S.app=applyLoad();
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
/* The lab's interests step saved the top 3 fields: keep them in the portfolio. */
window.addEventListener("eduplan:profile",function(){S.prof=store("eduplan-profile")||{};pfTouch("profile");});
/* Claude can read photos in this view (results.js checkAI): redraw so the photo buttons appear. */
window.addEventListener("eduplan:ai",function(){if(app.querySelector(".idup,.idok,.pflogin,#cons-form")||/consultation|portfolio/.test(location.hash))render(true);});
/* My results changed (assets/js/results.js): save it to the portfolio, fill the application's results, redraw. */
window.addEventListener("eduplan:results",function(){
 pfTouch("results");
 var hx=applyExam();if(hx){S.app.v.h_results=RX.text(hx);var rv=RX.get().exams[hx];if(rv&&rv.v&&RX.has(hx))S.app.v.h_status=rv.v.kind;if(S.app.err)delete S.app.err.h_results;applySave();}
 if(app.querySelector("#rx,.prog,.paybox"))render(true);
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
  pfSignedIn(d);rerender();window.scrollTo(0,0);
 }).catch(function(){PF.busy=false;PF.err=PF_ERR.net;rerender("pf-code");});
}
/* A verified code: keep the session and load the portfolio into this browser (My portfolio and the opening screens). */
function pfSignedIn(d){
 PF.s={token:d.token,email:d.email,exp:Date.now()+(d.days||30)*864e5};store(PF_KEY,PF.s);
 PF.step="email";PF.msg="";PF.err="";PF.loaded=Date.now();
 pfUse(d.data,true);
 if(PF.dirty)PF.timer=setTimeout(pfFlush,300);
 pfStatus("Signed in. Your progress is saved automatically.");
 try{window.dispatchEvent(new CustomEvent("eduplan:signedin"));}catch(e){}
}
/* Sign-in for other screens (the lab's opening screens): the same account and portfolio as My portfolio. */
window.EDUPLAN_ACCOUNT={live:pfLive,errors:PF_ERR,
 sendCode:function(email){PF.email=String(email||"").trim().toLowerCase();PF.consent=true;return pfPost({action:"account_code",email:PF.email});},
 verify:function(email,code){return pfPost({action:"account_verify",email:String(email||"").trim().toLowerCase(),code:String(code||"").replace(/\D/g,"")}).then(function(d){
  if(d&&d.token){pfSignedIn(d);render(true);}return d;});}};
function pfAction(act){
 if(act==="guest"){PF.guest=true;sset("eduplan-guest","1");PF.err="";if(HOST&&HOST.locked&&sget("eduplan-pfmode")){sset("eduplan-pfmode","");location.hash="#home";return;}rerender();window.scrollTo(0,0);return;}
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
   pfForget();PF.msg="Your portfolio was deleted. Applications you already sent stay with EDUPLAN so a counsellor can process them.";rerender();window.scrollTo(0,0);
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

/* First layer: signing in asks only for an email, a one-time code and agreement to how the portfolio is used. */
function pfAsk(){return '<div class="pfask"><span class="sl">To sign in we only ask for</span><ul>'+
  '<li><b>Your email</b><span>Your account; we send the sign-in code and reminders here.</span></li>'+
  '<li><b>A one-time code</b><span>Proves the email is yours. No password to remember.</span></li>'+
  '<li><b>Your agreement</b><span>To how EDUPLAN uses your portfolio (Malaysia’s Personal Data Protection Act 2010).</span></li></ul>'+
  '<p class="hint">Everything else is optional, or asked only when you apply. We never ask for a password or card details. <a href="#privacy">What we ask for, and when</a></p></div>';}
function pfLogin(gate){
 var err=PF.err?'<span class="err" id="pf-err">'+esc(PF.err)+'</span>':'',inv=PF.err?' aria-invalid="true" aria-describedby="pf-err"':'',dis=PF.busy?' disabled':'';
 var msg=PF.msg?'<p class="note" role="status">'+esc(PF.msg)+'</p>':'';
 var guest=gate&&PF.guestOk?'<div class="row"><button type="button" class="btn ghost" data-pf="guest">Continue without signing in</button></div>':'';
 if(!pfLive()){var pm=sget("eduplan-pfmode"),member=HOST&&HOST.locked&&!HOST.locked("guided");
  return '<section class="panel pflogin"><h2>'+(pm==="register"?'Register':'Sign in')+'</h2><p class="muted">Registering and signing in work on the live EDUPLAN website. In this preview, your saved programmes and quiz result stay in this browser.</p>'+pfAsk()+
  (gate||(pm&&!member)?'<p class="muted">Tap below to try everything a member can do in this preview.</p><div class="row"><button type="button" class="btn" data-pf="guest">Continue to the preview</button></div>':'')+'</section>';}
 if(PF.step==="code")return '<section class="panel pflogin"><h2>Enter your code</h2>'+msg+
  '<form class="fields" id="pf-code-form" novalidate><div class="field"><label for="pf-code">6-digit code</label>'+
  '<input id="pf-code" inputmode="numeric" autocomplete="one-time-code" maxlength="6"'+inv+'>'+err+'<span class="hint">Sent to <span data-notr>'+esc(PF.email)+'</span>. Check your spam folder if it is not in your inbox.</span></div>'+
  '<div class="row"><button type="submit" class="btn"'+dis+'>'+(PF.busy?'Checking…':'Sign in')+'</button>'+
  '<button type="button" class="btn ghost" data-pf="again"'+dis+'>Send a new code</button><button type="button" class="btn ghost" data-pf="other">Use another email</button></div></form>'+guest+'</section>';
 var mode=gate?"":sget("eduplan-pfmode");
 return '<section class="panel pflogin"><h2>'+(gate?'Sign in to continue':mode==="register"?'Register: create your free account':mode==="signin"?'Sign in to your account':'Sign in or create your portfolio')+'</h2>'+msg+
  (mode==="register"?'<p class="muted">Enter your email and we send you a 6-digit code. No password needed.</p>':mode==="signin"?'<p class="muted">Enter the email you registered with. We send you a 6-digit code to sign in.</p>':'')+pfAsk()+
  '<form class="fields" id="pf-email-form" novalidate><div class="field"><label for="pf-email">Email</label>'+
  '<input id="pf-email" type="email" autocomplete="email" value="'+esc(PF.email)+'"'+(PF.err&&PF.err!==PF_ERR.consent?inv:'')+'>'+(PF.err&&PF.err!==PF_ERR.consent?err:'')+
  '<span class="hint">No password needed. Each time you sign in, we email you a 6-digit code.</span></div>'+
  '<div class="field"><label class="check"><input type="checkbox" id="pf-consent"'+(PF.consent?' checked':'')+(PF.err===PF_ERR.consent?inv:'')+'><span>I agree that EDUPLAN keeps my portfolio (saved programmes, quiz result, results, profile, consultation request and application details) to guide me with my studies. Only EDUPLAN staff can see it; it goes to a university only when I submit an application. I can delete it at any time. If I am under 18, I have asked my parent or guardian.</span></label>'+(PF.err===PF_ERR.consent?err:'')+'</div>'+
  '<div class="row"><button type="submit" class="btn"'+dis+'>'+(PF.busy?'Sending…':'Email me a code')+'</button></div></form>'+
  (mode==="register"?'<p class="hint">Already have an account? <button type="button" class="linkbtn" data-role="signin">Sign in</button></p>':mode==="signin"?'<p class="hint">First time here? <button type="button" class="linkbtn" data-role="register">Register</button></p>':'')+guest+'</section>';
}
/* The first page of the website until the student signs in. The page they asked for opens after signing in. */
V.gate=function(){
 var intro=!PF.gateShown;PF.gateShown=true;   /* animate only the first time it appears */
 return '<section class="gate'+(intro?' intro':'')+'"><div class="gatecopy stack"><span class="eyebrow">Welcome to EDUPLAN</span><h1>Find your course, university and scholarship</h1>'+
  '<p class="lead">Sign in with your email to start. It is free, there is no password, and your progress is saved so you can continue on any device.</p>'+
  '<ul class="gatelist">'+["Courses, fees and entry requirements from partner universities","Scholarships you can apply for","An AI study assistant and free counsellors","One application form for your chosen university"]
   .map(function(t,k){return '<li style="--i:'+k+'">'+esc(t)+'</li>';}).join("")+'</ul></div>'+pfLogin(true)+'</section>';
};
function pfCard(title,body,cls,icon,id){return '<section class="panel pfcard'+(cls?' '+cls:'')+'"'+(id?' id="'+id+'"':'')+'><h2>'+(icon?'<span class="pfi" aria-hidden="true">'+icon+'</span>':'')+'<span>'+title+'</span></h2>'+body+'</section>';}
/* Portfolio header: who is signed in, and how complete the portfolio is (each step links to its card). */
function pfHero(){
 var p=S.prof||{},em=PF.s&&PF.s.email,steps=[["pf-profile","Name verified with IC",!!idv()],["pf-profile","Interests chosen",(p.fields||[]).length>0||S.guide.step>=QUIZ.questions.length],
  ["pf-choices","Programmes saved",SAVED.length>0],["pf-results","Results added",RX.taken().length>0],["pf-apply","Application started",!!(S.app.sent||applyProg())]];
 var done=steps.filter(function(x){return x[2];}).length,pct=Math.round(done/steps.length*100),r=34,c=2*Math.PI*r;
 return '<section class="pfhero"><div class="pfhbg" aria-hidden="true"><i></i><i></i></div>'+
  '<div class="pfwho"><span class="pfav" aria-hidden="true" data-notr>'+esc(((idv()&&idv().name)||em||"E").charAt(0).toUpperCase())+'</span><div class="stack">'+
   '<span class="eyebrow">My portfolio</span><h1>'+(PF.s?'Your EDUPLAN portfolio':'Save your progress')+'</h1>'+
   (em?'<p class="pfmail"><span>Signed in as</span> <b data-notr>'+esc(em)+'</b></p>':'<p class="pfmail">Keep your saved programmes, quiz result and application in one place.</p>')+
   '<span class="pill'+(idv()?' ok':'')+'">'+(idv()?'✓ Verified student':'Guest: verify your name with your IC in My profile')+'</span></div></div>'+
  '<div class="pfdone"><span class="pfring"><svg viewBox="0 0 80 80" aria-hidden="true"><circle cx="40" cy="40" r="'+r+'" class="tr"/><circle cx="40" cy="40" r="'+r+'" class="pr" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+(c*(1-pct/100)).toFixed(1)+'" style="--c:'+c.toFixed(1)+'"/></svg><b data-notr>'+pct+'%</b></span>'+
   '<div class="stack"><b>Portfolio complete</b><div class="pfsteps2">'+steps.map(function(x){return '<button type="button" class="pfstep'+(x[2]?' ok':'')+'" data-pfjump="'+x[0]+'">'+(x[2]?'✓':'○')+' <span>'+x[1]+'</span></button>';}).join("")+'</div></div></div></section>';}
/* My interests: the top fields the student chose (My profile) and the interest quiz result, first in the portfolio. */
function pfInterests(quiz){var f=((S.prof||{}).fields||[]).filter(function(c){return facField(c);});
 return '<h3>My interests</h3>'+(f.length?'<p class="muted">Fields you chose:</p><div class="pfints">'+f.map(function(c,i){var x=facField(c);return '<a class="pfint" href="#faculty/'+esc(c)+'" style="--h:'+((Number(c)*33+190)%360)+';--i:'+i+'"><span class="pfn">'+esc(c)+'</span><b>'+esc(x.name)+'</b><span>'+esc(x.zh||"")+'</span></a>';}).join("")+'</div>'
  :'<p class="muted">No fields chosen yet. Tick the fields you like in My profile, or take the interest quiz.</p>')+
  '<p class="hint">Change your fields under My details below.</p><h3>Interest quiz</h3>'+quiz;}
document.addEventListener("click",function(ev){var t=ev.target.closest&&ev.target.closest("[data-pfjump]");if(!t)return;var el=document.getElementById(t.getAttribute("data-pfjump"));
 if(el){el.scrollIntoView({behavior:"smooth",block:"start"});el.classList.remove("pfflash");void el.offsetWidth;el.classList.add("pfflash");}});
/* Campus scholarships the student's saved results reach (or nearly reach), from the school sheets. */
/* Campus scholarship tiers in the shape results.js reads. */
function campusRows(){var t=schType("campus"),rows=[];
 ((t&&t.universities)||[]).forEach(function(u){u.tiers.forEach(function(r){if(r.qual&&r.qual!=="Other")rows.push({inst:u.id,instName:u.name,name:r.scheme||"Scholarship",applies:r.applies,qual:r.qual,min:r.min,waiver:r.waiver,amount:r.amount});});});
 return rows;}
function pfScholarships(){
 var rows=campusRows();
 if(!RX.taken().length)return '<p class="muted">Add your exam results above. EDUPLAN then lists the campus scholarships your results qualify for.</p>';
 var list=RX.scholarships(rows),yes=list.filter(function(s){return s.hit;}),near=list.filter(function(s){return !s.hit;});
 function item(s){return '<div class="item"><span class="eyebrow">'+esc(s.instName)+'</span><span class="name">'+esc(s.name)+'</span>'+(s.applies?'<span class="hint">'+esc(s.applies)+'</span>':'')+
   (s.hit?'<span class="pill ok">'+esc(RX.awardText(s.hit))+'</span><span class="hint">With your '+esc(s.exam)+' results</span>':'')+
   (s.next?'<span class="hint">'+esc((s.hit?'Next: ':'')+RX.nextText(s))+'</span>':'')+
   '<div class="row"><a class="btn ghost" href="#scholarships-campus/'+esc(String(s.inst).toLowerCase())+'">See this scholarship '+ARROW+'</a></div></div>';}
 return RX.trackerHtml(list)+(yes.length?'<p class="muted">Your results qualify for '+yes.length+' campus scholarship'+(yes.length===1?'':'s')+'. Each one checks other conditions too, so read its details before you apply.</p><div class="pfsaved">'+yes.map(item).join("")+'</div>'
   :'<div class="empty">No campus scholarship in our data matches your results yet.</div>')+
  (near.length?'<h3>Almost there</h3><div class="pfsaved">'+near.map(item).join("")+'</div>':'');
}
/* Privacy, cookies and security (#privacy). Everything here describes what the code does: no cookies, browser storage
   for progress, the portfolio and applications on EDUPLAN's Google account (apps-script/Account.gs, Apply.gs). */
var STORE_ROWS=[
 ["Language","eduplan-lang","English or 中文","Until you change it"],
 ["My results","eduplan-results","Your exam subjects and grades","Until you remove them or clear this browser"],
 ["Saved and recent programmes","eduplan-saved, eduplan-lab-recent","Programmes you saved or opened","Until you remove them or clear this browser"],
 ["Interest quiz","eduplan-quiz","Your quiz answers","Until you retake it or clear this browser"],
 ["Searches","eduplan-lab-search, eduplan-lab-sch, eduplan-lab-mode","Your last search and route","Until you clear them"],
 ["Scholarship choice","eduplan-sch-pick","The scholarship you chose for each programme","Until you change it"],
 ["My profile","eduplan-profile","Your verified name and the last 4 digits of your IC, and the optional WhatsApp number, status and interests you filled in","Until you change them or clear this browser"],
 ["Consultation request","eduplan-consult","Details you typed in the consultation form","Until you clear this browser"],
 ["Sign-in","eduplan-session","Your email and a sign-in token","30 days, or until you sign out"],
 ["Application in progress","eduplan-apply","The application form you are filling in","Until you close the tab"],
 ["AI assistant","eduplan-chat","Your latest chat messages","Until you close the tab"],
 ["Visit counted","eduplan-visit","A mark that this tab's visit was counted, so it is counted once","Until you close the tab"]];
/* ---------- Payment (#pay, #pay/method): tuition to EDUPLAN, per semester or in full ----------
   The amount is the programme's tuition minus the scholarship the student chose (results.js). Per semester assumes
   2 semesters a year; the university's fee schedule decides the real amounts, which EDUPLAN confirms before charging.
   The server (Payments.gs) records the request and, once a gateway is connected, returns its checkout page. */
var PAY_KEY="eduplan-pay";S.pay=store(PAY_KEY)||{};
var PAY_METHODS=[["fpx","FPX online banking","Pay from your Malaysian bank account"],["tng","Touch 'n Go eWallet","Pay with the TNG eWallet app"],["paypal","PayPal","Pay with a PayPal account or card"]];
function payQuote(){var x=applyProg()||findProg(S.pick);if(!x)return null;
 var annual=lines(x.p.notes).filter(function(l){return /^Annual fee: /.test(l);}).map(function(l){return l.replace(/^Annual fee: /,"");});
 var base=RX.feeBase(x.p.fee,annual,x.p.years);if(!base||base.year)return {x:x};
 var list=RX.taken().length?RX.schFor(campusRows(),x.u.id,x.p.level).list:[],pk=RX.pickOf(x.p.id,list),off=RX.cut(base,pk&&pk.t),total=base.total-off;
 var n=Math.max(1,Math.round((x.p.years||1)*2));
 return {x:x,base:base,pk:pk,off:off,total:total,n:n,sem:Math.round(total/n*100)/100};}
function payDue(q){return S.pay.plan==="semester"?q.sem:q.total;}
function paySave(){S.pay.prog=(payQuote()||{x:{p:{}}}).x.p.id;store(PAY_KEY,S.pay);}
V.pay=function(){var q=payQuote(),step=S.payStep;
 var head='<section class="stack">'+flowStep("Payment")+'<span class="eyebrow">Payment</span>';
 if(!q)return head+'<h1>Choose a programme first</h1><p class="lead">Payment comes after you choose a programme and apply.</p><div class="row"><a class="btn" href="#universities">Find a programme</a></div></section>';
 var x=q.x,card='<div class="pickcard"><span class="eyebrow">'+esc(x.u.fullName||x.u.name)+'</span><h2>'+esc(x.p.programme)+'</h2></div>';
 if(!q.base)return head+'<h1>Pay tuition fees</h1>'+card+'<p class="lead">The tuition fee for this programme is not listed yet, so it cannot be paid online. A counsellor will confirm the amount with you.</p><div class="row"><a class="btn" href="#consultation">Ask a counsellor</a></div></section>';
 var sum='<dl class="paytot"><dt>Tuition fee</dt><dd>'+esc(rm(q.base.total))+' <span class="hint">('+esc(q.base.how)+')</span></dd>'+
  (q.pk?'<dt>Scholarship</dt><dd>− '+esc(rm(q.off))+' <span class="hint">('+esc(RX.awardShort(q.pk.t))+')</span></dd>':'')+'<dt>Total to pay</dt><dd><b>'+esc(rm(q.total))+'</b></dd></dl>';
 if(step!=="method")return head+'<h1>How would you like to pay?</h1>'+card+'</section>'+
  '<section class="panel" style="max-width:760px">'+sum+'<fieldset class="picks"><legend class="hint">Choose a payment plan.</legend>'+
   '<label class="pickr"><input type="radio" name="payplan" data-payplan="semester"'+(S.pay.plan==="semester"?' checked':'')+'><span><b>Per semester (instalments)</b><span>'+esc(rm(q.sem))+' a semester × '+q.n+' semesters</span><span class="hint">Pay each semester before it starts.</span></span></label>'+
   '<label class="pickr"><input type="radio" name="payplan" data-payplan="full"'+(S.pay.plan==="full"?' checked':'')+'><span><b>Full payment</b><span>'+esc(rm(q.total))+' once</span><span class="hint">Pay the whole programme now.</span></span></label></fieldset>'+
   '<p class="hint">Estimate for '+(q.base.est?'the yearly fee × duration':'the whole programme')+', 2 semesters a year. The university\'s fee schedule decides the exact amounts and dates; EDUPLAN confirms the amount with you before you pay.</p>'+
   '<div class="row"><a class="btn'+(S.pay.plan?'':' disabled')+'" href="#pay/method"'+(S.pay.plan?'':' aria-disabled="true" tabindex="-1"')+' data-paynext>Choose payment method '+ARROW+'</a></div></section>';
 if(!S.pay.plan){location.hash="#pay";return '';}
 var due=payDue(q),done=S.pay.ref&&S.pay.prog===x.p.id&&S.pay.status;
 return head+'<h1>Choose a payment method</h1>'+card+'</section>'+
  '<section class="panel" style="max-width:760px"><dl class="paytot"><dt>Plan</dt><dd>'+(S.pay.plan==="semester"?'Per semester (instalments)':'Full payment')+' <a class="hint" href="#pay">Change</a></dd>'+
   '<dt>Amount due now</dt><dd><b>'+esc(rm(due))+'</b>'+(S.pay.plan==="semester"?' <span class="hint">(semester 1 of '+q.n+')</span>':'')+'</dd></dl>'+
   '<fieldset class="picks"><legend class="hint">Choose how to pay. You will be taken to the payment provider\'s own page to pay; EDUPLAN never sees your bank or card details.</legend>'+
   PAY_METHODS.map(function(m){return '<label class="pickr"><input type="radio" name="paymethod" data-paymethod="'+m[0]+'"'+(S.pay.method===m[0]?' checked':'')+'><span><b>'+esc(m[1])+'</b><span class="hint">'+esc(m[2])+'</span></span></label>';}).join("")+'</fieldset>'+
   (S.payErr?'<p class="err" role="alert">'+esc(S.payErr)+'</p>':'')+
   (done?'<div class="note" role="status">Payment request <strong data-notr>'+esc(S.pay.ref)+'</strong> is recorded. Online payment is not open yet: a counsellor will send you the payment details for '+esc(rm(due))+'.</div>':'')+
   (!pfLive()?'<p class="hint">Online payment works on the live EDUPLAN website. This preview shows the steps only.</p>':!PF.s?'<p class="hint"><a href="#portfolio">Sign in</a> to pay, so the payment is linked to your application.</p>':'')+
   '<div class="row"><button type="button" class="btn" data-paygo'+(!S.pay.method||S.payBusy||!pfLive()||!PF.s?' disabled':'')+'>'+(S.payBusy?'Please wait…':'Continue to payment '+ARROW)+'</button><a class="btn ghost" href="#pay">Back</a></div></section>';
};
function payGo(){var q=payQuote();if(!q||!q.base||!S.pay.plan||!S.pay.method||!PF.s)return;S.payBusy=true;S.payErr="";rerender();
 pfPost({action:"pay_create",token:PF.s.token,prog:q.x.p.id,plan:S.pay.plan,method:S.pay.method,amount:payDue(q),total:q.total}).then(function(d){S.payBusy=false;
  if(d&&d.ok&&d.url){S.pay.ref=d.ref;S.pay.status="redirected";paySave();location.href=d.url;return;}
  if(d&&d.ok){S.pay.ref=d.ref;S.pay.status="requested";S.pay.at=Date.now();paySave();}
  else S.payErr=d&&d.error==="signed_out"?"Please sign in again.":"Could not start the payment. Please try again, or ask a counsellor.";
  rerender();}).catch(function(){S.payBusy=false;S.payErr="Could not reach EDUPLAN. Check your connection and try again.";rerender();});}
document.addEventListener("change",function(ev){var t=ev.target;if(!t.hasAttribute)return;
 if(t.hasAttribute("data-payplan")){S.pay.plan=t.getAttribute("data-payplan");S.pay.ref=null;S.pay.status=null;paySave();rerender();}
 if(t.hasAttribute("data-paymethod")){S.pay.method=t.getAttribute("data-paymethod");paySave();rerender();}});
document.addEventListener("click",function(ev){var t=ev.target.closest&&ev.target.closest("[data-paygo],[data-paynext]");if(!t)return;
 if(t.hasAttribute("data-paynext")&&!S.pay.plan){ev.preventDefault();return;}if(t.hasAttribute("data-paygo"))payGo();});
/* My portfolio: the payment plan and the last payment request. */
function pfPayment(){var q=payQuote();
 if(!q||!S.app.v.prog)return '<p class="muted">After you apply for a programme, choose here how to pay the tuition fees: per semester or in full.</p><div class="row"><a class="btn ghost" href="#universities">Find a programme</a></div>';
 if(!q.base)return '<p class="muted">The tuition fee for '+esc(q.x.p.programme)+' is not listed yet; a counsellor will confirm it.</p>';
 return '<dl class="paytot"><dt>Programme</dt><dd>'+esc(q.x.p.programme)+' <span class="hint">('+esc(q.x.u.name)+')</span></dd><dt>Total to pay</dt><dd><b>'+esc(rm(q.total))+'</b>'+(q.pk?' <span class="hint">after '+esc(RX.awardShort(q.pk.t))+'</span>':'')+'</dd>'+
  '<dt>Plan</dt><dd>'+(S.pay.plan==="semester"?'Per semester: '+esc(rm(q.sem))+' × '+q.n:S.pay.plan==="full"?'Full payment':'Not chosen yet')+'</dd>'+
  (S.pay.ref&&S.pay.prog===q.x.p.id?'<dt>Last request</dt><dd data-notr>'+esc(S.pay.ref)+'</dd>':'')+'</dl>'+
  '<div class="row"><a class="btn" href="#pay">'+(S.pay.plan?'Change plan or pay':'Choose how to pay')+' '+ARROW+'</a></div>';}
/* Lab: scholarship pages and the interest quiz are for members; visitors are asked to register or sign in. */
V.locked=function(){
 return '<section class="stack"><span class="eyebrow">Members only</span><h1>Register or sign in to continue</h1>'+
  '<p class="lead">Searching by scholarship, interest or guidance is for EDUPLAN members. It is free: register once with your email, no password needed.</p>'+
  '<ul class="reqlist"><li>Match scholarships to your exam results</li><li>Take the interest quiz and get faculties that suit you</li><li>Save programmes and continue on any device</li></ul>'+
  '<div class="row"><button type="button" class="btn" data-role="register">Register</button><button type="button" class="btn ghost" data-role="signin">Sign in</button></div>'+
  '<p class="hint">Visitors can still browse:</p><div class="row"><a class="btn ghost" href="#faculty">Faculties and courses</a><a class="btn ghost" href="#universities">Universities</a></div></section>';
};
V.privacy=function(){
 return '<section class="stack"><span class="eyebrow">Privacy and security</span><h1>Privacy, cookies and security</h1>'+
  '<p class="lead">How EDUPLAN keeps your information safe, what is stored in your browser and what is sent to EDUPLAN.</p></section>'+
 '<section class="panel"><h2>Cookies</h2><ul class="reqlist"><li>EDUPLAN does not use cookies.</li><li>There are no advertising or tracking cookies, and no analytics tools from other companies on this website.</li><li>EDUPLAN counts visits anonymously: how many visits each day, whether the visitor was signed in, and which route (interest, scholarship or guidance) was open. No cookie, IP address or other identifier is kept.</li>'+
  '<li>To remember your progress, the website uses your browser’s own storage (local storage and session storage). It stays on your device and is not sent anywhere unless you sign in or submit a form.</li></ul></section>'+
 '<section class="panel"><h2>What this browser keeps</h2><div class="tablewrap"><table class="ptable"><thead><tr><th scope="col">What</th><th scope="col">Contents</th><th scope="col">Kept</th></tr></thead><tbody>'+
  STORE_ROWS.map(function(r){return '<tr><td><b>'+esc(r[0])+'</b><span class="hint" data-notr>'+esc(r[1])+'</span></td><td>'+esc(r[2])+'</td><td>'+esc(r[3])+'</td></tr>';}).join("")+'</tbody></table></div>'+
  '<div class="row"><button type="button" class="btn ghost" data-act="privacy-clear">Clear EDUPLAN data from this browser</button></div>'+
  '<p class="hint">This removes everything above from this browser and signs you out here. A portfolio saved to your account stays there; delete it from My portfolio.</p>'+
  (sget("eduplan-cleared")?'<p class="ematch ok" role="status">EDUPLAN data was cleared from this browser.</p>':'')+'</section>'+
 '<section class="panel"><h2>What we ask for, and when</h2><ol class="tiers3">'+
  '<li><b>To sign in</b><span>Only your email, a one-time code sent to it, and your agreement to this notice. No password.</span></li>'+
  '<li><b>In My profile (optional)</b><span>Your name, WhatsApp number, where you are in your studies, your exam results and the fields and places you are interested in. You can skip any of them; the website works without them.</span></li>'+
  '<li><b>To book a free consultation</b><span>A photo of the front of your IC (or passport photo page) so AI can confirm your name. We keep only your name and the last 4 digits of the number; the photo and the full number are not stored. Without it you browse as a guest.</span></li>'+
  '<li><b>When you apply</b><span>Your full name as on your IC, IC number, date of birth, address, documents and, for students under 18, a parent or guardian’s details. Some universities’ own forms also ask for things like religion or health; these are asked only on that university’s form. Before your application goes to the university, you are asked to agree to it.</span></li></ol>'+
  '<p class="muted"><b>We never ask for:</b> a password, bank or card numbers (you pay on the payment provider’s own page: FPX, Touch ’n Go or PayPal), or your IC number when you sign in. Your full IC number is asked only on the application form.</p></section>'+
 '<section class="panel"><h2>What is sent to EDUPLAN</h2><ul class="reqlist">'+
  '<li><b>My portfolio (only when you sign in):</b> your saved programmes, quiz result, results, profile, consultation request and application details are saved to EDUPLAN’s Google account so you can continue on any device. EDUPLAN also keeps when you registered, signed in, signed out and last used the website.</li>'+
  '<li><b>Applications:</b> your form and documents are kept in a private folder that only EDUPLAN staff can open, and are shared with the university you apply to so it can process your application.</li>'+
  '<li><b>AI study assistant:</b> your messages are sent through EDUPLAN’s server to Anthropic’s Claude to write the reply. Please do not type your IC number, phone number or other personal details in the chat.</li>'+
  '<li><b>Results slip:</b> when you upload it in My results, it is sent through EDUPLAN’s server to Anthropic’s Claude to read your subjects and grades. The slip itself is not stored; only the grades are kept, with a mark that they were read from your slip.</li>'+
  '<li><b>Consultation requests:</b> sent to EDUPLAN so a counsellor can contact you.</li></ul></section>'+
 '<section class="panel"><h2>How your account is protected</h2><ul class="reqlist">'+
  '<li>No passwords: you sign in with a 6-digit code sent to your email. The code works for 10 minutes and allows 5 tries.</li>'+
  '<li>You stay signed in for 30 days. EDUPLAN’s server keeps only a scrambled (hashed) copy of your sign-in token.</li>'+
  '<li>Signing out ends the sign-in on EDUPLAN’s server and removes your details from this browser. Please sign out on a shared computer.</li>'+
  '<li>The website and EDUPLAN’s server talk over an encrypted connection (HTTPS).</li>'+
  '<li>EDUPLAN’s service keys are kept on the server, never in the website.</li></ul></section>'+
 '<section class="panel"><h2>Your choices</h2><ul class="reqlist">'+
  '<li>Use the website without signing in: your progress then stays in this browser only.</li>'+
  '<li>Delete your portfolio at any time from <a href="#portfolio">My portfolio</a>.</li>'+
  '<li>Under Malaysia’s Personal Data Protection Act 2010 you may ask to see or correct your personal data. <a href="#consultation">Contact EDUPLAN</a>.</li></ul></section>';
};
/* My profile (second layer): optional details asked after sign-in, never required. Name and WhatsApp fill in the
   consultation and application forms when they are empty; status and interests help EDUPLAN's counsellors. */
/* Verified name: read from the student's IC by AI (Identity.gs; in the preview by Claude in the page). Students without
   it are guests: they can browse but not book a free consultation. */
function sameNameApp(a,b){function k(s){return String(s||"").toUpperCase().replace(/[^A-Z\u00C0-\u024F\u4E00-\u9FFF]+/g," ").trim().split(/\s+/).filter(Boolean).sort().join(" ");}return !!k(a)&&k(a)===k(b);}
function idv(){var v=S.prof&&S.prof.idv;return v&&v.name&&(!RX.live()||v.sig)?v:null;}
function idBox(){var v=idv();
 if(v)return '<div class="idok"><span class="idbadge">✓ Verified with your IC</span><b data-notr>'+esc(v.name)+'</b><span class="hint">'+(v.type==="passport"?'Passport':'IC')+' ending ••••'+esc(v.last4)+'</span>'+
  (function(f){return f&&(f.address||f.gender||f.dob)?'<dl class="facts idread">'+(f.dob?'<dt>Date of birth</dt><dd data-notr>'+esc(f.dob)+'</dd>':'')+(f.pob?'<dt>Place of birth</dt><dd>'+esc(f.pob)+'</dd>':'')+
   (f.gender?'<dt>Gender</dt><dd>'+esc(f.gender)+'</dd>':'')+(f.address?'<dt>Address</dt><dd data-notr>'+esc([f.address,[f.postcode,f.town].filter(Boolean).join(" "),f.state].filter(Boolean).join(", "))+'</dd>':'')+'</dl>'+
   '<span class="hint">Filled in on your application form for you. Please check them; if anything is wrong, upload a sharper photo below.</span>':'';})((S.prof||{}).icform)+
  (!S.idBusy?'<button type="button" class="btn ghost sm" data-idremove>✕ <span>Remove my IC details</span></button>':'')+
  (RX.canRead()&&!S.idBusy?'<label class="btn ghost sm idbtn">🪪 <span>Upload my IC again</span><input type="file" accept="'+(RX.live()?'image/*,application/pdf':'image/*')+'" capture="environment" data-idfile hidden></label>':'')+
  (S.idBusy?'<p class="note" role="status">Reading your IC… This takes up to a minute.</p>':'')+(S.idErr?'<span class="err" role="alert">'+esc(S.idErr)+'</span>':'')+'</div>';
 if(RX.live()&&!PF.s)return '<p class="hint"><a href="#portfolio">Sign in</a>, then verify your name with a photo of your IC.</p>';
 if(!RX.canRead())return '<p class="hint">Verifying your name with your IC works on the live EDUPLAN website.</p>';
 if(S.idBusy)return '<p class="note" role="status">Reading your IC… This takes up to a minute.</p>';
 return '<div class="idup"><label class="btn idbtn">🪪 Verify my name with my IC<input type="file" accept="'+(RX.live()?'image/*,application/pdf':'image/*')+'" capture="environment" data-idfile hidden></label>'+
  '<span class="hint">Take a photo of the front of your IC (MyKad or MyKid; international students: passport photo page). AI reads your name, and from a MyKad or MyKid also your IC number, date of birth, place of birth, gender (from the last digit: odd male, even female), address and postcode, to fill in your application form for you. We keep your name and the last 4 digits of the number; the photo is not stored.</span>'+
  (S.idErr?'<span class="err" role="alert">'+esc(S.idErr)+'</span>':'')+'</div>';}
document.addEventListener("change",function(ev){var t=ev.target;if(!t.hasAttribute||!t.hasAttribute("data-idfile"))return;var file=t.files&&t.files[0];if(!file)return;
 S.idBusy=true;S.idErr="";rerender();
 RX.readId(file).then(function(r){S.idBusy=false;
  if(r.error)S.idErr=RX.errText(r.error);else{S.prof=S.prof||{};S.prof.idv=r.v;S.prof.name=r.v.name;S.prof.icform=r.form||{};store("eduplan-profile",S.prof);pfTouch("profile");
   /* A new IC reading replaces the IC fields already in the application form. */
   var f=S.prof.icform,map={ic:f.ic,dob:f.dob,a_pob:f.pob,gender:f.gender,nationality:f.nationality,residence:f.residence,religion:f.religion,addr:f.address,postcode:f.postcode,town:f.town,state:f.state},ch=false;
   if(S.app&&S.app.v){Object.keys(map).forEach(function(k){if(map[k]&&S.app.v[k]!==map[k]){S.app.v[k]=map[k];ch=true;}});if(ch)applySave();}}
  rerender();});});
/* Remove the IC check: the verified name, the details read from the IC and the same details in the application
   form are cleared, so the student can upload the IC again or start over. */
document.addEventListener("click",function(ev){var b=ev.target.closest&&ev.target.closest("[data-idremove]");if(!b)return;
 var q="Remove your IC details? Your verified name and the details read from your IC are cleared, also from your application form. You can upload your IC again at any time.";
 if(!window.confirm(window.EDUPLAN_T?window.EDUPLAN_T(q):q))return;
 var p=S.prof||{},f=p.icform||{},map={ic:f.ic,dob:f.dob,a_pob:f.pob,gender:f.gender,nationality:f.nationality,residence:f.residence,religion:f.religion,addr:f.address,postcode:f.postcode,town:f.town,state:f.state,name_en:p.idv&&p.idv.name},ch=false;
 if(S.app&&S.app.v)Object.keys(map).forEach(function(k){if(map[k]&&S.app.v[k]===map[k]){S.app.v[k]="";ch=true;}});if(ch)applySave();
 delete p.idv;delete p.icform;if(p.postcode&&p.postcode===f.postcode)delete p.postcode;S.prof=p;S.idErr="";store("eduplan-profile",p);pfTouch("profile");rerender();});
var PROF_STATUS=["Form 4 or Form 5 student","Waiting for SPM results","Finished SPM","In pre-university (Form 6, A-Level, foundation, matriculation)","Studying at a college or university"];
var MY_STATES=["Johor","Kedah","Kelantan","Kuala Lumpur","Labuan","Melaka","Negeri Sembilan","Pahang","Penang","Perak","Perlis","Putrajaya","Sabah","Sarawak","Selangor","Terengganu"];
function pfProfile(){var p=S.prof||{},fi=p.fields||[];
 return '<p class="muted">Your name comes from your IC, exactly as printed (for example TAN LI LI), and cannot be typed in. The name on your results slip must match it, so your results, scholarships and applications are accurate. It is also needed to book a free consultation. Everything else here is optional. Your name and WhatsApp number are filled in on the consultation and application forms for you. Your status and interests help our counsellors suggest courses.</p>'+
  '<div class="fields" id="pf-prof">'+
  '<div class="field"><span class="legend">Your name</span>'+idBox()+'</div>'+
  '<div class="field"><label for="pr-phone">WhatsApp number <span class="hint">(optional)</span></label><input id="pr-phone" data-prof="phone" type="tel" autocomplete="tel" placeholder="012-345 6789" value="'+esc(p.phone||"")+'"><span class="hint">For counsellor follow-ups and deadline reminders.</span></div>'+
  '<div class="field"><label for="pr-status">Where are you now? <span class="hint">(optional)</span></label><select id="pr-status" data-prof="status"><option value="">Choose</option>'+PROF_STATUS.map(function(x){return '<option'+(p.status===x?' selected':'')+'>'+esc(x)+'</option>';}).join("")+'</select></div>'+
  '<div class="field"><label for="pr-home">Your postcode <span class="hint">(optional)</span></label>'+homeSelect("pr-home")+'<span class="hint">Used to show how far each university is from home when you compare programmes.</span></div>'+
  '<div class="field"><label for="pr-region">Where would you like to study? <span class="hint">(optional)</span></label><select id="pr-region" data-prof="region"><option value="">Anywhere in Malaysia</option>'+MY_STATES.map(function(x){return '<option'+(p.region===x?' selected':'')+'>'+esc(x)+'</option>';}).join("")+'</select></div>'+
  (FAC.fields.length?'<fieldset class="field pfset"><legend class="legend">Fields you are interested in <span class="hint">(optional)</span></legend><div class="chips">'+FAC.fields.filter(function(f){return f.code!=="00";}).map(function(f){return '<label class="chip pchk"><input type="checkbox" data-proff="'+esc(f.code)+'"'+(fi.indexOf(f.code)>=0?' checked':'')+'> '+esc(f.name)+'</label>';}).join("")+'</div></fieldset>':'')+
  '</div><p class="hint">Exam results are kept in My results below. Saved as you type'+(PF.s?' to your portfolio':' in this browser')+'.</p>';}
document.addEventListener("change",function(ev){var t=ev.target;if(!t||!t.closest||!t.closest("#pf-prof"))return;S.prof=S.prof||{};
 if(t.hasAttribute("data-proff")){var c=t.getAttribute("data-proff"),a=(S.prof.fields||[]).filter(function(x){return x!==c;});if(t.checked)a.push(c);S.prof.fields=a;}
 else if(t.hasAttribute("data-prof"))S.prof[t.getAttribute("data-prof")]=t.value.trim();
 store("eduplan-profile",S.prof);pfTouch("profile");});
V.portfolio=function(){
 /* Live website: the portfolio is filled in only after signing in. */
 if(pfLive()&&!PF.s)return '<section class="stack"><span class="eyebrow">My portfolio</span><h1>Sign in to fill in your portfolio</h1>'+
  '<p class="lead">Your portfolio keeps your verified name, results, profile, saved programmes, application and payment in one place, on any device.</p></section>'+pfLogin()+
  '<section class="panel pfcard"><h2>After you sign in</h2><ol class="pfsteps">'+
  '<li><b>Verify your name with your IC.</b> AI reads the name on the front of your IC. We keep only your name and the last 4 digits.</li>'+
  '<li><b>Upload your results slip</b> (official SPM results or trial results). AI reads your grades and checks that the name on the slip is the same as on your IC.</li>'+
  '<li><b>Apply and get scholarships</b> with the same verified name, results and details.</li></ol></section>';
 var head=pfHero();
 /* Saved programmes */
 var saved=pfCard("My choices",SAVED.length?'<p class="muted">Programmes you saved. Tick 2 or 3 and compare them side by side, or check how well you fit them.</p>'+cmpBar()+'<a class="fitgo" href="#fit"><span class="fiti" aria-hidden="true">🎯</span><span class="fitt"><b>Am I a good fit?</b><span>'+(fitFields().length&&fitFields().every(function(c){return fitScore(c);})?'See your fit again, or answer again':'A few quick questions for each faculty you saved, then your fit in %')+'</span></span>'+ARROW+'</a>'+'<div class="pfsaved">'+SAVED.map(function(id){var x=findProg(id);
   if(!x)return '<div class="item"><span class="name" data-notr>'+esc(id)+'</span><span class="hint">'+(UNIV.length?'This programme is no longer listed.':'Loading…')+'</span><div class="row">'+saveBtn(id)+'</div></div>';
   return '<div class="item"><span class="eyebrow">'+esc(x.u.name)+'</span><span class="name">'+esc(x.p.programme)+'</span>'+
    '<span class="meta">'+[x.p.level,x.p.years!=null?years(x.p.years):""].filter(Boolean).map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</span>'+
    fitPill(x.p)+cmpTick(id)+'<div class="row"><a class="btn" href="#next/'+esc(x.p.id)+'">Choose '+ARROW+'</a>'+saveBtn(id)+'</div></div>';}).join("")+'</div>'
  :'<div class="empty">No saved programmes yet. Tap <strong>Save</strong> on a programme to keep it here, then compare 2 or 3 of them side by side.</div><div class="row"><a class="btn ghost" href="#faculty">Browse faculties</a><a class="btn ghost" href="#universities">Browse universities</a></div>',"wide","⭐","pf-choices");
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
  (PF.del?'<div class="empty"><strong>Delete your portfolio?</strong> Your saved programmes, quiz result, consultation request and unsent application will be deleted from EDUPLAN. Applications you already sent are not affected.</div>'+
   '<div class="row"><button type="button" class="btn" id="pf-del-yes" data-pf="delete-yes"'+(PF.busy?' disabled':'')+'>Yes, delete my portfolio</button><button type="button" class="btn ghost" data-pf="keep">Keep it</button></div>'
   :'<div class="row"><button type="button" class="btn ghost" data-pf="logout">Sign out</button><button type="button" class="btn ghost" data-pf="delete">Delete my portfolio</button></div>')+
  (PF.err?'<span class="err" role="alert">'+esc(PF.err)+'</span>':'')+
  '<p class="hint">Signing out removes your details from this browser. Please sign out on a shared computer.</p></section>':'';
 var nav='<nav class="pfnav" aria-label="Portfolio sections">'+[["pf-profile","👤","My profile"],["pf-results","📊","My results"],["pf-choices","⭐","My choices"],["pf-sch","🎓","Scholarships"],["pf-apply","📝","Application"],["pf-pay","💳","Payment"],["pf-cons","💬","Consultation"]]
  .map(function(x){return '<button type="button" data-pfjump="'+x[0]+'"><span aria-hidden="true">'+x[1]+'</span><span>'+x[2]+'</span></button>';}).join("")+'</nav>';
 return head+nav+(PF.s?'':pfLogin())+
  '<div class="pfgrid">'+pfCard("My profile",pfInterests(quiz)+'<h3>My details</h3>'+pfProfile(),"wide","👤","pf-profile")+pfCard("My results",'<p class="muted">Add your exam results once. EDUPLAN keeps them until you change them, and uses them to show which programmes and scholarships you qualify for.</p>'+RX.editor(),"wide","📊","pf-results")+saved+
   pfCard("Scholarships for my results",pfScholarships(),"wide","🎓","pf-sch")+
   pfCard("Application",app2,"","📝","pf-apply")+pfCard("My payment",pfPayment(),"","💳","pf-pay")+pfCard("Free consultation",cons,"wide","💬","pf-cons")+'</div>'+
  (PF.s?'':(pfLive()?'<p class="hint">Until you sign in, these are kept in this browser only.</p>':''))+acct;
};

/* ---------- Compare (#compare/ID,ID,ID): 2 or 3 saved programmes side by side ----------
   The student ticks programmes in My choices (portfolio), then Compare. Every number comes from the school sheets;
   distance is a straight line between town centres (TOWNS) and the popularity row counts how many universities on
   EDUPLAN offer the same course. Nothing here is estimated beyond that. */
var CMP_MAX=3,CMP=store("eduplan-compare")||[];
/* Town centres [name, latitude, longitude, state]: home towns to choose from, and where campuses are. */
var TOWNS=[["Kuala Lumpur",3.139,101.687,"W.P. Kuala Lumpur"],["Setapak",3.200,101.720,"W.P. Kuala Lumpur"],["Cheras",3.100,101.740,"W.P. Kuala Lumpur"],["Bukit Jalil",3.058,101.692,"W.P. Kuala Lumpur"],
 ["Petaling Jaya",3.107,101.607,"Selangor"],["Subang Jaya",3.050,101.585,"Selangor"],["Bandar Sunway",3.068,101.603,"Selangor"],["Shah Alam",3.073,101.518,"Selangor"],["Klang",3.044,101.446,"Selangor"],
 ["Puchong",3.025,101.618,"Selangor"],["Cyberjaya",2.922,101.651,"Selangor"],["Kajang",2.993,101.787,"Selangor"],["Semenyih",2.952,101.843,"Selangor"],["Bangi",2.920,101.780,"Selangor"],
 ["Seri Kembangan",3.022,101.705,"Selangor"],["Rawang",3.320,101.580,"Selangor"],["Sepang",2.690,101.750,"Selangor"],["Kota Damansara",3.150,101.580,"Selangor"],["Putrajaya",2.926,101.696,"W.P. Putrajaya"],
 ["Seremban",2.725,101.938,"Negeri Sembilan"],["Nilai",2.810,101.800,"Negeri Sembilan"],["Port Dickson",2.520,101.800,"Negeri Sembilan"],
 ["Melaka",2.189,102.250,"Melaka"],
 ["Johor Bahru",1.492,103.741,"Johor"],["Iskandar Puteri",1.430,103.640,"Johor"],["Skudai",1.530,103.660,"Johor"],["Kulai",1.660,103.600,"Johor"],["Kluang",2.030,103.320,"Johor"],["Batu Pahat",1.850,102.930,"Johor"],["Muar",2.040,102.570,"Johor"],["Segamat",2.510,102.820,"Johor"],
 ["Ipoh",4.597,101.090,"Perak"],["Kampar",4.310,101.150,"Perak"],["Seri Iskandar",4.360,100.980,"Perak"],["Teluk Intan",4.020,101.020,"Perak"],["Taiping",4.850,100.740,"Perak"],["Sitiawan",4.220,100.700,"Perak"],
 ["George Town",5.414,100.329,"Pulau Pinang"],["Bayan Lepas",5.290,100.260,"Pulau Pinang"],["Butterworth",5.399,100.364,"Pulau Pinang"],["Bukit Mertajam",5.360,100.460,"Pulau Pinang"],
 ["Alor Setar",6.121,100.368,"Kedah"],["Sungai Petani",5.647,100.488,"Kedah"],["Bedong",5.730,100.510,"Kedah"],["Kangar",6.440,100.200,"Perlis"],
 ["Kota Bharu",6.125,102.238,"Kelantan"],["Kuala Terengganu",5.329,103.137,"Terengganu"],["Kuantan",3.807,103.326,"Pahang"],["Temerloh",3.450,102.420,"Pahang"],["Bentong",3.520,101.910,"Pahang"],
 ["Kota Kinabalu",5.980,116.073,"Sabah"],["Sandakan",5.840,118.120,"Sabah"],["Tawau",4.240,117.890,"Sabah"],
 ["Kuching",1.553,110.359,"Sarawak"],["Miri",4.400,113.990,"Sarawak"],["Sibu",2.300,111.820,"Sarawak"],["Bintulu",3.170,113.030,"Sarawak"],["Labuan",5.280,115.240,"W.P. Labuan"],
 ["Singapore",1.352,103.820,""]];
/* The state's capital stands in when a campus town is not in TOWNS. */
var STATE_TOWN={"W.P. Kuala Lumpur":"Kuala Lumpur","Kuala Lumpur":"Kuala Lumpur","Selangor":"Shah Alam","W.P. Putrajaya":"Putrajaya","Putrajaya":"Putrajaya","Negeri Sembilan":"Seremban","Melaka":"Melaka","Johor":"Johor Bahru",
 "Perak":"Ipoh","Pulau Pinang":"George Town","Penang":"George Town","Kedah":"Alor Setar","Perlis":"Kangar","Kelantan":"Kota Bharu","Terengganu":"Kuala Terengganu","Pahang":"Kuantan","Sabah":"Kota Kinabalu","Sarawak":"Kuching","W.P. Labuan":"Labuan","Labuan":"Labuan"};
function town(name){name=String(name||"").toLowerCase();for(var i=0;i<TOWNS.length;i++)if(TOWNS[i][0].toLowerCase()===name)return TOWNS[i];return null;}
/* Where a programme is taught: a town named in its campus or the university's city, else the state's capital (approx). */
function campusTown(x){
 var text=(String(x.p.campus||"")+" | "+String(x.u.city||"")).toLowerCase(),best=null;
 TOWNS.forEach(function(t){if(text.indexOf(t[0].toLowerCase())>=0&&(!best||t[0].length>best[0].length))best=t;});
 if(best)return {t:best,approx:false};
 var s=town(STATE_TOWN[x.u.state]||"");return s?{t:s,approx:true}:null;
}
function kmBetween(a,b){var r=Math.PI/180,dl=(b[1]-a[1])*r,dn=(b[2]-a[2])*r,h=Math.sin(dl/2)*Math.sin(dl/2)+Math.cos(a[1]*r)*Math.cos(b[1]*r)*Math.sin(dn/2)*Math.sin(dn/2);return Math.round(12742*Math.asin(Math.sqrt(h)));}
/* The student's home: a town chosen in My profile, or this device's location for this visit only (never saved). */
/* Malaysian postcodes [from, to, nearest town in TOWNS]: the first digits give the area, so the town centre is approximate. */
var PC_TOWN=[[1000,2999,"Kangar"],[5000,7999,"Alor Setar"],[8000,8099,"Sungai Petani"],[8100,8199,"Bedong"],[8200,9999,"Sungai Petani"],
 [10000,11899,"George Town"],[11900,11999,"Bayan Lepas"],[12000,13999,"Butterworth"],[14000,14999,"Bukit Mertajam"],[15000,18999,"Kota Bharu"],[20000,24999,"Kuala Terengganu"],
 [25000,26999,"Kuantan"],[27000,28699,"Temerloh"],[28700,28799,"Bentong"],[28800,29999,"Temerloh"],[30000,31899,"Ipoh"],[31900,31999,"Kampar"],[32000,32599,"Sitiawan"],[32600,32699,"Seri Iskandar"],
 [32700,32999,"Sitiawan"],[33000,34999,"Taiping"],[35000,35999,"Kampar"],[36000,36999,"Teluk Intan"],[39000,39999,"Ipoh"],[40000,40999,"Shah Alam"],[41000,42999,"Klang"],
 [43000,43299,"Kajang"],[43300,43399,"Seri Kembangan"],[43400,43499,"Kajang"],[43500,43599,"Semenyih"],[43600,43699,"Bangi"],[43700,43799,"Kajang"],[43800,43999,"Sepang"],[44000,45999,"Rawang"],
 [46000,46999,"Petaling Jaya"],[47000,47099,"Kota Damansara"],[47100,47199,"Puchong"],[47200,47499,"Petaling Jaya"],[47500,47699,"Subang Jaya"],[47700,47799,"Petaling Jaya"],[47800,47899,"Kota Damansara"],
 [47900,47999,"Petaling Jaya"],[48000,48999,"Rawang"],[49000,49999,"Bentong"],[50000,52999,"Kuala Lumpur"],[53000,53399,"Setapak"],[53400,55999,"Kuala Lumpur"],[56000,56199,"Cheras"],[56200,56999,"Kuala Lumpur"],
 [57000,57199,"Bukit Jalil"],[57200,60999,"Kuala Lumpur"],[62000,62999,"Putrajaya"],[63000,63999,"Cyberjaya"],[64000,64999,"Sepang"],[68000,68999,"Kuala Lumpur"],[69000,69999,"Bentong"],
 [70000,70999,"Seremban"],[71000,71099,"Port Dickson"],[71100,71799,"Seremban"],[71800,71899,"Nilai"],[71900,73999,"Seremban"],[75000,78999,"Melaka"],[79000,79999,"Iskandar Puteri"],[80000,80999,"Johor Bahru"],
 [81000,81099,"Kulai"],[81100,81299,"Johor Bahru"],[81300,81399,"Skudai"],[81400,81999,"Johor Bahru"],[82000,83999,"Batu Pahat"],[84000,84999,"Muar"],[85000,85999,"Segamat"],[86000,86999,"Kluang"],
 [87000,87999,"Labuan"],[88000,89999,"Kota Kinabalu"],[90000,90999,"Sandakan"],[91000,91999,"Tawau"],[93000,95999,"Kuching"],[96000,96999,"Sibu"],[97000,97999,"Bintulu"],[98000,98999,"Miri"]];
function pcTown(pc){pc=String(pc||"").replace(/\D/g,"");if(pc.length!==5)return null;var n=+pc;for(var i=0;i<PC_TOWN.length;i++)if(n>=PC_TOWN[i][0]&&n<=PC_TOWN[i][1])return town(PC_TOWN[i][2]);return null;}
/* The student's postcode (typed in My profile or read from the IC); a town chosen before stays as a fallback. */
function homePC(){var p=S.prof||{};return p.postcode||(p.icform&&p.icform.postcode)||"";}
function homePoint(){if(S.geo)return ["your location",S.geo[0],S.geo[1]];var t=pcTown(homePC());return t?[homePC()+" ("+t[0]+")",t[1],t[2],t[3]]:town(S.prof&&S.prof.home);}
function homeSelect(id){var pc=homePC(),t=pcTown(pc);
 return '<input id="'+id+'" type="text" inputmode="numeric" maxlength="5" pattern="[0-9]{5}" autocomplete="postal-code" placeholder="e.g. 43000" value="'+esc(pc)+'" data-home-pc>'+
  '<span class="hint" id="'+id+'-near">'+(t?'<span>Near</span> <span data-notr>'+esc(t[0]+(t[3]?", "+t[3]:""))+'</span>':pc?'<span>Postcode not found. Check the 5 digits.</span>':'')+'</span>';}
function cmpSave(){CMP=CMP.filter(function(id){return SAVED.indexOf(id)>=0;});store("eduplan-compare",CMP);}
function cmpHref(ids){return "#compare/"+ids.map(encodeURIComponent).join(",");}
/* The picker in My choices: tick 2 or 3 saved programmes, then Compare. */
function cmpBar(){cmpSave();var n=CMP.length;
 return '<div class="cmpbar"><span class="cmpcount"><b>'+n+'</b> / '+CMP_MAX+'</span><span class="hint">'+(n<2?'Tick 2 or 3 programmes to compare them.':n===CMP_MAX?'Ready. You can compare up to 3.':'Ready. Tick one more if you like.')+'</span>'+
  (n>=2?'<a class="btn cmpgo" href="'+esc(cmpHref(CMP))+'">⚖️ <span>Compare</span> '+ARROW+'</a>':'<span class="btn cmpgo" aria-disabled="true">⚖️ <span>Compare</span></span>')+'</div>';}
function cmpTick(id){var on=CMP.indexOf(id)>=0,full=!on&&CMP.length>=CMP_MAX;
 return '<label class="cmpchk'+(on?' on':'')+(full?' full':'')+'"><input type="checkbox" data-cmp="'+esc(id)+'"'+(on?' checked':'')+(full?' disabled':'')+'><span>'+(on?'In comparison':'Compare')+'</span></label>';}
function cmpToggle(id){var i=CMP.indexOf(id);if(i>=0)CMP.splice(i,1);else if(CMP.length<CMP_MAX)CMP.push(id);store("eduplan-compare",CMP);rerender();}

function annualOf(p){return lines(p.notes).filter(function(x){return /^Annual fee: /.test(x);}).map(function(x){return x.replace(/^Annual fee: /,"");});}
/* How many universities on EDUPLAN offer the same course (popularity among institutions). */
function courseReach(p){if(!p.course_id)return null;var u={};allProgs().forEach(function(y){if(y.p.course_id===p.course_id)u[y.u.id]=1;});return Object.keys(u).length;}
function cmpData(x){
 var p=x.p,sch=progScholarships(p),best=null,mine=null,home=homePoint(),ct=campusTown(x);
 sch.forEach(function(g){if(g.best!=null&&(best==null||g.best>best))best=g.best;});
 if(RX.taken().length)RX.scholarships(campusRows().filter(function(r){return r.inst===x.u.id;})).forEach(function(s){if(s.hit&&(!mine||(s.hit.waiver||0)>(mine.waiver||0)))mine=s.hit;});
 var fy=p.fee!=null&&p.years?Math.round(p.fee/p.years):null;
 return {x:x,fee:p.fee!=null?Number(p.fee):null,perYear:fy,annual:annualOf(p),years:p.years!=null?Number(p.years):null,best:best,mine:mine,sch:sch,
  km:home&&ct?kmBetween(home,ct.t):null,town:ct,reach:courseReach(p),careers:careerList(p.course_id,p.careers).list,careersGeneral:careerList(p.course_id,p.careers).general,
  badge:RX.taken().length?RX.badge(RX.match({spm:p.entry,uec:p.uec,olevel:p.olevel,stpm:p.stpm,other:p.entry_other})):null};
}
/* Winner of a row: lowest or highest value among the programmes that have one (needs at least 2 values). */
/* Winners of a row: every programme with the lowest (or highest) value, so a tie crowns them all; none when all are equal. */
function cmpWin(list,key,low){var v=list.filter(function(d){return d[key]!=null;});if(v.length<2)return [];
 var best=v.reduce(function(a,b){return (low?b[key]<a[key]:b[key]>a[key])?b:a;})[key],w=v.filter(function(d){return d[key]===best;});
 return w.length===v.length?[]:w;}
function cmpRow(icon,title,list,cell,note,txt){return '<section class="crow'+(txt?' txt':'')+'"><h3><span aria-hidden="true">'+icon+'</span>'+title+'</h3><div class="ccells n'+list.length+'">'+list.map(function(d,i){return '<div class="ccell" style="--i:'+i+';--h:'+CMP_HUE[i]+'"><span class="ctag"><b aria-hidden="true">'+(i+1)+'</b><span data-notr>'+esc(d.x.u.name)+' · '+esc(cmpCut(d.x.p.programme,48))+'</span></span>'+cell(d,i)+'</div>';}).join("")+'</div>'+(note?'<p class="hint">'+note+'</p>':'')+'</section>';}
function cmpMeter(v,max,low){var w=max?Math.max(6,Math.round(v/max*100)):0;return '<span class="cmeter'+(low?' low':'')+'" aria-hidden="true"><i style="--w:'+w+'%"></i></span>';}
function crown(on,label){return on?'<span class="crown">👑 <span>'+label+'</span></span>':'';}
function cnum(n,pre,suf){return '<b class="cnum">'+(pre?'<span>'+esc(pre)+'</span>':'')+'<span data-count="'+n+'" data-notr>'+esc(Number(n).toLocaleString("en-MY"))+'</span>'+(suf?'<span class="csuf">'+esc(suf)+'</span>':'')+'</b>';}
var CMP_HUE=[199,262,24];
function cmpCut(t,n){t=String(t||"");return t.length>n?t.slice(0,n-1).replace(/\s+\S*$/,"")+"…":t;}

V.compare=function(){
 var ids=(S.cmpIds||[]),list=ids.map(findProg).filter(Boolean);
 if(list.length<2){
  if(!UNIV.length)return '<section class="stack"><h1>Compare programmes</h1><p class="muted">Loading…</p></section>';
  return '<section class="stack"><span class="eyebrow">Compare</span><h1>Compare programmes</h1><p class="lead">Save programmes you like, then tick 2 or 3 of them in My choices and tap Compare.</p>'+
   '<div class="row"><a class="btn" href="#portfolio">Go to My choices '+ARROW+'</a><a class="btn ghost" href="#universities">Browse universities</a></div></section>';
 }
 var D2=list.map(cmpData),home=homePoint();
 var wFee=cmpWin(D2,"fee",true),wYears=cmpWin(D2,"years",true),wKm=cmpWin(D2,"km",true),wSch=cmpWin(D2,"best",false),wReach=cmpWin(D2,"reach",false);
 var maxFee=Math.max.apply(null,D2.map(function(d){return d.fee||0;})),maxYears=Math.max.apply(null,D2.map(function(d){return d.years||0;})),
  maxKm=Math.max.apply(null,D2.map(function(d){return d.km||0;})),maxReach=Math.max.apply(null,D2.map(function(d){return d.reach||0;}));
 var heads='<div class="cheads n'+D2.length+'">'+D2.map(function(d,i){var x=d.x,meta=[x.p.level,d.years!=null?years(d.years):""].filter(Boolean);
   var wins=[wFee.indexOf(d)>=0?'Lowest fee':'',wYears.indexOf(d)>=0?'Shortest':'',wKm.indexOf(d)>=0?'Nearest':'',wSch.indexOf(d)>=0?'Biggest scholarship':''].filter(Boolean);
   return '<article class="chead" style="--i:'+i+';--h:'+CMP_HUE[i]+'"><span class="cn" aria-hidden="true">'+(i+1)+'</span><span class="eyebrow">'+esc(x.u.name)+'</span><h2>'+esc(x.p.programme)+'</h2>'+
    (meta.length?'<span class="meta">'+meta.map(function(m){return '<span class="pill">'+esc(m)+'</span>';}).join("")+'</span>':'')+
    (wins.length?'<span class="cwins">'+wins.map(function(w){return crown(true,esc(w));}).join("")+'</span>':'')+'</article>';}).join("")+'</div>';
 var homeBox=home?'<p class="hint"><span>Distance measured from</span> '+(S.geo?'<b>your location</b>':'<b data-notr>'+esc(home[0])+'</b>')+' <button type="button" class="linkbtn" data-cmpact="home-change">Change</button></p>'
  :'<div class="chome"><label for="cmp-home">Your postcode</label>'+homeSelect("cmp-home")+'<button type="button" class="btn ghost sm" data-cmpact="geo"><span aria-hidden="true">📍</span><span>Use my location</span></button></div>'+(S.geoErr?'<p class="err" role="alert">'+esc(S.geoErr)+'</p>':'');
 if(S.homeEdit&&home)homeBox='<div class="chome"><label for="cmp-home">Your postcode</label>'+homeSelect("cmp-home")+'<button type="button" class="btn ghost sm" data-cmpact="geo"><span aria-hidden="true">📍</span><span>Use my location</span></button></div>';
 var anyFit=D2.some(function(d){var c=progFac(d.x.p);return c&&fitScore(c);});
 var rows=(anyFit?cmpRow("🎯","Your fit",D2,function(d){var c=progFac(d.x.p),f=c&&fitScore(c);return f?'<span class="fitpill '+f.cls+'"><span>'+esc(f.band[1])+'</span></span>'+cnum(f.pct,"","%")+cmpMeter(f.pct,100,f.cls==="ok"):'<span class="hint">Not answered for this faculty</span>';},'From the Am I a good fit? quiz.'):'<a class="fitgo" href="#fit"><span class="fiti" aria-hidden="true">🎯</span><span class="fitt"><b>Am I a good fit?</b><span>Answer a few questions to add your fit to this comparison</span></span>'+ARROW+'</a>')+
  cmpRow("💰","Tuition fee (whole programme)",D2,function(d){
   if(d.fee==null)return d.annual.length?'<span class="cval">'+d.annual.map(function(a){return '<span class="line">'+esc(a)+'</span>';}).join("")+'</span><span class="hint">per year</span>':'<span class="hint">To be confirmed</span>';
   return crown(wFee.indexOf(d)>=0,'Lowest')+cnum(d.fee,"RM ")+cmpMeter(d.fee,maxFee,wFee.indexOf(d)>=0)+(d.perYear?'<span class="hint"><span>About</span> <span data-notr>'+esc(rm(d.perYear))+'</span> <span>a year</span></span>':'');},
   'Fees from the universities\' own fee lists. Hostel, books and other costs are not included.')+
  cmpRow("⏱️","Duration",D2,function(d){return d.years==null?'<span class="hint">Not listed</span>':crown(wYears.indexOf(d)>=0,'Shortest')+cnum(d.years,"",d.years===1?" year":" years")+cmpMeter(d.years,maxYears,wYears.indexOf(d)>=0);})+
  cmpRow("📍","Location and distance from home",D2,function(d){var x=d.x,place=x.p.campus||x.p.place||"";
   return '<span class="cval">'+(place?esc(place):'<span class="hint">To be confirmed</span>')+'</span>'+
    (d.km!=null?crown(wKm.indexOf(d)>=0,'Nearest')+cnum(d.km,"≈ "," km")+cmpMeter(d.km,maxKm,wKm.indexOf(d)>=0)+(d.town&&d.town.approx?'<span class="hint"><span>Measured to the state capital:</span> <span data-notr>'+esc(d.town.t[0])+'</span></span>':''):'');},
   home?'Straight-line distance between town centres; the road trip is longer.':'',true)+
  '<div class="chomewrap">'+homeBox+'</div>'+
  cmpRow("🎓","Scholarship",D2,function(d){
   return (d.best!=null?crown(wSch.indexOf(d)>=0,'Biggest')+cnum(d.best,"Up to ","%")+'<span class="hint">tuition waiver</span>'+cmpMeter(d.best,100,wSch.indexOf(d)>=0):d.sch.length?'<span class="cval">'+esc(d.sch[0].name)+'</span>':'<span class="hint">No campus scholarship listed</span>')+
    (d.mine?'<span class="pill ok"><span>With your results:</span> <b>'+esc(RX.awardText(d.mine))+'</b></span>':'');},
   RX.taken().length?'':'<a href="#portfolio">Add your results</a> to see the scholarship you would get.')+
  cmpRow("✅","Entry requirements",D2,function(d){var l=[],ex="";ENTRY.some(function(e){var x=lines(d.x.p[e[0]]);if(x.length){l=x;ex=e[1];return true;}return false;});
   return (ex?'<span class="pill">'+esc(ex)+'</span>':'')+(d.badge?'<span class="ematch '+d.badge[0]+'">'+esc(d.badge[1])+'</span>':'')+(l.length?'<ul class="clist">'+l.slice(0,5).map(function(x){return '<li>'+esc(x.replace(/^[•·*▪◦–-]\s*/,""))+'</li>';}).join("")+'</ul>'+(l.length>5?'<span class="hint">+'+(l.length-5)+'</span>':''):'<span class="hint">Not listed by the institution</span>')+
    (d.x.p.english?'<span class="hint"><span>English:</span> '+esc(cmpCut(d.x.p.english,160))+'</span>':'');},RX.taken().length?'':'<a href="#portfolio">Add your results</a> to see if you meet them.',true)+
  cmpRow("🔥","Popularity",D2,function(d){return d.reach==null?'<span class="hint">Not available</span>':crown(wReach.indexOf(d)>=0,'Most offered')+cnum(d.reach,"",d.reach===1?" university":" universities")+cmpMeter(d.reach,maxReach,false);},
   'How many universities on EDUPLAN offer the same course: a sign of how established and in demand it is.')+
  cmpRow("🚀","Future careers",D2,function(d){return d.careers.length?'<span class="cchips">'+d.careers.slice(0,6).map(function(c){return '<span class="cchip">'+esc(c)+'</span>';}).join("")+'</span>'+(d.careersGeneral?'<span class="hint">(general guide)</span>':''):'<span class="hint">Not listed by the institution yet</span>';},"",true)+
  cmpRow("🗓️","Intakes",D2,function(d){return d.x.p.intakes?'<span class="cval">'+esc(d.x.p.intakes)+'</span>':'<span class="hint">Not listed</span>';})+
  '<section class="crow cact txt"><div class="ccells n'+D2.length+'">'+D2.map(function(d,i){return '<div class="ccell" style="--i:'+i+'"><a class="btn" href="#next/'+esc(d.x.p.id)+'">Choose this '+ARROW+'</a>'+
   (d.x.p.url?'<a class="btn ghost sm" href="'+esc(d.x.p.url)+'" target="_blank" rel="noopener">Programme page</a>':'')+'</div>';}).join("")+'</div></section>';
 var tableView=cmpView()==="table",W={fee:wFee,years:wYears,km:wKm,sch:wSch,reach:wReach};
 var sw='<div class="cview" role="group" aria-label="Show the comparison as"><button type="button" data-cmpact="view-table" aria-pressed="'+tableView+'"><span aria-hidden="true">▦</span> <span>Table</span></button>'+
  '<button type="button" data-cmpact="view-cards" aria-pressed="'+!tableView+'"><span aria-hidden="true">▤</span> <span>Cards</span></button></div>';
 var body=tableView?'<div class="ctwrap n'+D2.length+'" role="region" aria-label="Comparison table, scroll sideways to see every programme" tabindex="0">'+
   cmpTable(D2,W,"ctable","Comparison of "+D2.map(function(d){return d.x.p.programme+" at "+d.x.u.name;}).join(", "),true)+'</div>'+
   '<p class="hint">★ = best in the row. '+(D2.length>2?'Scroll sideways on a phone to see every programme. ':'')+'Fees exclude hostel and books; distance is a straight line between town centres.</p><div class="chomewrap">'+homeBox+'</div>'
  :heads+rows;
 var share="https://wa.me/?text="+encodeURIComponent("EDUPLAN comparison: "+D2.map(function(d){return d.x.p.programme+" ("+d.x.u.name+")";}).join(" vs ")+" "+location.href);
 return '<div class="cmp"><section class="stack chero"><span class="eyebrow">Compare</span><h1>'+(D2.length===3?'3 programmes, side by side':'2 programmes, side by side')+'</h1>'+
   '<p class="lead">'+(tableView?'Fees, time, distance, scholarships, entry requirements and careers in one table. ★ marks the best in each row.':'Fees, time, distance, scholarships, entry requirements and careers in one view. 👑 marks the best in each row.')+'</p>'+
   '<div class="row"><button type="button" class="btn sm cmpa4go" data-cmpact="a4">📄 <span>Save as A4 PDF</span></button><a class="btn ghost sm" href="#portfolio">Change my choices</a><a class="btn ghost sm" href="'+esc(share)+'" target="_blank" rel="noopener">Share on WhatsApp</a></div>'+sw+'</section>'+
  body+'</div>'+cmpA4(D2,W,home);
};
/* The comparison as one A4 page (hidden on screen, the only thing printed): Save as A4 PDF opens the print window,
   where "Save as PDF" keeps it. Plain table, no animation, a star on the best of each row. */
function cmpA4(D2,W,home){
 var v=idv(),today=new Date().toISOString().slice(0,10);
 return '<section class="a4sheet" aria-hidden="true"><header class="a4head"><img src="'+esc(window.EDUPLAN_LOGO||"assets/img/logo.png")+'" alt="EDUPLAN"><div><b>Programme comparison</b>'+
  '<span>'+(v?'<span data-notr>'+esc(v.name)+'</span> · ':'')+today+(home?' · <span>Distance from</span> <span data-notr>'+esc(S.geo?'my location':home[0])+'</span>':'')+'</span></div></header>'+
  cmpTable(D2,W,"a4t","")+'<p class="a4foot">★ best in the row · Facts from each university\u2019s published information on EDUPLAN; distance is a straight line between town centres. Please confirm with the university before you apply. · EDUPLAN · WhatsApp '+WA_SHOW+'</p></section>';}
/* The comparison as a real table (screen table view and the A4 sheet): a row per criterion, a column per programme,
   header cells scoped for screen readers, ★ = best in the row (also said in words). */
function cmpTable(D2,W,cls,caption,screen){
 function star(key,d){return W[key].indexOf(d)>=0?' <b class="a4star" aria-hidden="true">★</b><span class="sr">best in this row</span>':'';}
 function row(label,cell){return '<tr><th scope="row">'+label+'</th>'+D2.map(function(d){return '<td>'+cell(d)+'</td>';}).join("")+'</tr>';}
 var fit=D2.some(function(d){var c=progFac(d.x.p);return c&&fitScore(c);});
 return '<table class="'+cls+'">'+(caption?'<caption class="sr">'+caption+'</caption>':'')+'<thead><tr><td class="ctcorner"><span class="sr">Criterion</span></td>'+D2.map(function(d,i){return '<th scope="col" style="--h:'+CMP_HUE[i]+'"><span class="a4n" aria-hidden="true">'+(i+1)+'</span><span class="a4u" data-notr>'+esc(d.x.u.name)+'</span><b>'+esc(d.x.p.programme)+'</b><span class="a4l">'+esc(d.x.p.level||"")+'</span></th>';}).join("")+'</tr></thead><tbody>'+
  (fit?row("Your fit",function(d){var c=progFac(d.x.p),f=c&&fitScore(c);return f?f.pct+'% · '+esc(f.band[1]):'—';}):'')+
  row("Tuition fee",function(d){return d.fee!=null?esc(rm(d.fee))+star("fee",d)+(d.perYear?'<br><small>about '+esc(rm(d.perYear))+' a year</small>':''):d.annual.length?esc(d.annual.join("; "))+'<br><small>per year</small>':'<small>To be confirmed</small>';})+
  row("Duration",function(d){return d.years!=null?esc(years(d.years))+star("years",d):'—';})+
  row("Location",function(d){return esc(d.x.p.campus||d.x.p.place||"—")+(d.km!=null?'<br><small>≈ '+d.km+' km from home</small>'+star("km",d):'');})+
  row("Scholarship",function(d){return (d.best!=null?'Up to '+d.best+'% tuition waiver'+star("sch",d):'<small>No campus scholarship listed</small>')+(d.mine?'<br><small>With my results: '+esc(RX.awardText(d.mine))+'</small>':'');})+
  row("Entry requirements",function(d){var l=[],ex="";ENTRY.some(function(e){var x=lines(d.x.p[e[0]]);if(x.length){l=x;ex=e[1];return true;}return false;});
   return (ex?'<small><b>'+esc(ex)+'</b></small><br>'+l.slice(0,4).map(function(x){return esc(x.replace(/^[•·*▪◦–-]\s*/,""));}).join('<br>')+(l.length>4?'<br><small>+'+(l.length-4)+' more</small>':''):'<small>Not listed</small>')+
    (d.x.p.english?'<br><small>English: '+esc(cmpCut(d.x.p.english,90))+'</small>':'');})+
  row("Popularity",function(d){return d.reach!=null?plural2(d.reach,"university","universities")+' offer it'+star("reach",d):'—';})+
  row("Careers",function(d){return d.careers.length?d.careers.slice(0,5).map(function(c){return '<span>'+esc(c)+'</span>';}).join(", ")+(d.careersGeneral?' <small>(general guide)</small>':''):'<small>Not listed</small>';})+
  row("Intakes",function(d){return esc(d.x.p.intakes||"—");})+
  (screen?row('<span class="sr">Next step</span>',function(d){return '<a class="btn sm" href="#next/'+esc(d.x.p.id)+'">Choose this</a>';}):'')+
  '</tbody></table>';}
/* Table on phones, cards on wider screens, until the student picks one (kept in this browser). */
function cmpView(){var v=null;try{v=localStorage.getItem("eduplan-cmpview");}catch(e){}return v||(window.matchMedia&&matchMedia("(max-width:640px)").matches?"table":"cards");}
function plural2(n,one,many){return n+' '+(n===1?one:many);}
/* Numbers count up when the comparison opens (skipped with reduced motion). */
function cmpAnimate(){if(!motion)return;Array.prototype.forEach.call(app.querySelectorAll(".cmp [data-count],.fitres [data-count]"),function(el,k){
 var to=Number(el.getAttribute("data-count")),pre="",suf="",t0=null,dur=900,delay=250+k*40,dec=to%1?1:0;
 function step(ts){if(t0==null)t0=ts+delay;var f=Math.min(1,Math.max(0,(ts-t0)/dur)),e=1-Math.pow(1-f,3);el.textContent=pre+(to*e).toLocaleString("en-MY",{maximumFractionDigits:dec,minimumFractionDigits:f<1?0:dec})+suf;if(f<1)requestAnimationFrame(step);}
 el.textContent=pre+"0"+suf;requestAnimationFrame(step);});}
document.addEventListener("change",function(ev){var t=ev.target;if(!t||!t.hasAttribute)return;
 if(t.hasAttribute("data-cmp")){cmpToggle(t.getAttribute("data-cmp"));return;}
 if(t.hasAttribute("data-home-pc")){var pc=String(t.value||"").replace(/\D/g,"").slice(0,5);S.prof=S.prof||{};
  if(pc.length===5&&!pcTown(pc)){var nb=document.getElementById(t.id+"-near");if(nb)nb.textContent="Postcode not found. Check the 5 digits.";return;}
  S.prof.postcode=pc;S.geo=null;S.homeEdit=false;store("eduplan-profile",S.prof);pfTouch("profile");if(S.view==="compare")render(true);else rerender();}});
document.addEventListener("click",function(ev){var t=ev.target.closest&&ev.target.closest("[data-cmpact]");if(!t)return;var a=t.getAttribute("data-cmpact");
 if(a==="a4"){var sheet=app.querySelector(".a4sheet");if(!sheet)return;var root=document.createElement("div");root.id="printroot";root.innerHTML=sheet.outerHTML;document.body.appendChild(root);
  document.body.classList.add("printa4");var done=function(){document.body.classList.remove("printa4");if(root.parentNode)root.parentNode.removeChild(root);window.removeEventListener("afterprint",done);};
  window.addEventListener("afterprint",done);try{window.print();}catch(e){done();}setTimeout(function(){if(!window.matchMedia||!matchMedia("print").matches)done();},60000);return;}
 if(a==="view-table"||a==="view-cards"){try{localStorage.setItem("eduplan-cmpview",a.slice(5));}catch(e){}render(false);var b=app.querySelector('[data-cmpact="'+a+'"]');if(b)b.focus();return;}
 if(a==="home-change"){S.homeEdit=true;S.geo=null;rerender("cmp-home");}
 else if(a==="geo"){if(!navigator.geolocation){S.geoErr="This browser cannot share its location. Type your postcode instead.";return rerender();}
  t.disabled=true;navigator.geolocation.getCurrentPosition(function(p){S.geo=[Math.round(p.coords.latitude*100)/100,Math.round(p.coords.longitude*100)/100];S.geoErr="";S.homeEdit=false;render(true);},
   function(){S.geoErr="Location not shared. Type your postcode instead.";render(true);},{timeout:10000,maximumAge:600000});}});

/* ---------- Am I a good fit? (#fit): a short quiz for the faculties of the saved programmes ----------
   Questions and points are in fit-data.js. The fit percentage per faculty is the answers (70%) and the grades in the
   faculty's key subjects from My results (30%); without results, the answers alone. Kept in this browser. */
var FIT=window.EDUPLAN_FIT||{common:[],fields:{},bands:[],weights:{quiz:1,results:0}};
S.fit=store("eduplan-fit")||{a:{}};
function fitSave(){store("eduplan-fit",S.fit);}
function progFac(p){var f=facOfCourse(p.course_id);return f?f.code:null;}
/* Faculties of the saved programmes that have fit questions, in the order the programmes were saved. */
function fitFields(){var out=[];SAVED.forEach(function(id){var x=findProg(id),c=x&&progFac(x.p);if(c&&FIT.fields[c]&&out.indexOf(c)<0)out.push(c);});return out;}
function fitQs(fields){var qs=FIT.common.map(function(q,i){return {key:"c"+i,q:q,field:null};});
 fields.forEach(function(c){FIT.fields[c].questions.forEach(function(q,i){qs.push({key:c+"-"+i,q:q,field:c});});});return qs;}
/* Grades in the faculty's key subjects, 0-100 (A grades 100, credit 70, pass 35, below 0); null without any. */
function fitResults(code){var re=FIT.fields[code].subjects,sum=0,n=0;
 RX.taken().forEach(function(eid){var e=RX.exam(eid);if(!e||e.cgpa)return;var ci=e.grades.indexOf(e.credit),pi=e.grades.indexOf(e.pass);
  RX.grades(eid).forEach(function(s){if(!re.test(s[0]))return;var k=e.grades.indexOf(s[1]);if(k<0)return;
   sum+=e.a.indexOf(s[1])>=0?100:k<=ci?70:k<=pi?35:0;n++;});});
 return n?{pct:Math.round(sum/n),n:n}:null;}
/* null until every question for this faculty (and the common ones) is answered. */
function fitScore(code){
 if(!FIT.fields[code])return null;var qs=fitQs([code]),got=0,max=0,good=[],think=[];
 for(var i=0;i<qs.length;i++){var k=S.fit.a[qs[i].key];if(k==null)return null;var o=qs[i].q.a[k];got+=o[2];max+=3;
  if(qs[i].field){if(o[2]===3)good.push(qs[i].q.q);else if(o[2]<=1)think.push(qs[i].q.q);}}
 var quiz=Math.round(got/max*100),res=fitResults(code),w=FIT.weights,pct=res?Math.round(quiz*w.quiz+res.pct*w.results):quiz;
 var band=FIT.bands.filter(function(b){return pct>=b[0];})[0]||FIT.bands[FIT.bands.length-1];
 return {pct:pct,quiz:quiz,res:res,band:band,good:good,think:think,cls:pct>=75?"ok":pct>=55?"good":pct>=40?"mid":"low"};}
function fitPill(p){var c=progFac(p),s=c&&fitScore(c);return s?'<span class="fitpill '+s.cls+'">🎯 <b data-notr>'+s.pct+'%</b> <span>'+esc(s.band[1])+'</span></span>':'';}
function fitRing(pct,cls){var r=52,c=2*Math.PI*r,off=(c*(1-pct/100)).toFixed(1);
 return '<span class="fitring '+cls+'"><svg viewBox="0 0 120 120" aria-hidden="true"><circle cx="60" cy="60" r="'+r+'" class="tr"/><circle cx="60" cy="60" r="'+r+'" class="pr" style="--c:'+c.toFixed(1)+';--o:'+off+'" stroke-dasharray="'+c.toFixed(1)+'" stroke-dashoffset="'+off+'"/></svg>'+
  '<span class="fitpct"><b data-count="'+pct+'" data-notr>'+pct+'</b>%</span></span>';}
V.fit=function(){
 var head='<section class="stack"><span class="eyebrow">Am I a good fit?</span><h1>Am I a good fit?</h1>';
 if(!SAVED.length)return head+'<p class="lead">Save the programmes you are thinking about first. This quiz then checks how well you fit their faculties.</p><div class="row"><a class="btn" href="#universities">Browse universities '+ARROW+'</a></div></section>';
 if(!UNIV.length)return head+'<p class="muted">Loading…</p></section>';
 var fields=fitFields();
 if(!fields.length)return head+'<p class="lead">Your saved programmes are foundation or general programmes. Take the 12-question interest quiz to find the faculty that suits you.</p><div class="row"><a class="btn" href="#guided">Take the interest quiz '+ARROW+'</a></div></section>';
 var qs=fitQs(fields),n=qs.length;
 if(S.fitStep==null){S.fitStep=0;while(S.fitStep<n&&S.fit.a[qs[S.fitStep].key]!=null)S.fitStep++;}
 if(S.fitStep<n){var t=qs[S.fitStep],cur=S.fit.a[t.key],f=t.field&&facField(t.field);
  return head+'<p class="lead">'+n+' quick questions about what studying and working in '+(fields.length===1?'this faculty':'these faculties')+' is really like. Answer honestly: there are no wrong answers.</p></section>'+
   '<section class="panel fitq" style="max-width:760px"><div class="fitprog" aria-hidden="true"><i style="width:'+Math.round(S.fitStep/n*100)+'%"></i></div>'+
   '<p class="muted"><span>Question</span> <span data-notr>'+(S.fitStep+1)+' / '+n+'</span>'+(f?' · <span class="pill brand">'+esc(facLabel(f.code))+'</span>':' · <span class="pill">For every faculty</span>')+'</p>'+
   '<h2 id="fit-q" class="fitqt">'+esc(t.q.q)+'</h2><div class="opts" role="group" aria-labelledby="fit-q">'+t.q.a.map(function(a,k){return '<button type="button" class="opt" data-fitans="'+k+'" aria-pressed="'+(cur===k)+'">'+esc(a[0])+'</button>';}).join("")+'</div>'+
   '<div class="row"><button type="button" class="btn ghost" data-fitact="back"'+(S.fitStep===0?' disabled':'')+'>Back</button><button type="button" class="btn" data-fitact="next"'+(cur==null?' disabled':'')+'>'+(S.fitStep===n-1?'See my fit':'Next')+'</button></div></section>';}
 var cards=fields.map(function(c,i){var s=fitScore(c),f=facField(c),progs=SAVED.map(findProg).filter(function(x){return x&&progFac(x.p)===c;});
  return '<article class="fitcard '+s.cls+'" style="--i:'+i+'">'+fitRing(s.pct,s.cls)+'<div class="stack"><span class="eyebrow">'+esc(facLabel(c))+'</span><h2>'+esc(s.band[1])+'</h2>'+
   '<p class="hint"><span>Your answers:</span> <b data-notr>'+s.quiz+'%</b>'+(s.res?' · <span>Your grades in key subjects:</span> <b data-notr>'+s.res.pct+'%</b>':' · <a href="#portfolio">Add your results</a> <span>to include your grades.</span>')+'</p>'+
   (s.good.length?'<div class="fitlist good"><b>Strong signs</b><ul>'+s.good.map(function(q){return '<li>'+esc(q)+'</li>';}).join("")+'</ul></div>':'')+
   (s.think.length?'<div class="fitlist think"><b>Think about</b><ul>'+s.think.map(function(q){return '<li>'+esc(q)+'</li>';}).join("")+'</ul></div>':'')+
   '<div class="fitprogs">'+progs.map(function(x){var b=RX.taken().length?RX.badge(RX.match({spm:x.p.entry,uec:x.p.uec,olevel:x.p.olevel,stpm:x.p.stpm,other:x.p.entry_other})):null;
    return '<a class="fitp" href="#next/'+esc(x.p.id)+'"><span class="eyebrow">'+esc(x.u.name)+'</span><span class="name">'+esc(x.p.programme)+'</span>'+(b?'<span class="ematch '+b[0]+'">'+esc(b[1])+'</span>':'')+'</a>';}).join("")+'</div></div></article>';}).join("");
 return '<div class="fitres">'+head+'<p class="lead">How well you fit the faculties of your saved programmes, from your answers'+(RX.taken().length?' and your results':'')+'. It is a guide to think with, not a test: talk it through with a counsellor before you decide.</p>'+
  '<div class="row"><a class="btn ghost sm" href="#portfolio">Back to My choices</a>'+(SAVED.length>1?'<a class="btn ghost sm" href="'+esc(cmpHref((CMP.length>1?CMP:SAVED).slice(0,CMP_MAX)))+'">⚖️ <span>Compare</span></a>':'')+'<button type="button" class="btn ghost sm" data-fitact="redo">Answer again</button><a class="btn ghost sm" href="#consultation">Talk to a counsellor</a></div></section>'+
  '<div class="fitcards">'+cards+'</div></div>';
};
document.addEventListener("click",function(ev){var t=ev.target.closest&&ev.target.closest("[data-fitans],[data-fitact]");if(!t||S.view!=="fit")return;
 var qs=fitQs(fitFields()),n=qs.length;
 if(t.hasAttribute("data-fitans")){S.fit.a[qs[S.fitStep].key]=Number(t.getAttribute("data-fitans"));S.fit.at=Date.now();fitSave();
  if(S.fitStep<n-1){S.fitStep++;}else S.fitStep=n;render(false);return;}
 var a=t.getAttribute("data-fitact");
 if(a==="back"&&S.fitStep>0)S.fitStep--;else if(a==="next"&&S.fitStep<n)S.fitStep++;else if(a==="redo"){S.fit={a:{}};fitSave();S.fitStep=0;}
 render(false);});
S.app=applyLoad();
S.flow=sget("eduplan-flow")||null;
S.pick=sget("eduplan-pick")||null;

/* ---------- Router ---------- */
var app=document.getElementById("app");
function route(){
 var h=(location.hash||"#home").slice(1),r=h,view,keepHash=false;
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
  var up=r.split("/"),ux=univ(up[1]),ul=ux&&up[2]&&LEVELS.some(function(x){return x[0]===up[2];})?up[2]:null,
   us=ul&&up[3]&&LEVELS.filter(function(x){return x[0]===ul;})[0][2].some(function(sl){return subSlug(sl)===up[3];})?up[3]:null;
  if(ux){r="universities/"+ux.id.toLowerCase()+(ul?"/"+ul:"")+(us?"/"+us:"");S.uni={id:ux.id,level:ul,sub:us};}
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
  if(nx){S.pick=nx.p.id;sset("eduplan-pick",S.pick);r="next";keepHash=true;}  /* the address keeps the programme, so it can be shared */
  else if(UNIV.length){r="next";keepHash=true;}  /* the live data may still be loading: keep the programme in the address */
 }
 if(r==="apply"||r.indexOf("apply/")===0){
  var pid=r.split("/")[1],hit=pid?allProgs().filter(function(x){return String(x.p.id).toLowerCase()===pid.toLowerCase();})[0]:null;
  if(hit){if(S.app.v.prog!==hit.p.id){S.app.v.prog=hit.p.id;S.app.v.track="";}S.app.step=1;S.app.err={};S.app.complete=false;S.app.sent=null;applySave();r="apply";}
  else if(!pid||UNIV.length)r="apply";   /* before the sheet data arrives, keep the programme in the link */
 }
 if(r==="compare"||r.indexOf("compare/")===0){S.cmpIds=r.slice(8).split(",").map(function(x){try{return decodeURIComponent(x);}catch(e){return x;}}).filter(Boolean).slice(0,CMP_MAX);}
 if(r==="fit"&&S.view!=="fit")S.fitStep=null;
 S.payStep=r==="pay/method"?"method":"plan";if(r==="pay/method")r="pay/method";
 view=r.indexOf("pay")===0&&/^pay(\/method)?$/.test(r)?"pay":r.indexOf("next")===0?"next":r.indexOf("apply")===0?"apply":r.indexOf("compare")===0?"compare":r.indexOf("faculty/")===0?"faculty":r.indexOf("universities/")===0?"universities":r.indexOf("scholarships-")===0?r.split("/")[0]:r;
 if(!V[view])r=view="home";
 if(r!==h&&h&&!keepHash)history.replaceState(null,"","#"+r);
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
  S.guide=store("eduplan-quiz")||S.guide;S.cons=store("eduplan-consult")||S.cons;S.prof=store("eduplan-profile")||S.prof;S.flow=sget("eduplan-flow")||S.flow;S.pick=sget("eduplan-pick")||S.pick;
 }
 var r=route();
 if(r==="faculty")setFlow("faculty");
 else if(r.indexOf("scholarships")===0)setFlow("scholarships");
 else if(r==="universities"&&S.flow!=="scholarships")setFlow("universities");
 if((r==="faculty"&&S.fac&&S.fac.course)||(r==="universities"&&S.uni&&S.uni.level))sset("eduplan-last",location.hash);
 var gate=pfGate();document.body.classList.toggle("gated",gate);
 if(gate)r="gate";
 else if(HOST&&HOST.locked&&HOST.locked(r))r="locked";
 S.view=r;
 app.innerHTML=V[r]();
 reveal();fsFilter();if(r==="compare"||r==="fit")cmpAnimate();
 var navKey={"guided":"","home":""}[r];
 if(navKey===undefined)navKey=r.indexOf("scholarships-")===0?"scholarships":r;
 Array.prototype.forEach.call(document.querySelectorAll("nav.main a"),function(a){if(a.getAttribute("data-nav")===navKey)a.setAttribute("aria-current","page");else a.removeAttribute("aria-current");});
 if(!keepScroll){window.scrollTo(0,0);}
 if(HOST&&HOST.rendered)HOST.rendered(r);
}
function rerender(focusId){render(true);if(focusId){var el=document.getElementById(focusId);if(el)el.focus();}}
window.addEventListener("hashchange",function(){render(false);app.focus({preventScroll:true});});

/* ---------- Events (delegated) ---------- */
function readCons(){var vv=idv();if(vv)S.cons["cons-name"]=vv.name;["cons-phone","cons-email","cons-qual","cons-topic","cons-msg"].forEach(function(id){var el=document.getElementById(id);if(el)S.cons[id]=el.value;});consSave();}
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
 /* Privacy page: end the sign-in on the server, remove every eduplan-* key from this browser, start afresh. */
 if(t.getAttribute("data-act")==="privacy-clear"){var tk=PF.s&&PF.s.token;
  function wipe(){[localStorage,sessionStorage].forEach(function(st){try{Object.keys(st).filter(function(k){return k.indexOf("eduplan-")===0;}).forEach(function(k){st.removeItem(k);});}catch(e){}});
   sset("eduplan-cleared","1");location.reload();}
  if(tk&&pfLive())pfPost({action:"account_logout",token:tk}).then(wipe,wipe);else wipe();return;}
 if(t.hasAttribute("data-ask")){window.dispatchEvent(new CustomEvent("eduplan:ask",{detail:{text:t.getAttribute("data-ask")}}));return;}
 if(t.hasAttribute("data-apply")){var act=t.getAttribute("data-apply"),A=S.app;
  if(act==="back"){A.err={};A.step=Math.max(1,A.step-1);applySave();rerender();window.scrollTo(0,0);}
  else if(act==="rx-edit"||act==="rx-done"){A.rxEdit=act==="rx-edit";rerender();}
  else if(act==="add-edu"){A.edu=Math.min(5,A.edu+1);applySave();rerender("ap-ed"+A.edu+"_school");}
  else if(act==="add-eng"){A.eng=Math.min(3,A.eng+1);applySave();rerender("ap-en"+A.eng+"_type");}
  else if(act==="edit"){A.fallback=false;A.sendMsg="";location.hash="#apply";}
  else if(act==="rmfile"){var fp=t.getAttribute("data-file").split(":");(A.files[fp[0]]||[]).splice(Number(fp[1]),1);rerender("ap-f_"+fp[0]);}
  else if(act==="share"){navigator.share({title:"EDUPLAN application",text:applySummary(),files:applyFilesForShare()}).catch(function(){});}
  else if(act==="clear"){try{sessionStorage.removeItem(APPLY_KEY);}catch(e){}S.app=applyLoad();applySave();location.hash="#apply";}
  else if(act==="print")window.print();
  else if(act==="copy"){var out=document.getElementById("apply-copied"),fb=function(){var pre=document.getElementById("apply-summary"),rg=document.createRange();rg.selectNodeContents(pre);var sel=window.getSelection();sel.removeAllRanges();sel.addRange(rg);out.textContent="The summary is selected. Press Ctrl+C (or long-press on a phone) to copy it.";};
   try{navigator.clipboard.writeText(applySummary()).then(function(){out.textContent="Copied. Paste it into WhatsApp or an email to EDUPLAN.";},fb);}catch(e){fb();}}
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
  try{navigator.clipboard.writeText(txt).then(function(){out.textContent="Copied. Paste it into WhatsApp or an email to EDUPLAN.";},fallback);}catch(e){fallback();}
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
 S.consDone=["EDUPLAN free consultation request","","Name: "+c["cons-name"].trim()+(idv()?" (verified with "+(idv().type==="passport"?"passport":"IC")+" ending "+idv().last4+")":""),"Phone: "+c["cons-phone"].trim(),"Email: "+(em||"-"),"Latest qualification: "+(c["cons-qual"]||"SPM"),"Topic: "+(c["cons-topic"]||"Scholarships"),"Notes: "+((c["cons-msg"]||"").trim()||"-")].join("\n");
 rerender("cons-copy");window.scrollTo(0,0);
});

/* ---------- School data API (Google Sheet) ---------- */
function applyApi(d){
 if(window.EDUPLAN_NO_DEMO)d=window.EDUPLAN_NO_DEMO(d);
 if(!d||d.version!==1)return false;
 var inst={},courses={};
 (d.institutions||[]).forEach(function(i){inst[i.institution_id]=i;});
 FAC.fields.forEach(function(f){f.courses.forEach(function(c){c.universities=[];courses[c.id]=c;});});
 UNIV=(d.institutions||[]).map(function(i){return {id:i.institution_id,name:i.short_name||i.name,fullName:i.name,type:i.type,city:i.city,state:i.state,place:[i.city,i.state].filter(Boolean).join(", "),
  website:i.website,tour:/^https:\/\//i.test(i.virtual_tour_url||"")?i.virtual_tour_url:"",email:i.admissions_email,phone:i.admissions_phone,whatsapp:i.whatsapp,lastUpdated:i.last_updated,progs:[]};})
  .sort(function(a,b){return a.name<b.name?-1:1;});
 (d.programmes||[]).forEach(function(p){
  var i=inst[p.institution_id];if(!i)return;
  var prog={inst:p.institution_id,name:i.short_name||i.name,place:[i.city,i.state].filter(Boolean).join(", "),campus:p.campus,programme:p.programme_name,level:p.level,mode:p.study_mode,
   years:p.duration_years,intakes:p.intakes,fee:p.tuition_fee_rm,entry:p.entry_spm,uec:p.entry_uec,olevel:p.entry_olevel,stpm:p.entry_stpm,entry_other:p.entry_other,english:p.english_requirement,
   deadline:p.application_deadline,mqa:p.mqa_reference,url:p.apply_url,notes:p.notes,overview:p.overview,structure:p.programme_structure,careers:p.career_prospects,course_id:p.course_id,id:p.programme_id};
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
  .then(function(d){API_DONE=true;if(applyApi(d))render(true);else render(true);})
  .catch(function(){API_DONE=true;render(true);/* keep the local data */});
}
})();
