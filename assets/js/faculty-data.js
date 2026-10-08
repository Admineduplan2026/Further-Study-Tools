/* Eduplan faculty data: the only place to add or change faculties, courses and universities.
   Shape: field (00-10) -> courses -> universities.
   - name and desc are shown exactly as written; desc is the Chinese note in brackets.
   - universities: list the institutions that offer the course, e.g. {name:"UTAR", note:"Kampar campus"}.
     An empty list shows "University list being prepared" on Page 4. Fill it in only with confirmed data.
   The page code reads this object as is, so new entries need no code changes. */
window.EDUPLAN_FACULTIES={
  fields:[
    {code:"00",name:"Generic programmes",zh:"通用课程",courses:[
      {id:"foundation",name:"Foundation / Asasi / Matrikulasi",desc:"预科",universities:[]},
      {id:"form-6",name:"Form 6 / Tingkatan 6",desc:"中六（STPM）",universities:[]},
      {id:"languages-centre",name:"Centre for Languages / Pusat Bahasa",desc:"语言中心",universities:[]},
      {id:"general-studies",name:"General Studies / Pengajian Umum",desc:"通识课程",universities:[]}
    ]},
    {code:"01",name:"Education",zh:"教育",courses:[
      {id:"education",name:"Faculty of Education / Fakulti Pendidikan",desc:"教育学院：TESL、数理教育、特殊教育",universities:[]},
      {id:"early-childhood",name:"Early Childhood Education",desc:"幼儿教育",universities:[]},
      {id:"sports-science",name:"Sports Science & Physical Education / Sains Sukan",desc:"运动科学",universities:[]}
    ]},
    {code:"02",name:"Arts and humanities",zh:"艺术与人文",courses:[
      {id:"arts-social-sciences",name:"Faculty of Arts & Social Sciences / Fakulti Sastera",desc:"文学院",universities:[]},
      {id:"languages-linguistics",name:"Languages & Linguistics / Bahasa dan Linguistik",desc:"语言学，包括中文、马来文、英文",universities:[]},
      {id:"islamic-studies",name:"Islamic Studies / Pengajian Islam、Kulliyyah of Islamic Revealed Knowledge",desc:"伊斯兰研究",universities:[]},
      {id:"music-performing-arts",name:"Music, Performing Arts / Seni Persembahan",desc:"音乐与表演艺术",universities:[]},
      {id:"art-design",name:"Art & Design, Creative Arts / Seni Reka",desc:"艺术与设计：平面、室内、时尚、动画",universities:[]},
      {id:"history-philosophy",name:"History, Philosophy / Sejarah, Falsafah",desc:"历史、哲学",universities:[]}
    ]},
    {code:"03",name:"Social sciences, journalism and information",zh:"社会科学、新闻与信息",courses:[
      {id:"social-sciences",name:"Social Sciences / Sains Sosial",desc:"心理学、社会学、经济学、政治学、国际关系",universities:[]},
      {id:"communication-media",name:"Communication & Media / Komunikasi",desc:"大众传播、新闻、广告、公关",universities:[]},
      {id:"information-management",name:"Information Management / Pengurusan Maklumat",desc:"图书馆与信息管理",universities:[]}
    ]},
    {code:"04",name:"Business, administration and law",zh:"商业、管理与法律",courses:[
      {id:"business-management",name:"Business / Perniagaan、Management / Pengurusan",desc:"企业管理、市场营销、人力资源",universities:[]},
      {id:"accountancy",name:"Accountancy / Perakaunan",desc:"会计",universities:[]},
      {id:"finance-banking",name:"Finance & Banking / Kewangan",desc:"金融、银行、伊斯兰金融",universities:[]},
      {id:"law",name:"Faculty of Law / Fakulti Undang-undang",desc:"法律，包括 Syariah Law",universities:[]}
    ]},
    {code:"05",name:"Natural sciences, mathematics and statistics",zh:"自然科学、数学与统计",courses:[
      {id:"science",name:"Faculty of Science / Fakulti Sains",desc:"生物、化学、物理",universities:[]},
      {id:"biotechnology",name:"Biotechnology / Bioteknologi",desc:"生物科技",universities:[]},
      {id:"mathematics-statistics",name:"Mathematics & Statistics / Matematik",desc:"数学、统计、精算",universities:[]},
      {id:"environmental-earth",name:"Environmental & Earth Sciences / Sains Alam Sekitar",desc:"环境与地球科学",universities:[]}
    ]},
    {code:"06",name:"ICT",zh:"资讯与通讯科技",courses:[
      {id:"computer-science-it",name:"Computer Science & IT / Sains Komputer dan Teknologi Maklumat",desc:"计算机科学、软件工程、网络安全、数据科学、人工智能",universities:[]}
    ]},
    {code:"07",name:"Engineering, manufacturing and construction",zh:"工程、制造与建筑",courses:[
      {id:"engineering",name:"Faculty of Engineering / Fakulti Kejuruteraan",desc:"土木、机械、电机电子、化学工程等",universities:[]},
      {id:"architecture-built-environment",name:"Architecture & Built Environment / Alam Bina",desc:"建筑、工料测量、城市规划、房地产",universities:[]},
      {id:"manufacturing-technology",name:"Manufacturing Technology / Teknologi Kejuruteraan",desc:"工程技术，常见于 TVET 和理工学院",universities:[]}
    ]},
    {code:"08",name:"Agriculture, forestry, fisheries and veterinary",zh:"农业、林业、渔业与兽医",courses:[
      {id:"agriculture",name:"Faculty of Agriculture / Fakulti Pertanian",desc:"农业、园艺",universities:[]},
      {id:"forestry",name:"Forestry / Perhutanan",desc:"林业",universities:[]},
      {id:"fisheries-aquaculture",name:"Fisheries & Aquaculture / Perikanan",desc:"渔业与水产",universities:[]},
      {id:"veterinary",name:"Veterinary Medicine / Perubatan Veterinar",desc:"兽医",universities:[]}
    ]},
    {code:"09",name:"Health and welfare",zh:"医疗与福利",courses:[
      {id:"medicine",name:"Faculty of Medicine / Fakulti Perubatan",desc:"医学 MBBS / MD",universities:[]},
      {id:"dentistry",name:"Dentistry / Pergigian",desc:"牙医",universities:[]},
      {id:"pharmacy",name:"Pharmacy / Farmasi",desc:"药剂",universities:[]},
      {id:"nursing",name:"Nursing / Kejururawatan",desc:"护理",universities:[]},
      {id:"health-sciences",name:"Health Sciences / Sains Kesihatan",desc:"物理治疗、营养、医疗检验、放射、职业治疗",universities:[]},
      {id:"traditional-medicine",name:"Traditional & Complementary Medicine",desc:"中医等传统医学",universities:[]},
      {id:"social-work",name:"Social Work / Kerja Sosial",desc:"社会工作",universities:[]}
    ]},
    {code:"10",name:"Services",zh:"服务业",courses:[
      {id:"hospitality-tourism",name:"Hospitality & Tourism / Hospitaliti dan Pelancongan",desc:"酒店管理、旅游、活动管理",universities:[]},
      {id:"culinary-arts",name:"Culinary Arts / Seni Kulinari",desc:"烹饪艺术",universities:[]},
      {id:"sports-management",name:"Sports Management",desc:"运动管理",universities:[]},
      {id:"transport-logistics",name:"Transport & Logistics / Logistik",desc:"物流、航空、航海",universities:[]},
      {id:"occupational-safety-health",name:"Occupational Safety & Health / Keselamatan dan Kesihatan Pekerjaan",desc:"职业安全与卫生",universities:[]}
    ]}
  ]
};
