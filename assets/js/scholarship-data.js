/* Eduplan scholarship data: the only place to add or change scholarships.
   Shape: type -> scholarships (with requirements) or universities (with tuition waiver tiers).
   - kind "requirements": each item is one option (A, B, C...). Set name and requirements to null
     for a slot that is still to be added; it is shown as "coming soon" and cannot be selected.
   - kind "waiver": each university lists its tiers; waiver is the % of tuition fees waived (or amount in RM).
     Optional per tier: scheme (scholarship name; tiers with the same scheme share one table), applies,
     conditions (list), deadline, url. Tiers whose applies starts with "Foundation" or "Undergraduate"
     also need qual (e.g. "SPM", "UEC") and min (the result); the page then shows qualification and level buttons.
     Optional per university: fullName, type, description (shown on the university list),
     website (Official website button) and lastUpdated (YYYY-MM-DD). Leave out what is not confirmed.
   The page code reads this object as is, so new entries need no code changes. */
(function(){
  /* UTAR Scholarship for Top Achievers, from UTAR's "Scholarship Opportunities @ UTAR" table (1.1, 1.2, 1.3). */
  function ta(applies,qual,min,waiver,extra){
    var c=["No application required, the scholarship shall be awarded automatically to applicants who meet the prescribed eligibility criteria.",
           "The award is based on actual examination results in a single-sitting.",
           "Criteria, terms and conditions are subject to change without prior notice."];
    if(applies===FP)c.push("Maintenance of CGPA is required for every trimester.");
    return {scheme:"UTAR Scholarship for Top Achievers",applies:applies,qual:qual,min:min,result:qual+" "+min,waiver:waiver,conditions:c.concat(extra||[]),url:U};
  }
  var FP="Foundation Programmes",UG="Undergraduate Programmes",
      MED="Undergraduate Programmes Offered by M. Kandiah Faculty of Medicine and Health Sciences (Chinese Medicine, M.B.B.S., Nursing and Physiotherapy)",
      SP="Straight passes in all courses.",EX="Except M.B.B.S.",MO="M.B.B.S. only",
      LIM="Limit to three (3) scholarships per year, and the combined monthly income of the applicant/applicant's spouse/applicant's parents should not exceed RM5,000.";
  var U="https://study.utar.edu.my/financial-aid-SPM-O-Level-student.php"; /* UTAR financial aid page; C-G and the alumni grant are from the "Financing Your Foundation Studies (October 2026 Intake)" poster, 26 October 2025 */
window.EDUPLAN_SCHOLARSHIPS={
  types:[
    {id:"foundation",label:"Foundation Scholarship",desc:"Scholarships and financial aid from foundations and funds",kind:"requirements",
     items:[
       {id:"A",name:"Tan Sri YB 李荣盛奖励金",requirements:["Trilingual","Grade A in SPM Bahasa Melayu","Grade A in SPM Bahasa Inggeris","Grade A in SPM Bahasa Cina"]},
       {id:"B",name:"卓越教育基金会",requirements:["Grade A in SPM Bahasa Cina"]},
       {id:"C",name:"UTAR Care Scholarship",organiser:"Universiti Tunku Abdul Rahman (UTAR)",requirements:["Requirements are not stated on the UTAR financing poster (terms and conditions apply). Please check UTAR's official website."],url:U,lastUpdated:"2025-10-26"},
       {id:"D",name:"UTAR Sports Scholarship",organiser:"Universiti Tunku Abdul Rahman (UTAR)",requirements:["Requirements are not stated on the UTAR financing poster (terms and conditions apply). Please check UTAR's official website."],url:U,lastUpdated:"2025-10-26"},
       {id:"E",name:"UTAR Talent Scholarship",organiser:"Universiti Tunku Abdul Rahman (UTAR)",requirements:["Requirements are not stated on the UTAR financing poster (terms and conditions apply). Please check UTAR's official website."],url:U,lastUpdated:"2025-10-26"},
       {id:"F",name:"Tan Sri (Dr) Lim Goh Tong-UTAR Scholarship Fund",organiser:"Universiti Tunku Abdul Rahman (UTAR)",requirements:["Requirements are not stated on the UTAR financing poster (terms and conditions apply). Please check UTAR's official website."],url:U,lastUpdated:"2025-10-26"},
       {id:"G",name:"UTAR Relief Financial Aid",organiser:"Universiti Tunku Abdul Rahman (UTAR)",requirements:["Requirements are not stated on the UTAR financing poster (terms and conditions apply). Please check UTAR's official website."],url:U,lastUpdated:"2025-10-26"}
     ]},
    {id:"campus",label:"Campus Scholarship",desc:"Scholarships offered by colleges / universities",kind:"waiver",
     universities:[
       {id:"tarumt",name:"TARUMT",fullName:"Tunku Abdul Rahman University of Management and Technology",type:"Private University",
        tiers:[{result:"SPM 7A",waiver:25},{result:"SPM 8A",waiver:50},{result:"SPM 8A+",waiver:100}]},
       {id:"utar",name:"UTAR",fullName:"Universiti Tunku Abdul Rahman",type:"Private University",place:"Kampar, Sungai Long",
        description:"Kampar Campus and Sungai Long Campus. Scholarships for Foundation and Undergraduate programmes, automatically offered on SPM, O-Level, UEC, STPM or A-Level results.",
        website:"https://study.utar.edu.my",lastUpdated:"2025-10-26",
        tiers:[
         ta(FP,"SPM","8As (A+ and A only)",100),
         ta(FP,"SPM","8As",50),
         ta(FP,"SPM","7As",25),
         ta(FP,"SPM","6As",20),
         ta(FP,"SPM","5As",15),
         ta(FP,"O-Level","8As",100),
         ta(FP,"O-Level","7As",50),
         ta(FP,"O-Level","6As",25),
         ta(FP,"O-Level","5As",20),
         ta(FP,"O-Level","4As",15),
         ta(UG,"STPM","3As",100),
         ta(UG,"STPM","2As",50),
         ta(UG,"STPM","1As",25),
         ta(UG,"A-Level","3As",100),
         ta(UG,"A-Level","2As",50),
         ta(UG,"A-Level","1As",25),
         ta(UG,"UEC","8As",100),
         ta(UG,"UEC","7As",50),
         ta(UG,"UEC","6As",25),
         ta(UG,"UEC","5As",20),
         ta(UG,"UEC","4As",10),
         ta(UG,"Foundation","Foundation/Matriculation/Diploma: ≥CGPA 3.9000",100,[SP]),
         ta(UG,"Foundation","Foundation/Matriculation/Diploma: CGPA 3.8000-3.8999",50,[SP]),
         ta(MED,"STPM","3As",50,[EX]),
         ta(MED,"STPM","2As",25,[EX]),
         ta(MED,"STPM","4As/average grade point of 4.0000 over 4 subjects",15,[MO,LIM]),
         ta(MED,"A-Level","3As",50,[EX]),
         ta(MED,"A-Level","2As",25,[EX]),
         ta(MED,"A-Level","4As/average grade point of 4.0000 over 4 subjects",15,[MO,LIM]),
         ta(MED,"UEC","8As",50,[EX]),
         ta(MED,"UEC","7As",25,[EX]),
         ta(MED,"UEC","8As",15,[MO,LIM]),
         ta(MED,"Foundation","UTAR Foundation: ≥CGPA 3.9000",50,[EX,SP]),
         ta(MED,"Foundation","UTAR Foundation: CGPA 3.8000-3.8999",25,[EX,SP]),
         ta(MED,"Foundation","UTAR Foundation: ≥CGPA 3.9500",15,[MO,LIM,SP]),
         {scheme:"Study Grant for Sibling / Parent Alumni",result:"Sibling / Parent Alumni",amount:1000,conditions:["Terms and conditions apply."],url:U}
        ]}
     ]}
  ]
};
})();
