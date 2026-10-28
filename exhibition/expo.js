/* Eduplan 教育展 (Exhibition): organisers open education fairs, schools book booths, Eduplan admins approve.
   Talks to the same Apps Script /exec as the main site (EDUPLAN_API_URL in ../assets/js/config.js), actions "expo_*"
   in apps-script/Exhibition.gs. The server checks every rule; the checks here only give quicker messages.
   Routes: #/  #/login/organiser|exhibitor  #/org  #/org/new  #/org/edit/<id>  #/org/regs/<id>  #/ex  #/ex/apply/<id>  #/ex/my  #/admin */
(function(){
"use strict";
var API=window.EXPO_API_URL||window.EDUPLAN_API_URL,TOKEN_KEY="eduplan-expo-token";
var app=document.getElementById("app"),head=document.getElementById("xhead");
var S={token:load(),me:null,checked:false,login:{email:"",step:"email",role:"",msg:""},mine:[],flash:""};
var STATES=["Johor","Kedah","Kelantan","Melaka","Negeri Sembilan","Pahang","Perak","Perlis","Pulau Pinang","Sabah","Sarawak","Selangor","Terengganu","W.P. Kuala Lumpur","W.P. Labuan","W.P. Putrajaya"];
var TYPES=[["university","大学 University"],["college","学院 College"],["secondary","中学 Secondary school"],["other","其他 Other"]];
var ROLE={organiser:["主办方后台","Organiser"],exhibitor:["参展学校","Exhibitor"],admin:["Eduplan 管理员","Admin"]};
var EV_STATUS={draft:"草稿 Draft",pending:"待审核 In review",published:"已发布 Published",rejected:"未获批准 Not approved",closed:"已截止 Closed",cancelled:"已取消 Cancelled"};
var REG_STATUS={pending:"待审核 Pending",accepted:"已接受 Accepted",rejected:"已拒绝 Rejected",withdrawn:"已撤回 Withdrawn",cancelled:"活动已取消 Event cancelled"};
var ERR={bad_email:"请输入正确的电邮地址。",wait:"验证码刚寄出，请等 1 分钟再试。",too_many:"这个电邮申请验证码太多次，请 6 小时后再试。",
 daily_limit:"今天的电邮额度已用完，请明天再试，或联络 Eduplan。",bad_code:"验证码不对，请再检查一次。",expired:"验证码已过期，请重新获取。",
 busy:"系统忙碌，请稍后再试。",signed_out:"登录已过期，请重新登录。",not_registered:"请先完成注册。",forbidden:"你没有权限做这个操作。",
 consent:"请先勾选同意资料使用说明。",missing:"请填写所有必填栏位。",bad_role:"请选择账号类型。",already_registered:"这个电邮已经注册过。一个账号只能有一种角色。",
 admin_account:"管理员电邮不能注册为主办方或学校。",past_date:"活动日期不能早于今天。",bad_time:"结束时间必须晚于开始时间。",
 deadline_after_event:"报名截止日必须早于活动日期。",past_deadline:"报名截止日不能早于今天。",bad_capacity:"摊位总数必须是大于 0 的整数。",
 bad_fee:"摊位费必须是 0 或以上的金额。",organiser_not_approved:"你的主办方账号还在等待 Eduplan 审核，暂时只能保存草稿。",
 capacity_below_booked:"摊位总数不能少于已报名的摊位数。",has_registrations:"已经有学校报名，活动不能改回草稿。",cancelled:"这个活动已取消。",
 not_found:"找不到这个活动或报名。",closed:"报名已截止。",duplicate:"你的学校已经报名这个活动，不能重复报名。",full:"摊位已额满。",
 not_enough_booths:"剩余摊位不够。",bad_booths:"摊位数量必须是 1 或以上的整数。",withdrawn:"学校已撤回这个报名。",bad_status:"这个状态不能再更改。",
 bad_image:"封面图片只接受 JPG、PNG 或 WebP。",image_too_large:"封面图片不能超过 2 MB。",server:"系统出错，请稍后再试。",bad_request:"请求有误。",
 network:"连不上 Eduplan 伺服器，请检查网络后再试。"};
var FIELD={title:"活动名称",description:"简介",date:"日期",start_time:"开始时间",end_time:"结束时间",venue:"场地名称",address:"地址",city:"城市",state:"州属",
 booth_capacity:"摊位总数",registration_deadline:"报名截止日",booth_fee:"摊位费",org_name:"机构／学校名称",name:"联络人姓名",position:"职位",phone:"电话",
 school_type:"学校类型",website:"学校官网",topics:"展示的科系或主题",booths:"摊位数量"};

function load(){try{return localStorage.getItem(TOKEN_KEY)||"";}catch(e){return "";}}
function setToken(t){S.token=t||"";try{if(t)localStorage.setItem(TOKEN_KEY,t);else localStorage.removeItem(TOKEN_KEY);}catch(e){}}
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
function api(action,data){
 var body={action:action};if(S.token)body.token=S.token;
 Object.keys(data||{}).forEach(function(k){body[k]=data[k];});
 if(!API||!window.fetch)return Promise.resolve({error:"network"});
 return fetch(API,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify(body)})
  .then(function(r){return r.json();}).catch(function(){return {error:"network"};})
  .then(function(r){r=r||{error:"server"};if(r.error==="signed_out"){setToken("");S.me=null;}return r;});
}
function errText(r){var t=ERR[r.error]||ERR.server;if(r.fields&&r.fields.length&&r.error==="missing")t+="（"+r.fields.map(function(f){return FIELD[f]||f;}).join("、")+"）";
 if(r.error==="not_enough_booths"&&r.remaining!=null)t+="目前剩 "+r.remaining+" 个。";return t;}
function rm(n){n=Number(n)||0;return n?"RM "+n.toLocaleString("en-MY",{minimumFractionDigits:n%1?2:0}):"免费 Free";}
var WD=["日","一","二","三","四","五","六"];
function day(d){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||"");if(!m)return esc(d);var w=new Date(+m[1],+m[2]-1,+m[3]).getDay();return +m[1]+"年"+(+m[2])+"月"+(+m[3])+"日（周"+WD[w]+"）";}
function today(){var d=new Date(Date.now()+8*3600000);return d.toISOString().slice(0,10);}   /* Malaysia time */
function pill(text,cls){return '<span class="xpill '+(cls||"")+'">'+esc(text)+'</span>';}
function roleBadge(role){var r=ROLE[role];return r?'<span class="xrole r-'+role+'">'+esc(r[0])+' <span>'+esc(r[1])+'</span></span>':'';}
function route(){return (location.hash||"#/").replace(/^#\/?/,"").split("/").filter(Boolean);}
function go(h){if(location.hash===h)render();else location.hash=h;}
function home(role){return role==="organiser"?"#/org":role==="exhibitor"?"#/ex":role==="admin"?"#/admin":"#/";}

/* ---------- Page frame ---------- */
function header(){
 var me=S.me,role=me&&me.role;
 document.body.className=role?"as-"+role:"";
 var links=role==="organiser"?[["#/org","我的活动 My events"],["#/org/new","开新活动 New event"]]:
  role==="exhibitor"?[["#/ex","浏览活动 Events"],["#/ex/my","我的报名 My bookings"]]:role==="admin"?[["#/admin","审核 Review"]]:[];
 head.innerHTML='<div class="xbar"><a class="xbrand" href="#/"><img src="'+esc(window.EDUPLAN_LOGO||"../assets/img/logo.png")+'" alt="EDUPLAN"><span><b>Eduplan 教育展</b><small>Education Exhibition</small></span></a>'+
  roleBadge(role)+'<span class="xsp"></span>'+
  (me?'<button type="button" class="xbtn ghost sm" data-act="logout">登出 Sign out</button>':'<a class="xbtn ghost sm" href="#/login">登录 Sign in</a>')+'</div>'+
  (links.length?'<nav class="xnav" aria-label="教育展">'+links.map(function(l){
   return '<a href="'+l[0]+'"'+(location.hash===l[0]?' aria-current="page"':'')+'>'+esc(l[1])+'</a>';}).join("")+'</nav>':'');
}
function page(html){app.innerHTML='<div class="xpage">'+(S.flash?'<div class="xnote ok" role="status">'+esc(S.flash)+'</div>':'')+html+'</div>';S.flash="";}
function loading(){app.innerHTML='<div class="xpage"><div class="xload" role="status"><i aria-hidden="true"></i>载入中… Loading…</div></div>';}   /* keeps S.flash for the page that follows */
function failed(r){return '<div class="xnote err" role="alert">'+esc(errText(r))+'</div>';}

/* Who is signed in: checked once per visit, then kept in S.me. */
function ensureMe(){
 if(S.checked||!S.token){S.checked=true;return Promise.resolve(S.me);}
 return api("expo_me").then(function(r){S.checked=true;S.me=r.me||null;if(!r.me)setToken("");return S.me;});
}

var seq=0;
function render(){
 var my=++seq,r=route();
 ensureMe().then(function(){
  if(my!==seq)return;
  header();
  var me=S.me,need={org:"organiser",ex:"exhibitor",admin:"admin"}[r[0]];
  if(need&&(!me||!me.role)){go("#/login/"+(need==="admin"?"":need));return;}
  if(need&&me.role!==need){S.flash="你登录的是"+ROLE[me.role][0]+"账号，已为你打开对应的页面。";go(home(me.role));return;}
  if(r[0]==="login")return loginView(r[1]||"");
  if(r[0]==="org")return r[1]==="new"?eventForm(null):r[1]==="edit"?eventForm(r[2]):r[1]==="regs"?regsView(r[2]):orgView();
  if(r[0]==="ex")return r[1]==="apply"?applyView(r[2]):r[1]==="my"?myRegsView():browseView();
  if(r[0]==="admin")return adminView();
  homeView();
 });
}
function done(my){return my!==seq;}

/* ---------- Home ---------- */
function eventCard(e,opts){
 opts=opts||{};
 var state=e.status==="cancelled"?pill("已取消 Cancelled","bad"):!e.open?pill("报名已截止 Closed","mute"):e.full?pill("已额满 Full","bad"):pill("剩余 "+e.remaining+" 个摊位 booths left","ok");
 return '<article class="xcard ev">'+(e.cover_image?'<img class="xcover" src="'+esc(e.cover_image)+'" alt="" loading="lazy">':'<span class="xcover art" aria-hidden="true"><b>'+esc((e.city||"").slice(0,14))+'</b></span>')+
  '<div class="xbody"><span class="xdate">'+day(e.date)+' · '+esc(e.start_time)+'–'+esc(e.end_time)+'</span><h3>'+esc(e.title)+'</h3>'+
  '<p class="xmeta">📍 '+esc([e.venue,e.city,e.state].filter(Boolean).join("，"))+'</p>'+
  (e.organiser?'<p class="xmeta">主办方 Organiser：'+esc(e.organiser)+'</p>':'')+
  '<p class="xmeta">摊位费 Booth fee：'+esc(rm(e.booth_fee))+' · 报名截止 Deadline：'+day(e.registration_deadline)+'</p>'+
  '<div class="xpills">'+state+(opts.mine?pill("已报名："+(REG_STATUS[opts.mine]||opts.mine),"brand"):"")+'</div>'+
  (opts.more||"")+'</div></article>';
}
function homeView(){
 var my=seq,me=S.me;
 page('<section class="xhero"><span class="xeye">Eduplan 教育展 · Education Exhibition</span><h1>把升学展办好，让学校找到学生</h1>'+
  '<p class="xlead">Eduplan 教育展连接主办方和学校：主办方（教育者、协会、学校）开办升学展，大学、学院和中学在线报名摆摊，学生和家长到场了解升学选择。所有新主办方和活动都先经 Eduplan 审核，避免假活动。</p>'+
  '<div class="xroles"><a class="xrolecard r-organiser" href="'+(me&&me.role==="organiser"?"#/org":"#/login/organiser")+'"><span class="xri" aria-hidden="true">🎪</span><b>我是主办方</b><span>Organiser</span><small>开办教育展、管理摊位报名</small></a>'+
  '<a class="xrolecard r-exhibitor" href="'+(me&&me.role==="exhibitor"?"#/ex":"#/login/exhibitor")+'"><span class="xri" aria-hidden="true">🏫</span><b>我是参展学校</b><span>Exhibitor</span><small>浏览教育展、报名摊位</small></a></div></section>'+
  '<section class="xsec"><h2>即将举行的教育展 <span>Upcoming exhibitions</span></h2><div id="xlist"><div class="xload" role="status"><i aria-hidden="true"></i>载入中…</div></div></section>');
 api("expo_public").then(function(r){
  if(done(my))return;var box=document.getElementById("xlist");if(!box)return;
  if(r.error){box.innerHTML=failed(r);return;}
  box.innerHTML=r.events.length?'<div class="xgrid">'+r.events.map(function(e){
   return eventCard(e,{more:e.open&&!e.full?'<a class="xbtn sm" href="#/ex/apply/'+esc(e.id)+'">学校报名摊位 Book a booth</a>':''});}).join("")+'</div>'
   :'<div class="xempty">目前还没有即将举行的公开活动。主办方可以<a href="#/login/organiser">登录开办教育展</a>。</div>';
 });
}

/* ---------- Sign in and sign up ---------- */
function loginView(role){
 var L=S.login,me=S.me;
 if(me&&me.role){go(home(me.role));return;}
 if(role)L.role=role;
 var who=L.role==="organiser"?"主办方 Organiser":L.role==="exhibitor"?"参展学校 Exhibitor":"";
 if(me&&!me.role)return registerView();
 page('<section class="xform narrow"><span class="xeye">'+(who?esc(who)+" · ":"")+'登录 Sign in</span><h1>用电邮登录</h1>'+
  '<p class="xlead">我们会把 6 位数验证码寄到你的电邮，不需要密码。第一次登录时再选择账号类型（主办方或参展学校）。</p>'+
  (L.msg?'<div class="xnote err" role="alert">'+esc(L.msg)+'</div>':'')+
  (L.step==="email"?'<form data-form="code"><label class="xf"><span>电邮 Email</span><input type="email" name="email" required autocomplete="email" value="'+esc(L.email)+'"></label>'+
   '<button class="xbtn" type="submit">寄验证码 Send code</button></form>'
  :'<form data-form="verify"><p>验证码已寄到 <b>'+esc(L.email)+'</b>，10 分钟内有效。</p><label class="xf"><span>验证码 Code</span><input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>'+
   '<div class="xrow"><button class="xbtn" type="submit">登录 Sign in</button><button type="button" class="xbtn ghost" data-act="relogin">换电邮或重寄 Change email</button></div></form>')+'</section>');
 L.msg="";
 var f=app.querySelector("input");if(f)f.focus();
}
function registerView(){
 var L=S.login,role=L.role||"exhibitor",org=role==="organiser";
 page('<section class="xform"><span class="xeye">注册 Sign up</span><h1>完成注册</h1><p class="xlead">已用 <b>'+esc(S.me.email)+'</b> 登录。一个账号只能有一种角色，注册后不能更改。</p>'+
  '<form data-form="register" novalidate><fieldset class="xf"><legend>账号类型 Account type</legend><div class="xchoice">'+
   '<label><input type="radio" name="role" value="organiser"'+(org?" checked":"")+'> <b>主办方</b> Organiser<small>开办教育展。需经 Eduplan 审核后才能发布活动。</small></label>'+
   '<label><input type="radio" name="role" value="exhibitor"'+(!org?" checked":"")+'> <b>参展学校</b> Exhibitor<small>大学、学院、中学报名摊位。</small></label></div></fieldset>'+
  field("org_name",org?"机构名称 Organisation name":"学校全名 School full name","text",true)+
  (org?"":'<label class="xf"><span>学校类型 School type *</span><select name="school_type" required><option value="">请选择</option>'+TYPES.map(function(t){return '<option value="'+t[0]+'">'+esc(t[1])+'</option>';}).join("")+'</select></label>')+
  field("name","联络人姓名 Contact person","text",true)+field("position","职位 Position","text",true)+
  '<label class="xf"><span>电邮 Email</span><input value="'+esc(S.me.email)+'" readonly></label>'+
  field("phone","电话 Phone","tel",true)+(org?"":field("website","学校官网 School website","url",true,"https://"))+
  '<div class="xprivacy"><b>资料使用说明 How we use your details</b><p>我们只收集以上资料，用于开办和管理教育展摊位，不收身份证号码。'+
  (org?'你的机构名称会显示在活动页面；联络资料只给 Eduplan 审核和联络用。':'你的学校资料和联络人资料只提供给你报名的活动的主办方，不会公开。')+
  '你可以随时联络 Eduplan 删除账号。</p><label class="xcheck"><input type="checkbox" name="consent" required> 我已阅读并同意以上资料使用说明 I agree</label></div>'+
  '<button class="xbtn" type="submit">注册 Sign up</button></form></section>');
}
function field(name,label,type,req,ph,val,attrs){
 return '<label class="xf"><span>'+esc(label)+(req?" *":"")+'</span><input name="'+name+'" type="'+(type||"text")+'"'+(req?" required":"")+(ph?' placeholder="'+esc(ph)+'"':"")+
  (val!=null&&val!==""?' value="'+esc(val)+'"':"")+(attrs||"")+'></label>';
}
function formData(f){var o={};Array.prototype.forEach.call(f.elements,function(el){if(!el.name)return;if(el.type==="radio"){if(el.checked)o[el.name]=el.value;}else if(el.type==="checkbox")o[el.name]=el.checked;else if(el.type!=="file")o[el.name]=el.value.trim();});return o;}
function busy(f,on){Array.prototype.forEach.call(f.querySelectorAll("button"),function(b){b.disabled=on;});}
function formError(f,r){var box=f.querySelector(".xnote.err");if(!box){box=document.createElement("div");box.className="xnote err";box.setAttribute("role","alert");f.insertBefore(box,f.firstChild);}
 box.textContent=errText(r);
 Array.prototype.forEach.call(f.querySelectorAll("[aria-invalid]"),function(el){el.removeAttribute("aria-invalid");});
 (r.fields||[]).forEach(function(n){var el=f.elements[n];if(el&&el.setAttribute)el.setAttribute("aria-invalid","true");});
 var first=(r.fields||[]).map(function(n){return f.elements[n];}).filter(function(el){return el&&el.focus;})[0];
 box.scrollIntoView({block:"nearest"});if(first)first.focus({preventScroll:true});}

/* ---------- Organiser ---------- */
function orgBanner(me){
 if(me.status==="pending")return '<div class="xnote warn">你的主办方账号正在等待 Eduplan 审核。审核通过前，你可以先保存活动草稿，但不能提交发布。</div>';
 if(me.status==="rejected")return '<div class="xnote err">你的主办方账号未获批准。'+(me.review_note?"原因："+esc(me.review_note):"")+' 如有疑问请联络 Eduplan。</div>';
 return '';
}
function orgView(){
 var my=seq;loading();
 api("expo_my_events").then(function(r){
  if(done(my))return;if(r.error){page(failed(r));return;}
  S.me=r.me;S.mine=r.events;
  page('<section class="xtop"><div><span class="xeye">主办方后台 Organiser</span><h1>我的活动</h1><p class="xlead">'+esc(r.me.org_name)+'</p></div>'+
   '<a class="xbtn" href="#/org/new">+ 开新活动 New event</a></section>'+orgBanner(r.me)+
   (r.events.length?'<div class="xlist">'+r.events.map(function(e){
    var st=e.status,booked=e.accepted_booths+e.pending_booths;
    return '<article class="xcard row"><div class="xbody"><span class="xdate">'+day(e.date)+' · '+esc(e.start_time)+'–'+esc(e.end_time)+'</span><h3>'+esc(e.title)+'</h3>'+
     '<p class="xmeta">📍 '+esc([e.venue,e.city].join("，"))+'</p><div class="xpills">'+pill(EV_STATUS[st]||st,st==="published"?"ok":st==="cancelled"||st==="rejected"?"bad":"mute")+
     pill("已报名 "+booked+" / "+e.booth_capacity+" 个摊位","brand")+(e.pending_booths?pill(e.pending_booths+" 个待审核","warn"):"")+'</div>'+
     (st==="rejected"&&e.review_note?'<p class="xnote err sm">Eduplan 备注：'+esc(e.review_note)+'</p>':'')+
     (st==="pending"?'<p class="xmeta">Eduplan 审核通过后，活动会公开给学校报名。</p>':'')+
     '<div class="xrow">'+(st!=="cancelled"?'<a class="xbtn sm" href="#/org/regs/'+esc(e.id)+'">管理报名 Registrations ('+e.registrations+')</a><a class="xbtn ghost sm" href="#/org/edit/'+esc(e.id)+'">编辑 Edit</a>'+
      '<button type="button" class="xbtn ghost sm danger" data-act="cancel-event" data-id="'+esc(e.id)+'" data-title="'+esc(e.title)+'">取消活动 Cancel</button>':'<a class="xbtn ghost sm" href="#/org/regs/'+esc(e.id)+'">查看报名 View</a>')+'</div></div></article>';}).join("")+'</div>'
    :'<div class="xempty">你还没有开办活动。<a href="#/org/new">开第一个活动</a>。</div>'));
 });
}
function eventForm(id){
 var my=seq,me=S.me;
 var p=id?(S.mine.length?Promise.resolve({events:S.mine}):api("expo_my_events")):Promise.resolve({events:[]});
 loading();
 p.then(function(r){
  if(done(my))return;if(r.error){page(failed(r));return;}
  if(r.events)S.mine=r.events;
  var e=id?S.mine.filter(function(x){return x.id===id;})[0]:{booth_fee:0};
  if(id&&!e){page(failed({error:"not_found"}));return;}
  if(e.status==="cancelled"){page(failed({error:"cancelled"}));return;}
  var t=today(),approved=me.status==="approved";
  page('<section class="xform wide"><span class="xeye">主办方后台 Organiser</span><h1>'+(id?"编辑活动":"开新活动")+'</h1>'+orgBanner(me)+
   '<form data-form="event" data-id="'+esc(id||"")+'" novalidate>'+
   field("title","活动名称 Event title","text",true,"",e.title,' maxlength="140"')+
   '<label class="xf"><span>简介 Description *</span><textarea name="description" rows="4" required maxlength="3000">'+esc(e.description)+'</textarea></label>'+
   '<div class="xgrid3">'+field("date","日期 Date","date",true,"",e.date,' min="'+t+'"')+field("start_time","开始 Start","time",true,"",e.start_time)+field("end_time","结束 End","time",true,"",e.end_time)+'</div>'+
   field("venue","场地名称 Venue","text",true,"",e.venue)+field("address","地址 Address","text",true,"",e.address)+
   '<div class="xgrid2">'+field("city","城市 City","text",true,"",e.city)+
   '<label class="xf"><span>州属 State *</span><select name="state" required><option value="">请选择</option>'+STATES.map(function(s){return '<option'+(e.state===s?" selected":"")+'>'+esc(s)+'</option>';}).join("")+'</select></label></div>'+
   '<div class="xgrid3">'+field("booth_capacity","摊位总数 Booths","number",true,"",e.booth_capacity,' min="1" max="1000" step="1" inputmode="numeric"')+
   field("registration_deadline","报名截止日 Deadline","date",true,"",e.registration_deadline,' min="'+t+'"')+
   field("booth_fee","摊位费 Fee (RM)","number",true,"0 = 免费",e.booth_fee,' min="0" step="0.01" inputmode="decimal"')+'</div>'+
   '<p class="xhint">报名截止日必须早于活动日期。摊位费目前只显示，不做线上付款。</p>'+
   '<label class="xf"><span>封面图片 Cover image（可选，JPG/PNG/WebP）</span><input type="file" name="cover" accept="image/jpeg,image/png,image/webp"></label>'+
   (e.cover_image?'<img class="xcover sm" src="'+esc(e.cover_image)+'" alt="目前的封面">':'')+
   '<div class="xrow"><button class="xbtn" type="submit" data-submit="1">'+(e.approved?"保存并发布 Save &amp; publish":"提交 Eduplan 审核 Submit for review")+'</button>'+
   ((!id||!(e.registrations>0))&&e.status!=="published"?'<button class="xbtn ghost" type="submit" data-submit="0">保存草稿 Save draft</button>':'')+
   '<a class="xbtn ghost" href="#/org">返回 Back</a></div>'+(approved?'':'<p class="xhint">审核通过前只能保存草稿。</p>')+'</form></section>');
 });
}
/* Reads a chosen cover image and makes it at most 1600 px wide as a JPEG, well under the 2 MB limit. */
function readCover(file){
 return new Promise(function(ok,no){
  if(!file)return ok(null);
  if(!/^image\/(jpeg|png|webp)$/.test(file.type))return no({error:"bad_image"});
  var url=URL.createObjectURL(file),img=new Image();
  img.onload=function(){var k=Math.min(1,1600/img.width),c=document.createElement("canvas");c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);
   c.getContext("2d").drawImage(img,0,0,c.width,c.height);URL.revokeObjectURL(url);var d=c.toDataURL("image/jpeg",0.85);
   if(d.length*0.75>2*1024*1024)return no({error:"image_too_large"});ok({type:"image/jpeg",data:d.split(",")[1]});};
  img.onerror=function(){no({error:"bad_image"});};img.src=url;});
}
function checkEvent(v){
 var t=today(),bad=["title","description","date","start_time","end_time","venue","address","city","state","registration_deadline","booth_capacity"].filter(function(k){return !v[k];});
 if(bad.length)return {error:"missing",fields:bad};
 if(v.date<t)return {error:"past_date",fields:["date"]};
 if(v.end_time<=v.start_time)return {error:"bad_time",fields:["end_time"]};
 if(v.registration_deadline>=v.date)return {error:"deadline_after_event",fields:["registration_deadline"]};
 if(v.registration_deadline<t)return {error:"past_deadline",fields:["registration_deadline"]};
 var n=Number(v.booth_capacity);if(!(n>0)||Math.floor(n)!==n)return {error:"bad_capacity",fields:["booth_capacity"]};
 if(v.booth_fee===""||!(Number(v.booth_fee)>=0))return {error:"bad_fee",fields:["booth_fee"]};
 return null;
}
function regsView(id){
 var my=seq;loading();
 api("expo_event_regs",{event_id:id}).then(function(r){
  if(done(my))return;if(r.error){page(failed(r)+'<a class="xbtn ghost" href="#/org">返回 Back</a>');return;}
  var e=r.event,acc=0,pen=0;r.registrations.forEach(function(x){if(x.status==="accepted")acc+=x.booths_requested;if(x.status==="pending")pen+=x.booths_requested;});
  var live=e.status!=="cancelled";
  page('<nav class="xcrumb"><a href="#/org">我的活动</a> › '+esc(e.title)+'</nav><section class="xtop"><div><span class="xeye">主办方后台 · 管理报名</span><h1>'+esc(e.title)+'</h1>'+
   '<p class="xlead">'+day(e.date)+' · '+esc(e.venue)+'</p></div></section>'+
   '<div class="xstats"><div><b>'+acc+'</b><span>已接受摊位</span></div><div><b>'+pen+'</b><span>待审核摊位</span></div><div><b>'+e.booth_capacity+'</b><span>摊位总数</span></div><div><b>'+e.remaining+'</b><span>剩余</span></div></div>'+
   (!live?'<div class="xnote err">这个活动已取消，已报名的学校会看到「活动已取消」。</div>':'')+
   '<p class="xhint">学校的联络资料只给你（这个活动的主办方）看，请勿外传。</p>'+
   (r.registrations.length?'<div class="xlist">'+r.registrations.map(function(x){var s=x.school||{};
    return '<article class="xcard row"><div class="xbody"><div class="xpills">'+pill(REG_STATUS[x.status]||x.status,x.status==="accepted"?"ok":x.status==="pending"?"warn":"mute")+pill(x.booths_requested+" 个摊位","brand")+'</div>'+
     '<h3>'+esc(s.org_name)+'</h3><p class="xmeta">'+esc((TYPES.filter(function(t){return t[0]===s.school_type;})[0]||["",""])[1])+(s.website?' · <a href="'+esc(s.website)+'" target="_blank" rel="noopener">官网</a>':'')+'</p>'+
     '<dl class="xdl"><dt>联络人</dt><dd>'+esc(s.name)+'（'+esc(s.position)+'）</dd><dt>电邮</dt><dd><a href="mailto:'+esc(s.email)+'">'+esc(s.email)+'</a></dd><dt>电话</dt><dd><a href="tel:'+esc(s.phone)+'">'+esc(s.phone)+'</a></dd>'+
     '<dt>展示内容</dt><dd>'+esc(x.topics)+'</dd>'+(x.special_needs?'<dt>特别需求</dt><dd>'+esc(x.special_needs)+'</dd>':'')+'</dl>'+
     (live&&x.status!=="withdrawn"?'<form class="xdecide" data-form="decide" data-id="'+esc(x.id)+'"><label class="xf"><span>备注（学校会看到）Note</span><input name="note" maxlength="300" value="'+esc(x.organiser_note)+'" placeholder="例如：摊位 A1、请在 9 点前布置"></label>'+
      '<div class="xrow"><button class="xbtn sm ok" type="submit" data-decision="accepted"'+(x.status==="accepted"?" disabled":"")+'>接受 Accept</button><button class="xbtn sm ghost danger" type="submit" data-decision="rejected"'+(x.status==="rejected"?" disabled":"")+'>拒绝 Reject</button></div></form>'
      :(x.organiser_note?'<p class="xmeta">备注：'+esc(x.organiser_note)+'</p>':''))+'</div></article>';}).join("")+'</div>'
    :'<div class="xempty">还没有学校报名。</div>')+'<p><a class="xbtn ghost" href="#/org">返回我的活动 Back</a></p>');
 });
}

/* ---------- Exhibitor ---------- */
var F={state:"",city:"",from:"",to:""};
function browseView(){
 var my=seq;
 page('<section class="xtop"><div><span class="xeye">参展学校 Exhibitor</span><h1>浏览教育展</h1><p class="xlead">只显示已发布、还没举行、报名还没截止的活动。</p></div></section>'+
  '<form class="xfilters" data-form="filter"><label class="xf"><span>州属 State</span><select name="state"><option value="">全部 All</option>'+STATES.map(function(s){return '<option'+(F.state===s?" selected":"")+'>'+esc(s)+'</option>';}).join("")+'</select></label>'+
  field("city","城市 City","text",false,"例如 Kuala Lumpur",F.city)+field("from","从 From","date",false,"",F.from)+field("to","到 To","date",false,"",F.to)+
  '<div class="xrow"><button class="xbtn sm" type="submit">筛选 Filter</button><button class="xbtn ghost sm" type="button" data-act="clear-filter">清除 Clear</button></div></form><div id="xlist"><div class="xload" role="status"><i aria-hidden="true"></i>载入中…</div></div>');
 api("expo_events",F).then(function(r){
  if(done(my))return;var box=document.getElementById("xlist");if(!box)return;
  if(r.error){box.innerHTML=failed(r);return;}
  box.innerHTML=r.events.length?'<div class="xgrid">'+r.events.map(function(e){
   var act=e.my_status?'<a class="xbtn ghost sm" href="#/ex/my">查看我的报名 My booking</a>':e.full?'<button class="xbtn sm" type="button" disabled>已额满 Full</button>':'<a class="xbtn sm" href="#/ex/apply/'+esc(e.id)+'">报名摊位 Book a booth</a>';
   return eventCard(e,{mine:e.my_status,more:'<div class="xrow">'+act+'</div>'});}).join("")+'</div>'
   :'<div class="xempty">没有符合条件、还可以报名的活动。</div>';
 });
}
function applyView(id){
 var my=seq;loading();
 api("expo_events").then(function(r){
  if(done(my))return;if(r.error){page(failed(r));return;}
  var e=r.events.filter(function(x){return x.id===id;})[0];
  if(!e){page('<div class="xnote err">这个活动目前不接受报名（可能已截止、已额满、已取消或还没公开）。</div><a class="xbtn ghost" href="#/ex">浏览其他活动 Back</a>');return;}
  if(e.my_status){page('<div class="xnote warn">你的学校已经报名这个活动（'+esc(REG_STATUS[e.my_status]||e.my_status)+'），不能重复报名。</div><a class="xbtn" href="#/ex/my">查看我的报名</a>');return;}
  if(e.full){page('<div class="xnote err">这个活动的摊位已额满。</div><a class="xbtn ghost" href="#/ex">浏览其他活动</a>');return;}
  page('<nav class="xcrumb"><a href="#/ex">浏览活动</a> › '+esc(e.title)+'</nav>'+eventCard(e)+
   (e.description?'<section class="xcard pad"><h2>活动简介</h2><p class="xpre">'+esc(e.description)+'</p><p class="xmeta">地址：'+esc(e.address)+'</p></section>':'')+
   '<section class="xform"><h2>报名摊位 Book a booth</h2><form data-form="apply" data-id="'+esc(e.id)+'" novalidate>'+
   field("booths","需要几个摊位 Booths","number",true,"",1,' min="1" max="'+e.remaining+'" step="1" inputmode="numeric"')+'<p class="xhint">目前剩 '+e.remaining+' 个摊位。摊位费：'+esc(rm(e.booth_fee))+'（每个摊位，向主办方缴付）。</p>'+
   '<label class="xf"><span>展示的科系或主题 Programmes or topics *</span><textarea name="topics" rows="3" required maxlength="500" placeholder="例如：医学、工程、商科；奖学金咨询"></textarea></label>'+
   '<label class="xf"><span>特别需求 Special needs（可选）</span><textarea name="special_needs" rows="2" maxlength="500" placeholder="例如：需要电源、2 张桌子、4 张椅子"></textarea></label>'+
   '<p class="xhint">报名后由主办方接受或拒绝。你的学校资料和联络人资料只会提供给这个活动的主办方。</p>'+
   '<div class="xrow"><button class="xbtn" type="submit">提交报名 Submit</button><a class="xbtn ghost" href="#/ex">返回 Back</a></div></form></section>');
 });
}
function myRegsView(){
 var my=seq;loading();
 api("expo_my_regs").then(function(r){
  if(done(my))return;if(r.error){page(failed(r));return;}
  page('<section class="xtop"><div><span class="xeye">参展学校 Exhibitor</span><h1>我的报名</h1><p class="xlead">'+esc(r.me.org_name)+'</p></div><a class="xbtn" href="#/ex">浏览活动 Events</a></section>'+
   (r.registrations.length?'<div class="xlist">'+r.registrations.map(function(x){var e=x.event||{};
    return '<article class="xcard row"><div class="xbody"><div class="xpills">'+pill(REG_STATUS[x.status]||x.status,x.status==="accepted"?"ok":x.status==="pending"?"warn":"bad")+pill(x.booths_requested+" 个摊位","brand")+'</div>'+
     '<h3>'+esc(e.title||"活动")+'</h3><p class="xmeta">'+day(e.date)+' · '+esc(e.start_time)+'–'+esc(e.end_time)+' · '+esc([e.venue,e.city].filter(Boolean).join("，"))+'</p>'+
     '<p class="xmeta">展示内容：'+esc(x.topics)+'</p>'+(x.organiser_note?'<p class="xnote sm">主办方备注：'+esc(x.organiser_note)+'</p>':'')+
     (x.can_withdraw?'<div class="xrow"><button type="button" class="xbtn ghost sm danger" data-act="withdraw" data-id="'+esc(x.id)+'">撤回报名 Withdraw</button></div>':'')+'</div></article>';}).join("")+'</div>'
    :'<div class="xempty">你还没有报名任何活动。<a href="#/ex">浏览活动</a>。</div>'));
 });
}

/* ---------- Admin ---------- */
function adminView(){
 var my=seq;loading();
 api("expo_admin_list").then(function(r){
  if(done(my))return;if(r.error){page(failed(r));return;}
  var po=r.organisers.filter(function(u){return u.status==="pending";}),pe=r.events.filter(function(e){return e.stored_status==="pending";});
  function decide(kind,id){return '<form class="xdecide" data-form="admin" data-kind="'+kind+'" data-id="'+esc(id)+'"><label class="xf"><span>备注（对方会看到）</span><input name="note" maxlength="300"></label>'+
   '<div class="xrow"><button class="xbtn sm ok" type="submit" data-decision="approved">批准 Approve</button><button class="xbtn sm ghost danger" type="submit" data-decision="rejected">拒绝 Reject</button></div></form>';}
  page('<section class="xtop"><div><span class="xeye">Eduplan 管理员 Admin</span><h1>审核</h1><p class="xlead">新的主办方要先批准，才能提交活动；每个新活动也要批准后才公开。</p></div></section>'+
   '<section class="xsec"><h2>待审核主办方 <span>'+po.length+'</span></h2>'+(po.length?'<div class="xlist">'+po.map(function(u){
    return '<article class="xcard row"><div class="xbody"><h3>'+esc(u.org_name)+'</h3><dl class="xdl"><dt>联络人</dt><dd>'+esc(u.name)+'（'+esc(u.position)+'）</dd><dt>电邮</dt><dd>'+esc(u.email)+'</dd><dt>电话</dt><dd>'+esc(u.phone)+'</dd><dt>注册于</dt><dd>'+esc(u.created_at)+'</dd></dl>'+decide("user",u.id)+'</div></article>';}).join("")+'</div>':'<div class="xempty">没有待审核的主办方。</div>')+'</section>'+
   '<section class="xsec"><h2>待审核活动 <span>'+pe.length+'</span></h2>'+(pe.length?'<div class="xlist">'+pe.map(function(e){
    return eventCard(e,{more:'<p class="xpre sm">'+esc(e.description)+'</p><p class="xmeta">地址：'+esc(e.address)+' · 摊位 '+e.booth_capacity+' 个</p>'+decide("event",e.id)});}).join("")+'</div>':'<div class="xempty">没有待审核的活动。</div>')+'</section>'+
   '<section class="xsec"><h2>所有主办方 <span>'+r.organisers.length+'</span></h2><div class="xtable"><table><thead><tr><th>机构</th><th>联络人</th><th>状态</th></tr></thead><tbody>'+
    r.organisers.map(function(u){return '<tr><td>'+esc(u.org_name)+'</td><td>'+esc(u.name)+'<br><small>'+esc(u.email)+'</small></td><td>'+esc({pending:"待审核",approved:"已批准",rejected:"已拒绝"}[u.status]||u.status)+'</td></tr>';}).join("")+'</tbody></table></div></section>');
 });
}

/* ---------- Events ---------- */
app.addEventListener("submit",function(ev){
 var f=ev.target,kind=f.getAttribute("data-form");if(!kind)return;ev.preventDefault();
 var v=formData(f),btn=ev.submitter||document.activeElement;
 if(kind==="filter"){F=v;render();return;}
 busy(f,true);
 var p,after;
 if(kind==="code"){S.login.email=v.email;p=api("expo_code",{email:v.email});after=function(){S.login.step="code";render();};}
 else if(kind==="verify"){p=api("expo_verify",{email:S.login.email,code:v.code});after=function(r){setToken(r.token);S.me=r.me;S.checked=true;S.login.step="email";
  if(r.me.role){S.flash="已登录 Signed in。";go(home(r.me.role));}else render();};}
 else if(kind==="register"){S.login.role=v.role;p=api("expo_register",v);after=function(r){S.me=r.me;S.flash=r.me.role==="organiser"?"注册成功！你的主办方账号正在等待 Eduplan 审核，审核通过前可以先保存草稿。":"注册成功！现在可以浏览教育展并报名摊位。";go(home(r.me.role));};}
 else if(kind==="event"){
  var submit=btn&&btn.getAttribute("data-submit")==="1",chk=checkEvent(v);
  if(chk){busy(f,false);formError(f,chk);return;}
  var id=f.getAttribute("data-id");v.booth_capacity=Number(v.booth_capacity);v.booth_fee=Number(v.booth_fee);if(id)v.id=id;
  p=readCover(f.elements.cover&&f.elements.cover.files[0]).then(function(cover){return api("expo_event_save",{event:v,submit:submit,cover:cover||undefined});},function(e){return e;});
  after=function(r){S.mine=[];S.flash=r.status==="pending"?"已提交，Eduplan 审核通过后会公开给学校报名。":r.status==="published"?"已保存并发布。":"草稿已保存。";go("#/org");};}
 else if(kind==="decide"){var d=btn&&btn.getAttribute("data-decision");p=api("expo_reg_decide",{reg_id:f.getAttribute("data-id"),decision:d,note:v.note});
  after=function(){S.flash=d==="accepted"?"已接受，学校会收到电邮通知。":"已拒绝，学校会收到电邮通知。";render();};}
 else if(kind==="apply"){var b=Number(v.booths||1);if(!v.topics){busy(f,false);formError(f,{error:"missing",fields:["topics"]});return;}
  p=api("expo_apply",{event_id:f.getAttribute("data-id"),booths:b,topics:v.topics,special_needs:v.special_needs});
  after=function(){S.flash="报名已提交，主办方接受或拒绝后会电邮通知你。";go("#/ex/my");};}
 else if(kind==="admin"){var dd=btn&&btn.getAttribute("data-decision"),k=f.getAttribute("data-kind");
  p=api(k==="user"?"expo_admin_user":"expo_admin_event",k==="user"?{user_id:f.getAttribute("data-id"),decision:dd,note:v.note}:{event_id:f.getAttribute("data-id"),decision:dd,note:v.note});
  after=function(){S.flash=dd==="approved"?"已批准。":"已拒绝。";render();};}
 if(!p){busy(f,false);return;}
 p.then(function(r){busy(f,false);if(!r||r.error){formError(f,r||{error:"server"});return;}after(r);});
});
document.addEventListener("click",function(ev){
 var b=ev.target.closest&&ev.target.closest("[data-act]");if(!b)return;var a=b.getAttribute("data-act");
 if(a==="logout"){api("expo_logout").then(function(){setToken("");S.me=null;S.mine=[];go("#/");});}
 else if(a==="relogin"){S.login.step="email";render();}
 else if(a==="clear-filter"){F={state:"",city:"",from:"",to:""};render();}
 else if(a==="cancel-event"){if(!confirm("确定取消「"+b.getAttribute("data-title")+"」吗？已报名的学校会收到通知，取消后不能恢复。"))return;
  b.disabled=true;api("expo_event_cancel",{event_id:b.getAttribute("data-id")}).then(function(r){S.mine=[];if(r.error){b.disabled=false;alert(errText(r));return;}S.flash="活动已取消，已报名的学校会收到通知。";render();});}
 else if(a==="withdraw"){if(!confirm("确定撤回这个报名吗？"))return;
  b.disabled=true;api("expo_withdraw",{reg_id:b.getAttribute("data-id")}).then(function(r){if(r.error){b.disabled=false;alert(errText(r));return;}S.flash="报名已撤回。";render();});}
});
window.addEventListener("hashchange",function(){render();window.scrollTo(0,0);app.focus({preventScroll:true});});
render();
})();
