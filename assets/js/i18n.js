/* Eduplan language switch (English / 中文).
   The pages are written in English. In 中文 mode every text node and label is looked up in ZH (exact text)
   and then in ZH_PATTERNS (text with numbers or names in it). Text that is not listed stays as it is:
   names and content from the Google Sheet or official sources (university, course and scholarship names,
   official scholarship terms) are kept in their original wording on purpose.
   To translate a new sentence, add it to ZH exactly as it appears in English. */
(function(){
"use strict";
var ZH={
 /* Header, footer, shared */
 "About Us":"关于我们","Faculty":"科系","Universities":"大学","Scholarships":"奖学金","Accommodation":"住宿","Free Consultation":"免费咨询",
 "Sample data. Universities, scholarships, fees and contact details on this site are placeholders until Eduplan replaces them.":"示范资料：本网站的大学、奖学金、学费与联络资料仍是占位内容，Eduplan 将陆续更新。",
 "Plan your future. Guidance from choosing a course to registration, free of charge.":"规划你的未来。从选科到报名注册，全程免费指导。",
 "Eduplan home":"Eduplan 首页","Main":"主选单","Eduplan: plan your future":"Eduplan：规划你的未来","Progress":"进度",
 "Back":"返回","Next":"下一步","Book a free consultation":"预约免费咨询","Ask a counsellor":"咨询升学顾问",
 "Ask a counsellor about scholarships":"向升学顾问咨询奖学金","Ask a counsellor about this course":"向升学顾问咨询这个课程",
 "Open the tool":"使用工具","Last updated":"最后更新","Official website":"官方网站","Official information":"官方资料",
 "Official website link to be added.":"官网链接待补充。",
 "Information is for reference only. Please confirm with the university’s official website.":"资料仅供参考。奖学金条件保留官方英文原文，请以大学官网为准。",
 /* Home */
 "Specific Tools for Study Further":"专属升学工具","Three ways to find your course and university. Free of charge.":"三种方式，帮你找到合适的课程与大学，完全免费。",
 "Option 1 · Scholarship based":"选项一 · 奖学金导向","Option 2 · Interest based":"选项二 · 兴趣导向","Option 3 · Guidance based":"选项三 · 引导式",
 "Don't Let Fees Decide Your Future: Match With a Scholarship":"别让学费决定你的未来：找到适合你的奖学金","Find my scholarships":"寻找我的奖学金",
 "From Interest to Career: Courses Matched to You in any field":"从兴趣到职业：为你配对各领域的课程","Match my interests":"配对我的兴趣",
 "From \"I Don't Know\" to \"I'm Enrolled\", One Step at a Time":"从「我不知道」到「我已报名」，一步一步来","Start the 5 questions":"开始回答 5 道题",
 "Others: browse all faculties":"其他：浏览所有科系","How Eduplan works":"Eduplan 如何帮助你",
 "Step 1":"步骤一","Step 2":"步骤二","Step 3":"步骤三",
 "Tell us where you are":"告诉我们你的情况","Pick the tool that fits you: you need funding, you know what you like, or you are not sure yet.":"选择适合你的工具：需要经济援助、已经知道兴趣，或是还不确定方向。",
 "See your matches":"查看配对结果","Get a short list of courses, universities and scholarships that fit your answers.":"根据你的答案，列出适合的课程、大学与奖学金。",
 "Talk to a counsellor":"与升学顾问面谈","Book a free consultation. We guide you from application to registration.":"预约免费咨询，我们陪你从申请走到注册。",
 /* About */
 "We lead students to the right place to study":"引导学生找到最适合的升学去处",
 "Eduplan is an education tool that guides students to a suitable institution, from learning about it to the registration phase. The service is free of charge for students.":"Eduplan 是一个升学工具，从认识院校到完成注册，一路引导学生找到合适的学府。本服务对学生完全免费。",
 "Our vision":"我们的愿景","Our mission":"我们的使命",
 "To be Malaysia’s most trusted local education advisor, helping students save on the cost of further studies and avoid detours along the way.":"成为马来西亚本地最值得信任的升学顾问，帮助学生节省升学成本，避开升学弯路。",
 "Most trusted in Malaysia":"马来西亚最值得信任","A local advisor students and parents can rely on":"学生与家长都能信赖的本地顾问",
 "Save on study costs":"节省升学成本","Scholarships, fees and options compared before you commit":"在做决定前，先比较奖学金、学费与各种选择",
 "Avoid detours":"避开升学弯路","The right course and institution from the start":"一开始就选对课程与院校",
 "To help students go from discovering the field of study they aspire to, all the way to enrolling in a college or university, in the simplest and fastest way possible.":"用最简约、最快速的方法，帮助学生从了解所向往的科系，一路到报名大专。",
 "Discover":"探索","Find the field of study you aspire to":"找到你向往的科系","Compare":"比较","See the courses and universities that offer it":"查看开办该科系的课程与大学",
 "Fund":"资助","Check the scholarships you qualify for":"查看你符合资格的奖学金","Enrol":"报名","We guide you all the way to registration":"全程陪你走到报名注册",
 "Meet our founder":"认识我们的创办人","Founder & CEO":"创办人兼首席执行官",
 "Founder and CEO of Eduplan, where he has led student guidance as Chief Education Advisor since May 2020. He has worked in higher education recruitment and student guidance since 2015, at BERJAYA University College, Xiamen University Malaysia and FSI Center 升学情报.":"Eduplan 创办人兼首席执行官，自 2020 年 5 月起以首席升学顾问身份带领学生辅导工作。他自 2015 年起投身高等教育招生与学生辅导，曾任职于 BERJAYA University College、Xiamen University Malaysia 及 FSI Center 升学情报。",
 "Career":"工作经历","Education":"学历","Chief Education Advisor":"首席升学顾问","Manager":"经理","Student Recruitment":"招生","Sales/Marketing":"销售／市场营销",
 "Business Administration":"企业管理","Class of 2008":"2008 届",
 "May 2020 – Present":"2020年5月 – 至今","Oct 2017 – Apr 2020 · Kajang, Malaysia":"2017年10月 – 2020年4月 · 马来西亚加影",
 "Jul 2016 – Sep 2017 · Sepang":"2016年7月 – 2017年9月 · 雪邦","Dec 2015 – Jul 2016 · Kuala Lumpur":"2015年12月 – 2016年7月 · 吉隆坡",
 "Three ways we guide you":"我们引导你的三种方式","Scholarship based":"奖学金导向","Interest based":"兴趣导向","Guidance based":"引导式",
 "For students who need funding. We match your results and family income with scholarships you can apply for.":"适合需要经济援助的学生。我们根据你的成绩与家庭收入，配对可申请的奖学金。",
 "For students who know what they enjoy. We turn your interests into courses and universities.":"适合已经知道兴趣的学生。我们把你的兴趣转化为合适的课程与大学。",
 "For students who are still unsure. Five short questions, then a counsellor walks you through each step.":"适合还不确定方向的学生。回答五道简单问题，再由升学顾问一步步陪你规划。",
 "Ready to talk?":"准备好聊聊了吗？","A counsellor will go through your options with you and your family.":"升学顾问会与你和家人一起讨论各种选择。",
 /* Universities and accommodation (sample content) */
 "Partner universities and colleges":"合作大学与学院","Placeholder institutions. Replace them with your real partners before launch.":"以下为占位院校，正式上线前将替换为实际合作伙伴。",
 "Medicine & Health":"医药与健康","Engineering":"工程","Computer Science & IT":"计算机科学与资讯科技","Business & Finance":"商业与金融","Design & Creative Arts":"设计与创意艺术",
 "Law":"法律","Science":"科学","Hospitality & Tourism":"酒店与旅游","Communication & Media":"传播与媒体",
 "On-campus hostel.":"校内宿舍。","Partner hostel, 10 minutes by shuttle.":"合作宿舍，搭乘接驳车约 10 分钟。","No hostel. Eduplan helps you find a rented room nearby.":"无宿舍，Eduplan 协助你在附近租房。",
 "Where you will stay":"你的住宿安排","Hostel options at each institution. Monthly rent is a placeholder figure.":"各院校的宿舍选择。月租为示范数字。",
 "per month, shared room":"每月，共享房间","Rental help":"租房协助","no hostel on campus":"校内没有宿舍","Need help choosing a hostel?":"需要帮忙选择宿舍吗？",
 /* Faculty flow */
 "Choose a faculty":"选择科系","Pick the field you are interested in to see its courses.":"选择你感兴趣的领域，查看相关课程。","See universities":"查看大学",
 "Universities offering this course":"开办此课程的大学","The university list for this course is being prepared. A counsellor can tell you which universities offer it.":"此课程的大学名单正在整理中，升学顾问可以告诉你哪些大学开办这个课程。",
 "Programme page":"课程网页","Tuition fee (whole programme)":"学费（整个课程）","Intakes":"开课月份","Entry (SPM)":"入学条件（SPM）","Entry (other)":"入学条件（其他）","English":"英文要求","Application deadline":"截止日期","Notes":"备注",
 "Interest-based":"兴趣导向","Courses":"课程",
 "Choose a university to see its programmes by level: foundation, undergraduate and postgraduate.":"选择大学，按阶段查看课程：预科、本科与研究生。",
 "View university":"查看大学","The university list is being prepared.":"大学名单正在整理中。","Website":"官网","Admissions email":"招生电邮","Admissions phone":"招生电话",
 "Choose a study level":"选择升学阶段","View programmes":"查看课程","Programmes":"课程","Professional Certificate":"专业证书",
 "Certificate / Diploma / Bachelor's Degree":"证书／文凭／学士学位","Master's Degree / PhD / Professional Certificate":"硕士学位／博士／专业证书",
 "Location":"地点","To be confirmed":"待确认","Entry requirements":"入学条件","Not listed by the institution":"院校未列出","Others":"其他",
 "Scholarships you can apply for":"可申请的奖学金","No campus scholarship listed for this level yet.":"此阶段暂未列出大学奖学金。",
 "Other scholarships open to all students":"其他开放给所有学生的奖学金",
 "Pre-university (Foundation / Matriculation / Form 6 / A-Level)":"大学先修（预科／大学先修班／中六／A-Level）","Certificate":"证书",
 "Bachelor's Degree":"学士学位","Master's Degree":"硕士学位","PhD":"博士","Full-time":"全日制","Part-time":"兼读制",
 /* Scholarship flow */
 "Scholarship-based":"奖学金导向","Scholarship type":"奖学金类别","Scholarship":"奖学金","Requirements":"申请条件","University":"院校","Scholarship details":"奖学金详情","Choose a scholarship":"选择奖学金","Details":"详情",
 "Choose a scholarship type":"选择奖学金类别","Scholarships come from two places. Pick one to continue.":"奖学金有两种来源，请选择其中一种继续。",
 "Foundation Scholarship":"基金会奖学金","Campus Scholarship":"大学奖学金",
 "Scholarships and financial aid from foundations and funds":"由基金会及基金提供的奖学金与助学金","Scholarships offered by colleges / universities":"由学院／大学提供的奖学金",
 "Continue":"继续","Choose a foundation scholarship":"选择基金会奖学金","View requirements":"查看申请条件","No foundation scholarships listed yet.":"暂未列出基金会奖学金。",
 "Want help applying?":"需要申请协助吗？","Choose a university":"选择大学","View scholarship details":"查看奖学金详情","No universities listed yet.":"暂未列出大学。",
 "Kampar Campus and Sungai Long Campus. Scholarships for Foundation and Undergraduate programmes, automatically offered on SPM, O-Level, UEC, STPM or A-Level results.":"金宝校区与双溪龙校区。预科与学士课程奖学金，依据 SPM、O-Level、UEC、STPM 或 A-Level 成绩自动颁发。",
 "Private University":"私立大学","Scholarship tiers":"奖学金等级","Tuition waiver":"学费减免","Award":"奖励","Eligibility":"资格","Result":"成绩","Conditions":"条件","Applies to":"适用于",
 "Not sure which tier you reach?":"不确定自己符合哪个等级？","Find your scholarship":"查找你的奖学金","Your qualification":"你的考试资格","Study level":"升学阶段",
 "Foundation":"预科","Undergraduate":"本科","Postgraduate":"研究生","Qualification":"考试资格",
 /* Guided */
 "Not sure yet? Start here":"还不确定？从这里开始","Five short questions. There are no wrong answers.":"五道简单问题，没有错误答案。",
 "Which school subjects do you enjoy most?":"你最喜欢哪些科目？","Biology and Chemistry":"生物与化学","Maths and Physics":"数学与物理","Accounts and Economics":"会计与经济","Art and Design":"美术与设计","Languages and History":"语文与历史",
 "On a free weekend, what would you rather do?":"空闲的周末，你比较想做什么？","Fix or build something":"修理或动手做东西","Make a video or a poster":"制作视频或海报","Help out at a clinic or care home":"到诊所或护理院帮忙","Run a small stall or sell something":"摆摊或卖东西","Solve puzzles or write code":"解谜题或写程序",
 "How do you like to work?":"你喜欢怎样的工作方式？","With people, face to face":"面对面与人接触","With data and numbers":"处理数据与数字","With my hands and tools":"动手操作工具","With words and arguments":"运用文字与论述",
 "What matters most to you in a future job?":"未来的工作中，你最重视什么？","A stable income":"稳定的收入","Helping other people":"帮助他人","Being creative":"发挥创意","Solving hard problems":"解决困难问题",
 "How long are you ready to study before you start working?":"在开始工作前，你愿意读书多久？","About 2 years":"大约 2 年","3 to 4 years":"3 至 4 年","5 years or more":"5 年或以上","I am not sure yet":"我还不确定",
 "See my result":"查看我的结果","You answered all five questions.":"你已回答全部五道题。","Fields that suit your answers":"适合你的领域","Courses to look at first":"优先了解的课程",
 "This is a starting point, not a final answer. The next step is a conversation with a counsellor.":"这只是起点，不是最终答案。下一步是与升学顾问谈一谈。",
 "Book my free consultation":"预约我的免费咨询","Start again":"重新开始","Degree":"学位","Diploma":"文凭",
 /* Consultation */
 "Book a free consultation":"预约免费咨询","Tell us a little about yourself. It takes about a minute.":"简单介绍一下你自己，大约一分钟。",
 "Full name":"全名","Phone or WhatsApp number":"电话或 WhatsApp 号码","Example: 012-345 6789":"例如：012-345 6789","Email":"电邮","(optional)":"（选填）",
 "Latest qualification":"最新学历","Foundation or Matriculation":"预科或大学先修班","Other":"其他",
 "What do you want to talk about?":"你想咨询什么？","Choosing a course":"选择课程","Choosing a university":"选择大学","I am not sure what to study":"我不确定要读什么",
 "Anything else we should know?":"还有什么想让我们知道的吗？","Prepare my request":"准备我的申请",
 "Enter your full name.":"请输入全名。","Enter a phone number with 9 to 13 digits, for example 012-345 6789.":"请输入 9 至 13 位数的电话号码，例如 012-345 6789。",
 "Enter an email like name@example.com, or leave it empty.":"请输入电邮，例如 name@example.com，或留空。",
 "Your request is ready to send":"你的咨询申请已准备好","Copy the summary and send it to Eduplan by WhatsApp or email. A counsellor replies to arrange a time.":"复制以下摘要，通过 WhatsApp 或电邮发送给 Eduplan，升学顾问会回复你安排时间。",
 "Copy summary":"复制摘要","Edit my answers":"修改我的答案",
 "Copied. Paste it into WhatsApp or an email to Eduplan.":"已复制。请粘贴到 WhatsApp 或电邮发送给 Eduplan。",
 "The summary is selected. Press Ctrl+C (or long-press on a phone) to copy it.":"摘要已选取。请按 Ctrl+C 复制（手机请长按）。"
};
var LEVEL={Foundation:"预科",Undergraduate:"本科",Postgraduate:"研究生"};
var ZH_PATTERNS=[
 [/^Page (\d): (.+)$/,function(m){return "第 "+m[1]+" 页："+tr(m[2]);}],
 [/^(\d+) courses?$/,"$1 门课程"],
 [/^(\d+) scholarships?$/,"$1 项奖学金"],
 [/^(\d+) universit(?:y|ies)$/,"$1 所大学"],
 [/^Scholarships \((\d+)\)$/,"奖学金（$1）"],
 [/^(.+) \u00b7 (Foundation|Undergraduate|Postgraduate)$/,function(m){return m[1]+" · "+LEVEL[m[2]];}],
 [/^No (foundation|undergraduate|postgraduate) programmes listed for (.+) yet\.$/,function(m){return m[2]+" 暂未列出"+LEVEL[m[1].charAt(0).toUpperCase()+m[1].slice(1)]+"课程。";}],
 [/^(.+) \u00b7 (\d+)$/,function(m){var z=tr(m[1]);return (z||m[1])+" · "+m[2];}],
 [/^(\d+) programmes?$/,"$1 个课程"],
 [/^Up to (\d+)% tuition waiver$/,"最高 $1% 学费减免"],
 [/^Faculty (\d\d)$/,"科系 $1"],
 [/^Faculty (\d\d) · (.+)$/,"科系 $1 · $2"],
 [/^(.+)\. Choose a course to see which universities offer it\.$/,"$1。选择课程，查看开办该课程的大学。"],
 [/^(.+)\. Tap a scholarship to see its requirements\.$/,function(m){return tr(m[1])+"。点选奖学金查看申请条件。";}],
 [/^(.+)\. Tap a university to see its scholarship details\.$/,function(m){return tr(m[1])+"。点选大学查看奖学金详情。";}],
 [/^Question (\d) of (\d)$/,"第 $1 题，共 $2 题"],
 [/^(SPM|O-Level|UEC|STPM|A-Level) result$/,"$1 成绩"],
 [/^(.+) holders start a degree after Foundation, Matriculation or Diploma\. At undergraduate level the scholarship is based on that result\.$/,"$1 考生须先完成预科、大学先修班或文凭课程才能攻读学位，学士阶段的奖学金以该成绩为准。"],
 [/^See Foundation level for (.+)$/,"查看 $1 的预科阶段"],
 [/^(.+)’s scholarship table lists no (Foundation|Undergraduate) programme award for (.+)\.$/,function(m){return m[1]+" 的奖学金表格没有列出 "+m[3]+" 的"+LEVEL[m[2]]+"课程奖学金。";}],
 [/^See (Foundation|Undergraduate) level$/,function(m){return "查看"+LEVEL[m[1]]+"阶段";}],
 [/^Offered at (.+)\.$/,"开办院校：$1。"],
 [/^(\d+(?:\.\d+)?) years?$/,"$1 年"],
 [/^(.+?)\. (On-campus hostel\.|Partner hostel, 10 minutes by shuttle\.|No hostel\. Eduplan helps you find a rented room nearby\.)$/,function(m){return m[1]+"。"+tr(m[2]);}],
 [/^Phone \/ WhatsApp: (.*)$/,"电话／WhatsApp：$1"],[/^Email: (.*)$/,"电邮：$1"],[/^Address: (.*)$/,"地址：$1"],
 [/^Send to: WhatsApp (.+) or email (.+)\.$/,"发送至：WhatsApp $1 或电邮 $2。"]
];
function tr(s){
 if(Object.prototype.hasOwnProperty.call(ZH,s))return ZH[s];
 for(var i=0;i<ZH_PATTERNS.length;i++){var m=s.match(ZH_PATTERNS[i][0]);
  if(m)return typeof ZH_PATTERNS[i][1]==="function"?ZH_PATTERNS[i][1](m):s.replace(ZH_PATTERNS[i][0],ZH_PATTERNS[i][1]);}
 return null;
}

var lang="en";try{if(localStorage.getItem("eduplan-lang")==="zh")lang="zh";}catch(e){}
var EN=new WeakMap(),OUT=new WeakMap(),ATTR=["placeholder","aria-label","alt","title"],SKIP="script,style,pre,[data-notr]";
function text(n){
 var p=n.parentElement;if(!p||p.closest(SKIP))return;
 var v=n.nodeValue,src=OUT.has(n)&&OUT.get(n)===v?EN.get(n):v;   /* unchanged since we set it: start from the English */
 EN.set(n,src);
 var t=src.trim(),z=lang==="zh"&&t?tr(t):null,next=z==null?src:src.replace(t,z);
 OUT.set(n,next);if(next!==v)n.nodeValue=next;
}
function attrs(el){
 if(el.closest(SKIP))return;
 if(el.tagName==="OPTION"&&!el.hasAttribute("value"))el.setAttribute("value",el.textContent); /* keep form values in English */
 var en=EN.get(el)||{};
 ATTR.forEach(function(a){if(!el.hasAttribute(a))return;var v=el.getAttribute(a);
  if(en["o"+a]!==v)en[a]=v;var z=lang==="zh"?tr(en[a]):null,next=z==null?en[a]:z;en["o"+a]=next;if(next!==v)el.setAttribute(a,next);});
 EN.set(el,en);
}
function walk(root){
 if(root.nodeType===3){text(root);return;}
 if(root.nodeType!==1)return;
 attrs(root);
 var w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT|NodeFilter.SHOW_ELEMENT),n;
 while((n=w.nextNode())){if(n.nodeType===3)text(n);else attrs(n);}
}
function apply(){
 document.documentElement.lang=lang==="zh"?"zh-Hans":"en";
 walk(document.body);
 Array.prototype.forEach.call(document.querySelectorAll(".lang button"),function(b){b.setAttribute("aria-pressed",String(b.getAttribute("data-lang")===lang));});
}
new MutationObserver(function(ms){ms.forEach(function(m){
 if(m.type==="characterData")text(m.target);else for(var i=0;i<m.addedNodes.length;i++)walk(m.addedNodes[i]);
});}).observe(document.body,{childList:true,subtree:true,characterData:true});

/* The switch sits at the right end of the header on every page. */
var nav=document.querySelector("header.site .bar");
if(nav){
 var box=document.createElement("div");box.className="lang";box.setAttribute("role","group");box.setAttribute("aria-label","Language / 语言");box.setAttribute("data-notr","");
 box.innerHTML='<button type="button" data-lang="en" lang="en">EN</button><button type="button" data-lang="zh" lang="zh-Hans">中文</button>';
 nav.appendChild(box);
 box.addEventListener("click",function(ev){var b=ev.target.closest("button[data-lang]");if(!b||b.getAttribute("data-lang")===lang)return;
  lang=b.getAttribute("data-lang");try{localStorage.setItem("eduplan-lang",lang);}catch(e){}
  apply();});
}
apply();
})();
