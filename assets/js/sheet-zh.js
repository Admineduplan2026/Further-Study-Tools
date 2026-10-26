/* Chinese for text that comes from the school sheets (campus scholarships): scheme names, levels, eligibility and
   the sentences under "Conditions". A line made of several known sentences is translated sentence by sentence,
   and "Label: value" eligibility (IB Diploma: 36 points and above) label and value separately.
   Load after lab-zh.js and before i18n.js. Add new sheet sentences here when a school adds them. */
(function(){
var x=window.EDUPLAN_ZH_EXTRA=window.EDUPLAN_ZH_EXTRA||{text:{},patterns:[]};x.text=x.text||{};x.patterns=x.patterns||[];
/* Whole sentences (each "Conditions" line, or one sentence of it). */
var S={
 "An official letter from a recognised sports organisation confirming national or state athlete status is required every year.":"每年须提交由认可体育机构发出、证明国家级或州级运动员身份的正式信函。",
 "Awards apply only to course fees, first-come first-served, at the discretion of the APU Scholarships & Merit Awards Committee, with actual verified results.":"奖励只适用于课程学费，先到先得，由 APU 奖学金与优异奖委员会依据经核实的实际成绩决定。",
 "Criteria, terms and conditions are subject to change without prior notice.":"标准、条款与条件可能更改，恕不另行通知。",
 "Documents: certified copies of both birth certificates and the sibling's XMUM student ID.":"所需文件：双方出生证明及兄弟姐妹 XMUM 学生证的核证副本。",
 "Documents: certified copies of parent's NRIC, teacher's ID or latest salary slip, and your birth certificate.":"所需文件：家长身份证、教师证或最新薪资单，以及你的出生证明的核证副本。",
 "Documents: certified copy of your birth certificate.":"所需文件：你的出生证明核证副本。",
 "Email scholarships@apu.edu.my.":"电邮：scholarships@apu.edu.my。",
 "Except M.B.B.S.":"M.B.B.S. 除外。",
 "For Foundation, Diploma, Certificate, Bachelor's Degree or Postgraduate programmes.":"适用于预科、文凭、证书、学士学位或研究生课程。",
 "For applicants from other institutions only.":"只限来自其他院校的申请者。",
 "For students from XMUM foundation programmes only.":"只限 XMUM 预科课程的学生。",
 "Grade A includes A+, A and A-.":"A 包括 A+、A 和 A-。",
 "Interview required.":"须参加面试。",
 "Kept each year only if you stay in the top 25% (award above 80%), 35% (above 50%), 45% (above 25%) or 70% (25% or less) of your programme and intake.":"每年须保持在同课程、同届学生的前 25%（奖学金高于 80%）、前 35%（高于 50%）、前 45%（高于 25%）或前 70%（25% 或以下），才能继续获得。",
 "Kept with CGPA 2.00 each year.":"每年 CGPA 须达 2.00 才能继续获得。",
 "Limit to three (3) scholarships per year, and the combined monthly income of the applicant/applicant's spouse/applicant's parents should not exceed RM5,000.":"每年限三（3）个名额，且申请者／申请者配偶／申请者父母的每月合计收入不超过 RM5,000。",
 "M.B.B.S. only":"只限 M.B.B.S.",
 "Maintenance of CGPA is required for every trimester.":"每个学期都须维持 CGPA。",
 "Merit Awards are awarded on a yearly basis and are renewable upon meeting minimum CGPA 2.50 at the end of each academic year.":"优异奖每年颁发一次，每学年结束时 CGPA 达到 2.50 或以上即可续领。",
 "No application required, the scholarship shall be awarded automatically to applicants who meet the prescribed eligibility criteria.":"无须申请，符合资格的申请者将自动获得奖学金。",
 "Only the scholarship or a study grant, whichever is higher.":"奖学金与助学金只能二选一，以较高者为准。",
 "Only the study grant or a scholarship, whichever is higher.":"助学金与奖学金只能二选一，以较高者为准。",
 "Please check UTAR's official website.":"请查看 UTAR 官方网站。",
 "Renewable yearly upon meeting minimum CGPA 3.70 at the end of each academic year.":"每学年结束时 CGPA 达到 3.70 或以上即可每年续领。",
 "Requirements are not stated on the UTAR financing poster (terms and conditions apply).":"UTAR 助学海报未列明申请条件（须符合条款与条件）。",
 "SPM grades A+, A and A- all count as As.":"SPM 的 A+、A 和 A- 都算作 A。",
 "Source: XMUM fees & scholarship 2026 (Nov 2025).":"资料来源：XMUM 2026 年学费与奖学金（2025 年 11 月）。",
 "10A or more.":"10A 或以上。",
 "Straight passes in all courses.":"所有科目全部及格。",
 "Terms and conditions apply.":"须符合条款与条件。",
 "The award is based on actual examination results in a single-sitting.":"奖励以一次考获的实际考试成绩为准。",
 "UEC grade points: A1=1, A2=2, B3=3, B4=4, B5=5, B6=6.":"UEC 等级积分：A1=1、A2=2、B3=3、B4=4、B5=5、B6=6。"
};
/* Scheme names, levels and eligibility written in words. */
var T={
 "APU Scholarships & Merit Awards":"APU 奖学金与优异奖","APU Special Recognition Awards":"APU 特别表扬奖","APU/APIIT Community Rebate":"APU/APIIT 社群回扣",
 "Academic Achievement Scholarship":"学业成就奖学金","East Malaysia Community Rebate":"东马社群回扣","MDEC Digital Ninja Rebate":"MDEC Digital Ninja 回扣",
 "Merit Scholarship":"优异奖学金","Sportsman Award":"运动员奖","Study Grant":"助学金","Study Grant for Sibling / Parent Alumni":"兄弟姐妹／家长校友助学金",
 "UTAR Scholarship for Top Achievers":"UTAR 优秀生奖学金","UTAR Care Scholarship":"UTAR 关怀奖学金","UTAR Relief Financial Aid":"UTAR 纾困助学金",
 "UTAR Sports Scholarship":"UTAR 运动奖学金","UTAR Talent Scholarship":"UTAR 才艺奖学金","Tan Sri (Dr) Lim Goh Tong-UTAR Scholarship Fund":"丹斯里林梧桐博士-UTAR 奖学金基金",
 "XMUM Progression Scholarship":"XMUM 升学奖学金",
 "Foundation Programmes":"预科课程","Undergraduate Programmes":"学士学位课程","Postgraduate Programmes":"研究生课程",
 "Undergraduate Programmes Offered by M. Kandiah Faculty of Medicine and Health Sciences (Chinese Medicine, M.B.B.S., Nursing and Physiotherapy)":"M. Kandiah 医学与健康科学学院的学士学位课程（中医、M.B.B.S.、护理和物理治疗）",
 "Bumiputera or Indian applicant":"土著或印裔申请者","Child of an APU/APIIT alumnus":"APU/APIIT 校友的子女",
 "Active Digital Ninja endorsed by the Malaysia Digital Economy Corporation (MDEC)":"获马来西亚数码经济机构（MDEC）认可的现役 Digital Ninja",
 "National player":"国家级运动员","State player":"州级运动员","Parent is a teacher":"父母是教师",
 "New student who is a sibling of a current student or an alumnus":"在籍学生或校友的兄弟姐妹（新生）",
 "Not stated: see UTAR's official website":"未列明：请查看 UTAR 官方网站","SPM, STPM or UEC from a school in Sabah or Sarawak":"来自沙巴或砂拉越学校的 SPM、STPM 或 UEC",
 "Sibling / Parent Alumni":"兄弟姐妹／家长是校友","Sibling is an XMUM student or alumnus":"兄弟姐妹是 XMUM 学生或校友",
 "APU Leadership Award: prefect in the final school year, with a recommendation letter from the principal or headmaster":"APU 领袖奖：中学最后一年担任学长，并附校长推荐信",
 "APU Emerging Young Leader Award: President, Vice-President, Treasurer or Secretary-General of a club or society (certificate from the school)":"APU 青年领袖奖：社团或学会的主席、副主席、财政或秘书长（附学校证书）",
 "APU Nationwide School Teachers' & Educators' Children Bursary: child of a school teacher or educator":"APU 全国教师与教育工作者子女助学金：学校教师或教育工作者的子女"
};
/* "Label: value" eligibility: the labels, and the value forms that follow them. */
var L={"IB Diploma":"IB 文凭","International Baccalaureate (IB) Diploma":"国际文凭（IB）","IB Middle Years Programme (MYP)":"IB 中学项目（MYP）",
 "Australian Matriculation (AUSMAT / SACE)":"澳洲大学先修（AUSMAT / SACE）","SACE / AUSMAT / NEW HSC":"SACE / AUSMAT / NEW HSC","OSSD / CIMP":"OSSD / CIMP",
 "Monash University Foundation Year (MUFY)":"莫纳什大学预科（MUFY）","XMUM Foundation":"XMUM 预科","UTAR Foundation":"UTAR 预科",
 "Foundation/Matriculation/Diploma":"预科／大学先修班／文凭"};
function val(v){var m;
 if((m=v.match(/^(\d+(?:-\d+)?) points?( and above)?$/)))return m[1]+" 分"+(m[2]?"或以上":"");
 if((m=v.match(/^ATAR (\d+)( and above)?$/)))return "ATAR "+m[1]+(m[2]?" 或以上":"");
 if((m=v.match(/^(\d+%) and above$/)))return m[1]+" 或以上";
 if((m=v.match(/^CGPA ([\d.]+) and above( \(Foundation \/ Matriculation\))?$/)))return "CGPA "+m[1]+" 或以上"+(m[2]?"（预科／大学先修班）":"");
 if((m=v.match(/^≥CGPA ([\d.]+)$/)))return "CGPA "+m[1]+" 或以上";
 if((m=v.match(/^CGPA ([\d.]+)-([\d.]+)$/)))return "CGPA "+m[1]+"–"+m[2];
 return null;}
Object.keys(S).forEach(function(k){x.text[k]=S[k];});Object.keys(T).forEach(function(k){x.text[k]=T[k];});
function rx(s){return s.replace(/[.*+?^${}()|[\]\\]/g,"\\$&");}
/* A line made only of known sentences. */
var sent=Object.keys(S).map(rx).join("|");
x.patterns.push([new RegExp("^(?:(?:"+sent+")\\s*)+$"),function(m){
 var out=m[0],keys=Object.keys(S).sort(function(a,b){return b.length-a.length;});
 keys.forEach(function(k){out=out.split(k).join(S[k]);});return out.replace(/。\s+/g,"。");}]);
/* Label: value, and plain eligibility values. */
x.patterns.push([new RegExp("^("+Object.keys(L).map(rx).join("|")+"): (.+)$"),function(m){var v=val(m[2]);return L[m[1]]+"："+(v==null?m[2]:v);}]);
x.patterns.push([/^(?:CGPA [\d.]+ and above(?: \(Foundation \/ Matriculation\))?)$/,function(m){return val(m[0]);}]);
})();
