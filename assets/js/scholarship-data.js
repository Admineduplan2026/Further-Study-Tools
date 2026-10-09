/* Eduplan scholarship data: the only place to add or change scholarships.
   Shape: type -> scholarships (with requirements) or universities (with tuition waiver tiers).
   - kind "requirements": each item is one option (A, B, C...). Set name and requirements to null
     for a slot that is still to be added; it is shown as "coming soon" and cannot be selected.
   - kind "waiver": each university lists its tiers; waiver is the % of tuition fees waived (or amount in RM).
     Optional per tier: scheme (scholarship name; tiers with the same scheme share one table), applies,
     conditions (list), deadline, url.
     Optional per university: fullName, type, description (shown on the university list),
     website (Official website button) and lastUpdated (YYYY-MM-DD). Leave out what is not confirmed.
   The page code reads this object as is, so new entries need no code changes. */
(function(){
var U="https://study.utar.edu.my/financial-aid-SPM-O-Level-student.php"; /* UTAR "Financing Your Foundation Studies (October 2026 Intake)" poster, 26 October 2025 */
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
        description:"Kampar Campus and Sungai Long Campus. Scholarships for Foundation in Arts / Science, automatically offered on SPM or O-Level results.",
        website:"https://study.utar.edu.my",lastUpdated:"2025-10-26",
        tiers:[
         {scheme:"UTAR Scholarship for Top Achievers on Tuition Fees",result:"SPM 8As (A+ & A only) / O-Level 8As",waiver:100,applies:"Foundation in Arts (FA) / Foundation in Science (FS), October 2026 intake; continues into Bachelor's Degree",conditions:["Automatically offered based on actual result in one examination sitting.","Maintenance of CGPA is required for every trimester.","Terms and conditions apply."],url:U},
         {scheme:"UTAR Scholarship for Top Achievers on Tuition Fees",result:"SPM 8As (A+, A & A-) / O-Level 7As",waiver:50,applies:"Foundation in Arts (FA) / Foundation in Science (FS), October 2026 intake; continues into Bachelor's Degree",conditions:["Automatically offered based on actual result in one examination sitting.","Maintenance of CGPA is required for every trimester.","Terms and conditions apply."],url:U},
         {scheme:"UTAR Scholarship for Top Achievers on Tuition Fees",result:"SPM 7As (A+, A & A-) / O-Level 6As",waiver:25,applies:"Foundation in Arts (FA) / Foundation in Science (FS), October 2026 intake; continues into Bachelor's Degree",conditions:["Automatically offered based on actual result in one examination sitting.","Maintenance of CGPA is required for every trimester.","Terms and conditions apply."],url:U},
         {scheme:"UTAR Scholarship for Top Achievers on Tuition Fees",result:"SPM 6As (A+, A & A-) / O-Level 5As",waiver:20,applies:"Foundation in Arts (FA) / Foundation in Science (FS), October 2026 intake; continues into Bachelor's Degree",conditions:["Automatically offered based on actual result in one examination sitting.","Maintenance of CGPA is required for every trimester.","Terms and conditions apply."],url:U},
         {scheme:"UTAR Scholarship for Top Achievers on Tuition Fees",result:"SPM 5As (A+, A & A-) / O-Level 4As",waiver:15,applies:"Foundation in Arts (FA) / Foundation in Science (FS), October 2026 intake; continues into Bachelor's Degree",conditions:["Automatically offered based on actual result in one examination sitting.","Maintenance of CGPA is required for every trimester.","Terms and conditions apply."],url:U},
         {scheme:"Study Grant for Sibling / Parent Alumni",result:"Sibling / Parent Alumni",amount:1000,conditions:["Terms and conditions apply."],url:U}
        ]}
     ]}
  ]
};
})();
