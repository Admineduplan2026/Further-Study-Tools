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
 "Choose this programme":"选择这个课程","Your choice":"你选择的课程","Any questions before you apply?":"报名前还有疑问吗？",
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
 "Signed in as":"已登录：",". Everything you do on Eduplan is saved automatically.":"。你在 Eduplan 的每一步都会自动保存。",
 "Keep your saved programmes, quiz result, consultation request and application in one place, and continue on any device.":"把收藏的课程、测验结果、咨询申请和报名表集中在一处，在任何装置都能继续。",
 "Sign in":"登录","Sign in or create your portfolio":"登录或建立你的档案","Enter your code":"输入验证码","6-digit code":"6 位数验证码",
 "No password needed. Each time you sign in, we email you a 6-digit code.":"不需要密码。每次登录，我们会把 6 位数验证码发到你的电邮。",
 "I agree that Eduplan keeps my portfolio (saved programmes, quiz result, consultation request and application details) to guide me with my studies. I can delete it at any time.":"我同意 Eduplan 保存我的档案（收藏的课程、测验结果、咨询申请及报名资料），用于升学辅导。我可以随时删除。",
 "Email me a code":"把验证码发到我的电邮","Checking…":"核对中…","Send a new code":"重新发送验证码","Use another email":"改用其他电邮",
 "Sent to":"已发送至",". Check your spam folder if it is not in your inbox.":"。如果收件箱没有，请查看垃圾邮件。",
 "Sign-in works on the live Eduplan website. In this preview, your saved programmes and quiz result stay in this browser.":"登录功能在正式的 Eduplan 网站上使用。在此预览版，收藏的课程和测验结果保存在这个浏览器。",
 "Please tick to agree first.":"请先勾选同意。","Enter the 6-digit code from the email.":"请输入电邮里的 6 位数验证码。",
 "A code was sent less than a minute ago. Check your inbox and spam folder, or wait a minute and ask again.":"验证码在一分钟内刚发出。请查看收件箱和垃圾邮件，或等一分钟再申请。",
 "Too many codes were asked for this email. Please try again in a few hours.":"这个电邮申请验证码的次数太多，请几个小时后再试。","Sign-in is very busy today. Please try again tomorrow.":"今天登录人数太多，请明天再试。",
 "That code is not right. Use the latest code Eduplan emailed you.":"验证码不正确，请使用 Eduplan 最新发出的验证码。","This code has expired. Ask for a new code.":"验证码已过期，请重新申请。",
 "Eduplan is busy right now. Please try again in a moment.":"Eduplan 系统繁忙，请稍后再试。","Eduplan could not be reached. Check your connection and try again.":"无法连接 Eduplan，请检查网络后再试。","Something went wrong. Please try again.":"出了点问题，请再试一次。",
 "You were signed out. Sign in again to keep saving to your portfolio.":"你已被登出。请重新登录以继续保存到档案。","Signed out":"已登出",
 "You have signed out. Your details were removed from this browser and stay in your portfolio for next time.":"你已登出。你的资料已从这个浏览器清除，并保留在档案中供下次使用。",
 "Your portfolio was deleted. Applications you already sent stay with Eduplan so a counsellor can process them.":"你的档案已删除。已送出的报名资料仍由 Eduplan 保存，以便顾问处理。",
 "Saving…":"保存中…","Saved to your portfolio":"已保存到你的档案","Not saved yet. Trying again…":"尚未保存，正在重试…","Your portfolio is too large to save. Please contact Eduplan.":"档案太大无法保存，请联系 Eduplan。",
 "Signed in. Your progress is saved automatically.":"已登录，你的进度会自动保存。","Saved in this browser. Sign in to keep it on any device.":"已保存在这个浏览器。登录后可在任何装置查看。","Removed from your saved programmes":"已从收藏移除",
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
 "Until you sign in, these are kept in this browser only.":"登录之前，这些资料只保存在这个浏览器。",
 "Welcome to Eduplan":"欢迎来到 Eduplan","Find your course, university and scholarship":"找到适合你的课程、大学和奖学金",
 "Sign in with your email to start. It is free, there is no password, and your progress is saved so you can continue on any device.":"用电邮登录即可开始。完全免费、不需要密码，进度会自动保存，在任何装置都能继续。",
 "Courses, fees and entry requirements from partner universities":"合作大学的课程、学费和入学条件","Scholarships you can apply for":"你可以申请的奖学金",
 "An AI study assistant and free counsellors":"AI 升学助手和免费顾问","One application form for your chosen university":"一份表格报读你选择的大学",
 "Sign in to continue":"登录以继续","Continue to the preview":"进入预览","Continue without signing in":"不登录，直接继续",
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
 "Exam results slip":"考试成绩单","Official results slip":"正式成绩单","Trial exam results slip":"模拟考（Trial）成绩单","Which results slip are you sending?":"你要提交哪一种成绩单？","Official results":"正式成绩","Trial results":"模拟考成绩","Trial: your school’s trial exam, while the official results are not out yet. Send the official slip when it comes out.":"Trial：学校的模拟考成绩，适用于正式成绩还没公布的时候。正式成绩出来后，请再提交正式成绩单。","Choose official or trial.":"请选择正式成绩或模拟考成绩。","Filled in from My results in your portfolio. You do not need to enter them again.":"已从档案里的「我的成绩」自动填入，不需要再填写一次。","Change my results":"修改我的成绩","Done":"完成","Changes are saved to My results in your portfolio.":"修改会保存到档案里的「我的成绩」。","Enter them once: they are saved to My results in your portfolio and filled in for you next time.":"只需填写一次：会保存到档案里的「我的成绩」，下次自动帮你填好。",
 /* My results (assets/js/results.js) */
 "My results":"我的成绩","Scholarships for my results":"我的成绩可获得的奖学金","Add your exam results above. Eduplan then lists the campus scholarships your results qualify for.":"在上方填写你的考试成绩，Eduplan 就会列出你的成绩符合的校内奖学金。","See this scholarship":"查看这项奖学金","Almost there":"还差一点","No campus scholarship in our data matches your results yet.":"我们的资料中暂时没有符合你成绩的校内奖学金。","Which campus scholarships can I get with my results?":"以我的成绩可以获得哪些校内奖学金？","Add your exam results once. Eduplan keeps them until you change them, and uses them to show which programmes and scholarships you qualify for.":"成绩只需填写一次。Eduplan 会一直保存，直到你自己更改，并用来显示你符合哪些课程和奖学金。",
 "Saved to My results, and used to match programmes and scholarships for you.":"会保存到「我的成绩」，并用来为你配对课程和奖学金。","Your CGPA (out of 4.00)":"你的 CGPA（满分 4.00）","Your CGPA":"你的 CGPA",
 "+ Add subject":"+ 添加科目","Other subject…":"其他科目…","Subject name":"科目名称","Add":"添加","Add at least one subject and its grade.":"请至少添加一个科目及其成绩。","Enter your CGPA.":"请填写你的 CGPA。",
 "Add your results":"填写你的成绩"," to see if you meet these requirements.":"，查看你是否符合这些条件。","These requirements cannot be checked against your results automatically. Ask a counsellor.":"这些条件无法自动对照你的成绩，请咨询顾问。",
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
 "Information is for reference only. Please confirm with the university’s official website.":"资料仅供参考。奖学金条件保留官方英文原文，请以大学官网为准。",
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
 "Location":"地点","To be confirmed":"待确认","Entry requirements":"入学条件","Not listed by the institution":"院校未列出","Others":"其他",
 "Scholarships you can apply for":"可申请的奖学金","No campus scholarship listed for this level yet.":"此阶段暂未列出大学奖学金。",
 "Other scholarships open to all students":"其他开放给所有学生的奖学金",
 "Pre-university (Foundation / Matriculation / Form 6 / A-Level)":"大学先修（预科／大学先修班／中六／A-Level）","Certificate":"证书",
 "Bachelor's Degree":"学士学位","Master's Degree":"硕士学位","PhD":"博士","Full-time":"全日制","Part-time":"兼读制",
 /* Scholarship flow */
 "Scholarship-based":"奖学金导向","Scholarship type":"奖学金类别","Scholarship":"奖学金","Requirements":"申请条件","University":"院校","Scholarship details":"奖学金详情","Choose a scholarship":"选择奖学金","Details":"详情",
 "Choose a scholarship type":"选择奖学金类别","Scholarships come from two places. Pick one to continue.":"奖学金有两种来源，请选择其中一种继续。",
 "Foundation Scholarship":"基金会奖学金","Campus Scholarship":"大学奖学金",
 "Scholarships and financial aid from foundations and funds":"由基金会及基金提供的奖学金与助学金","Scholarships offered by colleges / universities":"由学院／大学提供的奖学金",
 "Continue":"继续","Choose a foundation scholarship":"选择基金会奖学金","View requirements":"查看申请条件","No foundation scholarships listed yet.":"暂未列出基金会奖学金。",
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
 [/^(Official results slip|Trial exam results slip) \((.+)\)$/,function(m){return (m[1]==="Official results slip"?"正式成绩单":"模拟考（Trial）成绩单")+"（"+m[2]+"）";}],
 [/^Your results qualify for (\d+) campus scholarships?\. Each one checks other conditions too, so read its details before you apply\.$/,"你的成绩符合 $1 项校内奖学金。每项奖学金还有其他条件，申请前请先查看详情。"],
 [/^With your (.+) results$/,"以你的 $1 成绩"],
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
 [/^Faculty (\d\d)$/,"科系 $1"],
 [/^Faculty (\d\d) · (.+)$/,"科系 $1 · $2"],
 [/^Explore Faculty (\d\d) · (.+)$/,"探索科系 $1 · $2"],
 [/^(.+)\. Choose a course to see which universities offer it\.$/,"$1。选择课程，查看开办该课程的大学。"],
 [/^(.+)\. Tap a scholarship to see its requirements\.$/,function(m){return tr(m[1])+"。点选奖学金查看申请条件。";}],
 [/^(.+)\. Tap a university to see its scholarship details\.$/,function(m){return tr(m[1])+"。点选大学查看奖学金详情。";}],
 [/^Question (\d+) of (\d+)$/,"第 $1 题，共 $2 题"],
 [/^(SPM|O-Level|UEC|STPM|A-Level) result$/,"$1 成绩"],
 [/^(.+) holders start a degree after Foundation, Matriculation or Diploma\. At undergraduate level the scholarship is based on that result\.$/,"$1 考生须先完成预科、大学先修班或文凭课程才能攻读学位，学士阶段的奖学金以该成绩为准。"],
 [/^See Foundation level for (.+)$/,"查看 $1 的预科阶段"],
 [/^(.+)’s scholarship table lists no (Foundation|Undergraduate) programme award for (.+)\.$/,function(m){return m[1]+" 的奖学金表格没有列出 "+m[3]+" 的"+LEVEL[m[2]]+"课程奖学金。";}],
 [/^See (Foundation|Undergraduate) level$/,function(m){return "查看"+LEVEL[m[1]]+"阶段";}],
 [/^Offered at (.+)\.$/,"开办院校：$1。"],
 [/^(\d+(?:\.\d+)?) years?$/,"$1 年"],
 [/^(.+?)\. (On-campus hostel\.|Partner hostel, 10 minutes by shuttle\.|No hostel\. Eduplan helps you find a rented room nearby\.)$/,function(m){return m[1]+"。"+tr(m[2]);}],
 [/^Phone \/ WhatsApp: (.*)$/,"电话／WhatsApp：$1"],[/^Email: (.*)$/,"电邮：$1"],[/^Address: (.*)$/,"地址：$1"],
 [/^Send to: WhatsApp (.+) or email (.+)\.$/,"发送至：WhatsApp $1 或电邮 $2。"]
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
