/* Eduplan AI study assistant: the chat bubble at the bottom right of every page.
   Answers come from Claude, grounded in the school data (assets/js/chat-knowledge.js):
   - on the live website, through the Apps Script /exec URL (apps-script/Chat.gs keeps the API key);
   - inside a Claude artifact, through the artifact's own "sample" capability with the embedded snapshot.
   The conversation is kept for this browser tab only (sessionStorage). */
(function(){
"use strict";
if(window.EDUPLAN_CHAT===false)return;

var KEY="eduplan-chat",MAX=1000;
var msgs=[];try{msgs=JSON.parse(sessionStorage.getItem(KEY))||[];}catch(e){}
function save(){try{sessionStorage.setItem(KEY,JSON.stringify(msgs.slice(-30)));}catch(e){}}

var SUGGEST=["What can I study at XMUM with UEC?","Which scholarships are there for SPM students?","I like computers. Which courses suit me?","How much is the Master of Science in Mathematics at XMUM?"];
var ERR={
 not_configured:"The assistant is not switched on yet. Please book a free consultation and a counsellor will answer you.",
 daily_limit:"The assistant has answered many questions today. Please try again tomorrow, or book a free consultation.",
 busy:"The assistant is busy right now. Please try again in a moment.",
 declined:"Sorry, I can't help with that. Please ask about courses, universities or scholarships.",
 offline:"The assistant is not available here. Please book a free consultation and a counsellor will answer you."
};

function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];});}
/* Small, safe formatting: **bold**, lists, [text](#page or https://...) links and bare https links. */
function inline(s){
 return esc(s).replace(/\*\*([^*]+)\*\*/g,"<strong>$1</strong>")
  .replace(/\[([^\]]+)\]\((#[a-z0-9\/-]*|https:\/\/[^\s)]+)\)/gi,function(m,t,u){return '<a href="'+u+'"'+(u.charAt(0)==="#"?' data-chatlink':' target="_blank" rel="noopener"')+'>'+t+'</a>';})
  .replace(/(^|[\s(])(https:\/\/[^\s<)]+)/g,'$1<a href="$2" target="_blank" rel="noopener">$2</a>');
}
function format(text){
 var html="",list=null;
 String(text).split(/\r?\n/).forEach(function(line){
  var m=line.match(/^\s*(?:[-*•]|\d+[.)])\s+(.*)$/);
  if(m){if(!list){list=/^\s*\d/.test(line)?"ol":"ul";html+="<"+list+">";}html+="<li>"+inline(m[1])+"</li>";return;}
  if(list){html+="</"+list+">";list=null;}
  if(line.trim())html+="<p>"+inline(line.replace(/^#+\s*/,""))+"</p>";
 });
 if(list)html+="</"+list+">";
 return html;
}

/* ---------- Backend ---------- */
var sampler;  // undefined: not checked yet; null: not available
function getSampler(){
 if(sampler!==undefined)return Promise.resolve(sampler);
 if(!window.claude||typeof window.claude.use!=="function")return Promise.resolve(sampler=null);
 return window.claude.use("sample").then(function(s){return sampler=s||null;},function(){return sampler=null;});
}
function askArtifact(sample,history,onText){
 var data=window.EDUPLAN_SHEET_DATA||{};
 var turns=history.map(function(m){return {role:m.role,content:m.content};});
 turns[0]={role:"user",content:EDUPLAN_CHAT_SYSTEM+"\n\n<eduplan_data>\n"+eduplanKnowledge(data)+"\n</eduplan_data>\n\nStudent: "+turns[0].content};
 return sample(turns,{cache:false,onText:function(p){onText(p.text);}}).then(function(r){return r.text;},function(err){
  throw new Error(err&&err.code==="rate_limited"?"busy":err&&err.code==="not_granted"?"offline":"busy");});
}
function askServer(history){
 var url=window.EDUPLAN_CHAT_URL||window.EDUPLAN_API_URL;
 if(!url||!window.fetch)return Promise.reject(new Error("offline"));
 /* text/plain keeps this a "simple" request, which Apps Script accepts from any website. */
 return fetch(url,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action:"chat",messages:history})})
  .then(function(r){if(!r.ok)throw new Error("busy");return r.json();},function(){throw new Error("offline");})
  .then(function(d){if(d&&d.reply)return d.reply;throw new Error(d&&ERR[d.error]?d.error:"busy");});
}
function ask(history,onText){
 return getSampler().then(function(s){return s&&typeof eduplanKnowledge==="function"?askArtifact(s,history,onText):askServer(history);});
}

/* ---------- UI ---------- */
var ICON='<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1.1-4.6A8 8 0 1 1 21 12z"></path></svg>';
var CLOSE='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"></path></svg>';
var SEND='<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"></path></svg>';

var root=document.createElement("div");root.className="chat";
root.innerHTML=
 '<button type="button" class="chatfab" aria-expanded="false" aria-controls="chat-panel">'+ICON+'<span>Ask Eduplan</span></button>'+
 '<section class="chatpanel" id="chat-panel" role="dialog" aria-label="Eduplan study assistant" hidden>'+
  '<header class="chathead"><div><strong>Eduplan study assistant</strong><span>AI answers from Eduplan’s course and scholarship data</span></div>'+
   '<button type="button" class="chaticon" data-chat="close" aria-label="Close chat">'+CLOSE+'</button></header>'+
  '<div class="chatlog" aria-live="polite"></div>'+
  '<form class="chatform"><label class="sr" for="chat-input">Your question</label>'+
   '<textarea id="chat-input" rows="1" maxlength="'+MAX+'" placeholder="Type your question…"></textarea>'+
   '<button type="submit" class="chaticon send" aria-label="Send">'+SEND+'</button></form>'+
  '<p class="chatnote">AI answers can be wrong. Please confirm with a counsellor. Do not type personal details such as your IC number. <button type="button" class="chatclear" data-chat="clear">New chat</button></p>'+
 '</section>';
document.body.appendChild(root);
var fab=root.querySelector(".chatfab"),panel=root.querySelector(".chatpanel"),log=root.querySelector(".chatlog"),
    form=root.querySelector(".chatform"),input=root.querySelector("#chat-input"),sendBtn=root.querySelector(".send"),busy=false;

function bubble(m){
 var d=document.createElement("div");d.className="msg "+(m.role==="user"?"me":"bot")+(m.error?" err":"");
 if(m.role==="user"){d.setAttribute("data-notr","");d.textContent=m.content;}
 else if(m.error)d.innerHTML="<p>"+esc(ERR[m.error]||ERR.busy)+'</p><p><a href="#consultation" data-chatlink>Book a free consultation</a></p>';
 else{d.setAttribute("data-notr","");d.innerHTML=format(m.content);}
 return d;
}
function render(){
 log.innerHTML="";
 if(!msgs.length){
  var w=document.createElement("div");w.className="msg bot";
  w.innerHTML="<p>Hi! I can help you find courses, compare universities and check scholarships. What would you like to know?</p>";
  log.appendChild(w);
  var s=document.createElement("div");s.className="chatsuggest";
  s.innerHTML=SUGGEST.map(function(q){return '<button type="button" class="chip" data-chat="ask">'+esc(q)+'</button>';}).join("");
  log.appendChild(s);
 }
 msgs.forEach(function(m){log.appendChild(bubble(m));});
 log.scrollTop=log.scrollHeight;
}
function grow(){input.style.height="auto";input.style.height=Math.min(input.scrollHeight,120)+"px";}

function send(text){
 text=String(text||"").trim().slice(0,MAX);
 if(!text||busy)return;
 busy=true;sendBtn.disabled=true;
 msgs.push({role:"user",content:text});save();render();
 input.value="";grow();
 var pending=document.createElement("div");pending.className="msg bot typing";pending.setAttribute("data-notr","");
 pending.innerHTML='<span class="dots" aria-label="Typing"><i></i><i></i><i></i></span>';
 log.appendChild(pending);log.scrollTop=log.scrollHeight;
 /* Only answered turns go to the assistant: error notices and the questions they failed on are left out. */
 var history=msgs.filter(function(m,i){return !m.error&&!(msgs[i+1]&&msgs[i+1].error);}).map(function(m){return {role:m.role,content:m.content};});
 ask(history,function(partial){pending.className="msg bot";pending.innerHTML=format(partial);log.scrollTop=log.scrollHeight;})
  .then(function(reply){msgs.push({role:"assistant",content:reply});},function(err){msgs.push({role:"assistant",error:ERR[err&&err.message]?err.message:"busy"});})
  .then(function(){busy=false;sendBtn.disabled=false;save();render();input.focus();});
}

function open(o){
 panel.hidden=!o;fab.setAttribute("aria-expanded",String(o));root.classList.toggle("open",o);
 if(o){render();setTimeout(function(){input.focus();},0);}else fab.focus();
}
fab.addEventListener("click",function(){open(panel.hidden);});
/* Other pages can open the chat with a question started, e.g. the "Ask more" step after choosing a programme. */
window.addEventListener("eduplan:ask",function(ev){open(true);input.value=(ev.detail&&ev.detail.text)||"";grow();input.focus();input.setSelectionRange(input.value.length,input.value.length);});
form.addEventListener("submit",function(ev){ev.preventDefault();send(input.value);});
input.addEventListener("input",grow);
input.addEventListener("keydown",function(ev){if(ev.key==="Enter"&&!ev.shiftKey&&!ev.isComposing){ev.preventDefault();send(input.value);}});
root.addEventListener("keydown",function(ev){if(ev.key==="Escape"&&!panel.hidden)open(false);});
root.addEventListener("click",function(ev){
 var t=ev.target.closest("[data-chat],[data-chatlink]");if(!t)return;
 if(t.hasAttribute("data-chatlink")){if(matchMedia("(max-width: 600px)").matches)open(false);return;}
 var a=t.getAttribute("data-chat");
 if(a==="close")open(false);
 else if(a==="ask")send(t.textContent);
 else if(a==="clear"){msgs=[];save();render();input.focus();}
});
})();
