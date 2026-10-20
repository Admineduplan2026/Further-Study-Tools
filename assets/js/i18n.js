/* Eduplan language switch (English / 中文).
   The pages are written in English. In 中文 mode every text node and label is looked up in ZH (exact text)
   and then in ZH_PATTERNS (text with numbers or names in it). Text that is not listed stays as it is:
   names and content from the Google Sheet or official sources (university, course and scholarship names,
   official scholarship terms) are kept in their original wording on purpose.
   To translate a new sentence, add it to ZH exactly as it appears in English. */
(function(){
"use strict";
var ZH={
 "Thank you. Your reference number is":"谢谢！你的报名编号是",". A counsellor will contact you about signatures, the application fee and the next steps.":"。顾问会联络你，处理签名、报名费及接下来的步骤。",
 "University & programme":"大学与课程","Ask more":"进一步咨询","Documents":"文件",
 "Next: choose a university":"下一步：选择大学","Find a university and programme to apply to with this scholarship.":"找一所大学和课程，用这项奖学金报读。",
 "Not sure which tier you reach? A counsellor can check with you.":"不确定能拿到哪一级？顾问可以帮你核对。",
 "Choose this programme":"选择这个课程","Your choice":"你选择的课程","Bachelor's degree":"学士学位",
 "Title":"称谓","Mr":"先生","Ms":"女士","Mrs":"太太","Title (other)":"称谓（其他）","Place of birth (city / state)":"出生地（城市／州属）","Do you have any special or medical condition that needs the university's attention?":"你是否有任何需要大学特别留意的特殊或医疗状况？","Have you had any history of mental or psychiatric conditions?":"你是否曾有精神或心理疾病的病史？","Have you been diagnosed with any condition that may affect your ability to cope with university studies?":"你是否曾被诊断出可能影响你应付大学学业的状况或障碍？","Level of study":"修读程度","Degree Level 1":"学位第一级（Degree Level 1）","Degree Level 2 (direct entry with a diploma)":"学位第二级（持文凭直接插班）","Was English the language of instruction in your previous studies?":"你之前完成的学业是否以英语授课？","Do you hold a Malaysian immigration pass or visa now?":"你目前是否持有马来西亚移民准证或签证？","Type of pass / visa":"准证／签证类型","Social Visit":"社交访问","Student":"学生","Dependent":"家属","Diplomatic":"外交","Resident Pass":"居留准证","Expiry date":"到期日","Example: 2026-04":"例如：2026-04","Place of birth":"出生地","Specialism":"专业方向","Parent / guardian NRIC / passport no.":"家长／监护人身份证／护照号码","Special or medical condition":"特殊或医疗状况","History of mental or psychiatric conditions":"精神或心理疾病病史","Condition that may affect coping with studies":"可能影响应付学业的状况","English was the language of instruction":"之前以英语授课","Malaysian immigration pass / visa":"马来西亚移民准证／签证","Any questions before you apply?":"报名前还有疑问吗？",
 "Ask our AI study assistant, talk to a counsellor for free, or go straight to the application form.":"可以问 AI 升学助手、免费咨询顾问，或直接填写报名表格。",
 "Ask the AI study assistant":"问 AI 升学助手","Quick answers about fees, entry requirements and scholarships, any time.":"随时快速解答学费、入学条件和奖学金问题。","Open the chat":"打开对话",
 "A counsellor goes through your options with you and your family.":"顾问与你和家人一起了解各个选择。","Book a time":"预约时间",
 "I am ready to apply":"我准备好报名了","Fill in one form and upload your documents. About 10 minutes.":"填写一份表格并上传文件，约 10 分钟。","Start the application":"开始报名",
 "Choose a programme first":"请先选择课程","Find a programme by faculty, university or scholarship, then come back here.":"请从科系、大学或奖学金找到课程，再回到这里。","Browse faculties":"浏览科系","Browse universities":"浏览大学",
 "Upload your documents":"上传文件",
 "Take a clear photo of each document, or choose a PDF. Each file can be up to 5 MB. Files stay on this page until you send your application, so add them again if you reload.":"请为每份文件拍一张清晰的照片，或选择 PDF，每个文件最大 5 MB。文件只保留在此页面直到送出报名，如重新整理页面请重新加入。",
 "NRIC or passport (front and back)":"身份证或护照（正反面）","Results slip (SPM / UEC / O-Level or equivalent)":"成绩单（SPM／UEC／O-Level 或同等）","Passport-size photo":"护照尺寸照片",
 "English language certificate":"英语资格证书","Scholarship application form":"奖学金申请表","Proof of application fee payment":"报名费付款证明","Photo or PDF.":"照片或 PDF。","Remove":"移除",
 "Please add this document.":"请加入这份文件。","All your files together can be up to 20 MB.":"所有文件合计最多 20 MB。","That file is too large or cannot be read. Use a photo or a PDF up to 5 MB.":"文件太大或无法读取，请使用 5 MB 以内的照片或 PDF。",
 "I declare that the information in this application is true, correct and complete. I understand that the university may change or withdraw a decision made on incorrect or incomplete information. I agree that Eduplan keeps my application and documents and shares them with the university to process this application, as set out in their personal data protection notices.":"本人声明所填资料真实、正确且完整。本人明白若资料不正确或不完整，大学可更改或撤回相关决定。本人同意 Eduplan 保存本人的报名资料及文件，并依据其个人资料保护通知，与大学分享以处理本次报名。",
 "Do you need help with accommodation?":"你需要住宿协助吗？","Do you need accommodation help?":"是否需要住宿协助？","Yes, please help me":"需要，请协助我","No, I have arranged it":"不需要，我已安排好",
 "Type":"类型","On-campus hostel":"校内宿舍","Rented room near campus":"校外租房","Not sure yet":"还不确定","Room":"房间","Single room":"单人房","Shared room":"共享房","No preference":"没有偏好",
 "Budget per month (RM)":"每月预算（RM）","Move-in month":"入住月份","Anything else":"其他需求","Back to the form":"返回表格","Send my application to Eduplan":"把报名资料送交 Eduplan","Sending…":"发送中…","Please choose one.":"请选择一项。",
 "Application sent":"报名资料已送出","Back to home":"返回首页",
 "Finish your application first":"请先完成报名表格","Accommodation help is the last step of the application.":"住宿协助是报名的最后一步。","Go to the application form":"前往报名表格",
 "Send it yourself":"自行发送","Share with documents":"连同文件分享","Continue to the application form":"继续填写报名表格",
 "This preview cannot send files. Please send your application yourself below.":"此预览版无法发送文件，请用下方方式自行发送。",
 "Your application could not be sent just now. Please send it yourself below, or try again later.":"报名资料暂时无法送出，请用下方方式自行发送，或稍后再试。",
 "Apply":"报名","Apply with Eduplan":"通过 Eduplan 报名","Application form":"报名表格","See official information":"请看官方资料",
 "One form for your university application. It takes about 10 minutes. Your answers stay on this device until you close the tab.":"一份表格完成大学报名，约需 10 分钟。你的资料只保存在这个装置，关闭分页后即清除。",
 "One form for your university application. It takes about 10 minutes. Your answers are saved to your portfolio as you type.":"一份表格完成大学报名，约需 10 分钟。你填写的资料会自动保存到你的档案。",
 "to save them and continue later.":"，即可保存资料，下次继续填写。",
 "My portfolio":"我的档案","Your Eduplan portfolio":"你的 Eduplan 档案","Save your progress":"保存你的进度",
 "Signed in as":"已登入：",". Everything you do on Eduplan is saved automatically.":"。你在 Eduplan 的每一步都会自动保存。",
 "Keep your saved programmes, quiz result, consultation request and application in one place, and continue on any device.":"把收藏的课程、测验结果、咨询申请和报名表集中在一处，在任何装置都能继续。",
 "Sign in":"登入","Sign in or create your portfolio":"登入或建立你的档案","Enter your code":"输入验证码","6-digit code":"6 位数验证码",
 "No password needed. Each time you sign in, we email you a 6-digit code.":"不需要密码。每次登入，我们会把 6 位数验证码发到你的电邮。",
 "I agree that Eduplan keeps my portfolio (saved programmes, quiz result, consultation request and application details) to guide me with my studies. I can delete it at any time.":"我同意 Eduplan 保存我的档案（收藏的课程、测验结果、咨询申请及报名资料），用于升学辅导。我可以随时删除。",
 "Email me a code":"把验证码发到我的电邮","Checking…":"核对中…","Send a new code":"重新发送验证码","Use another email":"改用其他电邮",
 "Sent to":"已发送至",". Check your spam folder if it is not in your inbox.":"。如果收件箱没有，请查看垃圾邮件。",
 "Sign-in works on the live Eduplan website. In this preview, your saved programmes and quiz result stay in this browser.":"登入功能在正式的 Eduplan 网站上使用。在此预览版，收藏的课程和测验结果保存在这个浏览器。",
 "Please tick to agree first.":"请先勾选同意。","Enter the 6-digit code from the email.":"请输入电邮里的 6 位数验证码。",
 "A code was sent less than a minute ago. Check your inbox and spam folder, or wait a minute and ask again.":"验证码在一分钟内刚发出。请查看收件箱和垃圾邮件，或等一分钟再申请。",
 "Too many codes were asked for this email. Please try again in a few hours.":"这个电邮申请验证码的次数太多，请几个小时后再试。","Sign-in is very busy today. Please try again tomorrow.":"今天登入人数太多，请明天再试。",
 "That code is not right. Use the latest code Eduplan emailed you.":"验证码不正确，请使用 Eduplan 最新发出的验证码。","This code has expired. Ask for a new code.":"验证码已过期，请重新申请。",
 "Eduplan is busy right now. Please try again in a moment.":"Eduplan 系统繁忙，请稍后再试。","Eduplan could not be reached. Check your connection and try again.":"无法连接 Eduplan，请检查网络后再试。","Something went wrong. Please try again.":"出了点问题，请再试一次。",
 "You were signed out. Sign in again to keep saving to your portfolio.":"你已被登出。请重新登入以继续保存到档案。","Signed out":"已登出",
 "You have signed out. Your details were removed from this browser and stay in your portfolio for next time.":"你已登出。你的资料已从这个浏览器清除，并保留在档案中供下次使用。",
 "Your portfolio was deleted. Applications you already sent stay with Eduplan so a counsellor can process them.":"你的档案已删除。已送出的报名资料仍由 Eduplan 保存，以便顾问处理。",
 "Saving…":"保存中…","Saved to your portfolio":"已保存到你的档案","Not saved yet. Trying again…":"尚未保存，正在重试…","Your portfolio is too large to save. Please contact Eduplan.":"档案太大无法保存，请联系 Eduplan。",
 "Signed in. Your progress is saved automatically.":"已登入，你的进度会自动保存。","Saved in this browser. Sign in to keep it on any device.":"已保存在这个浏览器。登入后可在任何装置查看。","Removed from your saved programmes":"已从收藏移除",
 "Save":"收藏","Saved":"已收藏","Saved programmes":"收藏的课程","This programme is no longer listed.":"这个课程已不在列表中。","Loading…":"加载中…",
 "No saved programmes yet. Tap":"还没有收藏的课程。在课程上点","on a programme to keep it here.":"，就会保存在这里。",
 "Interest quiz":"兴趣测验","Faculties that suit your interests:":"适合你兴趣的科系：","See my full result":"查看完整结果","Take the quiz again":"重新测验","Continue the quiz":"继续测验",
 "Not taken yet. Twelve short questions about what you enjoy.":"还没做。12 道关于你兴趣的小问题。",
 "Free consultation":"免费咨询","Name":"姓名","Phone":"电话","Topic":"主题","Open my request":"打开我的咨询申请","No request yet.":"还没有咨询申请。",
 "Application":"报名","Application sent. Your reference number is":"报名资料已送出。你的报名编号是","Ready to send":"可以送出","Finish and send":"完成并送出","Continue my application":"继续填写报名表",
 "Uploaded documents are not kept in your portfolio. Add them again before you send your application.":"上传的文件不会保存在档案中，送出报名前请重新加入。",
 "Not started. Choose a programme first, then tap":"还没开始。请先选择课程，然后点",
 "Account":"账户","Status:":"状态：","Sign out":"登出","Delete my portfolio":"删除我的档案","Delete your portfolio?":"要删除你的档案吗？",
 "Your saved programmes, quiz result, consultation request and unsent application will be deleted from Eduplan. Applications you already sent are not affected.":"你收藏的课程、测验结果、咨询申请和未送出的报名表将从 Eduplan 删除。已送出的报名不受影响。",
 "Yes, delete my portfolio":"是的，删除我的档案","Keep it":"保留",
 "Signing out removes your details from this browser. Please sign out on a shared computer.":"登出会把你的资料从这个浏览器清除。使用公用电脑时请记得登出。",
 "Until you sign in, these are kept in this browser only.":"登入之前，这些资料只保存在这个浏览器。",
 "Welcome to Eduplan":"欢迎来到 Eduplan","Find your course, university and scholarship":"找到适合你的课程、大学和奖学金",
 "Sign in with your email to start. It is free, there is no password, and your progress is saved so you can continue on any device.":"用电邮登入即可开始。完全免费、不需要密码，进度会自动保存，在任何装置都能继续。",
 "Courses, fees and entry requirements from partner universities":"合作大学的课程、学费和入学条件","Scholarships you can apply for":"你可以申请的奖学金",
 "An AI study assistant and free counsellors":"AI 升学助手和免费顾问","One application form for your chosen university":"一份表格报读你选择的大学",
 "Sign in to continue":"登入以继续","Continue to the preview":"进入预览","Continue without signing in":"不登入，直接继续",
 "Programme":"课程","About you":"个人资料","Contact":"联络资料","Family":"家长与紧急联络人","Confirm":"确认",
 "Choose a programme":"选择课程","Not sure yet?":"还不确定？","first.":"再决定。","Academic track":"学术方向","Choose a track":"选择方向","Intake (month and year)":"入学月份与年份",
 "Personal details":"个人资料","Full name (as on NRIC/passport)":"全名（与身份证／护照相同）","In capital letters, for example TAN WEI MING.":"请用大写，例如 TAN WEI MING。",
 "Chinese name":"中文名","NRIC / passport no.":"身份证／护照号码","Example: 080101-14-1234":"例如：080101-14-1234","Date of birth":"出生日期","Gender":"性别","Male":"男","Female":"女",
 "Marital status":"婚姻状况","Single":"单身","Married":"已婚","Race":"种族","Religion":"宗教","Nationality":"国籍","Country of permanent residence":"永久居留国家","Choose":"请选择",
 "Contact details":"联络资料","Mobile":"手机号码","Home telephone":"住家电话","Correspondence address":"通讯地址","Town / city":"城镇","Postcode":"邮编","State":"州属","Country":"国家",
 "My permanent address is the same":"永久地址与通讯地址相同","Permanent address":"永久地址","Home telephone (permanent address)":"住家电话（永久地址）",
 "Parent / guardian":"家长／监护人","Relationship":"关系","Father, mother, guardian …":"父亲、母亲、监护人…","Occupation":"职业",
 "Emergency contact":"紧急联络人","Same as parent / guardian":"与家长／监护人相同",
 "Education background":"教育背景","Start with your most recent school. Add every school from secondary school onwards.":"从最近就读的学校开始，填写中学起的所有学校。",
 "School / institution and location":"学校／院校名称与地点","From":"从","To":"至","Add another school":"再加一所学校",
 "Highest qualification":"最高学历","Results":"成绩","Actual results":"正式成绩","Forecast / not out yet":"预测成绩／尚未公布","Institution":"院校","Year started":"开始年月","Year completed":"完成年月",
 "Subjects and grades":"科目与成绩",
 "Choose a degree programme":"选择学位课程","None":"无","Preferred campus for the foundation programme":"预科课程首选校区","Are you in good physical and mental health?":"你的身心健康状况良好吗？","Sungai Long Campus":"双溪龙校区","Kampar Campus":"金宝校区","The university may assign you to another campus.":"大学可能会安排你到其他校区。",
 "Exam results slip":"考试成绩单","Official results slip":"正式成绩单","Trial exam results slip":"模拟考（Trial）成绩单","Which results slip are you sending?":"你要提交哪一种成绩单？","Official results":"正式成绩","Trial results":"模拟考成绩","Trial: your school’s trial exam, while the official results are not out yet. Send the official slip when it comes out.":"Trial：学校的模拟考成绩，适用于正式成绩还没公布的时候。正式成绩出来后，请再提交正式成绩单。","Choose official or trial.":"请选择正式成绩或模拟考成绩。","Filled in from My results in your portfolio. You do not need to enter them again.":"已从档案里的「我的成绩」自动填入，不需要再填写一次。","Change my results":"修改我的成绩","Done":"完成","Changes are saved to My results in your portfolio.":"修改会保存到档案里的「我的成绩」。","Enter them once: they are saved to My results in your portfolio and filled in for you next time.":"只需填写一次：会保存到档案里的「我的成绩」，下次自动帮你填好。",
 /* My results (assets/js/results.js) */
 "My results":"我的成绩","Scholarships for my results":"我的成绩可获得的奖学金","Add your exam results above. Eduplan then lists the campus scholarships your results qualify for.":"在上方填写你的考试成绩，Eduplan 就会列出你的成绩符合的校内奖学金。","See this scholarship":"查看这项奖学金","Almost there":"还差一点","No campus scholarship in our data matches your results yet.":"我们的资料中暂时没有符合你成绩的校内奖学金。","Which campus scholarships can I get with my results?":"以我的成绩可以获得哪些校内奖学金？","Add your exam results once. Eduplan keeps them until you change them, and uses them to show which programmes and scholarships you qualify for.":"成绩只需填写一次。Eduplan 会一直保存，直到你自己更改，并用来显示你符合哪些课程和奖学金。",
 "Saved to My results, and used to match programmes and scholarships for you.":"会保存到「我的成绩」，并用来为你配对课程和奖学金。","Your CGPA (out of 4.00)":"你的 CGPA（满分 4.00）","Your CGPA":"你的 CGPA",
 "+ Add subject":"+ 添加科目","Other subject…":"其他科目…","Subject name":"科目名称","Add":"添加","Add at least one subject and its grade.":"请至少添加一个科目及其成绩。","Enter your CGPA.":"请填写你的 CGPA。",
 "Add your results":"填写你的成绩","to see if you meet these requirements.":"，查看你是否符合这些条件。","These requirements cannot be checked against your results automatically. Ask a counsellor.":"这些条件无法自动对照你的成绩，请咨询顾问。",
 "O-Level / IGCSE":"O-Level / IGCSE","Matriculation":"大学先修班","UEC (Senior Middle 3)":"独中统考 UEC（高三）","Secondary school":"中学","Pre-university":"大学先修","Foundation, matriculation or diploma (CGPA)":"预科／大学先修班／文凭（CGPA）",
 "Bahasa Melayu":"马来文","English":"英文","Mathematics":"数学","Additional Mathematics":"高级数学","History (Sejarah)":"历史","Science":"科学","Physics":"物理","Chemistry":"化学","Biology":"生物",
 "Islamic Education":"伊斯兰教育","Moral Education":"道德教育","Principles of Accounting":"会计原理","Economics":"经济","Business":"商业","Geography":"地理","Chinese Language":"华文","Tamil Language":"淡米尔文",
 "Literature in English":"英国文学","Computer Science":"电脑科学","Visual Arts":"美术","Combined Science":"综合科学","Business Studies":"商业学","Accounting":"会计","Chinese":"华文","Malay":"国文","Art and Design":"艺术与设计",
 "Advanced Mathematics":"高级数学","Bookkeeping and Accounting":"簿记与会计","Commerce":"商业学","Computing and Information Technology":"电脑与资讯工艺","Art":"美术","History":"历史",
 "General Studies (Pengajian Am)":"通识（Pengajian Am）","Mathematics (T)":"数学（T）","Mathematics (M)":"数学（M）","Chinese Literature":"华文文学","Malay Literature":"马来文学","ICT":"资讯与通信工艺",
 "Further Mathematics":"进阶数学","Psychology":"心理学","Law":"法律","Sociology":"社会学","One subject per line, for example: Mathematics A+":"每行一科，例如：Mathematics A+",
 "English language":"英语资格","Any English test you have taken or will take.":"已考或将考的英语考试。","Test":"考试","MUET, IELTS, TOEFL, SPM English …":"MUET、IELTS、TOEFL、SPM 英文…",
 "Score / band":"分数／等级","Date taken or to be taken":"考试日期（已考或将考）","Add another test":"再加一项考试",
 "Do you have a disability?":"你是否有身体障碍？","No":"否","Yes":"是","Please give details":"请说明详情",
 "Documents to prepare":"需准备的文件","Your counsellor collects these from you after you send this form.":"送出表格后，顾问会向你收取这些文件。",
 "A copy of your NRIC (Malaysian students) or passport (international students)":"身份证副本（本地生）或护照副本（国际生）",
 "A certified true copy of your SPM / UEC / O-Level results or equivalent":"SPM／UEC／O-Level 或同等成绩的认证副本",
 "A certified true copy of your English language certificate (if any)":"英语资格证书认证副本（如有）",
 "Scholarship application form, if you are applying for a scholarship":"奖学金申请表（如申请奖学金）","Proof of payment of the application fee":"报名费付款证明",
 "Declaration":"声明",
 "I declare that the information in this application is true, correct and complete. I understand that the university may change or withdraw a decision made on incorrect or incomplete information. I agree that Eduplan and the university may use and process my personal data for this application, as set out in their personal data protection notices.":"本人声明所填资料真实、正确且完整。本人明白若资料不正确或不完整，大学可更改或撤回相关决定。本人同意 Eduplan 及该大学根据其个人资料保护通知，为本次报名使用及处理本人的个人资料。",
 "You are under 18, so your parent or legal guardian must also agree.":"你未满 18 岁，须由家长或法定监护人一同同意。",
 "I am the applicant’s parent or legal guardian. I consent to this application and understand that the university’s fees and charges are payable by the dates it sets.":"本人为申请人的家长或法定监护人，同意此报名，并明白须于大学规定日期前缴付各项费用。",
 "Parent / guardian name":"家长／监护人姓名","Prepare my application":"完成并生成报名资料",
 "Your application is ready":"你的报名资料已准备好",
 "Send it to Eduplan by WhatsApp or email. A counsellor checks it with you and tells you the next steps, including signatures, documents and the application fee.":"请通过 WhatsApp 或电邮发送给 Eduplan。顾问会与你核对，并告诉你接下来的步骤，包括签名、文件和报名费。",
 "Print or save as PDF":"打印或另存为 PDF","Start a new application":"开始新的报名",
 "Send to: WhatsApp [YOUR PHONE NUMBER] or email [YOUR EMAIL]. This page keeps your answers only until you close the tab.":"发送至：WhatsApp [YOUR PHONE NUMBER] 或电邮 [YOUR EMAIL]。此页面只在分页开启期间保存你的资料。",
 "Please fill this in.":"请填写此项。","Choose a programme.":"请选择课程。","Choose an academic track.":"请选择学术方向。","Enter the intake month and year.":"请填写入学月份与年份。",
 "Check the date of birth.":"请检查出生日期。","Enter a phone number with 9 to 13 digits.":"请输入 9 至 13 位数的电话号码。","Enter an email like name@example.com.":"请输入电邮，例如 name@example.com。",
 "Please tick to confirm.":"请勾选以确认。","Your parent or guardian must tick to agree.":"须由家长或监护人勾选同意。",
 "Ask Eduplan":"问 Eduplan","Eduplan study assistant":"Eduplan 升学助手","AI answers from Eduplan’s course and scholarship data":"根据 Eduplan 的课程与奖学金资料以 AI 回答",
 "Close chat":"关闭对话","Your question":"你的问题","Type your question…":"输入你的问题…","Send":"发送","New chat":"新对话",
 "AI answers can be wrong. Please confirm with a counsellor. Do not type personal details such as your IC number.":"AI 的回答可能有误，请与升学顾问确认。请勿输入身份证号码等个人资料。",
 "Hi! I can help you find courses, compare universities and check scholarships. What would you like to know?":"你好！我可以帮你找课程、比较大学和查询奖学金。你想了解什么？",
 "What can I study at XMUM with UEC?":"我用 UEC 可以在 XMUM 读什么？","Which scholarships are there for SPM students?":"SPM 学生有哪些奖学金？",
 "I like computers. Which courses suit me?":"我喜欢电脑，适合读什么课程？","How much is the Master of Science in Mathematics at XMUM?":"XMUM 的数学硕士学费多少？",
 "The assistant is not switched on yet. Please book a free consultation and a counsellor will answer you.":"升学助手尚未开通。请预约免费咨询，由升学顾问为你解答。",
 "The assistant has answered many questions today. Please try again tomorrow, or book a free consultation.":"升学助手今天已回答了很多问题，请明天再试，或预约免费咨询。",
 "The assistant is busy right now. Please try again in a moment.":"升学助手目前忙碌，请稍后再试。",
 "Sorry, I can't help with that. Please ask about courses, universities or scholarships.":"抱歉，我无法回答这个问题。请询问课程、大学或奖学金相关问题。",
 "The assistant is not available here. Please book a free consultation and a counsellor will answer you.":"此处无法使用升学助手。请预约免费咨询，由升学顾问为你解答。",
 "Show details":"展开详情","Hide details":"收起详情","Expand all":"全部展开","Collapse all":"全部收起",
 "Tuition fee (per year)":"学费（每年）",
 "Not applicable: postgraduate entry is based on a Bachelor's or Master's degree (see Others).":"不适用：研究生课程以学士或硕士学位入学（见「其他」）。",
 "Not accepted directly for this degree in the XMUM brochure. Enter through Foundation/Matriculation, STPM, A-Level, UEC or a Diploma first.":"XMUM 简章未接受以此资格直接报读此学位，需先完成预科／大学先修班、STPM、A-Level、UEC 或文凭课程。",
 "Not accepted directly for this degree in the XMUM brochure. Enter through Foundation/Matriculation, A-Level or a Diploma first.":"XMUM 简章未接受以此资格直接报读此学位，需先完成预科／大学先修班、A-Level 或文凭课程。",
 "Twelve short questions about what you enjoy. There are no wrong answers.":"十二道关于你兴趣的简单问题，没有错误答案。",
 "Start the 12 questions":"开始回答 12 道题",
 "For students who are still unsure. Twelve short questions, then a counsellor walks you through each step.":"适合还不确定方向的学生。回答十二道简单问题，再由升学顾问一步步陪你规划。",
 "Two areas came out very close.":"有两个领域的结果非常接近。",
 "If you could only choose one of these and do it for the next 3 years, which would you pick?":"这两样只能选一样，持续做 3 年，你选哪个？",
 "You answered all twelve questions.":"你已回答全部十二道题。","Faculties that suit your interests":"适合你兴趣的科系",
 "Best match":"最适合","Also a good fit":"也很适合","Courses in this faculty":"此科系的课程","Also worth considering":"也值得考虑",
 "Your own choice in the last question was":"你在最后一题自己选的是",
 ", which is different from your other answers. That is worth talking through with a counsellor.":"，和你其他答案的方向不同，值得与升学顾问好好聊聊。",
 "Your interests are still open or spread across several areas. A foundation or general programme lets you explore before you choose a degree.":"你的兴趣还很开放，或分散在几个领域。先读预科或通用课程，可以让你在选择学位前多探索。",
 "This quiz looks at interests only. Ability, budget, physical requirements and family considerations still need to be discussed with a counsellor.":"此问卷只衡量兴趣。能力、预算、身体条件及家庭因素，仍需与升学顾问另外讨论。",
 /* Header, footer, shared */
 "About Us":"关于我们","Faculty":"科系","Universities":"大学","Scholarships":"奖学金","Accommodation":"住宿","Free Consultation":"免费咨询",
 "Sample data. Universities, scholarships, fees and contact details on this site are placeholders until Eduplan replaces them.":"示范资料：本网站的大学、奖学金、学费与联络资料仍是占位内容，Eduplan 将陆续更新。",
 "Plan your future. Guidance from choosing a course to registration, free of charge.":"规划你的未来。从选科到报名注册，全程免费指导。",
 "Eduplan home":"Eduplan 首页","Main":"主选单","Eduplan: plan your future":"Eduplan：规划你的未来","Progress":"进度",
 "Back":"返回","Next":"下一步","Book a free consultation":"预约免费咨询","Ask a counsellor":"咨询升学顾问",
 "Ask a counsellor about scholarships":"向升学顾问咨询奖学金","Ask a counsellor about this course":"向升学顾问咨询这个课程",
 "Open the tool":"使用工具","Last updated":"最后更新","Official website":"官方网站","Official information":"官方资料",
 "Official website link to be added.":"官网链接待补充。",
 "Information is for reference only. Please confirm with the university’s official website.":"资料仅供参考，请以大学官网为准。",
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
 "Programme page":"课程网页","Tuition fee (whole programme)":"学费（整个课程）","Intakes":"开课月份","Entry (SPM)":"入学条件（SPM）","Entry (other)":"入学条件（其他）","English requirement":"英文要求","Application deadline":"截止日期","Notes":"备注",
 "Interest-based":"兴趣导向","Courses":"课程",
 "Choose a university to see its programmes by level: foundation, undergraduate and postgraduate.":"选择大学，按阶段查看课程：预科、本科与研究生。",
 "View university":"查看大学","The university list is being prepared.":"大学名单正在整理中。","Website":"官网","Admissions email":"招生电邮","Admissions phone":"招生电话",
 "Choose a study level":"选择升学阶段","3D campus tour":"3D 校园导览","Explore the 3D campus tour":"进入 3D 校园导览","View programmes":"查看课程","Programmes":"课程","Professional Certificate":"专业证书",
 "Certificate / Diploma / Bachelor's Degree":"证书／文凭／学士学位","Master's Degree / PhD / Professional Certificate":"硕士学位／博士／专业证书",
 "Programme structure":"课程结构","Career prospects":"就业前景","The institution has not listed the programme structure yet.":"院校尚未列出课程结构。","See the programme page":"查看课程网页",
 "Location":"地点","To be confirmed":"待确认","Entry requirements":"入学条件","Not listed by the institution":"院校未列出","Others":"其他",
 "Scholarships you can apply for":"可申请的奖学金","No campus scholarship listed for this level yet.":"此阶段暂未列出大学奖学金。",
 "Other scholarships open to all students":"其他开放给所有学生的奖学金",
 "Pre-university (Foundation / Matriculation / Form 6 / A-Level)":"大学先修（预科／大学先修班／中六／A-Level）","Certificate":"证书",
 "Verify your name with your IC first (My portfolio, My profile). The name on your results slip must match your IC.":"请先在「我的档案 → 我的个人资料」用身份证核实姓名。成绩单上的姓名必须和身份证一致。","Your name could not be read on this slip. Upload a clear photo that shows your name and your grades.":"无法在这张成绩单上读到你的姓名。请上传能清楚看到姓名和成绩的照片。","The name on this slip does not match the name on your IC. Upload your own results slip.":"这张成绩单上的姓名和你身份证上的姓名不一致。请上传你本人的成绩单。","The name on your results slip must match your IC, so verify your name with your IC first:":"成绩单上的姓名必须和身份证一致，所以请先用身份证核实姓名：","My portfolio, My profile":"我的档案 → 我的个人资料","✓ Matches your IC":"✓ 与身份证一致","Your grades are read from a photo of your results slip, and the name on it must match your IC. Verify your name with your IC first in":"你的成绩会从成绩单照片读取，而成绩单上的姓名必须和身份证一致。请先在以下页面用身份证核实姓名：","Sign in to fill in your portfolio":"登入后才能填写你的档案","Your portfolio keeps your verified name, results, profile, saved programmes, application and payment in one place, on any device.":"你的档案会把已核实的姓名、成绩、个人资料、收藏的课程、报名和付款集中保存，在任何设备上都能使用。","After you sign in":"登入之后","Verify your name with your IC.":"用身份证核实你的姓名。","AI reads the name on the front of your IC. We keep only your name and the last 4 digits.":"AI 会读取身份证正面的姓名。我们只保留你的姓名和号码最后 4 位数。","Upload your results slip":"上传你的成绩单","(official SPM results or trial results). AI reads your grades and checks that the name on the slip is the same as on your IC.":"（SPM 正式成绩或模拟考成绩）。AI 会读取你的成绩，并核对成绩单上的姓名是否和身份证一致。","Apply and get scholarships":"报名并申请奖学金","with the same verified name, results and details.":"使用同一个已核实的姓名、成绩和资料。","✓ From your IC (verified). Your results slip and scholarship use the same name.":"✓ 来自你的身份证（已核实）。成绩单和奖学金都使用同一个姓名。","In capital letters, exactly as on your IC, for example TAN WEI MING. Verify your name with your IC in My portfolio to fill it in for you.":"请用大写字母，和身份证上完全一致，例如 TAN WEI MING。在「我的档案」用身份证核实姓名后会自动填入。","Your name comes from your IC, exactly as printed (for example TAN LI LI), and cannot be typed in. The name on your results slip must match it, so your results, scholarships and applications are accurate. It is also needed to book a free consultation. Everything else here is optional. Your name and WhatsApp number are filled in on the consultation and application forms for you. Your status and interests help our counsellors suggest courses.":"你的姓名来自身份证，和印在上面的完全一致（例如 TAN LI LI），不能自行输入。成绩单上的姓名必须与它一致，这样你的成绩、奖学金和报名资料才准确。预约免费咨询也需要它。其他资料都是选填。你的姓名和 WhatsApp 号码会自动填进咨询表格和报名表；升学阶段和兴趣能帮助顾问为你推荐课程。",
 "Eduplan could not be reached. Check your connection and try again in a few minutes.":"无法连接 Eduplan。请检查网络，几分钟后再试。","Eduplan's server had a problem. Please try again in a few minutes. If it keeps happening, please tell Eduplan.":"Eduplan 服务器出现问题，请几分钟后再试。如果一直这样，请告诉 Eduplan。",
 "Bachelor's Degree":"学士学位","All":"全部","Scholarship tracker":"奖学金追踪","Payment":"付款","Next: pay your tuition fees":"下一步：缴付学费","Choose to pay per semester or in full, then your payment method (FPX, Touch 'n Go eWallet or PayPal).":"选择按学期分期或一次付清，再选择付款方式（FPX、Touch 'n Go 电子钱包或 PayPal）。","Pay tuition fees":"缴付学费","Payment comes after you choose a programme and apply.":"选好课程并报名后，才能付款。","Find a programme":"寻找课程","The tuition fee for this programme is not listed yet, so it cannot be paid online. A counsellor will confirm the amount with you.":"这个课程的学费尚未列出，所以暂时无法在线付款。顾问会和你确认金额。","Ask a counsellor":"咨询顾问","Total to pay":"应付总额","How would you like to pay?":"你想怎么付款？","Choose a payment plan.":"请选择付款计划。","Per semester (instalments)":"按学期分期付款","Pay each semester before it starts.":"每个学期开学前缴付。","Full payment":"一次付清","Pay the whole programme now.":"现在一次付清整个课程的学费。","Choose payment method":"选择付款方式","Choose a payment method":"选择付款方式","Plan":"付款计划","Change":"更改","Amount due now":"本次应付","FPX online banking":"FPX 网上银行","Pay from your Malaysian bank account":"从你的马来西亚银行户口付款","Touch 'n Go eWallet":"Touch 'n Go 电子钱包","Pay with the TNG eWallet app":"用 TNG 电子钱包应用付款","PayPal":"PayPal","Pay with a PayPal account or card":"用 PayPal 账户或银行卡付款","Choose how to pay. You will be taken to the payment provider's own page to pay; Eduplan never sees your bank or card details.":"请选择付款方式。付款时会跳转到付款服务商自己的页面；Eduplan 不会看到你的银行或银行卡资料。","Online payment works on the live Eduplan website. This preview shows the steps only.":"在线付款只能在正式的 Eduplan 网站使用。这个预览版只展示步骤。","to pay, so the payment is linked to your application.":"后再付款，让付款记录和你的报名资料连接在一起。","Continue to payment":"前往付款","Please wait…":"请稍候……","Back":"返回","Please sign in again.":"请重新登入。","Could not start the payment. Please try again, or ask a counsellor.":"无法开始付款，请再试一次或咨询顾问。","Could not reach Eduplan. Check your connection and try again.":"无法连接 Eduplan，请检查网络后再试。","My payment":"我的付款","Payment request":"付款申请","After you apply for a programme, choose here how to pay the tuition fees: per semester or in full.":"报名课程后，可以在这里选择学费的付款方式：按学期分期或一次付清。","Programme":"课程","Not chosen yet":"尚未选择","Last request":"最近的付款申请","Change plan or pay":"更改计划或付款","Choose how to pay":"选择付款方式","a password, bank or card numbers (you pay on the payment provider’s own page: FPX, Touch ’n Go or PayPal), or your IC number when you sign in. Your full IC number is asked only on the application form.":"密码、银行或银行卡号码（付款在付款服务商自己的页面进行：FPX、Touch ’n Go 或 PayPal），或在登入时要求身份证号码。完整的身份证号码只会在报名表里询问。","There are no advertising or tracking cookies, and no analytics tools from other companies on this website.":"本网站没有广告或追踪 Cookie，也没有使用其他公司的流量分析工具。","Eduplan counts visits anonymously: how many visits each day, whether the visitor was signed in, and which route (interest, scholarship or guidance) was open. No cookie, IP address or other identifier is kept.":"Eduplan 会匿名统计访问：每天有多少次访问、访客是否已登入，以及打开的是哪一种导向（兴趣、奖学金或引导）。不使用 Cookie，也不保存 IP 地址或任何识别资料。","Visit counted":"已统计访问","A mark that this tab's visit was counted, so it is counted once":"标记这个分页的访问已统计，避免重复计算","✓ Verified with your IC":"✓ 已用身份证核实","Sign in":"登入",", then verify your name with a photo of your IC.":"，然后用身份证照片核实你的姓名。","Verifying your name with your IC works on the live Eduplan website.":"用身份证核实姓名只能在正式的 Eduplan 网站使用。","Reading your IC… This takes up to a minute.":"正在读取你的身份证……最多需要一分钟。","🪪 Verify my name with my IC":"🪪 用身份证核实我的姓名","Take a photo of the front of your IC (MyKad or MyKid; international students: passport photo page). AI reads your name. We keep only your name and the last 4 digits of the number; the photo is not stored.":"拍摄身份证正面（MyKad 或 MyKid；国际学生请拍护照资料页）。AI 会读取你的姓名。我们只保留你的姓名和号码最后 4 位数；照片不会被保存。","This does not look like the front of an IC (MyKad or MyKid) or a passport photo page. Take a clear photo of the front of your IC.":"这看起来不是身份证（MyKad 或 MyKid）正面或护照资料页。请拍一张清晰的身份证正面照片。","Your name":"你的姓名","Your name is verified with your IC; it is needed to book a free consultation. Everything else here is optional. Your name and WhatsApp number are filled in on the consultation and application forms for you. Your status and interests help our counsellors suggest courses.":"你的姓名需要用身份证核实，预约免费咨询时会用到。其他资料都是选填。你的姓名和 WhatsApp 号码会自动填进咨询表格和报名表；升学阶段和兴趣能帮助顾问为你推荐课程。","Verify your name to book a free consultation":"核实姓名后即可预约免费咨询","You are browsing as a guest. Free consultations are for students whose name is verified with their IC, so our counsellors know who they are speaking to.":"你目前是访客身份。免费咨询只开放给已用身份证核实姓名的学生，让顾问清楚知道在和谁沟通。","Verify your name":"核实你的姓名","Full name":"全名","✓ Verified student":"✓ 已核实学生","Guest: verify your name with your IC in My profile":"访客：请在「我的个人资料」用身份证核实姓名","To book a free consultation":"预约免费咨询时","A photo of the front of your IC (or passport photo page) so AI can confirm your name. We keep only your name and the last 4 digits of the number; the photo and the full number are not stored. Without it you browse as a guest.":"身份证正面（或护照资料页）照片，让 AI 确认你的姓名。我们只保留你的姓名和号码最后 4 位数；照片和完整号码都不会被保存。没有核实的话，你会以访客身份浏览。","Your verified name and the last 4 digits of your IC, and the optional WhatsApp number, status and interests you filled in":"你已核实的姓名、身份证最后 4 位数，以及你选填的 WhatsApp 号码、升学阶段和兴趣","a password, bank or card numbers (payments are made to the university), or your IC number when you sign in. Your full IC number is asked only on the application form.":"密码、银行或信用卡号码（费用直接付给大学），或在登入时要求身份证号码。完整的身份证号码只会在报名表里询问。","🔒 Read from your results slip":"🔒 已从你的成绩单读取","Upload a new slip in My results":"在「我的成绩」上传新的成绩单","Your grades are read from a photo of your results slip.":"你的成绩会从成绩单照片读取。","to upload it.":"以上传成绩单。","📷 Photo of my results slip":"📷 拍摄／上传成绩单","AI reads your grades and fills them in. They are locked: they cannot be typed in or changed.":"AI 会读取你的成绩并自动填入。成绩会被锁定，不能自行输入或修改。","Official results":"正式成绩","Trial results":"模拟考成绩","This does not look like a results slip. Upload a clear photo or PDF of your results slip.":"这看起来不是成绩单。请上传清晰的成绩单照片或 PDF。","This slip is for a different exam. Choose the right exam above, or upload the right slip.":"这张成绩单属于另一种考试。请在上方选择正确的考试，或上传正确的成绩单。","This looks like a trial or school report, not the official results. Choose Trial results, or upload the official slip.":"这看起来是模拟考或学校成绩报告，不是正式成绩。请选择「模拟考成绩」，或上传正式成绩单。","The grades could not be read clearly. Upload a sharper photo with the whole slip in view.":"无法清楚读取成绩。请上传更清晰、拍到整张成绩单的照片。","The file is larger than 5 MB. Upload a smaller photo or PDF.":"文件超过 5 MB，请上传较小的照片或 PDF。","Please sign in again, then upload your slip.":"请重新登入，再上传成绩单。","Too many slips were checked today. Please try again tomorrow, or ask a counsellor.":"今天检查的成绩单太多了，请明天再试，或咨询顾问。","The checker is busy. Please try again in a minute.":"系统繁忙，请一分钟后再试。","Reading results slips is not available yet. Please ask a counsellor.":"暂时无法读取成绩单，请咨询顾问。","Could not reach Eduplan. Check your connection and try again.":"无法连接 Eduplan，请检查网络后再试。","Choose a photo (JPG, PNG) or PDF of your slip.":"请选择成绩单的照片（JPG、PNG）或 PDF。","Choose a photo or PDF of your slip first.":"请先选择成绩单的照片或 PDF。","Name on the slip:":"成绩单上的姓名：","These grades come from your slip and cannot be typed in or changed here. Upload a new slip to replace them, for example when your official results come out. If something was read wrongly, ask a counsellor.":"这些成绩来自你的成绩单，不能在这里输入或修改。如需更新（例如正式成绩公布后），请上传新的成绩单。如果读取有误，请咨询顾问。","to upload your slip.":"以上传你的成绩单。","Reading your slip… This takes up to a minute.":"正在读取你的成绩单……最多需要一分钟。","Upload a new slip":"上传新的成绩单","Which results slip?":"哪一种成绩单？","Trial results (school trial exam)":"模拟考成绩（学校模拟考）","Photo or PDF of the slip":"成绩单照片或 PDF","Max 5 MB. AI reads your grades; the slip itself is not stored.":"最大 5 MB。AI 会读取你的成绩；成绩单本身不会被保存。","Read my results":"读取我的成绩","Preview: type your results here to try the website. On the live Eduplan website, results are read from your results slip by AI and cannot be typed in.":"预览版：你可以在这里输入成绩来试用网站。在正式的 Eduplan 网站上，成绩由 AI 从你的成绩单读取，不能自行输入。","Your results":"你的成绩","Not added yet":"尚未添加","Upload your results slip":"上传你的成绩单","Results slip:":"成绩单：","when you upload it in My results, it is sent through Eduplan’s server to Anthropic’s Claude to read your subjects and grades. The slip itself is not stored; only the grades are kept, with a mark that they were read from your slip.":"在「我的成绩」上传时，成绩单会经由 Eduplan 的服务器发送给 Anthropic 的 Claude 读取科目和成绩。成绩单本身不会被保存，只保留成绩，并注明是从你的成绩单读取的。","To sign in we only ask for":"登入只需要","Your email":"你的电邮","Your account; we send the sign-in code and reminders here.":"作为你的账户，登入验证码和提醒都会发到这里。","A one-time code":"一次性验证码","Proves the email is yours. No password to remember.":"证明电邮是你本人的，不用记密码。","Your agreement":"你的同意","To how Eduplan uses your portfolio (Malaysia’s Personal Data Protection Act 2010).":"同意 Eduplan 如何使用你的档案（马来西亚《2010 年个人资料保护法令》）。","Everything else is optional, or asked only when you apply. We never ask for a password or card details.":"其他资料都是选填，或者等你报名时才问。我们绝不会要求密码或银行卡资料。","What we ask for, and when":"我们收集什么资料、什么时候收集","I agree that Eduplan keeps my portfolio (saved programmes, quiz result, results, profile, consultation request and application details) to guide me with my studies. Only Eduplan staff can see it; it goes to a university only when I submit an application. I can delete it at any time. If I am under 18, I have asked my parent or guardian.":"我同意 Eduplan 保存我的档案（收藏的课程、测验结果、成绩、个人资料、咨询申请及报名资料），用于升学辅导。只有 Eduplan 职员可以查看；只有在我提交报名时，资料才会交给大学。我可以随时删除。如果我未满 18 岁，我已经征求父母或监护人的同意。","My profile":"我的个人资料","Optional: fill in only what you want, and skip the rest. Your name and WhatsApp number are filled in on the consultation and application forms for you. Your status and interests help our counsellors suggest courses.":"选填：想填多少都可以，其他可以跳过。你的名字和 WhatsApp 号码会自动填进咨询表格和报名表。你的升学阶段和兴趣能帮助顾问为你推荐课程。","Your name":"你的名字","(optional)":"（选填）","WhatsApp number":"WhatsApp 号码","For counsellor follow-ups and deadline reminders.":"用于顾问跟进和截止日期提醒。","Where are you now?":"你目前的阶段？","Choose":"请选择","Form 4 or Form 5 student":"中四或中五学生","Waiting for SPM results":"正在等 SPM 成绩","Finished SPM":"已考完 SPM","In pre-university (Form 6, A-Level, foundation, matriculation)":"正在读大学先修（中六、A-Level、预科、大学先修班）","Studying at a college or university":"正在学院或大学就读","Where would you like to study?":"你想在哪里升学？","Anywhere in Malaysia":"马来西亚各地","Fields you are interested in":"你感兴趣的领域","Exam results are kept in My results above. Saved as you type to your portfolio.":"考试成绩保存在上方的「我的成绩」。输入时会自动保存到你的档案。","Exam results are kept in My results above. Saved as you type in this browser.":"考试成绩保存在上方的「我的成绩」。输入时会自动保存在这个浏览器。","The optional name, WhatsApp number, status and interests you filled in":"你选填的名字、WhatsApp 号码、升学阶段和兴趣","Until you change them or clear this browser":"直到你更改或清除这个浏览器的资料为止","To sign in":"登入时","Only your email, a one-time code sent to it, and your agreement to this notice. No password.":"只需要你的电邮、发到电邮的一次性验证码，以及你同意本说明。不需要密码。","In My profile (optional)":"在「我的个人资料」（选填）","Your name, WhatsApp number, where you are in your studies, your exam results and the fields and places you are interested in. You can skip any of them; the website works without them.":"你的名字、WhatsApp 号码、升学阶段、考试成绩，以及感兴趣的领域和地区。每一项都可以跳过，不填也能使用网站。","When you apply":"报名时","Your full name as on your IC, IC number, date of birth, address, documents and, for students under 18, a parent or guardian’s details. Some universities’ own forms also ask for things like religion or health; these are asked only on that university’s form. Before your application goes to the university, you are asked to agree to it.":"与身份证一致的全名、身份证号码、出生日期、地址、文件，以及未满 18 岁学生的父母或监护人资料。有些大学自己的报名表还会问宗教或健康状况等，这些只会在该大学的报名表里询问。报名资料交给大学之前，会先请你同意。","We never ask for:":"我们绝不会要求：","a password, bank or card numbers (payments are made to the university), or your IC number when you sign in.":"密码、银行或信用卡号码（费用直接付给大学），或在登入时要求身份证号码。","Register":"注册","Visitor":"访客","First time here? Create a free account in one minute.":"第一次来？一分钟免费注册账户。","Already have an account? Sign in with your email.":"已经有账户？用电邮登入。","Just looking? Browse fields of study, faculties, courses and universities.":"只想看看？浏览热门学科、科系、课程和大学。","How do you want to use Eduplan?":"你想以什么身份使用 Eduplan？","You are browsing as a visitor":"你正在以访客身份浏览","Register or sign in to search by scholarship, interest or guidance, match scholarships to your results and save your progress.":"注册或登入后，就可以按奖学金、兴趣或引导导向搜索，按成绩配对奖学金，并保存你的进度。","Register or sign in to search by scholarship, interest or guidance. Visitors can browse fields of study, faculties, courses and universities.":"注册或登入后，就可以按奖学金、兴趣或引导导向搜索。访客可以浏览学科、科系、课程和大学。","Plan your studies in Malaysia: courses, universities and scholarships.":"规划你在马来西亚的升学：课程、大学和奖学金。","Members only":"会员专属","Register or sign in to continue":"请注册或登入以继续","Searching by scholarship, interest or guidance is for Eduplan members. It is free: register once with your email, no password needed.":"按奖学金、兴趣或引导导向搜索是 Eduplan 会员专属功能。注册免费：用电邮注册一次，不需要密码。","Match scholarships to your exam results":"按你的考试成绩配对奖学金","Take the interest quiz and get faculties that suit you":"做兴趣测验，找到适合你的科系","Save programmes and continue on any device":"收藏课程，在任何设备上继续","Visitors can still browse:":"访客仍然可以浏览：","Faculties and courses":"科系和课程","Register: create your free account":"注册：创建你的免费账户","Sign in to your account":"登入你的账户","Enter your email and we send you a 6-digit code. No password needed.":"输入你的电邮，我们会发送 6 位数验证码给你。不需要密码。","Enter the email you registered with. We send you a 6-digit code to sign in.":"输入你注册时使用的电邮，我们会发送 6 位数验证码让你登入。","Already have an account?":"已经有账户？","First time here?":"第一次来？","Registering and signing in work on the live Eduplan website. In this preview, your saved programmes and quiz result stay in this browser.":"注册和登入只能在正式的 Eduplan 网站使用。在这个预览版里，你收藏的课程和测验结果只保存在这个浏览器。","Tap below to try everything a member can do in this preview.":"点下方按钮，在预览版里体验会员的全部功能。","Privacy and security":"隐私与安全","Privacy, cookies and security":"隐私、Cookie 与安全","How Eduplan keeps your information safe, what is stored in your browser and what is sent to Eduplan.":"Eduplan 如何保护你的资料、你的浏览器里保存了什么，以及哪些资料会发送给 Eduplan。","Cookies":"Cookie","Eduplan does not use cookies.":"Eduplan 不使用 Cookie。","There are no advertising or tracking cookies, and no analytics tools on this website.":"本网站没有广告或追踪 Cookie，也没有使用任何流量分析工具。","To remember your progress, the website uses your browser’s own storage (local storage and session storage). It stays on your device and is not sent anywhere unless you sign in or submit a form.":"为了记住你的进度，网站使用浏览器自带的储存空间（local storage 和 session storage）。这些资料只留在你的设备上，除非你登入或提交表格，否则不会发送到任何地方。","What this browser keeps":"这个浏览器保存的资料","What":"项目","Contents":"内容","Kept":"保存期限","Language":"语言","English or 中文":"English 或中文","Until you change it":"直到你更改为止","Your exam subjects and grades":"你的考试科目和成绩","Until you remove them or clear this browser":"直到你删除或清除这个浏览器的资料为止","Saved and recent programmes":"收藏和最近浏览的课程","Programmes you saved or opened":"你收藏或打开过的课程","Interest quiz":"兴趣测验","Your quiz answers":"你的测验答案","Until you retake it or clear this browser":"直到你重新测验或清除这个浏览器的资料为止","Searches":"搜索记录","Your last search and route":"你上次的搜索和选择的导向","Until you clear them":"直到你清除为止","Scholarship choice":"选择的奖学金","The scholarship you chose for each programme":"你为每个课程选择的奖学金","Consultation request":"咨询申请","Details you typed in the consultation form":"你在咨询表格里填写的资料","Until you clear this browser":"直到你清除这个浏览器的资料为止","Sign-in":"登入","Your email and a sign-in token":"你的电邮和登入凭证","30 days, or until you sign out":"30 天，或直到你登出为止","Application in progress":"填写中的报名表","The application form you are filling in":"你正在填写的报名表","Until you close the tab":"直到你关闭这个分页为止","AI assistant":"AI 助手","Your latest chat messages":"你最近的聊天内容","Clear Eduplan data from this browser":"清除这个浏览器里的 Eduplan 资料","This removes everything above from this browser and signs you out here. A portfolio saved to your account stays there; delete it from My portfolio.":"这会从这个浏览器删除以上所有资料，并在这里登出。已保存到账户的档案不会被删除；如需删除，请到「我的档案」操作。","Eduplan data was cleared from this browser.":"已清除这个浏览器里的 Eduplan 资料。","What is sent to Eduplan":"哪些资料会发送给 Eduplan","My portfolio (only when you sign in):":"我的档案（仅在你登入时）：","your saved programmes, quiz result, results, profile, consultation request and application details are saved to Eduplan’s Google account so you can continue on any device. Eduplan also keeps when you registered, signed in, signed out and last used the website.":"你收藏的课程、测验结果、成绩、个人资料、咨询申请和报名资料会保存到 Eduplan 的 Google 账户，让你可以在任何设备上继续。Eduplan 也会记录你注册、登入、登出和最后使用网站的时间。","Applications:":"报名：","your form and documents are kept in a private folder that only Eduplan staff can open, and are shared with the university you apply to so it can process your application.":"你的报名表和文件保存在只有 Eduplan 职员才能打开的私人文件夹里，并会提供给你报读的大学以处理你的申请。","AI study assistant:":"AI 升学助手：","your messages are sent through Eduplan’s server to Anthropic’s Claude to write the reply. Please do not type your IC number, phone number or other personal details in the chat.":"你的讯息会经由 Eduplan 的服务器发送给 Anthropic 的 Claude 来生成回复。请不要在聊天中输入身份证号码、电话号码或其他个人资料。","Consultation requests:":"咨询申请：","sent to Eduplan so a counsellor can contact you.":"会发送给 Eduplan，让顾问联系你。","How your account is protected":"我们如何保护你的账户","No passwords: you sign in with a 6-digit code sent to your email. The code works for 10 minutes and allows 5 tries.":"不需要密码：你用发送到电邮的 6 位数验证码登入。验证码 10 分钟内有效，最多可尝试 5 次。","You stay signed in for 30 days. Eduplan’s server keeps only a scrambled (hashed) copy of your sign-in token.":"登入状态保持 30 天。Eduplan 的服务器只保存经过加密处理（哈希）的登入凭证。","Signing out ends the sign-in on Eduplan’s server and removes your details from this browser. Please sign out on a shared computer.":"登出会结束 Eduplan 服务器上的登入，并从这个浏览器删除你的资料。使用公用电脑时请记得登出。","The website and Eduplan’s server talk over an encrypted connection (HTTPS).":"网站与 Eduplan 服务器之间使用加密连接（HTTPS）。","Eduplan’s service keys are kept on the server, never in the website.":"Eduplan 的服务密钥只保存在服务器上，绝不会放在网站里。","Your choices":"你的选择","Use the website without signing in: your progress then stays in this browser only.":"不登入也可以使用网站：你的进度只会保存在这个浏览器里。","Delete your portfolio at any time from":"你可以随时在以下页面删除你的档案：","Under Malaysia’s Personal Data Protection Act 2010 you may ask to see or correct your personal data.":"根据马来西亚《2010 年个人资料保护法令》，你可以要求查阅或更正你的个人资料。","Contact Eduplan":"联系 Eduplan","Eduplan uses no cookies and no tracking. Your progress (results, saved programmes, language) is kept in this browser only, until you sign in.":"Eduplan 不使用 Cookie，也不追踪你。你的进度（成绩、收藏的课程、语言）只保存在这个浏览器里，直到你登入为止。","No cookies or tracking. What this browser keeps":"不使用 Cookie、不追踪。浏览器保存了什么","Privacy notice":"隐私提示","Your scholarship and what you pay":"你的奖学金与应付学费","in My portfolio to see the scholarships you qualify for here and the tuition you would pay.":"保存在「我的档案」，即可在这里看到你符合资格的奖学金和需要支付的学费。","Total you pay":"你需要支付","Your results qualify for these. Choose one to see the total.":"你的成绩符合以下奖学金，选择一项即可查看总额。","No scholarship":"不使用奖学金","(whole programme)":"（整个课程）","(per year)":"（每年）","The fee for this programme is not listed yet, so the total cannot be worked out.":"这个课程的学费尚未列出，所以无法计算总额。","Tuition fee":"学费","whole programme":"整个课程","per year":"每年","tuition waiver":"学费减免","scholarships you qualify for":"项你符合资格的奖学金","scholarship you qualify for":"项你符合资格的奖学金","scholarship award":"奖学金金额","almost there: one step away":"差一步就能获得","See my scholarships":"查看我的奖学金","in My portfolio, and Eduplan tracks which scholarships you qualify for.":"保存在「我的档案」，Eduplan 会自动追踪你符合资格的奖学金。","Programme type":"课程类型","Master's Degree":"硕士学位","PhD":"博士","Full-time":"全日制","Part-time":"兼读制",
 /* Scholarship flow */
 "Scholarship-based":"奖学金导向","Scholarship type":"奖学金类别","Scholarship":"奖学金","Requirements":"申请条件","University":"院校","Scholarship details":"奖学金详情","Choose a scholarship":"选择奖学金","Details":"详情",
 "Choose a scholarship type":"选择奖学金类别","Scholarships come from two places. Pick one to continue.":"奖学金有两种来源，请选择其中一种继续。",
 "Foundation Scholarship":"基金会奖学金","Campus Scholarship":"大学奖学金",
 "Scholarships and financial aid from foundations and funds":"由基金会及基金提供的奖学金与助学金","Scholarships offered by colleges / universities":"由学院／大学提供的奖学金",
 "Continue":"继续","Choose a foundation scholarship":"选择基金会奖学金","View requirements":"查看申请条件","Award: what you get":"奖励：你可以获得","Information is for reference only. Please confirm with the official website.":"资料仅供参考，请以官方网站为准。","See official information":"请查看官方资料","See official information.":"请查看官方资料。","Requirements and award":"申请条件与奖励","Search scholarships":"搜索奖学金","e.g. engineering, B40, SPM, Petronas":"例如 engineering、B40、SPM、Petronas","No scholarship matches. Try another word.":"没有符合的奖学金，请换一个关键词。","See all":"查看全部","No foundation scholarships listed yet.":"暂未列出基金会奖学金。",
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
 [/^The name on this slip \((.+)\) does not match the name on your IC \((.+)\)\. Upload your own results slip\.$/,"这张成绩单上的姓名（$1）和你身份证上的姓名（$2）不一致。请上传你本人的成绩单。"],
 [/^Choice (\d)$/,"第 $1 志愿"],[/^Have you applied to (\S+) before\?$/,"你以前申请过 $1 吗？"],[/^(\S+) ID no\.$/,"$1 学号"],[/^(\S+) application form$/,"$1 报名表"],[/^Your choices need (.+)\.$/,"你选择的课程需要在 $1 就读。"],
 [/^Choose up to 5 degree programmes you would like to study after the (.+), in order of preference\. You are offered a degree on condition that you enrol in and pass the foundation programme\.$/,"请按志愿顺序选择预科（$1）毕业后想读的学位课程，最多 5 个。你需要报读并通过预科课程，才能获得学位课程的录取。"],
 [/^(Official results slip|Trial exam results slip) \((.+)\)$/,function(m){return (m[1]==="Official results slip"?"正式成绩单":"模拟考（Trial）成绩单")+"（"+m[2]+"）";}],
 [/^Your results qualify for (\d+) campus scholarships?\. Each one checks other conditions too, so read its details before you apply\.$/,"你的成绩符合 $1 项校内奖学金。每项奖学金还有其他条件，申请前请先查看详情。"],
 [/^With your (.+) results$/,"以你的 $1 成绩"],
 /* Scholarship tiers checked from My results grades (results.js needWords): UEC points, STPM averages, A-Level grade sets. */
 [/^(Next: )?Needs (\d+) points or fewer in your best (\d+) subjects for (\d+)% tuition waiver(?: \(you have (\d+)\))?$/,function(m){return (m[1]?"下一级：":"")+"需要最好的 "+m[3]+" 科总积分不超过 "+m[2]+" 分，可获 "+m[4]+"% 学费减免"+(m[5]?"（你的是 "+m[5]+" 分）":"");}],
 [/^(Next: )?Needs an average of ([\d.]+) in your best (\d+) subjects for (\d+)% tuition waiver(?: \(you have ([\d.]+)\))?$/,function(m){return (m[1]?"下一级：":"")+"需要最好的 "+m[3]+" 科平均绩点达到 "+m[2]+"，可获 "+m[4]+"% 学费减免"+(m[5]?"（你的是 "+m[5]+"）":"");}],
 [/^(Next: )?Needs ([A-E*]{2,6}(?: or [A-E*]{2,6})*) for (\d+)% tuition waiver(?: \(you have ([A-E*]+)\))?$/,function(m){return (m[1]?"下一级：":"")+"需要 "+m[2].replace(/ or /g," 或 ")+"，可获 "+m[3]+"% 学费减免"+(m[4]?"（你的是 "+m[4]+"）":"");}],
 [/^(Next: )?(\d+) more As? for (\d+)% tuition waiver$/,function(m){return (m[1]?"下一级：":"")+"再多 "+m[2]+" 个 A 可获 "+m[3]+"% 学费减免";}],
 [/^(Next: )?Needs CGPA ([\d.]+) for (\d+)% tuition waiver$/,function(m){return (m[1]?"下一级：":"")+"需要 CGPA "+m[2]+"，可获 "+m[3]+"% 学费减免";}],
 [/^(Next: )?Needs (\d+) (\S+?)(?: or (\S+))? for (\d+)% tuition waiver \(you have (\d+)\)$/,function(m){return (m[1]?"下一级：":"")+"需要 "+m[2]+" 个 "+m[3]+(m[4]?" 或 "+m[4]:"")+"，可获 "+m[5]+"% 学费减免（你有 "+m[6]+" 个）";}],
 [/^(\d+)% tuition waiver$/,"$1% 学费减免"], /* My results: summaries and entry-requirement matches (assets/js/results.js) */
 [/^For each grade, add the subjects you got that grade in\. Counts as A in (.+?): (.+)\.$/,"在每个等级加入你考获该等级的科目。$1 中算作 A 的等级：$2。"],
 [/^Remove my (.+) results$/,"删除我的 $1 成绩"],[/^(\d+) As?$/,"$1 个 A"],
 [/^You meet the entry requirements \((.+)\)$/,"✓ 你的 $1 成绩符合入学条件"],[/^Your (.+?) grades meet the requirements$/,"✓ 你的 $1 成绩符合要求"],
 [/^(.+) not accepted directly$/,"$1 不能直接报读"],[/^(.+) is not accepted directly for this programme$/,"此课程不接受直接以 $1 报读"],
 [/^Your (.+?) results meet the entry requirements(?: \((.+)\))?$/,function(m){return "✓ 你的 "+m[1]+" 成绩符合入学条件"+(m[2]?"（"+m[2]+"）":"");}],
 [/^Your (.+?) grades meet the requirements\. Also check: (.+)$/,"✓ 你的 $1 成绩符合要求。另请留意：$2"],
 [/^Needs (.+?)(?: and (\d+) more)?$/,function(m){return "还需要："+needZh(m[1])+(m[2]?"，另有 "+m[2]+" 项":"");}],
 [/^Not yet with your (.+?) results: needs (.+)$/,function(m){return "你的 "+m[1]+" 成绩暂未符合，还需要："+m[2].split("; ").map(needZh).join("；");}], [/^Page (\d): (.+)$/,function(m){return "第 "+m[1]+" 页："+tr(m[2]);}],
 [/^(\d+) courses?$/,"$1 门课程"],
 [/^(\d+) scholarships?$/,"$1 项奖学金"],
 [/^(\d+) universit(?:y|ies)$/,"$1 所大学"],
 [/^Scholarships \((\d+)\)$/,"奖学金（$1）"],
 [/^Opens (.+)\u2019s official virtual tour in a new tab\.$/,"在新分页打开 $1 的官方虚拟导览。"],
 [/^(.+) \u00b7 (Foundation|Undergraduate|Postgraduate)$/,function(m){return m[1]+" · "+LEVEL[m[2]];}],
 [/^No (foundation|undergraduate|postgraduate) programmes listed for (.+) yet\.$/,function(m){return m[2]+" 暂未列出"+LEVEL[m[1].charAt(0).toUpperCase()+m[1].slice(1)]+"课程。";}],
 [/^(.+) \u00b7 (\d+)$/,function(m){var z=tr(m[1]);return (z||m[1])+" · "+m[2];}],
 [/^(\d+) programmes?$/,"$1 个课程"],
 [/^RM ([\d,]+) \(Local\); RM ([\d,]+) \(International(, subject to 6% Sales & Service Tax \(SST\))?\)\.( Fees subject to 6% Sales & Service Tax \(SST\)\.)?$/,function(m){return "RM "+m[1]+"（本地生）；RM "+m[2]+"（国际生"+(m[3]?"，另加 6% 销售与服务税":"")+"）。"+(m[4]?"学费另加 6% 销售与服务税。":"");}],
 [/^(\d+) programmes?\. Tap a programme to see fees, entry requirements and scholarships\.$/,"共 $1 个课程。点选课程查看学费、入学条件和奖学金。"],
 [/^Intakes: (.+)$/,"开课月份：$1"],
 [/^Other scholarships, grants and financial aid at (.+)\.$/,"$1 的其他奖学金、助学金与经济援助。"],
 [/^We emailed a 6-digit code to (.+)\. It expires in 10 minutes\.$/,"验证码已发送到 $1，10 分钟内有效。"],
 [/^(\d+) of (\d+) questions answered\.$/,"已回答 $1／$2 题。"],
 [/^Part (\d+) of (\d+): (.+)$/,function(m){return "第 "+m[1]+" 部分，共 "+m[2]+" 部分："+(tr(m[3])||m[3]);}],
 [/^Next: choose your programme at (.+)$/,"下一步：选择 $1 的课程"],[/^See (.+) programmes$/,"查看 $1 的课程"],
 [/^Eduplan can help you find a hostel or a room near (.+)\.$/,"Eduplan 可以协助你在 $1 附近找宿舍或房间。"],
 [/^Photo or PDF, up to (\d+) files\.$/,"照片或 PDF，最多 $1 个文件。"],
 [/^Send this summary and your document photos to Eduplan by WhatsApp (.+) or email (.+)\.$/,"请把这份摘要和文件照片，通过 WhatsApp $1 或电邮 $2 发送给 Eduplan。"],
 [/^Up to (\d+)% tuition waiver$/,"最高 $1% 学费减免"],
 [/^Up to (\d+)%$/,"最高 $1%"],
 [/^(RM [\d,.]+) a semester × (\d+) semesters$/,"每学期 $1 × $2 个学期"],[/^(RM [\d,.]+) once$/,"一次付 $1"],[/^\(semester 1 of (\d+)\)$/,"（第 1 学期，共 $1 个学期）"],
 [/^Per semester: (RM [\d,.]+) × (\d+)$/,"按学期：$1 × $2"],[/^after (.+)$/,function(m){return "已扣除"+(tr(m[1])||m[1]);}],
 [/^Estimate for (the yearly fee × duration|the whole programme), 2 semesters a year\. The university's fee schedule decides the exact amounts and dates; Eduplan confirms the amount with you before you pay\.$/,function(m){return "以"+(m[1]==="the whole programme"?"整个课程的学费":"每年学费 × 年数")+"估算，每年按 2 个学期计算。实际金额和日期以大学的收费表为准；付款前 Eduplan 会先和你确认金额。";}],
 [/^is recorded\. Online payment is not open yet: a counsellor will send you the payment details for (RM [\d,.]+)\.$/,"已记录。在线付款尚未开放：顾问会把 $1 的付款资料发给你。"],
 [/^Payment request (.+) is recorded\. Online payment is not open yet: a counsellor will send you the payment details for (RM [\d,.]+)\.$/,"付款申请 $1 已记录。在线付款尚未开放：顾问会把 $2 的付款资料发给你。"],
 [/^The tuition fee for (.+) is not listed yet; a counsellor will confirm it\.$/,"$1 的学费尚未列出，顾问会和你确认。"],
 [/^✓ Verified by AI from your (official|trial) results slip · (.+)$/,function(m){var d=m[2].match(/^(\d+) (\w{3}) (\d{4})$/),t=d?d[3]+"年"+(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(d[2])+1)+"月"+d[1]+"日":m[2];return "✓ 已由 AI 从你的"+(m[1]==="trial"?"模拟考":"正式")+"成绩单核实 · "+t;}],
 [/^Upload your (.+) results slip$/,"上传你的 $1 成绩单"],[/^(IC|Passport) ending ••••(\w+)$/,function(m){return (m[1]==="IC"?"身份证":"护照")+"号码尾数 ••••"+m[2];}],[/^Remove my (.+) results$/,"删除我的 $1 成绩"],
 [/^Your (.+) results are read from your results slip by AI, so they cannot be typed in\.$/,"你的 $1 成绩由 AI 从成绩单读取，因此不能自行输入。"],
 [/^No results-based scholarship is listed for this level at (.+) yet\.$/,"$1 暂时没有列出这个学历层次、按成绩颁发的奖学金。"],
 [/^Your results in My results do not reach a scholarship tier at (.+) for this level yet\.$/,"你在「我的成绩」里的成绩，暂时还未达到 $1 这个学历层次的奖学金等级。"],
 [/^\(RM ([\d,]+) a year × (\d+(?:\.\d+)?) years?\)$/,"（每年 RM $1 × $2 年）"],[/^\((\d+)% tuition waiver\)$/,"（$1% 学费减免）"],[/^\((RM [\d,]+)\)$/,"（$1）"],
 [/^Estimate of tuition only(, from the yearly fee)?\. Other fees \(registration, hostel and others\) are not included\. Each scholarship has its own conditions, so confirm with (.+) before you apply\.$/,function(m){return "这只是学费估算"+(m[1]?"（按每年学费计算）":"")+"，不包括注册费、宿舍费等其他费用。每项奖学金都有自己的条件，申请前请先向 "+m[2]+" 确认。";}],[/^Up to RM ([\d,]+)$/,"最高 RM $1"],
 [/^Checked automatically with your (.+?) results in My results(?:: (.+))?\. Each scholarship checks other conditions too\.$/,function(m){return "已根据「我的成绩」里的 "+m[1].replace(/, /g,"、")+" 成绩自动检查"+(m[2]?"："+m[2].replace(/(\S+) (\d+)/g,"$1 $2 项"):"")+"。每项奖学金还有其他条件。";}],
 [/^Faculty (\d\d)$/,"科系 $1"],
 [/^Faculty (\d\d) · (.+)$/,"科系 $1 · $2"],
 [/^Explore Faculty (\d\d) · (.+)$/,"探索科系 $1 · $2"],
 [/^(.+)\. Choose a course to see which universities offer it\.$/,"$1。选择课程，查看开办该课程的大学。"],
 [/^(.+)\. Each card shows what the scholarship gives; tap it to see who can apply and every requirement\.$/,function(m){return tr(m[1])+"。每张卡片显示奖学金能提供什么；点进去可查看申请资格和全部申请条件。";}],
 [/^(\d+) requirements?$/,"$1 项申请条件"],[/^(\d+) more requirements?$/,"另有 $1 项申请条件"],[/^(\d+) of (\d+) scholarships match\.$/,"$2 项奖学金中有 $1 项符合。"],[/^See all (\d+) foundation scholarships$/,"查看全部 $1 项基金会奖学金"],
 [/^Closes (\d+) (\w{3}) (\d{4})$/,function(m){return "截止日期："+m[3]+"年"+(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m[2])+1)+"月"+m[1]+"日";}],
 [/^Closed on (\d+) (\w{3}) (\d{4})$/,function(m){return "已于 "+m[3]+"年"+(["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"].indexOf(m[2])+1)+"月"+m[1]+"日截止";}],
 [/^Closing date: (.+)$/,function(m){return "截止日期："+(tr(m[1])||m[1]);}],
 [/^(.+)\. Tap a scholarship to see its requirements\.$/,function(m){return tr(m[1])+"。点选奖学金查看申请条件。";}],
 [/^(.+)\. Tap a university to see its scholarship details\.$/,function(m){return tr(m[1])+"。点选大学查看奖学金详情。";}],
 [/^Question (\d+) of (\d+)$/,"第 $1 题，共 $2 题"],
 [/^(SPM|O-Level|UEC|STPM|A-Level) result$/,"$1 成绩"],
 [/^(.+) holders start a degree after Foundation, Matriculation or Diploma\. At undergraduate level the scholarship is based on that result\.$/,"$1 考生须先完成预科、大学先修班或文凭课程才能攻读学位，学士阶段的奖学金以该成绩为准。"],
 [/^See Foundation level for (.+)$/,"查看 $1 的预科阶段"],
 [/^(.+)’s scholarship table lists no (Foundation|Undergraduate) programme award for (.+)\.$/,function(m){return m[1]+" 的奖学金表格没有列出 "+m[3]+" 的"+LEVEL[m[2]]+"课程奖学金。";}],
 [/^See (Foundation|Undergraduate) level$/,function(m){return "查看"+LEVEL[m[1]]+"阶段";}],
 [/^Offered at (.+)\.$/,"开办院校：$1。"],
 /* APU form (school-forms.js all: true) */
 [/^(\S+) asks for this\.$/,"$1 的报名表需要这一项。"],[/^(\S+): international applicants$/,"$1：国际申请者"],
 [/^Which condition\? \((.+)\)$/,function(m){return "哪一种状况？（"+m[1].split(", ").map(function(x){return ({"Allergies":"过敏","Anemia":"贫血","Asthma":"哮喘","Colour Blindness":"色盲","Epilepsy":"癫痫","Heart Disease":"心脏病","Others":"其他"})[x]||x;}).join("、")+"）";}],
 [/^(\S+) Undergraduate Application Form: these questions are on \S+'s own form\. Level of study: (.+?)(?: · Specialism: (.+))?\.$/,function(m){var l={"Foundation":"预科","Foundation-ODL":"预科（线上）","APIIT Certificate":"APIIT 证书","Diploma":"文凭","Degree":"学位"}[m[2]]||m[2];return m[1]+" 本科报名表：以下问题来自 "+m[1]+" 自己的报名表。修读程度："+l+(m[3]?"・专业方向："+(tr(m[3])||m[3]):"")+"。";}],
 [/^(\d+(?:\.\d+)?) years?$/,"$1 年"],
 /* Yearly fees from a fee guide, e.g. "RM 28,000 (Malaysian students, 2026)." (the last line of a list ends with " (per year)") */
 [/^RM ([\d,]+) \(Malaysian students(, part-time)?, (\d{4})\)\.?( \(per year\))?$/,function(m){return "RM "+m[1]+"（马来西亚学生"+(m[2]?"，非全日制":"")+"，"+m[3]+" 年）"+(m[4]?"（每年）":"");}],
 [/^(.+?)\. (On-campus hostel\.|Partner hostel, 10 minutes by shuttle\.|No hostel\. Eduplan helps you find a rented room nearby\.)$/,function(m){return m[1]+"。"+tr(m[2]);}],
 [/^Phone \/ WhatsApp: (.*)$/,"电话／WhatsApp：$1"],[/^Email: (.*)$/,"电邮：$1"],[/^Address: (.*)$/,"地址：$1"],
 [/^Send to: WhatsApp (.+) or email (.+)\.$/,"发送至：WhatsApp $1 或电邮 $2。"],
 /* Last: "University · Level" under the chosen programme, each side translated on its own. */
 [/^(.+?) · (.+)$/,function(m){var a=tr(m[1]),b=tr(m[2]);return a==null&&b==null?null:(a==null?m[1]:a)+" · "+(b==null?m[2]:b);}]
];
/* "5 subjects at credit (C) or better (you have 3)" and similar parts of an entry-requirement match. */
function needZh(t){var m;
 if((m=t.match(/^(\d+) subjects at (.+?) or better \(you have (\d+)\)$/)))return m[1]+" 科 "+gradeZh(m[2])+" 或以上（你有 "+m[3]+" 科）";
 if((m=t.match(/^CGPA ([\d.]+) \(you have ([\d.]+)\)$/)))return "CGPA "+m[1]+"（你的是 "+m[2]+"）";
 if((m=t.match(/^(.+?) at (.+?) \(add your (.+) results\)$/)))return subjZh(m[1])+" 达到 "+gradeZh(m[2])+"（请填写你的 "+m[3]+" 成绩）";
 if((m=t.match(/^(.+?) at (.+?) or better$/)))return subjZh(m[1])+" 达到 "+gradeZh(m[2])+" 或以上";
 return t;}
function gradeZh(g){return g.replace(/^credit \((.+)\)$/,"优等（$1）").replace(/^pass \((.+)\)$/,"及格（$1）");}
function subjZh(s){return s.split(/(, | and | or )/).map(function(x){return x===", "?"、":x===" and "?" 和 ":x===" or "?" 或 ":(ZH[x]||x);}).join("");}
/* Other pages (lab/lab-zh.js) add their own text: window.EDUPLAN_ZH_EXTRA={text:{...},patterns:[[regex,replacement],...]}. */
(function(x){if(!x)return;Object.keys(x.text||{}).forEach(function(k){ZH[k]=x.text[k];});(x.patterns||[]).forEach(function(p){ZH_PATTERNS.unshift(p);});})(window.EDUPLAN_ZH_EXTRA);
/* Course details from the school sheets (names, structures, entry rules, notes): Chinese kept in assets/js/content-zh.js, made by tools/content-zh.md. */
if(window.EDUPLAN_CONTENT_ZH)Object.keys(window.EDUPLAN_CONTENT_ZH).forEach(function(k){if(!Object.prototype.hasOwnProperty.call(ZH,k))ZH[k]=window.EDUPLAN_CONTENT_ZH[k];});
/* Quiz questions and options carry their own Chinese in quiz-data.js. */
if(window.EDUPLAN_QUIZ)(window.EDUPLAN_QUIZ.questions||[]).forEach(function(q){ZH[q.q]=q.zh;q.a.forEach(function(a){ZH[a[0]]=a[1];});});
function tr(s){
 if(Object.prototype.hasOwnProperty.call(ZH,s))return ZH[s];
 for(var i=0;i<ZH_PATTERNS.length;i++){var m=s.match(ZH_PATTERNS[i][0]);
  if(m)return typeof ZH_PATTERNS[i][1]==="function"?ZH_PATTERNS[i][1](m):s.replace(ZH_PATTERNS[i][0],ZH_PATTERNS[i][1]);}
 return null;
}

var lang="en";try{if(localStorage.getItem("eduplan-lang")==="zh")lang="zh";}catch(e){}
var EN=new WeakMap(),OUT=new WeakMap(),ATTR=["placeholder","aria-label","alt","title","label"],SKIP="script,style,pre,[data-notr]";
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
