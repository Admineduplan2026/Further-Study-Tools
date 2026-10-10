/* Eduplan interest quiz ("Not sure yet? Start here").
   12 questions, one answer each. Every option adds points to faculties 00-10 (same codes as faculty-data.js),
   e.g. {"06":3} adds 3 points to 06 ICT. The points are never shown to students.
   Question 12 carries the most weight (4 points): it is the student's own choice without money or parents
   in the picture, and is also used to check whether the earlier answers agree. To make it lighter, change its 4s to 2.
   Each option: [English, 中文, {faculty: points}]. */
window.EDUPLAN_QUIZ={
 /* Result rules (see app.js guidedScore). */
 rules:{
  closeGap:2,        /* top two within this many points: ask the tie-break question */
  tieBonus:3,        /* points added to the faculty picked in the tie-break */
  keepRatio:0.75,    /* 2nd and 3rd faculty are shown when they reach this share of the top score */
  lowTop:15,         /* top score below this: interests are still open, suggest 00 */
  spreadGap:3        /* top score within this many points of the 4th: interests are spread, suggest 00 */
 },
 questions:[
  {q:"What do you do most in your free time?",zh:"空闲时，你最常做什么？",a:[
   ["Draw, design, or edit photos and videos","画画、设计或剪辑照片和视频",{"02":3}],
   ["Read novels, write stories or learn languages","看小说、写故事或学语言",{"02":2,"01":1}],
   ["Follow the news and talk about social issues","关注新闻、讨论社会话题",{"03":3}],
   ["Play strategy games or solve puzzles","玩策略游戏或解谜题",{"06":2,"05":1}],
   ["Take things apart or build models","拆东西或组装模型",{"07":3}],
   ["Look after pets or plants","照顾宠物或植物",{"08":3}],
   ["Sell things online or plan small businesses","网上卖东西或策划小生意",{"04":3}],
   ["Cook, travel or plan outings for friends","煮东西、旅行或帮朋友安排出游",{"10":3}],
   ["Exercise or look after family members' health","运动或照顾家人的健康",{"09":2,"10":1}]]},
  {q:"Which subject do you study more without anyone pushing you?",zh:"哪一科不用人催，你也会主动多读？",a:[
   ["Biology","生物",{"09":2,"08":1}],
   ["Chemistry","化学",{"05":2,"09":1}],
   ["Physics","物理",{"07":2,"05":1}],
   ["Mathematics or Additional Mathematics","数学或高级数学",{"05":2,"06":1}],
   ["Computer science or ICT","电脑科学或资讯工艺",{"06":3}],
   ["Accounting, economics or business","会计、经济或商业",{"04":3}],
   ["Languages and literature","语文与文学",{"02":3}],
   ["History, geography or moral studies","历史、地理或道德",{"03":2,"01":1}],
   ["Art or design and technology","美术或设计与工艺",{"02":2,"07":1}],
   ["Physical education and sports","体育",{"10":2,"01":1}],
   ["Agriculture or home science","农业或家政",{"08":2,"10":1}]]},
  {q:"You have a free weekend for a project. What do you start?",zh:"周末有空做一个项目，你会做什么？",a:[
   ["Build a simple app or website","做一个简单的 App 或网站",{"06":3}],
   ["Make a short film, comic or poster","拍短片、画漫画或做海报",{"02":3}],
   ["Grow vegetables or set up an aquarium","种菜或布置鱼缸",{"08":3}],
   ["Repair a bicycle or build a robot kit","修脚车或组装机器人",{"07":3}],
   ["Run a bake sale or a small online shop","办义卖或开小网店",{"04":2,"10":1}],
   ["Organise a charity drive or community clean-up","筹办慈善活动或社区清洁",{"03":2,"09":1}],
   ["Run an experiment and record the results","做实验并记录结果",{"05":3}],
   ["Teach younger kids a subject or a skill","教弟弟妹妹功课或技能",{"01":3}]]},
  {q:"What do friends and family usually ask you to help with?",zh:"朋友和家人通常找你帮什么忙？",a:[
   ["Fixing phones or computers","修手机或电脑",{"06":3}],
   ["Homework, or explaining a topic","功课，或讲解某个课题",{"01":3}],
   ["Listening to their problems and giving advice","听他们诉苦、给建议",{"03":2,"09":1}],
   ["Planning budgets or comparing prices","规划预算或比较价钱",{"04":3}],
   ["First aid, or looking after someone who is unwell","急救或照顾生病的人",{"09":3}],
   ["Designing posters, slides or invitations","设计海报、简报或请柬",{"02":3}],
   ["Planning trips, events or meals","安排旅行、活动或餐点",{"10":3}],
   ["Fixing things around the house","修理家里的东西",{"07":3}]]},
  {q:"Which real-world problem do you most want to solve?",zh:"你最想解决哪一个现实问题？",a:[
   ["Diseases and health care","疾病与医疗",{"09":3}],
   ["Climate change and the environment","气候变化与环境",{"08":2,"05":1}],
   ["Food security and farming","粮食安全与农业",{"08":3}],
   ["Poverty and inequality","贫穷与不平等",{"03":2,"04":1}],
   ["Unequal access to education","教育资源不平均",{"01":3}],
   ["Cyber security and online scams","网络安全与网络诈骗",{"06":3}],
   ["Traffic, housing and city infrastructure","交通、住屋与城市建设",{"07":3}],
   ["Unemployment and the economy","失业与经济",{"04":3}],
   ["Keeping culture, languages and history alive","保存文化、语言与历史",{"02":3}],
   ["Unsolved questions in science","科学上还没解开的谜题",{"05":3}]]},
  {q:"What is your ideal workplace?",zh:"你理想的上班环境是哪里？",a:[
   ["A hospital or clinic","医院或诊所",{"09":3}],
   ["A school or classroom","学校或课室",{"01":3}],
   ["A laboratory","实验室",{"05":3}],
   ["A company office or a bank","公司办公室或银行",{"04":3}],
   ["A tech company, at a computer","科技公司，坐在电脑前",{"06":3}],
   ["A construction site or a factory","工地或工厂",{"07":3}],
   ["Outdoors: a farm, a forest or the sea","户外：农场、森林或海上",{"08":3}],
   ["A hotel, airport, restaurant or event venue","酒店、机场、餐厅或活动场地",{"10":3}],
   ["A studio, newsroom or museum","工作室、新闻室或博物馆",{"02":2,"03":1}]]},
  {q:"When you scroll through videos, which ones do you click?",zh:"刷视频时，你会点进去看哪一类？",a:[
   ["Science explainers and experiments","科学解说与实验",{"05":3}],
   ["Tech reviews and coding tutorials","科技评测与写程序教学",{"06":3}],
   ["Health, fitness and medical stories","健康、健身与医疗故事",{"09":2,"10":1}],
   ["Business, investing and success stories","商业、投资与成功故事",{"04":3}],
   ["Art, music, film and design","艺术、音乐、电影与设计",{"02":3}],
   ["Food, travel and lifestyle","美食、旅行与生活",{"10":3}],
   ["Animals, nature and farming","动物、大自然与农耕",{"08":3}],
   ["Engineering builds and how things work","工程制作与东西怎样运作",{"07":3}],
   ["News, society and true stories","新闻、社会与真实故事",{"03":3}],
   ["Teaching tips and study hacks","教学技巧与读书方法",{"01":3}]]},
  {q:"When something gets hard, what would you keep at the longest?",zh:"遇到难题时，哪一件事你最愿意坚持到底？",a:[
   ["Debugging a program until it works","一直修改程序直到能运作",{"06":3}],
   ["Working through a maths or physics problem","解一道数学或物理难题",{"05":2,"07":1}],
   ["Getting a design or artwork exactly right","把设计或作品做到最好",{"02":3}],
   ["Calming and helping a person in difficulty","安抚并帮助有困难的人",{"09":2,"03":1}],
   ["Explaining again until someone understands","一再讲解直到对方明白",{"01":3}],
   ["Closing a deal or reaching a sales target","谈成生意或达到销售目标",{"04":3}],
   ["Keeping plants or animals healthy","让植物或动物健康成长",{"08":3}],
   ["Building or fixing a machine","组装或修好一台机器",{"07":3}],
   ["Serving a difficult customer well","好好服务难搞的顾客",{"10":3}]]},
  {q:"When do you feel most accomplished?",zh:"什么时候你最有成就感？",a:[
   ["When someone recovers with my help","有人在我的帮助下康复",{"09":3}],
   ["When a student finally understands","学生终于听懂了",{"01":3}],
   ["When my code or app works","我写的程序或 App 成功运作",{"06":3}],
   ["When I earn my own money","我自己赚到钱",{"04":3}],
   ["When people are moved by my work","别人被我的作品打动",{"02":3}],
   ["When something I built works","我做的东西真的能用",{"07":3}],
   ["When an experiment proves my idea","实验证明了我的想法",{"05":3}],
   ["When my plants or animals do well","我照顾的植物或动物长得很好",{"08":3}],
   ["When guests leave happy","客人满意地离开",{"10":3}],
   ["When I change minds or help a community","我改变了别人的看法或帮助了社区",{"03":3}]]},
  {q:"How do you like to work?",zh:"你喜欢怎样的工作方式？",a:[
   ["On my own, at a computer","自己一个人，对着电脑",{"06":2,"05":1}],
   ["With people, face to face","面对面与人接触",{"10":2,"09":1}],
   ["Leading a team and making decisions","带领团队、做决定",{"04":3}],
   ["With my hands and tools","动手操作工具",{"07":2,"08":1}],
   ["With words: writing, speaking, debating","运用文字：写作、演讲、辩论",{"03":2,"02":1}],
   ["Guiding and coaching others","指导和培训别人",{"01":3}],
   ["Carefully, checking details and data","细心核对细节和数据",{"05":2,"04":1}]]},
  {q:"Whom do you admire most?",zh:"你最崇拜哪一种人？",a:[
   ["A doctor or nurse","医生或护士",{"09":3}],
   ["An entrepreneur","企业家",{"04":3}],
   ["A scientist","科学家",{"05":3}],
   ["A software engineer or tech founder","软件工程师或科技公司创办人",{"06":3}],
   ["An engineer or architect","工程师或建筑师",{"07":3}],
   ["A teacher","老师",{"01":3}],
   ["A writer, artist or designer","作家、艺术家或设计师",{"02":3}],
   ["A journalist or social researcher","记者或社会研究者",{"03":3}],
   ["A lawyer","律师",{"04":2,"03":1}],
   ["A chef or hotelier","厨师或酒店经营者",{"10":3}],
   ["A farmer, vet or environmentalist","农夫、兽医或环保人士",{"08":3}]]},
  {q:"If money and your parents' views did not matter, what would you study?",zh:"如果不考虑钱和父母的意见，你会选读什么？",check:true,a:[
   ["Not sure yet: I want to explore first","还不确定，想先多了解",{"00":4}],
   ["Teaching and education","教育",{"01":4}],
   ["Arts, design, languages or music","艺术、设计、语言或音乐",{"02":4}],
   ["Psychology, media or social sciences","心理学、传媒或社会科学",{"03":4}],
   ["Business, accounting, finance or law","商业、会计、金融或法律",{"04":4}],
   ["Pure science or mathematics","纯科学或数学",{"05":4}],
   ["Computing, IT or AI","电脑、资讯科技或人工智能",{"06":4}],
   ["Engineering or architecture","工程或建筑",{"07":4}],
   ["Agriculture, veterinary or the environment","农业、兽医或环境",{"08":4}],
   ["Medicine, nursing or health sciences","医药、护理或健康科学",{"09":4}],
   ["Hospitality, culinary arts, tourism or sports","酒店、烹饪、旅游或运动",{"10":4}]]}
 ]
};
