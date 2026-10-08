/* Eduplan scholarship data: the only place to add or change scholarships.
   Shape: type -> scholarships (with requirements) or universities (with tuition waiver tiers).
   - kind "requirements": each item is one option (A, B, C...). Set name and requirements to null
     for a slot that is still to be added; it is shown as "coming soon" and cannot be selected.
   - kind "waiver": each university lists its tiers; waiver is the % of tuition fees waived.
   The page code reads this object as is, so new entries need no code changes. */
window.EDUPLAN_SCHOLARSHIPS={
  types:[
    {id:"foundation",label:"Foundation Scholarship",desc:"Scholarships offered by external foundations",kind:"requirements",
     items:[
       {id:"A",name:"Tan Sri YB 李荣盛奖励金",requirements:["Trilingual","Grade A in SPM Bahasa Melayu","Grade A in SPM Bahasa Inggeris","Grade A in SPM Bahasa Cina"]},
       {id:"B",name:"卓越教育基金会",requirements:["Grade A in SPM Bahasa Cina"]},
       {id:"C",name:null,requirements:null}
     ]},
    {id:"campus",label:"Campus Scholarship",desc:"Scholarships offered by colleges / universities",kind:"waiver",
     universities:[
       {id:"tarumt",name:"TARUMT",tiers:[{result:"SPM 7A",waiver:25},{result:"SPM 8A",waiver:50},{result:"SPM 8A+",waiver:100}]},
       {id:"utar",name:"UTAR",tiers:[{result:"SPM 7A",waiver:25},{result:"SPM 8A",waiver:50},{result:"SPM 8A+",waiver:100}]}
     ]}
  ]
};
