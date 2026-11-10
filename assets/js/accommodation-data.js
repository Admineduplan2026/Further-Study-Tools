/* Student accommodation per institution (key = institution_id), copied from each institution's own accommodation
   document. Shown on the university page, the Ask more page, the Lab detail sheet and the Accommodation page.
   Photos are in assets/img/accom/. Each text is [English, Chinese]. Load after lab-zh.js and before app.js: the
   Chinese text is added to the translations here. */
window.EDUPLAN_ACCOM={
 XMUM:{
  source:["XMUM Accommodation Photobook, last updated October 2025","XMUM 宿舍图册，2025 年 10 月更新"],
  rooms:[
   {name:["Twin sharing room (Block D)","双人房（D 座）"],rent:360,deposit:500,size:15.9,note:["En-suite bathroom","房内附设浴室"]},
   {name:["Twin sharing room (Block LY)","双人房（LY 座）"],rent:460,deposit:500,size:17.6,note:["En-suite bathroom","房内附设浴室"]}
  ],
  fees:[
   ["Resident application fee of RM 100 (non-refundable), charged when you apply","申请时收取 RM 100 住宿申请费（不退还）"],
   ["The one-time deposit is refunded at the end of the tenancy","一次性押金在租约结束时退还"],
   ["Rental is not refundable and not pro-rated, except when the University or the Accommodation Office is proven liable","租金不退还，也不按比例计算，除非证实是大学或住宿处的责任"]
  ],
  facilities:[
   ["Bed, study table, chair and wardrobe","床、书桌、椅子和衣橱"],
   ["Wi-Fi in every room","每间房都有 Wi-Fi"],
   ["Air-conditioner in every room (electricity is not included in the rent)","每间房都有冷气（电费不包括在租金内）"],
   ["Common pantry on each floor with microwave, refrigerator, kettle and water dispenser","每层楼有公用茶水间，设有微波炉、冰箱、热水壶和饮水机"],
   ["Laundry room","洗衣房"],
   ["Car parking area","停车场"]
  ],
  payment:[
   ["Rent is paid per semester","租金按学期缴付"],
   ["Pay within seven (7) working days from the start of the new semester","须在新学期开始后七（7）个工作日内缴付"]
  ],
  terms:[
   [["Degree","学位"],[[["February semester (short)","二月学期（短学期）"],2],[["April semester (long)","四月学期（长学期）"],5],[["September semester (long)","九月学期（长学期）"],5]]],
   [["Foundation","预科"],[[["April semester","四月学期"],4],[["August semester","八月学期"],4],[["December semester","十二月学期"],4]]]
  ],
  contact:{email:"studentaccommodation@xmu.edu.my",phones:"03-8705 5164 / 03-8705 5051 / 03-8705 5193 / 03-8800 6832 / 03-8800 6847 / 03-8800 6854 / 03-8800 6924",
   hours:["Monday to Friday, 8.30am to 5.30pm (closed on Selangor public holidays)","星期一至五，上午 8.30 至下午 5.30（雪兰莪州公共假期休息）"]},
  photos:[
   ["assets/img/accom/xmum-d-room.jpg",["Block D twin sharing room","D 座双人房"]],
   ["assets/img/accom/xmum-d-desk.jpg",["Block D study desks and wardrobes","D 座书桌和衣橱"]],
   ["assets/img/accom/xmum-d-block.jpg",["Block D building","D 座宿舍大楼"]],
   ["assets/img/accom/xmum-d-pantry.jpg",["Common pantry","公用茶水间"]],
   ["assets/img/accom/xmum-ly-room.jpg",["Block LY twin sharing room","LY 座双人房"]],
   ["assets/img/accom/xmum-ly-bath.jpg",["Block LY en-suite bathroom","LY 座房内浴室"]],
   ["assets/img/accom/xmum-ly-block.jpg",["Block LY building (Ling Yun 4)","LY 座宿舍大楼（凌云 4）"]],
   ["assets/img/accom/xmum-ly-common.jpg",["Common area","公共休闲区"]],
   ["assets/img/accom/xmum-laundry.jpg",["Laundry room","洗衣房"]]
  ]
 }
};
(function(A){var x=window.EDUPLAN_ZH_EXTRA=window.EDUPLAN_ZH_EXTRA||{text:{},patterns:[]};x.text=x.text||{};
 function add(p){if(p&&typeof p[0]==="string"&&typeof p[1]==="string")x.text[p[0]]=p[1];}
 Object.keys(A).forEach(function(k){var a=A[k];add(a.source);a.rooms.forEach(function(r){add(r.name);add(r.note);});
  a.fees.forEach(add);a.facilities.forEach(add);a.payment.forEach(add);add(a.contact.hours);
  a.terms.forEach(function(t){add(t[0]);t[1].forEach(function(s){add(s[0]);});});a.photos.forEach(function(p){add(p[1]);});});
 [["Accommodation","住宿"],["Student accommodation","学生宿舍"],["Room type","房型"],["Monthly rent per student","每位学生月租"],["Deposit","押金"],["Room size","房间面积"],
  ["Fees and refunds","费用与退款"],["Facilities","设施"],["Paying the rent","缴付租金"],["Rent charged per semester","每学期收取的租金"],["Programme","课程"],["Semester","学期"],["Rent charged","收取租金"],
  ["Contact the accommodation office","联络住宿处"],["Photos","照片"],["from","最低"],["a month","每月"],["Source:","资料来源："],
  ["Rules and fees can change. Please confirm with the university before you book.","规则和费用可能会更改，预订前请向大学确认。"],
  ["Accommodation details from the institution","院校提供的住宿资料"],["See accommodation","查看住宿"],["Accommodation details from the institutions","各院校提供的住宿资料"]].forEach(add);
 x.patterns=x.patterns||[];x.patterns.push([/^(\d+) months?$/,function(m){return m[1]+" 个月";}]);
})(window.EDUPLAN_ACCOM);
