/* Eduplan "Am I a good fit?" quiz (#fit), for the faculties of the programmes a student saved.
   Every faculty (same codes as faculty-data.js) has 5 questions about what studying and working in it is really like,
   and everyone answers the 2 common questions. Each option: [English, 中文, points 0-3]; 3 = a strong sign of fit.
   The options are deliberately not in points order. Points are never shown to students.
   subjects: exam subjects that matter most for the faculty (matched against the subject names in My results).
   The fit percentage (app.js fitScore) = answers 70% + those subjects' grades 30%; without results, answers only.
   Bands: 75+ strong fit, 55-74 good fit, 40-54 think it through, below 40 not the best fit. */
window.EDUPLAN_FIT={
 weights:{quiz:0.7,results:0.3},
 bands:[[75,"Strong fit","非常适合"],[55,"Good fit","适合"],[40,"Think it through","可以考虑，但要想清楚"],[0,"Not the best fit","不太适合"]],
 common:[
  {q:"Why do you want to study this?",zh:"你为什么想读这个科系？",a:[
   ["My parents or friends chose it for me","父母或朋友帮我选的",0],
   ["I enjoy the subject and want a career in it","我喜欢这个领域，也想以它为职业",3],
   ["I heard it pays well","听说薪水很高",1],
   ["I like parts of it and want to learn more","我喜欢其中一部分，想多了解",2]]},
  {q:"How would you feel studying this for 3 to 5 years, including the hardest subjects?",zh:"如果要读 3 到 5 年，包括最难的科目，你会觉得？",a:[
   ["Ready: hard work in this area does not scare me","准备好了：在这方面辛苦也不怕",3],
   ["I would probably lose interest","我可能会失去兴趣",0],
   ["Fine, as long as I get support","只要有人辅导，没问题",2],
   ["Worried, but I would try","有点担心，但会尝试",1]]}
 ],
 fields:{
  "01":{subjects:/Bahasa Melayu|Malay|English|History|Sejarah|Moral|Islamic/i,questions:[
   {q:"A younger student keeps getting the same question wrong. What do you do?",zh:"一个学弟妹同一题一直做错，你会怎么做？",a:[
    ["Give them the answer so we can move on","直接给答案，继续下一题",0],["Explain it a different way until they get it","换个方法解释，直到他明白",3],["Ask someone else to help them","请别人帮他",1],["Show them once more, the same way","用同样的方法再教一次",2]]},
   {q:"How do you feel about speaking in front of a class every day?",zh:"每天要在全班面前讲话，你觉得？",a:[
    ["I enjoy it","我喜欢",3],["I avoid it whenever I can","能避就避",0],["Nervous, but I can do it","会紧张，但做得到",2],["Only if I have to","不得不才做",1]]},
   {q:"Teachers spend evenings marking and preparing lessons. How do you feel about that?",zh:"老师晚上常要改作业、备课，你觉得？",a:[
    ["That is not for me","不适合我",0],["It is part of the job, and I don't mind","这是工作的一部分，不介意",3],["I would accept it for a while","可以接受一段时间",1],["Okay if the pay is fair","薪水合理就可以",2]]},
   {q:"Do you have patience with children or teenagers who misbehave?",zh:"面对调皮的小孩或青少年，你有耐心吗？",a:[
    ["Yes, I try to understand why","有，我会想了解原因",3],["Sometimes","有时候",2],["Not really","不太有",1],["No, it makes me angry quickly","没有，很快就生气",0]]},
   {q:"Which matters most to you in a job?",zh:"一份工作中，你最看重什么？",a:[
    ["Helping people grow","帮助别人成长",3],["A high salary","高薪",0],["Stable hours and holidays","稳定的时间和假期",2],["Working alone","独自工作",1]]}]},
  "02":{subjects:/Visual Arts|Art|Literature|Chinese|Malay|English|Bahasa|Tamil|History/i,questions:[
   {q:"How often do you create something (drawings, writing, music, videos) without being asked?",zh:"你多常主动创作（画画、写作、音乐、影片）？",a:[
    ["Rarely","很少",0],["Almost every week","几乎每周",3],["Sometimes","有时候",2],["Only for school work","只在功课需要时",1]]},
   {q:"A lecturer criticises your work in front of the class. How do you react?",zh:"讲师在全班面前批评你的作品，你会？",a:[
    ["Use it to make the next one better","用来改进下一份作品",3],["Feel hurt and stop trying","觉得受伤，不想再做",0],["Feel upset, then improve it","先难过，再改进",2],["Argue that my way is right","坚持我的做法是对的",1]]},
   {q:"Creative jobs often start with lower pay and freelance work. How do you feel about that?",zh:"创意工作起薪常较低，也常是自由职业，你觉得？",a:[
    ["Fine, I will build my portfolio","可以，我会累积作品集",3],["I need a fixed salary from day one","我从第一天就要稳定薪水",0],["Okay for a few years","几年内可以接受",2],["Not sure","不确定",1]]},
   {q:"Do you have work you could show (a portfolio, writing, recordings)?",zh:"你有作品可以展示吗（作品集、文章、录音）？",a:[
    ["Yes, quite a lot","有，不少",3],["A few pieces","有一些",2],["Not yet, but I want to start","还没有，但想开始",1],["No, and I am not interested in making one","没有，也没兴趣做",0]]},
   {q:"Which describes you best?",zh:"哪一项最像你？",a:[
    ["I like clear rules and one right answer","我喜欢清楚的规则和标准答案",0],["I notice colours, words or sounds others miss","我会注意到别人忽略的颜色、文字或声音",3],["I like ideas, but prefer practical work","我喜欢点子，但更喜欢实际的工作",1],["I enjoy expressing myself","我喜欢表达自己",2]]}]},
  "03":{subjects:/History|Sejarah|Geography|Economics|English|Bahasa Melayu|Malay|Literature|General Studies|Pengajian Am|Psychology|Sociology/i,questions:[
   {q:"How do you feel about reading long articles and reports?",zh:"阅读长篇文章和报告，你觉得？",a:[
    ["I enjoy it","我喜欢",3],["I avoid it","我会避开",0],["Fine if the topic is interesting","题目有趣就可以",2],["Only when I must","不得不才读",1]]},
   {q:"When you see a social issue in the news, what do you do?",zh:"看到新闻里的社会问题，你会？",a:[
    ["Scroll past","直接滑过",0],["Look for why it happens and different views","找原因和不同的观点",3],["Talk about it with friends","和朋友讨论",2],["Share it without reading much","没细看就转发",1]]},
   {q:"How comfortable are you interviewing strangers or asking people questions?",zh:"访问陌生人或向别人提问，你自在吗？",a:[
    ["Very","很自在",3],["Okay","还可以",2],["A bit shy","有点害羞",1],["I really dislike it","非常不喜欢",0]]},
   {q:"How good are you at writing essays and explaining your opinion?",zh:"你写文章、表达观点的能力如何？",a:[
    ["One of my strengths","是我的强项",3],["Average","普通",2],["Weak, but improving","较弱，但在进步",1],["I find it very hard","觉得很难",0]]},
   {q:"Which work sounds most interesting?",zh:"哪一种工作最吸引你？",a:[
    ["Researching how people and society work","研究人与社会如何运作",3],["Repairing machines","修理机器",0],["Reporting stories to the public","向大众报道故事",2],["Organising files and records","整理档案和记录",1]]}]},
  "04":{subjects:/Mathematics|Accounting|Perakaunan|Bookkeeping|Economics|Business|Commerce|English/i,questions:[
   {q:"How do you feel about working with numbers, budgets and money every day?",zh:"每天处理数字、预算和钱，你觉得？",a:[
    ["I dislike it","不喜欢",0],["I enjoy it","喜欢",3],["Fine","还好",2],["Only a little","一点点可以",1]]},
   {q:"Have you ever sold something, run a stall or managed money for a club?",zh:"你有没有卖过东西、摆过摊或管理过社团的钱？",a:[
    ["Yes, and I liked it","有，而且喜欢",3],["Once or twice","一两次",2],["No, but I would like to","没有，但想试",1],["No, and it does not interest me","没有，也没兴趣",0]]},
   {q:"In a group project, which role do you usually take?",zh:"小组作业时，你通常担任什么角色？",a:[
    ["The leader who plans and divides the work","负责规划和分工的领袖",3],["The one who checks the details","检查细节的人",2],["The one who does what I am told","听安排做事的人",1],["I prefer working alone","我比较喜欢独自做",0]]},
   {q:"How do you feel about rules, contracts and deadlines?",zh:"面对规则、合约和截止日期，你觉得？",a:[
    ["I keep to them carefully","我会严格遵守",3],["I often forget them","我常忘记",0],["Mostly fine","大致可以",2],["They stress me","让我有压力",1]]},
   {q:"Which future sounds best?",zh:"哪一种未来最吸引你？",a:[
    ["Running my own business or a team","经营自己的生意或带领团队",3],["Working in a lab","在实验室工作",0],["A professional job (accountant, lawyer, banker)","专业工作（会计师、律师、银行家）",3],["Something creative","创意性的工作",1]]}]},
  "05":{subjects:/Mathematics|Additional|Advanced Math|Further Math|Physics|Chemistry|Biology|Science/i,questions:[
   {q:"How do you feel about long lab sessions where experiments often fail?",zh:"实验室时间很长、实验常常失败，你觉得？",a:[
    ["I find out why and try again","找出原因再试",3],["I get frustrated quickly","很快就烦躁",0],["Okay with guidance","有人指导就可以",2],["I would rather not","宁可不要",1]]},
   {q:"How are your Mathematics and science results?",zh:"你的数学和理科成绩如何？",a:[
    ["Among my best subjects","是我最好的科目之一",3],["Average","普通",2],["Below average","低于平均",1],["My weakest subjects","是我最弱的科目",0]]},
   {q:"When something surprises you, what do you do?",zh:"遇到让你惊讶的现象，你会？",a:[
    ["Look up how it works","查清楚它的原理",3],["Forget about it","就忘了",0],["Ask someone","问别人",2],["Find it interesting for a moment","觉得有趣一下子",1]]},
   {q:"Many science careers need a master's degree or PhD. How do you feel about that?",zh:"很多理科职业需要硕士或博士学位，你觉得？",a:[
    ["Happy to study further","乐意继续深造",3],["I want to work right after my degree","学士毕业就想工作",1],["Maybe","也许",2],["No way","绝不",0]]},
   {q:"Which work sounds most interesting?",zh:"哪一种工作最吸引你？",a:[
    ["Testing ideas with data and experiments","用数据和实验验证想法",3],["Selling products","销售产品",0],["Analysing numbers to find patterns","分析数字找规律",3],["Talking to customers","跟顾客沟通",1]]}]},
  "06":{subjects:/Mathematics|Additional|Advanced Math|Further Math|Computer|ICT|Computing|Physics/i,questions:[
   {q:"Have you tried coding, building a website or making a game?",zh:"你有没有试过写程序、做网站或做游戏？",a:[
    ["Yes, and I enjoyed it","有，而且喜欢",3],["A little","一点点",2],["No, but I would like to","没有，但想试",1],["No, and it does not interest me","没有，也没兴趣",0]]},
   {q:"Your program has a bug you cannot find for hours. How do you feel?",zh:"程序有个错误，找了几个小时都找不到，你会？",a:[
    ["Determined: I want to solve it","更想把它解决",3],["I give up","放弃",0],["Annoyed, but I keep going","会烦，但继续",2],["I ask someone to fix it","请别人修",1]]},
   {q:"How do you feel about sitting at a computer most of the day?",zh:"一整天大部分时间坐在电脑前，你觉得？",a:[
    ["Fine","没问题",3],["I would hate it","会很讨厌",0],["Okay with breaks","有休息就可以",2],["Not ideal","不太理想",1]]},
   {q:"Technology changes every year. How do you feel about always learning new tools?",zh:"科技每年都在变，要不断学新工具，你觉得？",a:[
    ["I would rather learn once and be done","宁可学一次就够",0],["Exciting","很兴奋",3],["Fine","可以",2],["Tiring","很累",1]]},
   {q:"How do you solve puzzles and logic problems?",zh:"你怎么面对谜题和逻辑题？",a:[
    ["Step by step, and I enjoy it","一步步来，而且喜欢",3],["I guess","用猜的",1],["I avoid them","避开",0],["With some help","需要一点帮助",2]]}]},
  "07":{subjects:/Mathematics|Additional|Advanced Math|Further Math|Physics|Chemistry/i,questions:[
   {q:"How are your Mathematics and Physics (or Science) results?",zh:"你的数学和物理（或科学）成绩如何？",a:[
    ["Among my best subjects","是我最好的科目之一",3],["Average","普通",2],["Below average","低于平均",1],["My weakest subjects","是我最弱的科目",0]]},
   {q:"Do you like taking things apart to see how they work?",zh:"你喜欢把东西拆开看它怎么运作吗？",a:[
    ["Yes, often","喜欢，常常这样",3],["No","不喜欢",0],["Sometimes","有时候",2],["Rarely","很少",1]]},
   {q:"Engineering has heavy Mathematics in the first two years. How do you feel?",zh:"工程系头两年数学很重，你觉得？",a:[
    ["That is a problem for me","对我是个问题",0],["Ready for it","准备好了",3],["I will work hard on it","会努力应付",2],["Worried","担心",1]]},
   {q:"How do you feel about working on sites, in factories or outdoors at times?",zh:"有时要在工地、工厂或户外工作，你觉得？",a:[
    ["Fine, even interesting","可以，甚至有趣",3],["Only in an office","只想在办公室",0],["Okay sometimes","偶尔可以",2],["Rather not","宁可不要",1]]},
   {q:"Which work sounds most interesting?",zh:"哪一种工作最吸引你？",a:[
    ["Designing and building things that work","设计并建造能运作的东西",3],["Writing stories","写故事",0],["Solving technical problems","解决技术问题",3],["Organising events","策划活动",1]]}]},
  "08":{subjects:/Biology|Chemistry|Science|Mathematics|Geography|Agricultur/i,questions:[
   {q:"How do you feel about working outdoors in hot weather, mud or rain?",zh:"在炎热、泥泞或下雨的户外工作，你觉得？",a:[
    ["I enjoy it","喜欢",3],["I hate it","很讨厌",0],["Fine","还好",2],["Rather not","宁可不要",1]]},
   {q:"How do you feel around animals, including handling sick ones?",zh:"跟动物相处，包括照顾生病的动物，你觉得？",a:[
    ["Very comfortable","很自在",3],["Scared or uncomfortable","害怕或不自在",0],["Comfortable with pets","跟宠物可以",2],["Unsure","不确定",1]]},
   {q:"Are you interested in food, farming and the environment?",zh:"你对粮食、农业和环境有兴趣吗？",a:[
    ["Yes, a lot","很有兴趣",3],["Somewhat","有一点",2],["Not really","不太有",1],["Not at all","完全没有",0]]},
   {q:"How is your Biology (or Science)?",zh:"你的生物（或科学）成绩如何？",a:[
    ["Among my best subjects","是我最好的科目之一",3],["Average","普通",2],["Below average","低于平均",1],["My weakest subject","是我最弱的科目",0]]},
   {q:"Many jobs in this field are outside big cities. How do you feel about that?",zh:"这个领域很多工作不在大城市，你觉得？",a:[
    ["Happy to work there","乐意",3],["I want to stay in a big city","只想留在大城市",0],["Okay for a while","一段时间可以",2],["Not sure","不确定",1]]}]},
  "09":{subjects:/Biology|Chemistry|Physics|Mathematics|Science/i,questions:[
   {q:"How do you feel about blood, injuries or seeing people in pain?",zh:"看到血、伤口或别人痛苦，你会？",a:[
    ["I stay calm and want to help","保持冷静，想帮忙",3],["I feel faint or panic","会头晕或慌张",0],["Uneasy, but I can manage","不舒服，但撑得住",2],["I would rather not see it","宁可不要看",1]]},
   {q:"Health courses are long (5 years for medicine) with many exams to memorise. How do you feel?",zh:"医疗课程很长（医学要 5 年），而且很多考试要背，你觉得？",a:[
    ["Ready for it","准备好了",3],["Too much for me","对我太多了",0],["Hard, but worth it","很辛苦，但值得",2],["Not sure I can","不确定做得到",1]]},
   {q:"How do you feel about shift work, nights and weekends?",zh:"轮班、夜班和周末工作，你觉得？",a:[
    ["I want normal office hours","我要正常上班时间",0],["Fine, it is part of caring for people","可以，照顾病人就是这样",3],["Okay for some years","几年内可以",2],["Not ideal","不太理想",1]]},
   {q:"How are your Biology and Chemistry results?",zh:"你的生物和化学成绩如何？",a:[
    ["Among my best subjects","是我最好的科目之一",3],["Average","普通",2],["Below average","低于平均",1],["My weakest subjects","是我最弱的科目",0]]},
   {q:"A patient or client is rude to you while you are helping. What do you do?",zh:"你在帮忙时，病人或客户对你很不礼貌，你会？",a:[
    ["Stay kind and professional","保持友善和专业",3],["Walk away","走开",0],["Feel upset but keep helping","会难过，但继续帮忙",2],["Answer back","顶回去",1]]}]},
  "10":{subjects:/English|Bahasa Melayu|Malay|Chinese|Business|Commerce|Geography|Mathematics/i,questions:[
   {q:"How do you feel about serving customers and strangers every day?",zh:"每天服务顾客和陌生人，你觉得？",a:[
    ["I enjoy it","喜欢",3],["I dislike it","不喜欢",0],["Fine","还好",2],["Tiring","很累",1]]},
   {q:"Hotels, kitchens and events often work weekends and public holidays. How do you feel?",zh:"酒店、厨房和活动业常在周末和公共假期工作，你觉得？",a:[
    ["Fine","可以",3],["Not for me","不适合我",0],["Okay sometimes","偶尔可以",2],["I would miss family time","会少了家人时间",1]]},
   {q:"How do you handle being on your feet and busy for many hours?",zh:"长时间站着、很忙碌，你能应付吗？",a:[
    ["Easily, I like being active","轻松，我喜欢动",3],["Okay","还可以",2],["Hard","很辛苦",1],["I could not","做不到",0]]},
   {q:"A customer complains loudly in front of others. What do you do?",zh:"顾客当众大声投诉，你会？",a:[
    ["Stay calm and fix the problem","冷静处理问题",3],["Argue back","跟他争论",0],["Call my manager","找主管",2],["Freeze","不知所措",1]]},
   {q:"Which sounds most like you?",zh:"哪一项最像你？",a:[
    ["I like planning trips, cooking or events","我喜欢策划旅行、煮食或活动",3],["I prefer quiet, solo work","我喜欢安静、独自工作",0],["I like meeting new people","我喜欢认识新朋友",2],["I like routine work","我喜欢固定的工作",1]]}]}
 }
};
