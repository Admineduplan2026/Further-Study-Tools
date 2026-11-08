/* Eduplan 教育展 (Exhibition): organisers open education talks and fairs with limited talk seats for visitors and,
   when they choose, booths for schools (exhibitors). Visitors sign up for a seat, schools book booths, Eduplan admins approve.
   Talks to the same Apps Script /exec as the main site (EDUPLAN_API_URL in ../assets/js/config.js), actions "expo_*"
   in apps-script/Exhibition.gs. The server checks every rule; the checks here only give quicker messages.
   Routes: #/  #/login/organiser|exhibitor  #/org  #/org/new  #/org/edit/<id>  #/org/regs/<id>  #/org/att/<id>  #/ex  #/ex/apply/<id>  #/ex/my  #/admin
   Visitors (no account): #/e/<id> one event, #/join/<id> sign up to attend it. */
(function(){
"use strict";
var API=window.EXPO_API_URL||window.EDUPLAN_API_URL,TOKEN_KEY="eduplan-expo-token";
/* Language: English or 中文, shared with the main EDUPLAN site (localStorage "eduplan-lang"). Fixed texts are translated
   on the page by expo-i18n.js (EXPO_I18N); texts built from data use T(zh, en) here. */
var LANG=(function(){try{var v=localStorage.getItem("eduplan-lang");if(v==="zh"||v==="en")return v;}catch(e){}
 return /^zh/i.test(navigator.language||"")?"zh":"en";})();
function T(zh,en){return LANG==="en"?en:zh;}
function tx(s){return window.EXPO_TX?window.EXPO_TX(s,LANG):s;}
/* An event's title and description in the chosen language (Exhibition.gs gives both; the organiser's own text otherwise). */
function evT(e){return (LANG==="en"?e.title_en:e.title_zh)||e.title||"";}
function evD(e){return (LANG==="en"?e.description_en:e.description_zh)||e.description||"";}
var app=document.getElementById("app"),head=document.getElementById("xhead");
var S={token:load(),me:null,checked:false,login:{email:"",step:"email",role:"",msg:""},mine:[],flash:""};
var STATES=["Johor","Kedah","Kelantan","Melaka","Negeri Sembilan","Pahang","Perak","Perlis","Pulau Pinang","Sabah","Sarawak","Selangor","Terengganu","W.P. Kuala Lumpur","W.P. Labuan","W.P. Putrajaya"];
var TYPES=[["university","大学 University"],["college","学院 College"],["secondary","中学 Secondary school"],["other","其他 Other"]];
var ROLE={organiser:["主办方后台","Organiser"],exhibitor:["参展学校","Exhibitor"],admin:["Eduplan 管理员","Admin"]};
var EV_STATUS={draft:"草稿 Draft",pending:"待审核 In review",published:"已发布 Published",rejected:"未获批准 Not approved",closed:"已截止 Closed",cancelled:"已取消 Cancelled"};
var WHO=[["student","学生 Student"],["parent","家长 Parent"],["teacher","老师 Teacher"],["other","其他 Other"]];
var VISITOR_KEY="eduplan-expo-visitor";
var REG_STATUS={pending:"待审核 Pending",accepted:"已接受 Accepted",rejected:"已拒绝 Rejected",withdrawn:"已撤回 Withdrawn",cancelled:"活动已取消 Event cancelled"};
var ERR={bad_email:"请输入正确的电邮地址。",wait:"验证码刚寄出，请等 1 分钟再试。",too_many:"这个电邮申请验证码太多次，请 6 小时后再试。",
 daily_limit:"今天的电邮额度已用完，请明天再试，或联络 Eduplan。",bad_code:"验证码不对，请再检查一次。",expired:"验证码已过期，请重新获取。",
 busy:"系统忙碌，请稍后再试。",signed_out:"登录已过期，请重新登录。",not_registered:"请先完成注册。",forbidden:"你没有权限做这个操作。",
 consent:"请先勾选同意资料使用说明。",missing:"请填写所有必填栏位。",bad_role:"请选择账号类型。",already_registered:"这个电邮已经注册过。一个账号只能有一种角色。",
 admin_account:"管理员电邮不能注册为主办方或学校。",past_date:"活动日期不能早于今天。",bad_time:"结束时间必须晚于开始时间。",
 deadline_after_event:"报名截止日不能晚于活动日期。",past_deadline:"报名截止日不能早于今天。",bad_capacity:"名额必须是 1 到 5000 的整数。",
 bad_fee:"摊位费必须是 0 或以上的金额。",organiser_not_approved:"你的主办方账号还在等待 Eduplan 审核，暂时只能保存草稿。",
 capacity_below_booked:"名额不能少于已报名的人数。",has_registrations:"已经有人报名，活动不能改回草稿。",cancelled:"这个活动已取消。",
 not_found:"找不到这个活动或报名。",closed:"报名已截止。",not_enough_seats:"剩余名额不够。",no_booths:"这个活动只开放讲座名额，没有学校摊位。",has_booths:"已经有学校报名摊位，不能关闭摊位。",booths_below_booked:"摊位总数不能少于已报名的摊位数。",duplicate:"你的学校已经报名这个活动，不能重复报名。",full:"名额已满。",
 not_enough_booths:"剩余摊位不够。",bad_booths:"摊位数量必须是 1 到 1000 的整数。",withdrawn:"学校已撤回这个报名。",bad_status:"这个状态不能再更改。",
 bad_image:"封面图片只接受 JPG、PNG 或 WebP。",image_too_large:"封面图片不能超过 2 MB。",server:"系统出错，请稍后再试。",bad_request:"请求有误。",
 network:"连不上 Eduplan 伺服器，请检查网络后再试。",bad_people:"人数必须是 1 到 10 位。",event_over:"这个活动已经结束，不能再报名。",
 attend_many:"这个电邮报名太多次，请 1 小时后再试。"};
var FIELD={title:"活动名称",description:"简介",date:"日期",start_time:"开始时间",end_time:"结束时间",venue:"场地名称",address:"地址",city:"城市",state:"州属",
 booth_capacity:"名额",seats:"讲座名额",mode:"开放什么报名",registration_deadline:"报名截止日",booth_fee:"摊位费",org_name:"机构／学校名称",name:"联络人姓名",position:"职位",phone:"电话",
 school_type:"学校类型",website:"学校官网",topics:"展示的科系或主题",booths:"摊位数量",email:"电邮",who:"身份",school:"就读学校",people:"人数"};

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
function errText(r){var t=ERR[r.error]?tx(ERR[r.error])+(r.detail?"（"+String(r.detail).slice(0,160)+"）":""):tx(ERR.server)+T("（代码 "," (code ")+String(r.error||"unknown").slice(0,40)+T("）",")");if(r.fields&&r.fields.length&&r.error==="missing")t+=T("（",": ")+r.fields.map(function(f){return tx((r.labels||{})[f]||FIELD[f]||f);}).join(T("、",", "))+T("）","");
 if((r.error==="not_enough_booths"||r.error==="not_enough_seats")&&r.remaining!=null)t+=T("目前剩 "+r.remaining+" 个。"," "+r.remaining+" left.");return t;}
function rm(n){n=Number(n)||0;return n?"RM "+n.toLocaleString("en-MY",{minimumFractionDigits:n%1?2:0}):T("免费","Free");}
var WD=["日","一","二","三","四","五","六"],WDE=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"],MOE=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function day(d){var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(d||"");if(!m)return esc(d);var w=new Date(+m[1],+m[2]-1,+m[3]).getDay();return LANG==="en"?WDE[w]+", "+(+m[3])+" "+MOE[+m[2]-1]+" "+m[1]:+m[1]+"年"+(+m[2])+"月"+(+m[3])+"日（周"+WD[w]+"）";}
function today(){var d=new Date(Date.now()+8*3600000);return d.toISOString().slice(0,10);}   /* Malaysia time */
function pill(text,cls){return '<span class="xpill '+(cls||"")+'">'+esc(text)+'</span>';}
function roleBadge(role){var r=ROLE[role];return r?'<span class="xrole r-'+role+'">'+esc(r[0])+' <span>'+esc(r[1])+'</span></span>':'';}
function route(){return (location.hash||"#/").replace(/^#\/?/,"").split("/").filter(Boolean);}
function go(h){if(location.hash===h)render();else location.hash=h;}
function home(role){return role==="organiser"?"#/org":role==="exhibitor"?"#/ex":role==="admin"?"#/admin":"#/";}

/* ---------- Page frame ---------- */
/* The tip under the EDUPLAN button: visitors who are not signed in to EDUPLAN get new-exhibition emails once they sign in.
   Closed for good with ×, or when they follow it. */
var TIP={seen:false,key:"eduplan-expo-tip"};
function showTip(me){
 if(me&&me.role)return false;
 try{if(localStorage.getItem(TIP.key))return false;var se=JSON.parse(localStorage.getItem("eduplan-session")||"null");if(se&&se.token&&se.exp>Date.now())return false;}catch(e){}
 return true;
}
function closeTip(){try{localStorage.setItem(TIP.key,String(Date.now()));}catch(e){}var t=head.querySelector(".xtip");if(t)t.remove();}
function header(){
 var me=S.me,role=me&&me.role;
 if(head.querySelector(".xtip"))TIP.seen=true;   /* animate the tip only the first time */
 document.body.className=role?"as-"+role:"";
 var links=role==="organiser"?[["#/org","我的活动 My events"],["#/org/new","开新活动 New event"]]:
  role==="exhibitor"?[["#/ex","浏览活动 Events"],["#/ex/my","我的报名 My bookings"]]:role==="admin"?[["#/admin","审核 Review"]]:[];
 head.innerHTML='<div class="xbar"><a class="xbrand" href="#/"><img src="'+esc(window.EDUPLAN_LOGO||"../assets/img/logo.png")+'" alt="EDUPLAN"><span><b>Eduplan 教育展</b>'+T("<small>Education Exhibition</small>","")+'</span></a>'+
  roleBadge(role)+'<span class="xsp"></span>'+
  '<button type="button" class="xlang" data-notr data-act="lang" aria-label="'+T("Switch to English","切换到中文")+'" lang="'+T("en","zh")+'">'+T("EN","中文")+'</button>'+
  (me?'<button type="button" class="xbtn ghost sm" data-act="logout">'+T("登出","Sign out")+'</button>':'<a class="xbtn ghost sm" href="#/login" title="主办方或参展学校登录 Organiser or exhibitor sign in">'+T("登录","Sign in")+'</a>')+
  '<a class="xhome" href="../" title="回到 EDUPLAN 主网站 Back to EDUPLAN" aria-label="回到 EDUPLAN 主网站 Back to EDUPLAN"><span class="xhome-i" aria-hidden="true">🏠</span><span class="xhome-t"><b>EDUPLAN</b><small>回到主网站</small></span></a>'+
  (showTip(me)?'<div class="xtip'+(TIP.seen?'':' pop')+'" role="note"><p>💡 登入 EDUPLAN 以便得到最新消息，可以<a href="../#portfolio" data-act="tip-go">点击这里</a>哦！</p>'+
   '<button type="button" class="xtip-x" data-act="tip-close" aria-label="关闭提示 Close">×</button></div>':'')+'</div>'+
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
  if(need&&me.role!==need){S.flash=T("你登录的是"+ROLE[me.role][0]+"账号，已为你打开对应的页面。","You are signed in as "+ROLE[me.role][1]+", so we opened that page for you.");go(home(me.role));return;}
  if(r[0]==="login")return loginView(r[1]||"");
  if(r[0]==="org")return r[1]==="new"?eventForm(null):r[1]==="edit"?eventForm(r[2]):r[1]==="regs"?regsView(r[2]):r[1]==="att"?attView(r[2]):orgView();
  if(r[0]==="ex")return r[1]==="apply"?applyView(r[2]):r[1]==="my"?myRegsView():browseView();
  if(r[0]==="admin")return adminView();
  if(r[0]==="e")return eventView(r[1]||"");
  if(r[0]==="join")return joinView(r[1]||"");
  if(r[0]==="unsub")return unsubView(decodeURIComponent(r[1]||""),r[2]||"");
  homeView();
 });
}
function done(my){return my!==seq;}
/* One published event for anyone (students and parents come here from the EDUPLAN home page and the emails). */
function eventView(id){
 var my=seq;loading();
 api("expo_public").then(function(r){if(done(my))return;
  if(r.error){page(failed(r));return;}
  var e=r.events.filter(function(x){return x.id===id;})[0];
  if(!e){page('<div class="xempty">找不到这个活动，它可能已经结束或取消。<a href="#/">看看其他教育展 See other exhibitions</a></div>');return;}
  page('<p><a href="#/">← 所有教育展 All exhibitions</a></p><div class="xsolo">'+eventCard(e,{more:(evD(e)?'<p class="xpre">'+esc(evD(e))+'</p>':'')+
   (e.address?'<p class="xmeta">'+T("地址：","Address: ")+esc(e.address)+'</p>':'')+
   actions(e,true)})+'</div>');});
}
/* The button under a public event: visitors sign up for a seat while seats are left and sign-up is open. */
function actions(e,open){
 return '<div class="xrow">'+(e.can_attend?'<a class="xbtn sm" href="#/join/'+esc(e.id)+'">报名参加 Register to attend</a>':
  e.status==="published"&&e.full?'<button class="xbtn sm" type="button" disabled>名额已满 Full</button>':'')+
  (e.booths_open&&!e.booths_full?'<a class="xbtn ghost sm" href="#/ex/apply/'+esc(e.id)+'">学校报名摊位 Book a booth</a>':'')+
  (open?'':'<button type="button" class="xbtn ghost sm" data-act="toggle-share" aria-expanded="false">分享 Share</button>')+'</div>'+shareBox(e,open);
}
/* Share an event: the public event page link (#/e/<id>) to WhatsApp, Facebook, Telegram, X or email, the phone's own
   share menu where there is one, or copy the link. */
function shareUrl(e){return location.href.split("#")[0]+"#/e/"+encodeURIComponent(e.id);}
function shareText(e){
 var m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(e.date||""),d=m?(+m[3])+"/"+(+m[2])+"/"+m[1]:e.date;
 return evT(e)+"\n📅 "+d+" "+(e.start_time||"")+"–"+(e.end_time||"")+"\n📍 "+[e.venue,e.city].filter(Boolean).join(", ")+
  (e.can_attend?"\n🎟 "+T("限量名额，免费报名","Limited seats, free sign-up"):"");
}
function shareBox(e,open){
 var u=shareUrl(e),t=shareText(e),q=encodeURIComponent;
 var links=[["WhatsApp","https://wa.me/?text="+q(t+"\n"+u),"wa"],["Facebook","https://www.facebook.com/sharer/sharer.php?u="+q(u),"fb"],
  ["Telegram","https://t.me/share/url?url="+q(u)+"&text="+q(t),"tg"],["X","https://twitter.com/intent/tweet?text="+q(t)+"&url="+q(u),"x"],
  [T("电邮","Email"),"mailto:?subject="+q(evT(e))+"&body="+q(t+"\n\n"+u),"em"]];
 return '<div class="xshare"'+(open?'':' hidden')+'><span class="xshare-k">分享这个活动 Share</span><div class="xshare-row">'+
  links.map(function(l){return '<a class="xsh '+l[2]+'" href="'+esc(l[1])+'" target="_blank" rel="noopener">'+esc(l[0])+'</a>';}).join("")+
  '<button type="button" class="xsh cp" data-act="copy-link" data-url="'+esc(u)+'">复制链接 Copy link</button>'+
  (navigator.share?'<button type="button" class="xsh more" data-act="native-share" data-url="'+esc(u)+'" data-title="'+esc(evT(e))+'" data-text="'+esc(t)+'">更多 More…</button>':'')+
  '</div></div>';
}
function copyText(text){
 if(navigator.clipboard&&window.isSecureContext)return navigator.clipboard.writeText(text);
 return new Promise(function(ok,no){var ta=document.createElement("textarea");ta.value=text;ta.setAttribute("readonly","");ta.style.position="fixed";ta.style.opacity="0";
  document.body.appendChild(ta);ta.select();try{document.execCommand("copy")?ok():no();}catch(err){no();}ta.remove();});
}
function loadVisitor(){try{return JSON.parse(localStorage.getItem(VISITOR_KEY)||"null")||{};}catch(e){return {};}}
function saveVisitor(v){try{localStorage.setItem(VISITOR_KEY,JSON.stringify({name:v.name,email:v.email,phone:v.phone,who:v.who,school:v.school}));}catch(e){}}
/* Sign up to attend (students, parents, teachers): no account, details go only to the organiser and Eduplan. */
function joinView(id){
 var my=seq;loading();
 api("expo_public").then(function(r){if(done(my))return;
  if(r.error){page(failed(r));return;}
  var e=r.events.filter(function(x){return x.id===id;})[0];
  if(!e||!e.can_attend){page('<div class="xempty">'+(e&&e.full?"这个活动的名额已满。":"这个活动目前不接受报名，它可能已经截止、结束或取消。")+'<a href="#/">看看其他教育展 See other exhibitions</a></div>');return;}
  var v=loadVisitor();
  page('<nav class="xcrumb"><a href="#/">所有教育展</a> › <a href="#/e/'+esc(e.id)+'">'+esc(evT(e))+'</a></nav>'+eventCard(e)+
   '<section class="xform"><span class="xeye">学生 · 家长 · 老师 Visitors</span><h1>报名参加</h1><p class="xlead">免费报名，不需要注册账号。报名后会收到确认电邮（如果当天电邮额度允许）。</p>'+
   '<form data-form="join" data-id="'+esc(e.id)+'" novalidate>'+
   field("name","姓名 Full name","text",true,"",v.name,' maxlength="100" autocomplete="name"')+
   field("email","电邮 Email","email",true,"",v.email,' autocomplete="email"')+
   field("phone","电话 Phone","tel",true,"例如 012-345 6789",v.phone,' autocomplete="tel"')+
   '<fieldset class="xf"><legend>身份 I am a *</legend><div class="xchoice">'+WHO.map(function(w){
    return '<label><input type="radio" name="who" value="'+w[0]+'"'+((v.who||"student")===w[0]?" checked":"")+'> <b>'+esc(w[1])+'</b></label>';}).join("")+'</div></fieldset>'+
   field("school","就读学校 School（可选）","text",false,"例如 SMJK Chung Ling",v.school,' maxlength="160"')+
   field("people","人数（包括你自己）People coming, including you","number",true,"",1,' min="1" max="'+Math.max(1,Math.min(10,e.remaining))+'" step="1" inputmode="numeric"')+
   '<p class="xhint">'+T("目前剩 "+e.remaining+" 个名额。",e.remaining+" seats left.")+'</p>'+
   '<div class="xprivacy"><b>资料使用说明 How we use your details</b><p>你的姓名、电邮、电话、身份和学校只提供给这个活动的主办方和 Eduplan，用于安排这次活动和联络你，不会公开，也不收身份证号码。用同一个电邮再报名一次，会更新你之前的报名。</p>'+
   '<label class="xcheck"><input type="checkbox" name="consent" required> 我同意以上资料使用说明 I agree</label></div>'+
   '<div class="xrow"><button class="xbtn" type="submit">确认报名 Register</button><a class="xbtn ghost" href="#/e/'+esc(e.id)+'">返回 Back</a></div></form></section>');
 });
}
function joinDone(e,r,v){
 page('<section class="xform narrow"><span class="xeye">报名成功 You are signed up</span><h1>'+(r.updated?T("已更新你的报名","Sign-up updated"):T("报名成功！","You are signed up!"))+'</h1>'+
  '<p class="xlead">'+T(esc(v.name)+'，你已报名参加「'+esc(evT(e))+'」，共 '+esc(v.people)+' 人。',esc(v.name)+', you are signed up for “'+esc(evT(e))+'”, '+esc(v.people)+(v.people>1?' people.':' person.'))+'</p>'+
  '<dl class="xdl"><dt>日期</dt><dd>'+day(e.date)+' · '+esc(e.start_time)+'–'+esc(e.end_time)+'</dd><dt>地点</dt><dd>'+esc([e.venue,e.address,e.city].filter(Boolean).join("，"))+'</dd>'+
  '<dt>报名编号</dt><dd>'+esc(r.id)+'</dd></dl>'+
  '<p class="xhint">'+(r.emailed?T("确认电邮已寄到 "+esc(v.email)+"。","A confirmation email has been sent to "+esc(v.email)+"."):T("今天的电邮额度已满，这次不会寄确认电邮。请截图保存这一页。","Today's email limit is reached, so no confirmation email this time. Please take a screenshot of this page."))+'</p>'+
  (e.id&&e.title?'<p class="xmeta">邀请朋友一起来：</p>'+shareBox(e,true):'')+
  '<div class="xrow"><a class="xbtn" href="#/">看看其他教育展 More exhibitions</a></div></section>');
}
/* The stop link in new-exhibition emails (Exhibition.gs expoUnsubLink_). */
function unsubView(email,sig){
 var my=seq;loading();
 api("expo_unsub",{email:email,sig:sig}).then(function(r){if(done(my))return;
  page(r.error?'<section class="xtop"><div><h1>链接无效</h1><p class="xlead">这个取消通知的链接不完整或已失效。请直接点电邮里的链接，或联系 EDUPLAN。This link is not valid.</p></div></section>':
   '<section class="xtop"><div><span class="xeye">通知 Emails</span><h1>已取消教育展通知</h1><p class="xlead">'+esc(email)+' 以后不会再收到新教育展的电邮。You will no longer get emails about new exhibitions.</p></div></section>');});
}

/* ---------- Home ---------- */
function eventCard(e,opts){
 opts=opts||{};
 var seats=e.seats!=null?e.seats:e.booth_capacity;
 var state=e.status==="cancelled"?pill("已取消 Cancelled","bad"):e.status==="draft"||e.status==="pending"||e.status==="rejected"?pill(T("限量 "+seats+" 个讲座名额",seats+" seats"),"mute"):
  !e.open?pill("报名已截止 Closed","mute"):e.full?pill("名额已满 Full","bad"):pill(T("限量 · 剩余 "+e.remaining+" 个讲座名额","Limited · "+e.remaining+" seats left"),"ok");
 return '<article class="xcard ev">'+(e.cover_image?'<img class="xcover" src="'+esc(e.cover_image)+'" alt="" loading="lazy">':'<span class="xcover art" aria-hidden="true"><b>'+esc((e.city||"").slice(0,14))+'</b></span>')+
  '<div class="xbody"><span class="xdate">'+day(e.date)+' · '+esc(e.start_time)+'–'+esc(e.end_time)+'</span><h3>'+esc(evT(e))+'</h3>'+
  '<p class="xmeta">📍 '+esc([e.venue,e.city,e.state].filter(Boolean).join("，"))+'</p>'+
  (e.organiser?'<p class="xmeta">'+T("主办方：","Organiser: ")+esc(e.organiser)+'</p>':'')+
  '<p class="xmeta">'+T("免费报名 · 报名截止：","Free sign-up · Deadline: ")+day(e.registration_deadline)+'</p>'+
  (e.booths?'<p class="xmeta">🏫 '+T("学校摊位："+e.booths+" 个 · 摊位费 ","School booths: "+e.booths+" · Booth fee ")+esc(rm(e.booth_fee))+'</p>':'')+
  '<div class="xpills">'+state+(e.booths&&e.status==="published"&&e.open?(e.booths_full?pill("摊位已满","bad"):pill(T("摊位剩 "+e.booths_remaining+" 个",e.booths_remaining+" booths left"),"brand")):"")+(opts.mine?pill(T("已报名：","Booked: ")+tx(REG_STATUS[opts.mine]||opts.mine),"brand"):"")+'</div>'+
  (opts.more||"")+'</div></article>';
}
function homeView(){
 var my=seq,me=S.me;
 page('<section class="xhero"><span class="xeye">Eduplan 教育展 · Education Exhibition</span><h1>升学讲座和教育展，名额有限，快来报名</h1>'+
  '<p class="xlead">升学讲座和教育展，名额有限，学生、家长和老师免费报名。主办方（教育者、协会、学校）开办活动，大学和学院可以报名摊位。所有新主办方和活动都先经 Eduplan 审核，避免假活动。</p>'+
  '<div class="xroles"><a class="xrolecard r-organiser" href="'+(me&&me.role==="organiser"?"#/org":"#/login/organiser")+'"><span class="xri" aria-hidden="true">🎪</span><b>我是主办方</b>'+T('<span>Organiser</span>','')+'<small>开办讲座或教育展、查看报名名单</small></a>'+
  '<a class="xrolecard r-exhibitor" href="'+(me&&me.role==="exhibitor"?"#/ex":"#/login/exhibitor")+'"><span class="xri" aria-hidden="true">🏫</span><b>我是参展学校</b>'+T('<span>Exhibitor</span>','')+'<small>浏览教育展、报名摊位</small></a></div></section>'+
  '<section class="xsec"><h2>'+T('即将举行的教育展 <span>Upcoming exhibitions</span>','Upcoming exhibitions')+'</h2><div id="xlist"><div class="xload" role="status"><i aria-hidden="true"></i>载入中…</div></div></section>');
 api("expo_public").then(function(r){
  if(done(my))return;var box=document.getElementById("xlist");if(!box)return;
  if(r.error){box.innerHTML=failed(r);return;}
  box.innerHTML=r.events.length?'<div class="xgrid">'+r.events.map(function(e){
   return eventCard(e,{more:actions(e)});}).join("")+'</div>'
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
  '<p class="xlead">主办方和参展学校用电邮登录：我们会把 6 位数验证码寄到你的电邮，不需要密码。第一次登录时再选择账号类型。学生和家长报名参加不需要登录。</p>'+
  (L.msg?'<div class="xnote err" role="alert">'+esc(L.msg)+'</div>':'')+
  (L.step==="email"?'<form data-form="code"><label class="xf"><span>电邮 Email</span><input type="email" name="email" required autocomplete="email" value="'+esc(L.email)+'"></label>'+
   '<button class="xbtn" type="submit">寄验证码 Send code</button></form>'
  :'<form data-form="verify"><p>'+T('验证码已寄到 <b>'+esc(L.email)+'</b>，10 分钟内有效。','We sent a code to <b>'+esc(L.email)+'</b>. It is valid for 10 minutes.')+'</p><label class="xf"><span>验证码 Code</span><input name="code" inputmode="numeric" autocomplete="one-time-code" pattern="[0-9]{6}" maxlength="6" required></label>'+
   '<div class="xrow"><button class="xbtn" type="submit">登录 Sign in</button><button type="button" class="xbtn ghost" data-act="relogin">换电邮或重寄 Change email</button></div></form>')+'</section>');
 L.msg="";
 var f=app.querySelector("input");if(f)f.focus();
}
function registerView(){
 var L=S.login,role=L.role||"exhibitor",org=role==="organiser";
 page('<section class="xform"><span class="xeye">注册 Sign up</span><h1>完成注册</h1><p class="xlead">'+T('已用 <b>'+esc(S.me.email)+'</b> 登录。一个账号只能有一种角色，注册后不能更改。','Signed in as <b>'+esc(S.me.email)+'</b>. One account has one role, which cannot be changed later.')+'</p>'+
  '<form data-form="register" novalidate><fieldset class="xf"><legend>账号类型 Account type</legend><div class="xchoice">'+
   '<label><input type="radio" name="role" value="organiser"'+(org?" checked":"")+'> <b>主办方</b> Organiser<small>开办教育展。需经 Eduplan 审核后才能发布活动。</small></label>'+
   '<label><input type="radio" name="role" value="exhibitor"'+(!org?" checked":"")+'> <b>参展学校</b> Exhibitor<small>大学、学院、中学报名摊位。</small></label></div></fieldset>'+
  field("org_name",org?"机构名称 Organisation name":"学校全名 School full name","text",true)+
  (org?"":'<label class="xf"><span>学校类型 School type *</span><select name="school_type" required><option value="">请选择</option>'+TYPES.map(function(t){return '<option value="'+t[0]+'">'+esc(t[1])+'</option>';}).join("")+'</select></label>')+
  field("name","联络人姓名 Contact person","text",true)+field("position","职位 Position","text",true)+
  '<label class="xf"><span>电邮 Email</span><input value="'+esc(S.me.email)+'" readonly></label>'+
  field("phone","电话 Phone","tel",true)+(org?"":field("website","学校官网 School website","url",true,"https://"))+
  '<div class="xprivacy"><b>资料使用说明 How we use your details</b><p>我们只收集以上资料，用于开办和管理教育展活动和摊位，不收身份证号码。'+
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
    var st=e.status;
    return '<article class="xcard row"><div class="xbody"><span class="xdate">'+day(e.date)+' · '+esc(e.start_time)+'–'+esc(e.end_time)+'</span><h3>'+esc(evT(e))+'</h3>'+
     '<p class="xmeta">📍 '+esc([e.venue,e.city].join("，"))+'</p><div class="xpills">'+pill(EV_STATUS[st]||st,st==="published"?"ok":st==="cancelled"||st==="rejected"?"bad":"mute")+
     pill(T("讲座 "+(e.going||0)+" / "+e.seats+" 个名额","Seats "+(e.going||0)+" / "+e.seats),"brand")+(e.full?pill("名额已满","bad"):"")+
     (e.booths?pill(T("摊位 ","Booths ")+(e.accepted_booths+e.pending_booths)+" / "+e.booths,"brand")+(e.pending_booths?pill(T(e.pending_booths+" 个摊位待审核",e.pending_booths+" booths to review"),"warn"):""):"")+'</div>'+
     (st==="rejected"&&e.review_note?'<p class="xnote err sm">Eduplan 备注：'+esc(e.review_note)+'</p>':'')+
     (st==="pending"?'<p class="xmeta">Eduplan 审核通过后，活动会公开让学生和家长报名。</p>':'')+(st==="published"?shareBox(e,false):'')+
     '<div class="xrow">'+(st!=="cancelled"?'<a class="xbtn sm" href="#/org/att/'+esc(e.id)+'">'+T('报名名单','Sign-ups')+' ('+(e.visitors||0)+')</a>'+(e.booths||e.registrations?'<a class="xbtn sm" href="#/org/regs/'+esc(e.id)+'">'+T('摊位报名','Booths')+' ('+e.registrations+')</a>':'')+(st==="published"?'<button type="button" class="xbtn ghost sm" data-act="toggle-share" aria-expanded="false">分享 Share</button>':'')+'<a class="xbtn ghost sm" href="#/org/edit/'+esc(e.id)+'">编辑 Edit</a>'+
      '<button type="button" class="xbtn ghost sm danger" data-act="cancel-event" data-id="'+esc(e.id)+'" data-title="'+esc(evT(e))+'">取消活动 Cancel</button>':'<a class="xbtn ghost sm" href="#/org/att/'+esc(e.id)+'">'+T('报名名单','Sign-ups')+' ('+(e.visitors||0)+')</a>'+(e.registrations?'<a class="xbtn ghost sm" href="#/org/regs/'+esc(e.id)+'">摊位报名 Booths</a>':''))+'</div></div></article>';}).join("")+'</div>'
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
  var e=id?S.mine.filter(function(x){return x.id===id;})[0]:{};
  if(id&&!e){page(failed({error:"not_found"}));return;}
  if(e.status==="cancelled"){page(failed({error:"cancelled"}));return;}
  var t=today(),approved=me.status==="approved";
  page('<section class="xform wide"><span class="xeye">主办方后台 Organiser</span><h1>'+(id?"编辑活动":"开新活动")+'</h1>'+orgBanner(me)+
   '<form data-form="event" data-id="'+esc(id||"")+'" novalidate>'+
   field("title","活动名称 Event title","text",true,"",e.title,' maxlength="140"')+
   '<label class="xf"><span>简介 Description *</span><textarea name="description" rows="4" required maxlength="3000">'+esc(e.description)+'</textarea></label>'+
   '<details class="xtr"'+(e.title_tr?' open':'')+'><summary>英文／中文翻译（可选）Translation (optional)</summary>'+
   '<p class="xhint">活动名称和简介会按访客选的语言显示。留空的话，系统会自动翻译成另一种语言（英文或中文）；你也可以自己填写或修改。</p>'+
   field("title_tr","翻译后的活动名称 Translated title","text",false,"",e.title_tr,' maxlength="140"')+
   '<label class="xf"><span>翻译后的简介 Translated description</span><textarea name="description_tr" rows="4" maxlength="3000">'+esc(e.description_tr||"")+'</textarea></label></details>'+
   '<div class="xgrid3">'+field("date","日期 Date","date",true,"",e.date,' min="'+t+'"')+field("start_time","开始 Start","time",true,"",e.start_time)+field("end_time","结束 End","time",true,"",e.end_time)+'</div>'+
   field("venue","场地名称 Venue","text",true,"",e.venue)+field("address","地址 Address","text",true,"",e.address)+
   '<div class="xgrid2">'+field("city","城市 City","text",true,"",e.city)+
   '<label class="xf"><span>州属 State *</span><select name="state" required><option value="">请选择</option>'+STATES.map(function(s){return '<option'+(e.state===s?" selected":"")+'>'+esc(s)+'</option>';}).join("")+'</select></label></div>'+
   '<fieldset class="xf"><legend>开放什么报名 What to open *</legend><div class="xchoice">'+
    '<label><input type="radio" name="mode" value="seats"'+(e.mode!=="both"?" checked":"")+'> <b>只开放讲座名额</b> Talk seats only<small>学生、家长和老师免费报名座位。</small></label>'+
    '<label><input type="radio" name="mode" value="both"'+(e.mode==="both"?" checked":"")+'> <b>讲座名额 + 学校摊位</b> Seats and booths<small>另外让大学、学院报名摊位，由你接受或拒绝。</small></label></div></fieldset>'+
   '<div class="xgrid2">'+field("seats","讲座名额 Seats","number",true,"例如 100",e.seats,' min="1" max="5000" step="1" inputmode="numeric"')+
   field("registration_deadline","报名截止日 Deadline","date",true,"",e.registration_deadline,' min="'+t+'"')+'</div>'+
   '<div class="xgrid2" data-booths'+(e.mode==="both"?'':' hidden')+'>'+field("booths","学校摊位 Booths","number",false,"例如 20",e.booths||"",' min="1" max="1000" step="1" inputmode="numeric"')+
   field("booth_fee","摊位费 Booth fee (RM)","number",false,"0 = 免费",e.booths?e.booth_fee:0,' min="0" step="0.01" inputmode="decimal"')+'</div>'+
   '<p class="xhint">学生和家长免费报名，每人可以替最多 10 人报名，名额满了就自动停止报名。报名截止日可以是活动当天，也是学校摊位的截止日。摊位费目前只显示，不做线上付款。</p>'+
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
 var t=today(),bad=["title","description","date","start_time","end_time","venue","address","city","state","registration_deadline","seats"].filter(function(k){return !v[k];});
 if(bad.length)return {error:"missing",fields:bad};
 if(v.date<t)return {error:"past_date",fields:["date"]};
 if(v.end_time<=v.start_time)return {error:"bad_time",fields:["end_time"]};
 if(v.registration_deadline>v.date)return {error:"deadline_after_event",fields:["registration_deadline"]};
 if(v.registration_deadline<t)return {error:"past_deadline",fields:["registration_deadline"]};
 var n=Number(v.seats);if(!(n>0&&n<=5000)||Math.floor(n)!==n)return {error:"bad_capacity",fields:["seats"]};
 if(v.mode==="both"){var k=Number(v.booths);if(!(k>0&&k<=1000)||Math.floor(k)!==k)return {error:"bad_booths",fields:["booths"]};
  if(v.booth_fee===""||!(Number(v.booth_fee)>=0))return {error:"bad_fee",fields:["booth_fee"]};}
 return null;
}
function regsView(id){
 var my=seq;loading();
 api("expo_event_regs",{event_id:id}).then(function(r){
  if(done(my))return;if(r.error){page(failed(r)+'<a class="xbtn ghost" href="#/org">返回 Back</a>');return;}
  var e=r.event,acc=0,pen=0;r.registrations.forEach(function(x){if(x.status==="accepted")acc+=x.booths_requested;if(x.status==="pending")pen+=x.booths_requested;});
  var live=e.status!=="cancelled";
  page('<nav class="xcrumb"><a href="#/org">我的活动</a> › '+esc(evT(e))+'</nav><section class="xtop"><div><span class="xeye">主办方后台 · 管理报名</span><h1>'+esc(evT(e))+'</h1>'+
   '<p class="xlead">'+day(e.date)+' · '+esc(e.venue)+'</p></div></section>'+
   '<div class="xstats"><div><b>'+acc+'</b><span>已接受摊位</span></div><div><b>'+pen+'</b><span>待审核摊位</span></div><div><b>'+e.booths+'</b><span>摊位总数</span></div><div><b>'+e.booths_remaining+'</b><span>剩余</span></div></div>'+
   (!live?'<div class="xnote err">这个活动已取消，已报名的学校会看到「活动已取消」。</div>':'')+
   '<p class="xhint">学校的联络资料只给你（这个活动的主办方）看，请勿外传。</p>'+
   (r.registrations.length?'<div class="xlist">'+r.registrations.map(function(x){var s=x.school||{};
    return '<article class="xcard row"><div class="xbody"><div class="xpills">'+pill(REG_STATUS[x.status]||x.status,x.status==="accepted"?"ok":x.status==="pending"?"warn":"mute")+pill(T(x.booths_requested+" 个摊位",x.booths_requested+(x.booths_requested>1?" booths":" booth")),"brand")+'</div>'+
     '<h3>'+esc(s.org_name)+'</h3><p class="xmeta">'+esc(tx((TYPES.filter(function(t){return t[0]===s.school_type;})[0]||["",""])[1]))+(s.website?' · <a href="'+esc(s.website)+'" target="_blank" rel="noopener">官网</a>':'')+'</p>'+
     '<dl class="xdl"><dt>联络人</dt><dd>'+esc(s.name)+'（'+esc(s.position)+'）</dd><dt>电邮</dt><dd><a href="mailto:'+esc(s.email)+'">'+esc(s.email)+'</a></dd><dt>电话</dt><dd><a href="tel:'+esc(s.phone)+'">'+esc(s.phone)+'</a></dd>'+
     '<dt>展示内容</dt><dd>'+esc(x.topics)+'</dd>'+(x.special_needs?'<dt>特别需求</dt><dd>'+esc(x.special_needs)+'</dd>':'')+'</dl>'+
     (live&&x.status!=="withdrawn"?'<form class="xdecide" data-form="decide" data-id="'+esc(x.id)+'"><label class="xf"><span>备注（学校会看到）Note</span><input name="note" maxlength="300" value="'+esc(x.organiser_note)+'" placeholder="例如：摊位 A1、请在 9 点前布置"></label>'+
      '<div class="xrow"><button class="xbtn sm ok" type="submit" data-decision="accepted"'+(x.status==="accepted"?" disabled":"")+'>接受 Accept</button><button class="xbtn sm ghost danger" type="submit" data-decision="rejected"'+(x.status==="rejected"?" disabled":"")+'>拒绝 Reject</button></div></form>'
      :(x.organiser_note?'<p class="xmeta">备注：'+esc(x.organiser_note)+'</p>':''))+'</div></article>';}).join("")+'</div>'
    :'<div class="xempty">还没有学校报名。</div>')+'<p><a class="xbtn ghost" href="#/org">返回我的活动 Back</a></p>');
 });
}

/* The organiser's list of visitors signed up to attend (expo_event_attendees), with a CSV download. */
var ATT=[];
function attView(id){
 var my=seq;loading();
 api("expo_event_attendees",{event_id:id}).then(function(r){
  if(done(my))return;if(r.error){page(failed(r)+'<a class="xbtn ghost" href="#/org">返回 Back</a>');return;}
  var e=r.event,list=r.attendees,people=0;ATT=list;list.forEach(function(a){people+=a.people;});
  var whoName=function(w){return tx((WHO.filter(function(x){return x[0]===w;})[0]||["",w])[1]);};
  page('<nav class="xcrumb"><a href="#/org">我的活动</a> › '+esc(evT(e))+'</nav><section class="xtop"><div><span class="xeye">主办方后台 · 报名名单 Sign-ups</span><h1>'+esc(evT(e))+'</h1>'+
   '<p class="xlead">'+day(e.date)+' · '+esc(e.venue)+'</p></div>'+(list.length?'<button type="button" class="xbtn" data-act="att-csv" data-title="'+esc(evT(e))+'">下载 CSV Download</button>':'')+'</section>'+
   '<div class="xstats"><div><b>'+people+' / '+e.seats+'</b><span>已报名 / 名额</span></div><div><b>'+e.remaining+'</b><span>剩余名额</span></div><div><b>'+list.length+'</b><span>报名笔数</span></div>'+
   WHO.map(function(w){var n=list.filter(function(a){return a.who===w[0];}).length;return '<div><b>'+n+'</b><span>'+esc(tx(w[1]))+'</span></div>';}).join("")+'</div>'+
   '<p class="xhint">参加者的联络资料只给你（这个活动的主办方）用于这次活动，请勿外传。</p>'+
   (list.length?'<div class="xtable att" tabindex="0" role="region" aria-label="参加者名单"><table><thead><tr><th>#</th><th>姓名</th><th>身份</th><th>学校</th><th>人数</th><th>电话</th><th>电邮</th><th>报名时间</th></tr></thead><tbody>'+
    list.map(function(a,i){return '<tr><td>'+(i+1)+'</td><td>'+esc(a.name)+'</td><td>'+esc(whoName(a.who))+'</td><td>'+esc(a.school)+'</td><td>'+a.people+'</td>'+
     '<td><a href="tel:'+esc(a.phone)+'">'+esc(a.phone)+'</a></td><td><a href="mailto:'+esc(a.email)+'">'+esc(a.email)+'</a></td><td>'+esc(String(a.created_at).replace("T"," ").slice(0,16))+'</td></tr>';}).join("")+'</tbody></table></div>'
    :'<div class="xempty">'+T("还没有人报名参加。把活动链接分享给学生和家长：","No sign-ups yet. Share the event link with students and parents:")+'<br><b>'+esc(location.href.split("#")[0]+"#/e/"+e.id)+'</b></div>')+
   '<p><a class="xbtn ghost" href="#/org">返回我的活动 Back</a></p>');
 });
}
function attCsv(title){
 var q=function(x){x=String(x==null?"":x);if(/^[=+\-@]/.test(x))x="'"+x;return '"'+x.replace(/"/g,'""')+'"';};
 var rows=[["No","Name","Who","School","People","Phone","Email","Signed up"]].concat(ATT.map(function(a,i){return [i+1,a.name,a.who,a.school,a.people,a.phone,a.email,a.created_at];}));
 var blob=new Blob(["\ufeff"+rows.map(function(r){return r.map(q).join(",");}).join("\r\n")],{type:"text/csv;charset=utf-8"});
 var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=(title||"visitors").replace(/[\\/:*?"<>|]+/g," ").slice(0,60)+" - visitors.csv";
 document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove();},500);
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
   var act=e.my_status?'<a class="xbtn ghost sm" href="#/ex/my">查看我的报名 My booking</a>':e.booths_full?'<button class="xbtn sm" type="button" disabled>已额满 Full</button>':'<a class="xbtn sm" href="#/ex/apply/'+esc(e.id)+'">报名摊位 Book a booth</a>';
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
  if(e.my_status){page('<div class="xnote warn">'+T('你的学校已经报名这个活动（'+esc(tx(REG_STATUS[e.my_status]||e.my_status))+'），不能重复报名。','Your school has already booked this event ('+esc(tx(REG_STATUS[e.my_status]||e.my_status))+') and cannot book again.')+'</div><a class="xbtn" href="#/ex/my">查看我的报名</a>');return;}
  if(e.booths_full){page('<div class="xnote err">这个活动的摊位已额满。</div><a class="xbtn ghost" href="#/ex">浏览其他活动</a>');return;}
  page('<nav class="xcrumb"><a href="#/ex">浏览活动</a> › '+esc(evT(e))+'</nav>'+eventCard(e)+
   (evD(e)?'<section class="xcard pad"><h2>活动简介</h2><p class="xpre">'+esc(evD(e))+'</p><p class="xmeta">'+T("地址：","Address: ")+esc(e.address)+'</p></section>':'')+
   '<section class="xform"><h2>报名摊位 Book a booth</h2><form data-form="apply" data-id="'+esc(e.id)+'" novalidate>'+
   field("booths","需要几个摊位 Booths","number",true,"",1,' min="1" max="'+e.booths_remaining+'" step="1" inputmode="numeric"')+'<p class="xhint">'+T('目前剩 '+e.booths_remaining+' 个摊位。摊位费：'+esc(rm(e.booth_fee))+'（每个摊位，向主办方缴付）。',e.booths_remaining+' booths left. Booth fee: '+esc(rm(e.booth_fee))+' per booth, paid to the organiser.')+'</p>'+
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
    return '<article class="xcard row"><div class="xbody"><div class="xpills">'+pill(REG_STATUS[x.status]||x.status,x.status==="accepted"?"ok":x.status==="pending"?"warn":"bad")+pill(T(x.booths_requested+" 个摊位",x.booths_requested+(x.booths_requested>1?" booths":" booth")),"brand")+'</div>'+
     '<h3>'+esc(evT(e)||T("活动","Event"))+'</h3><p class="xmeta">'+day(e.date)+' · '+esc(e.start_time)+'–'+esc(e.end_time)+' · '+esc([e.venue,e.city].filter(Boolean).join("，"))+'</p>'+
     '<p class="xmeta">'+T("展示内容：","Topics: ")+esc(x.topics)+'</p>'+(x.organiser_note?'<p class="xnote sm">'+T("主办方备注：","Organiser's note: ")+esc(x.organiser_note)+'</p>':'')+
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
    return eventCard(e,{more:'<p class="xpre sm">'+esc(evD(e))+'</p><p class="xmeta">'+T("地址：","Address: ")+esc(e.address)+T(' · 名额 '+e.seats+' 个',' · '+e.seats+' seats')+'</p>'+decide("event",e.id)});}).join("")+'</div>':'<div class="xempty">没有待审核的活动。</div>')+'</section>'+
   '<section class="xsec"><h2>所有主办方 <span>'+r.organisers.length+'</span></h2><div class="xtable"><table><thead><tr><th>机构</th><th>联络人</th><th>状态</th></tr></thead><tbody>'+
    r.organisers.map(function(u){return '<tr><td>'+esc(u.org_name)+'</td><td>'+esc(u.name)+'<br><small>'+esc(u.email)+'</small></td><td>'+esc({pending:"待审核",approved:"已批准",rejected:"已拒绝"}[u.status]||u.status)+'</td></tr>';}).join("")+'</tbody></table></div></section>');
 });
}

/* ---------- Events ---------- */
app.addEventListener("change",function(ev){var el=ev.target;
 if(el.name==="mode"){var box=app.querySelector("[data-booths]");if(box)box.hidden=el.value!=="both";}
 else if(el.name==="role"&&el.form&&el.form.getAttribute("data-form")==="register"){S.login.role=el.value;registerView();}
});
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
  var id=f.getAttribute("data-id");v.seats=Number(v.seats);v.booths=Number(v.booths)||0;v.booth_fee=Number(v.booth_fee)||0;if(id)v.id=id;
  p=readCover(f.elements.cover&&f.elements.cover.files[0]).then(function(cover){return api("expo_event_save",{event:v,submit:submit,cover:cover||undefined});},function(e){return e;});
  after=function(r){S.mine=[];S.flash=r.status==="pending"?"已提交，Eduplan 审核通过后会公开让学生和家长报名。":r.status==="published"?"已保存并发布。":"草稿已保存。";go("#/org");};}
 else if(kind==="decide"){var d=btn&&btn.getAttribute("data-decision");p=api("expo_reg_decide",{reg_id:f.getAttribute("data-id"),decision:d,note:v.note});
  after=function(){S.flash=d==="accepted"?"已接受，学校会收到电邮通知。":"已拒绝，学校会收到电邮通知。";render();};}
 else if(kind==="apply"){var b=Number(v.booths||1);if(!v.topics){busy(f,false);formError(f,{error:"missing",fields:["topics"]});return;}
  p=api("expo_apply",{event_id:f.getAttribute("data-id"),booths:b,topics:v.topics,special_needs:v.special_needs});
  after=function(){S.flash="报名已提交，主办方接受或拒绝后会电邮通知你。";go("#/ex/my");};}
 else if(kind==="join"){var n=Number(v.people||1),jid=f.getAttribute("data-id");
  var miss=["name","email","phone","who"].filter(function(k){return !v[k];});
  if(miss.length){busy(f,false);formError(f,{error:"missing",fields:miss,labels:{name:"姓名"}});return;}
  if(!(n>=1&&n<=10&&Math.floor(n)===n)){busy(f,false);formError(f,{error:"bad_people",fields:["people"]});return;}
  if(!v.consent){busy(f,false);formError(f,{error:"consent"});return;}
  v.people=n;saveVisitor(v);
  p=api("expo_attend",{event_id:jid,name:v.name,email:v.email,phone:v.phone,who:v.who,school:v.school,people:n,consent:true}).then(function(r){
   if(r&&r.error==="too_many")r.error="attend_many";if(r&&r.error==="bad_email")r={error:"missing",fields:["email"]};if(r&&r.fields)r.labels={name:"姓名"};return r;});
  after=function(r){api("expo_public").then(function(x){var e=(x.events||[]).filter(function(y){return y.id===jid;})[0]||{title:"",id:jid};joinDone(e,r,v);window.scrollTo(0,0);});};}
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
 else if(a==="att-csv"){attCsv(b.getAttribute("data-title"));}
 else if(a==="tip-close"){closeTip();}
 else if(a==="lang"){setLang(LANG==="en"?"zh":"en");}
 else if(a==="tip-go"){try{localStorage.setItem(TIP.key,String(Date.now()));}catch(e){}}
 else if(a==="toggle-share"){var box=b.closest(".xbody").querySelector(".xshare");if(box){box.hidden=!box.hidden;b.setAttribute("aria-expanded",String(!box.hidden));}}
 else if(a==="copy-link"){var url=b.getAttribute("data-url"),was=b.textContent;
  copyText(url).then(function(){b.textContent=T("已复制 ✓","Copied ✓");},function(){window.prompt(T("复制这个链接：","Copy this link:"),url);})
   .then(function(){setTimeout(function(){b.textContent=was;},2000);});}
 else if(a==="native-share"){navigator.share({title:b.getAttribute("data-title"),text:b.getAttribute("data-text"),url:b.getAttribute("data-url")}).catch(function(){});}
 else if(a==="clear-filter"){F={state:"",city:"",from:"",to:""};render();}
 else if(a==="cancel-event"){if(!confirm(T("确定取消「"+b.getAttribute("data-title")+"」吗？已报名的人会收到通知，取消后不能恢复。","Cancel “"+b.getAttribute("data-title")+"”? Everyone signed up will be told. This cannot be undone.")))return;
  b.disabled=true;api("expo_event_cancel",{event_id:b.getAttribute("data-id")}).then(function(r){S.mine=[];if(r.error){b.disabled=false;alert(errText(r));return;}S.flash="活动已取消，已报名的人会收到通知。";render();});}
 else if(a==="withdraw"){if(!confirm(T("确定撤回这个报名吗？","Withdraw this booking?")))return;
  b.disabled=true;api("expo_withdraw",{reg_id:b.getAttribute("data-id")}).then(function(r){if(r.error){b.disabled=false;alert(errText(r));return;}S.flash="报名已撤回。";render();});}
});
window.addEventListener("hashchange",function(){render();window.scrollTo(0,0);app.focus({preventScroll:true});});
/* Translate fixed texts (EXPO_I18N in expo-i18n.js) whenever the page draws something new, and on the footer. */
function setLang(l){LANG=l;try{localStorage.setItem("eduplan-lang",l);}catch(e){}applyLang(document.body);render();}
function applyLang(root){document.documentElement.lang=LANG==="en"?"en":"zh-Hans";document.title=T("Eduplan 教育展","Eduplan Education Exhibition");if(window.EXPO_TR)window.EXPO_TR(root,LANG);}
if(window.MutationObserver)new MutationObserver(function(list){list.forEach(function(m){m.addedNodes.forEach(function(n){if(window.EXPO_TR)window.EXPO_TR(n,LANG);});});})
 .observe(document.body,{childList:true,subtree:true});
applyLang(document.body);
render();
})();
