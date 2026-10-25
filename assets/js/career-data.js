/* Eduplan career guide: common careers for each course (course_id from faculty-data.js) and the usual next study step
   for each level. General guidance written by Eduplan, shown only where the institution has not listed its own career
   prospects, and always labelled as a general guide. Each entry is [English, Chinese]. Load after lab-zh.js and before
   app.js: the Chinese text is added to the translations here. */
window.EDUPLAN_CAREERS={
 careers:{
  "foundation":[["Leads to a degree in your chosen field","升读所选领域的学士学位"]],
  "form-6":[["Leads to a degree at a public or private university","升读公立或私立大学的学士学位"]],
  "languages-centre":[["Prepares you for study in that language","为以该语言修读的课程做准备"]],
  "general-studies":[["Builds a base for any degree","为任何学士课程打好基础"]],
  "education":[["Teacher","教师"],["Education officer","教育官"],["Curriculum developer","课程开发员"],["Tutor or trainer","导师或培训师"],["School counsellor","学校辅导员"],["Education consultant","教育顾问"]],
  "early-childhood":[["Preschool teacher","幼儿园教师"],["Kindergarten owner or manager","幼儿园负责人或经理"],["Childcare centre supervisor","托儿中心主管"],["Early intervention assistant","早期干预助理"],["Children's programme designer","儿童课程设计师"]],
  "sports-science":[["Fitness coach or personal trainer","健身教练或私人教练"],["Physical education teacher","体育老师"],["Sports scientist","运动科学家"],["Strength and conditioning coach","体能教练"],["Sports performance analyst","运动表现分析师"]],
  "arts-social-sciences":[["Researcher","研究员"],["Writer or editor","作家或编辑"],["Public relations officer","公关专员"],["Civil servant","公务员"],["Human resources executive","人力资源专员"],["Teacher","教师"]],
  "languages-linguistics":[["Translator or interpreter","翻译员或口译员"],["Language teacher","语言教师"],["Editor or proofreader","编辑或校对员"],["Content writer","文案撰稿人"],["Localisation specialist","本地化专员"]],
  "islamic-studies":[["Religious teacher (ustaz / ustazah)","宗教老师（ustaz / ustazah）"],["Religious affairs officer","宗教事务官"],["Islamic finance or shariah officer","伊斯兰金融或伊斯兰法务专员"],["Researcher","研究员"],["Counsellor","辅导员"]],
  "music-performing-arts":[["Musician or performer","音乐家或表演者"],["Music teacher","音乐老师"],["Composer or producer","作曲家或制作人"],["Stage or event manager","舞台或活动经理"],["Arts administrator","艺术行政人员"]],
  "art-design":[["Graphic designer","平面设计师"],["Illustrator or animator","插画师或动画师"],["UI/UX designer","UI/UX 设计师"],["Art director","艺术总监"],["Interior or product designer","室内或产品设计师"],["Content creator","内容创作者"]],
  "history-philosophy":[["Researcher","研究员"],["Museum or archive officer","博物馆或档案馆专员"],["Writer or journalist","作家或记者"],["Teacher","教师"],["Policy analyst","政策分析员"]],
  "social-sciences":[["Social researcher","社会研究员"],["Policy analyst","政策分析员"],["Human resources executive","人力资源专员"],["Counsellor or psychologist (with further training)","辅导员或心理学家（需进修）"],["Civil servant","公务员"],["NGO officer","非政府组织专员"]],
  "communication-media":[["Journalist or reporter","记者"],["Public relations officer","公关专员"],["Digital marketing executive","数码营销专员"],["Content creator or video producer","内容创作者或视频制作人"],["Broadcaster","广播主持人"],["Copywriter","广告文案"]],
  "information-management":[["Records or information manager","档案或资讯管理员"],["Librarian","图书馆员"],["Data or knowledge management executive","数据或知识管理专员"],["Archivist","档案员"],["Information systems officer","资讯系统专员"]],
  "business-management":[["Business executive or manager","企业专员或经理"],["Marketing executive","市场营销专员"],["Human resources executive","人力资源专员"],["Business analyst","商业分析师"],["Entrepreneur","企业家"],["Sales or operations manager","销售或营运经理"]],
  "accountancy":[["Accountant","会计师"],["Auditor","审计师"],["Tax consultant","税务顾问"],["Financial controller","财务总监"],["Management accountant","管理会计师"],["Forensic accountant","法证会计师"]],
  "finance-banking":[["Financial analyst","金融分析师"],["Banker or relationship manager","银行家或客户经理"],["Investment analyst","投资分析师"],["Financial planner","理财规划师"],["Risk analyst","风险分析师"],["Fintech or Islamic finance executive","金融科技或伊斯兰金融专员"]],
  "law":[["Lawyer (advocate and solicitor)","律师"],["Legal advisor","法律顾问"],["Corporate or compliance officer","企业法务或合规专员"],["Judicial or legal officer","司法或法律官员"],["Company secretary","公司秘书"]],
  "science":[["Laboratory scientist","实验室科学家"],["Research assistant","研究助理"],["Quality control officer","质量控制专员"],["Science teacher","科学老师"],["Product or technical specialist","产品或技术专员"]],
  "biotechnology":[["Biotechnologist","生物科技专员"],["Laboratory researcher","实验室研究员"],["Quality assurance officer","质量保证专员"],["Clinical research associate","临床研究专员"],["Bioprocess or food technologist","生物工艺或食品技术员"]],
  "mathematics-statistics":[["Data analyst or data scientist","数据分析师或数据科学家"],["Actuary (with professional exams)","精算师（需考取专业资格）"],["Statistician","统计师"],["Financial or risk analyst","金融或风险分析师"],["Mathematics teacher","数学老师"]],
  "environmental-earth":[["Environmental officer or consultant","环境专员或顾问"],["Geologist","地质学家"],["Sustainability executive","可持续发展专员"],["Environmental impact assessor","环境影响评估员"],["Conservation officer","自然保育专员"]],
  "computer-science-it":[["Software developer","软件开发员"],["Data scientist or analyst","数据科学家或分析师"],["Cyber security analyst","网络安全分析师"],["Systems or network engineer","系统或网络工程师"],["Cloud engineer","云端工程师"],["UI/UX designer","UI/UX 设计师"]],
  "engineering":[["Engineer (civil, mechanical, electrical, chemical and more)","工程师（土木、机械、电机、化工等）"],["Project engineer","项目工程师"],["Design engineer","设计工程师"],["Maintenance or plant engineer","维修或厂房工程师"],["Consultant engineer","顾问工程师"]],
  "architecture-built-environment":[["Architect","建筑师"],["Quantity surveyor","工料测量师"],["Interior designer","室内设计师"],["Town planner","城市规划师"],["Construction or property manager","建筑或产业经理"],["Building surveyor","建筑测量师"]],
  "manufacturing-technology":[["Engineering technologist","工程技术专员"],["Production or process supervisor","生产或工艺主管"],["Quality engineer","质量工程师"],["Automation technician","自动化技术员"],["Maintenance technologist","维修技术专员"]],
  "agriculture":[["Agronomist","农艺师"],["Plantation executive","种植园专员"],["Agricultural officer","农业官员"],["Agribusiness executive","农业企业专员"],["Food production supervisor","食品生产主管"]],
  "forestry":[["Forest officer","林务官"],["Conservation officer","自然保育专员"],["Timber or wood technologist","木材技术员"],["Environmental consultant","环境顾问"]],
  "fisheries-aquaculture":[["Aquaculture officer","水产养殖专员"],["Fisheries officer","渔业官员"],["Marine researcher","海洋研究员"],["Hatchery manager","孵化场经理"]],
  "veterinary":[["Veterinarian","兽医"],["Veterinary officer","兽医官"],["Animal health researcher","动物健康研究员"],["Livestock or pet industry advisor","畜牧或宠物业顾问"]],
  "medicine":[["Medical doctor","医生"],["Specialist (after postgraduate training)","专科医生（需深造）"],["Medical researcher","医学研究员"],["Public health officer","公共卫生官员"]],
  "dentistry":[["Dentist","牙医"],["Dental specialist (after postgraduate training)","牙科专科医生（需深造）"],["Dental officer","牙科官员"],["Dental researcher","牙科研究员"]],
  "pharmacy":[["Pharmacist (hospital or community)","药剂师（医院或社区）"],["Clinical pharmacist","临床药剂师"],["Pharmaceutical industry executive","制药业专员"],["Regulatory affairs officer","药品法规专员"],["Drug researcher","药物研究员"]],
  "nursing":[["Registered nurse","注册护士"],["Specialist or clinical nurse","专科或临床护士"],["Nurse educator","护理教育者"],["Community health nurse","社区护士"],["Nursing manager","护理经理"]],
  "health-sciences":[["Physiotherapist","物理治疗师"],["Medical laboratory technologist","医学检验技术员"],["Nutritionist or dietitian","营养师"],["Radiographer","放射技师"],["Occupational therapist","职能治疗师"],["Optometrist","验光师"]],
  "traditional-medicine":[["Traditional Chinese medicine practitioner","中医师"],["Acupuncturist","针灸师"],["Herbal product specialist","草药产品专员"],["Wellness centre practitioner","养生中心治疗师"]],
  "social-work":[["Social worker","社工"],["Welfare officer","福利官员"],["Community development officer","社区发展专员"],["NGO programme officer","非政府组织项目专员"],["Counsellor","辅导员"]],
  "hospitality-tourism":[["Hotel manager or executive","酒店经理或专员"],["Event planner","活动策划"],["Tour or travel consultant","旅游顾问"],["Front office manager","前台经理"],["Tourism officer","旅游局官员"]],
  "culinary-arts":[["Chef","厨师"],["Pastry chef","糕点师"],["Restaurant or kitchen manager","餐厅或厨房经理"],["Food entrepreneur","餐饮创业者"],["Food stylist or product developer","食品造型师或产品开发员"]],
  "sports-management":[["Sports manager or administrator","体育经理或行政人员"],["Sports event manager","体育活动经理"],["Sports marketing executive","体育营销专员"],["Club or facility manager","俱乐部或场馆经理"]],
  "transport-logistics":[["Logistics executive or manager","物流专员或经理"],["Supply chain analyst","供应链分析师"],["Procurement executive","采购专员"],["Warehouse or operations manager","仓库或营运经理"],["Shipping or freight forwarding executive","船务或货运代理专员"]],
  "occupational-safety-health":[["Safety and health officer","安全与卫生官员"],["Environmental, health and safety (EHS) executive","环境、健康与安全（EHS）专员"],["Safety consultant","安全顾问"],["Risk or compliance officer","风险或合规专员"]]
 },
 /* Professional steps after the degree that are well known in Malaysia, for some courses. */
 pro:{
  "accountancy":["Professional qualifications such as ACCA, CIMA or MICPA, then membership of the Malaysian Institute of Accountants (MIA)","考取 ACCA、CIMA 或 MICPA 等专业资格，再成为马来西亚会计师公会（MIA）会员"],
  "finance-banking":["Professional qualifications such as CFA, FRM or a licensed financial planner certificate","考取 CFA、FRM 或持牌理财规划师等专业资格"],
  "law":["To practise as a lawyer in Malaysia: pupillage (chambering) and admission to the Malaysian Bar","要在马来西亚执业当律师：完成实习（chambering）并获准加入马来西亚律师公会"],
  "engineering":["Graduate engineer registration with the Board of Engineers Malaysia (BEM), then Professional Engineer after work experience","向马来西亚工程师局（BEM）注册为毕业工程师，累积工作经验后成为专业工程师"],
  "architecture-built-environment":["Architects: LAM Part I, II and III for registration with the Board of Architects Malaysia","建筑师：完成 LAM 第一、二、三阶段，向马来西亚建筑师局注册"],
  "medicine":["Housemanship, then full registration with the Malaysian Medical Council (MMC)","完成实习医生（housemanship），再向马来西亚医药理事会（MMC）正式注册"],
  "dentistry":["Registration with the Malaysian Dental Council, then compulsory service","向马来西亚牙医理事会注册，然后履行强制服务"],
  "pharmacy":["Provisionally registered pharmacist training, then registration with the Pharmacy Board Malaysia","完成预注册药剂师培训，再向马来西亚药剂局注册"],
  "nursing":["Registration with the Malaysia Nursing Board","向马来西亚护理局注册"],
  "education":["Teaching in government schools: apply through the education service (SPP) after a teaching qualification","想在政府学校任教：取得教育资格后通过教育服务委员会（SPP）申请"]
 },
 /* The usual next study step after each level (keys are the level names in the school sheets). */
 next:{
  "Pre-university (Foundation / Matriculation / Form 6 / A-Level)":["A bachelor's degree in a related field: usually 3 to 4 years (5 for medicine and dentistry)","相关领域的学士学位：一般 3 至 4 年（医科和牙科 5 年）"],
  "Certificate":["A diploma in the same field, then a bachelor's degree","同领域的文凭课程，之后可升读学士学位"],
  "Diploma":["A bachelor's degree in the same field; many universities give credit for diploma subjects, so the degree can be shorter","同领域的学士学位；不少大学承认文凭科目学分，学位课程可以缩短"],
  "Bachelor's Degree":["Work, a master's degree, or professional qualifications in the field","就业、攻读硕士，或考取该领域的专业资格"],
  "Master's Degree":["A PhD, or senior and specialist roles","攻读博士，或担任高级和专业职位"],
  "PhD":["Research, lecturing or senior specialist roles","从事研究、大学讲师或高级专业职位"],
  "Professional Certificate":["Higher levels of the same professional qualification","同一专业资格的更高级别"]
 }
};
(function(C){var x=window.EDUPLAN_ZH_EXTRA=window.EDUPLAN_ZH_EXTRA||{text:{},patterns:[]};x.text=x.text||{};
 function add(p){if(p&&p[1])x.text[p[0]]=p[1];}
 Object.keys(C.careers).forEach(function(k){C.careers[k].forEach(add);});
 Object.keys(C.pro).forEach(function(k){add(C.pro[k]);});Object.keys(C.next).forEach(function(k){add(C.next[k]);});
 [["Future pathway and careers","升学路径与未来职业"],["Your next study step","下一步升学"],["Common careers","常见职业"],["Professional step","专业资格"],
  ["Careers listed by the institution","院校列出的职业"],["General guide by Eduplan: common careers for this field, not a list from the institution.","Eduplan 整理的一般指南：此领域的常见职业，并非院校提供的名单。"],
  ["(general guide)","（一般指南）"]].forEach(add);
 x.patterns=x.patterns||[];x.patterns.push([/^(\d+) careers?( \(general guide\))?$/,function(m){return m[1]+" 个职业"+(m[2]?"（一般指南）":"");}]);
})(window.EDUPLAN_CAREERS);
