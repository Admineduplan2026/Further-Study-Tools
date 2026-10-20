/**
 * Eduplan application form: receives applications from the website (#apply and #stay).
 *
 * Every application is saved in one private folder, sorted by school (Drive.gs; this folder was called
 * "Eduplan Applications (private)" before driveOrganize):
 *   Eduplan Databases/2. Student applications (private)/<SCHOOL>/<EDU-YYYYMMDD-XXXX STUDENT NAME>/
 *       <ref> <NAME> - Application.pdf   the completed form as a PDF, with photos of the documents at the end
 *       <ref> <NAME> - UTAR Application Form.pdf   for schools with their own form (assets/js/school-forms.js): the
 *                                                  school's form, filled in from the application
 *       ic-1.jpg, results-1.pdf, ...      the uploaded documents
 * <SCHOOL> is the programme's institution_id (XMUM, UTAR, ...); the folder is created if it is missing. An application
 * without an institution goes to "Unassigned". The school folders in "Eduplan School Data" hold no student data.
 * A private spreadsheet "Eduplan Applications" (in "Eduplan Applications (private)") gets one row per application.
 * Nothing is shared by this script. Share "Eduplan Applications (private)" only with Eduplan staff.
 *
 * Script Properties (Project Settings > Script Properties), all optional:
 *   APPLY_NOTIFY_EMAIL  an Eduplan address to email when a new application arrives (name, programme and reference only).
 *   APPLY_DAILY_LIMIT   applications accepted per day for the whole website, default 100.
 * Set by the script itself: APPLY_FOLDER_ID, APPLY_SHEET_ID.
 * See docs/application-form-setup.md.
 */

var APPLY_DEFAULT_DAILY_LIMIT = 100;
var APPLY_MAX_FILES = 12;
var APPLY_MAX_FILE_BYTES = 5 * 1024 * 1024;
var APPLY_MAX_TOTAL_BYTES = 20 * 1024 * 1024;
var APPLY_TYPES = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/heic': 'heic', 'image/heif': 'heif', 'application/pdf': 'pdf' };
var APPLY_DOCS = { ic: 'NRIC or passport', results: 'Results slip', 'results-official': 'Official results slip',
  'results-trial': 'Trial exam results slip', photo: 'Passport-size photo', eng: 'English language certificate',
  sch: 'Scholarship application form', fee: 'Proof of application fee payment' };
var APPLY_HEADERS = ['Reference', 'Received', 'Name', 'NRIC / passport', 'Mobile', 'Email', 'University', 'Programme', 'Track', 'Intake',
  'Accommodation help', 'Documents', 'Folder', 'Status', 'Counsellor', 'Notes'];

function applyFolder_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('APPLY_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (err) { /* deleted or no access: make a new one */ } }
  var found = driveTop_().getFoldersByName(DRIVE_NAMES.apply);   // Drive.gs
  var folder = found.hasNext() ? found.next() : driveTop_().createFolder(DRIVE_NAMES.apply);
  props.setProperty('APPLY_FOLDER_ID', folder.getId());
  return folder;
}

/* Eduplan Applications (private)/<INSTITUTION ID>, or .../Unassigned. */
function applySchoolFolder_(institutionId) {
  var name = String(institutionId || '').trim().toUpperCase().replace(/[^\w-]/g, '') || 'Unassigned';
  var root = applyFolder_(), dirs = root.getFoldersByName(name);
  return dirs.hasNext() ? dirs.next() : root.createFolder(name);
}

function applyEsc_(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; });
}

/* The application as a PDF: the form sections from the website summary, signature lines, then photos of the documents. */
function applyPdf_(ref, received, summary, images, withImages) {
  var lines = String(summary).split(/\r?\n/), body = '', open = false;
  function close() { if (open) { body += '</table>'; open = false; } }
  function row(html) { if (!open) { body += '<table>'; open = true; } body += html; }
  lines.slice(1).forEach(function (l) {
    var t = l.trim(), m;
    if (!t) return;
    if ((m = t.match(/^== (.+) ==$/))) { close(); body += '<h2>' + applyEsc_(m[1]) + '</h2>'; return; }
    if (/^\[[x ]\] /.test(t)) { row('<tr><td class="k">' + (t.charAt(1) === 'x' ? '&#9745;' : '&#9744;') + '</td><td>' + applyEsc_(t.slice(4)) + '</td></tr>'); return; }
    if (/^ {2}\S/.test(l)) { row('<tr><td class="k"></td><td>' + applyEsc_(t) + '</td></tr>'); return; }
    if ((m = t.match(/^([^:]{1,60}):\s*(.*)$/)) && !/^\d+\. /.test(t)) { row('<tr><td class="k">' + applyEsc_(m[1]) + '</td><td>' + applyEsc_(m[2]) + '</td></tr>'); return; }
    row('<tr><td colspan="2">' + applyEsc_(t) + '</td></tr>');
  });
  close();
  var sign = '<h2>Signatures</h2><table class="sign"><tr><td>Applicant&#39;s signature</td><td>Date</td></tr>' +
    '<tr><td>Parent / guardian signature (if the applicant is under 18)</td><td>Date</td></tr></table>';
  var pics = withImages ? images.map(function (im) {
    return '<div class="doc"><p class="cap">' + applyEsc_(im.label) + '</p><img src="data:' + im.type + ';base64,' + im.data + '"></div>';
  }).join('') : '';
  var html = '<html><head><meta charset="utf-8"><style>' +
    'body{font-family:Arial,sans-serif;font-size:10.5pt;color:#111;margin:0}' +
    '.head{border-bottom:2px solid #0a6ea8;padding-bottom:8px;margin-bottom:6px}.brand{font-size:18pt;font-weight:bold;color:#0a6ea8;letter-spacing:1px}' +
    '.meta{color:#555;font-size:9.5pt}h1{font-size:14pt;margin:6px 0 2px}h2{font-size:11pt;color:#0a6ea8;margin:14px 0 4px;border-bottom:1px solid #d6dde3;padding-bottom:2px}' +
    'table{width:100%;border-collapse:collapse}td{padding:3px 6px;vertical-align:top;border-bottom:1px solid #eef1f4}td.k{width:34%;color:#444}' +
    '.sign td{height:48px;vertical-align:bottom;border-bottom:1px solid #111;width:50%}' +
    '.doc{page-break-before:always}.cap{font-weight:bold;margin:0 0 6px}.doc img{max-width:100%;max-height:900px}' +
    '</style></head><body><div class="head"><div class="brand">EDUPLAN</div><h1>Application form</h1>' +
    '<div class="meta">Reference ' + applyEsc_(ref) + ' &middot; Received ' + applyEsc_(received) + ' (Malaysia time) &middot; Submitted online by the applicant</div></div>' +
    body + sign + pics + '</body></html>';
  return HtmlService.createHtmlOutput(html).getBlob().getAs(MimeType.PDF);
}

/* Schools' own application forms, filled in from the website's application (body.form, from applyFormData in app.js). */
var APPLY_FORMS = { UTAR: applyUtarPdf_, APU: applyApuPdf_ };

/* UTAR "Student Application Form (Foundation Programmes leading to Bachelor Honours Degree Programmes)", form
   FM-DACE-003, in its own order: Section A, I Personal information, II Parent/guardian, III Declaration, IV Checklist.
   Signature and date are left blank for the applicant to sign. */
function applyUtarPdf_(ref, received, f) {
  var t = function (v, max) { return applyEsc_(applyText_(v, max || 200)); };
  var box = function (on) { return on ? '&#9745;' : '&#9744;'; };
  var line = function (label, value) { return '<tr><td class="k">' + label + '</td><td class="v">' + (value || '&nbsp;') + '</td></tr>'; };
  var choose = function (opts, value, other) {
    var hit = opts.indexOf(String(value || '')) >= 0;
    return opts.map(function (o) { return box(o === value) + ' ' + o; }).join('&nbsp;&nbsp; ') +
      (other ? '&nbsp;&nbsp; ' + box(value && !hit) + ' Others: ' + (value && !hit ? t(value, 60) : '______') : '');
  };
  var month = '', m = String(f.intake || '').match(/^(\d{4})-(\d{2})/);
  if (m) month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'][Number(m[2]) - 1] + ' ' + m[1];
  var dob = String(f.dob || '').replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1');
  var prefs = (f.prefs || []).slice(0, 5), rows = '';
  for (var i = 0; i < 5; i++) rows += '<tr><td class="n">' + (i + 1) + '.</td><td class="v">' + (t(prefs[i], 160) || '&nbsp;') + '</td></tr>';
  var html = '<html><head><meta charset="utf-8"><style>' +
    'body{font-family:Arial,sans-serif;font-size:10.5pt;color:#111;margin:0}h1{font-size:14pt;text-align:center;margin:0}' +
    '.sub{text-align:center;font-size:9pt;margin:2px 0 10px}.title{text-align:center;font-weight:bold;margin:4px 0}' +
    'h2{font-size:11pt;margin:14px 0 6px;border-bottom:1px solid #111}table{width:100%;border-collapse:collapse}' +
    'td{padding:4px 6px;vertical-align:top}td.k{width:36%}td.v{border-bottom:1px solid #999}td.n{width:24px}' +
    '.note{font-size:9pt;color:#333}.sign td{height:44px;vertical-align:bottom;border-bottom:1px solid #111;width:33%}' +
    '.foot{margin-top:18px;font-size:8.5pt;color:#555;border-top:1px solid #ccc;padding-top:4px}' +
    '</style></head><body>' +
    '<h1>UNIVERSITI TUNKU ABDUL RAHMAN</h1><div class="sub">Wholly owned by UTAR Education Foundation (Co. No. 578227 &ndash; M)</div>' +
    '<div class="title">Student Application Form<br>(Foundation Programmes leading to Bachelor Honours Degree Programmes)</div>' +
    '<p>Intake: <b>' + (t(month) || '&nbsp;') + '</b> &nbsp;&middot;&nbsp; Foundation: <b>' + t(f.route, 60) + '</b></p>' +
    '<h2>Section A: To be completed by applicant</h2><table>' +
    line('Have you previously applied to UTAR?', choose(['Yes', 'No'], f.previous)) +
    line('If Yes, UTAR ID No.', t(f.schoolId, 40)) + '</table>' +
    '<p>Choose 5 degree programmes you would like to study after completion of the foundation programme and list them in order of preference.<br>' +
    '<span class="note">Note: UTAR reserves the right to offer the programme available or alternative programme within the relevant study discipline.</span></p>' +
    '<table>' + rows + '</table>' +
    '<p>For Foundation programme, preferred campus: ' + choose(['Sungai Long Campus', 'Kampar Campus'], f.campus) + '<br><span class="note">Note: UTAR reserves the right to assign you to another campus.</span></p>' +
    '<p class="note">You will be offered a degree programme with the condition that you enrol and pass the UTAR Foundation Programme.</p>' +
    '<h2>I. Personal information</h2><table>' +
    line('1. Name (as in NRIC)', t(f.name, 120)) + line('2. NRIC No.', t(f.ic, 40)) + line('3. Nationality', t(f.nationality, 60)) +
    line('4. Date of Birth (Day/Month/Year)', t(dob, 20)) + line('5. Gender', choose(['Male', 'Female'], f.gender)) +
    line('6. Address', t(f.address, 300)) + line('&nbsp;&nbsp;&nbsp;Postcode / State', t(f.postcode, 10) + ' &nbsp;/&nbsp; ' + t(f.state, 60)) +
    line('7. Contact No. (Parents/Guardian)', t(f.guardianMobile, 30)) + line('&nbsp;&nbsp;&nbsp;Contact No. (H/P personal)', t(f.mobile, 30)) +
    line('8. E-mail address', t(f.email, 120)) +
    line('9. Race', choose(['Malay', 'Chinese', 'Indian'], f.race, true)) +
    line('10. Religion', choose(['Islam', 'Buddhism', 'Hinduism', 'Christianity'], f.religion, true)) +
    line('11. Good Physical and Mental Health', choose(['Yes', 'No'], f.health) + (f.health === 'No' ? '<br>' + t(f.healthInfo, 300) : '')) + '</table>' +
    '<h2>II. Particulars of parent/guardian</h2><table>' +
    line('1. Name of Parent/Guardian', t(f.guardian, 120)) + line('2. Relationship / (H/P)', t(f.relation, 40) + ' &nbsp;/&nbsp; ' + t(f.guardianMobile, 30)) +
    line('3. E-mail address', t(f.guardianEmail, 120)) + '</table>' +
    '<h2>III. Declaration by applicant</h2>' +
    '<p class="note">Personal data protection statement: https://www.utar.edu.my/PersonalDataProtectionStatementAdmission.jsp</p>' +
    '<p>I understand and agree to the University using and processing my personal data as contained in this form. I have read, understood and agreed to the Personal Data Protection Statement of the University. ' +
    'I declare that the information provided by me in connection with this application is true and correct. I understand that Universiti Tunku Abdul Rahman reserves the right to withdraw the offer of admission or ask me to leave the University at any time if such information is found to be false or incorrect.</p>' +
    '<table class="sign"><tr><td>' + t(f.name, 120) + '</td><td></td><td></td></tr></table>' +
    '<table><tr><td class="note">Name of Applicant</td><td class="note">Signature of Applicant</td><td class="note">Date</td></tr></table>' +
    '<h2>IV. Application checklist</h2><p class="note">Certified true copies (by School Principal / Justice of Peace / State Assemblyman / Member of Parliament) of: SPM or other equivalent results; ' +
    'STPM / A-Level / UEC / SAM / CPU or other equivalent results; School Leaving Certificate and Identity Card.</p>' +
    '<div class="foot">Prepared by Eduplan from the applicant&#39;s online application ' + applyEsc_(ref) + ' (received ' + applyEsc_(received) + ', Malaysia time). ' +
    'The applicant signs and dates Section III before the form is submitted to UTAR.</div>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html).getBlob().getAs(MimeType.PDF);
}

/* APU "Undergraduate Application Form" (AF(UG)/APU/JAN/2026/V1), parts A to J, filled in from the online application.
   The applicant signs Part J and attaches the documents in the Part I checklist before the form goes to APU. */
function applyApuPdf_(ref, received, f) {
  var t = function (v, max) { return applyEsc_(applyText_(v, max || 200)); };
  var box = function (on) { return on ? '&#9745;' : '&#9744;'; };
  var choose = function (opts, value, other) {
    var hit = opts.indexOf(String(value || '')) >= 0;
    return opts.map(function (o) { return box(o === value) + ' ' + o; }).join('&nbsp;&nbsp; ') +
      (other ? '&nbsp;&nbsp; ' + box(value && !hit) + ' Others' + (value && !hit ? ': ' + t(value, 40) : '') : '');
  };
  var cell = function (label, value, span) { return '<td' + (span ? ' colspan="' + span + '"' : '') + '><div class="l">' + label + '</div><div class="v">' + (value || '&nbsp;') + '</div></td>'; };
  var dmy = function (d) { return String(d || '').replace(/^(\d{4})-(\d{2})-(\d{2})$/, '$3/$2/$1'); };
  var mmyy = String(f.intake || '').replace(/^(\d{4})-(\d{2}).*$/, function (a, y, m) { return m + '/' + y.slice(2); });
  var intl = !!f.international, edu = (f.education || []).slice(0, 5), eng = (f.english || []).slice(0, 3);
  var hi = f.highest || {}, rows = '';
  if (hi.qual) rows += '<tr><td>' + t(hi.qual, 60) + '</td><td>' + t(hi.school, 120) + '</td><td>' + t(hi.year, 10) + '</td><td>' + box(hi.status === 'Official') + ' Actual &nbsp; ' + box(hi.status === 'Trial') + ' Forecast</td></tr>';
  edu.forEach(function (e) { if (e.school === hi.school && e.qual === hi.qual) return; rows += '<tr><td>' + t(e.qual, 60) + '</td><td>' + t(e.school, 120) + '</td><td>' + t(e.year, 10) + '</td><td>&nbsp;</td></tr>'; });
  var engRows = eng.map(function (e) { return '<tr><td>' + t(e.test, 60) + '</td><td>&nbsp;</td><td>' + t(e.date, 20) + '</td><td>' + t(e.score, 30) + '</td></tr>'; }).join('') || '<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>';
  var levels = ['Foundation', 'Foundation-ODL', 'APIIT Certificate', 'Diploma', 'Degree Level 1', 'Degree Level 2'];
  var html = '<html><head><meta charset="utf-8"><style>' +
    'body{font-family:Arial,sans-serif;font-size:9.5pt;color:#111;margin:0}' +
    '.top{display:flex;justify-content:space-between;align-items:flex-start}.top h1{font-size:15pt;margin:0;color:#0b3a5c}.addr{font-size:8.5pt;color:#333}' +
    'h2{font-size:10pt;margin:12px 0 4px;padding:2px 0;color:#0b3a5c;border-bottom:2px solid #0b3a5c}' +
    '*{box-sizing:border-box}table{width:100%;border-collapse:collapse;table-layout:fixed}td{padding:3px 5px;vertical-align:top;border:1px solid #bbb;word-wrap:break-word}' +
    '.l{font-size:7.5pt;color:#555}.v{min-height:13px}th{font-size:8pt;text-align:left;background:#eef3f7;border:1px solid #bbb;padding:3px 5px}' +
    '.note{font-size:8pt;color:#333}.sign td{height:40px;vertical-align:bottom}.foot{margin-top:14px;font-size:8pt;color:#555;border-top:1px solid #ccc;padding-top:4px}' +
    '</style></head><body>' +
    '<table style="border:0"><tr><td style="border:0"><h1 style="font-size:15pt;margin:0;color:#0b3a5c">UNDERGRADUATE APPLICATION FORM</h1>' +
    '<div class="addr">Asia Pacific University of Technology &amp; Innovation (APU) &middot; Asia Pacific Institute of Information Technology (APIIT)<br>' +
    'Technology Park Malaysia, Bukit Jalil, 57000 Kuala Lumpur, Malaysia. Tel: +603-8996 1000 &middot; Email: info@apu.edu.my</div></td>' +
    '<td style="border:0;text-align:right;width:34%">' + box(!intl) + ' Malaysian &nbsp; ' + box(intl) + ' International' + (intl ? ': ' + t(f.nationality, 40) : '') + '</td></tr></table>' +
    '<h2>PART A: PERSONAL DETAILS</h2><table>' +
    '<tr>' + cell('Title', choose(['Mr', 'Ms', 'Mrs'], f.title, true), 2) + cell('*Gender', choose(['Male', 'Female'], f.gender)) + '</tr>' +
    '<tr>' + cell('*Name (as per IC / Passport)', t(f.name, 120), 2) + cell('*Marital Status', choose(['Married', 'Single'], f.marital)) + '</tr>' +
    '<tr>' + cell('*IC Number / Passport Number', t(f.ic, 40)) + cell('*Date of Birth (dd/mm/yyyy)', t(dmy(f.dob), 12)) + cell('Place of Birth (City / State)', t(f.pob, 60)) + '</tr>' +
    '<tr>' + cell('Nationality', t(f.nationality, 60)) + cell('*Race', t(f.race, 40)) + cell('*Religion', t(f.religion, 40)) + '</tr>' +
    '<tr>' + cell('*Student&#39;s Correspondence Address', t(f.address, 300), 3) + '</tr>' +
    '<tr>' + cell('Postcode', t(f.postcode, 10)) + cell('*City / State', t(f.state, 60)) + cell('*Country', t(f.country, 60)) + '</tr>' +
    '<tr>' + cell('*Contact / Mobile (with Country code)', t(f.mobile, 30)) + cell('Email', t(f.email, 120), 2) + '</tr>' +
    '<tr>' + cell('*Parent / Guardian Name', t(f.guardian, 120)) + cell('Relationship to the Student', t(f.relation, 40)) + cell('Contact / Mobile (with Country code)', t(f.guardianMobile, 30)) + '</tr>' +
    '<tr>' + cell('Parent / Guardian Permanent Address (if different from Student&#39;s Correspondence Address)', '', 2) + cell('*Parent / Guardian IC Number / Passport Number', t(f.guardianIc, 40)) + '</tr>' +
    '<tr>' + cell('Postcode', '') + cell('Country', '') + cell('Parent / Guardian Email', t(f.guardianEmail, 120)) + '</tr>' +
    '<tr>' + cell('Contact Person in Case of Emergency', t(f.emergency, 120)) + cell('Relationship to the Student', t(f.emergencyRelation, 40)) + cell('Contact / Mobile (with Country code)', t(f.emergencyMobile, 30)) + '</tr>' +
    '</table>' +
    '<h2>PART B: COURSE APPLIED FOR</h2><table>' +
    '<tr>' + cell('Course Name', t(f.course, 160)) + cell('Specialism (if applicable)', t(f.specialism, 80)) + cell('Intake Date (mm/yy)', t(mmyy, 8)) + '</tr>' +
    '<tr>' + cell('Level of Study', levels.map(function (l) { return box(l === f.level) + ' ' + l; }).join('&nbsp;&nbsp; '), 3) + '</tr></table>' +
    '<h2>PART C: ACADEMIC BACKGROUND (from highest to lowest)</h2>' +
    '<table><tr><th>Qualification</th><th>Name of School / College / University</th><th>Year Completed</th><th>Result</th></tr>' + (rows || '<tr><td>&nbsp;</td><td></td><td></td><td></td></tr>') + '</table>' +
    '<p class="note">* Compulsory / Mandatory fields. Copies of certificates and transcripts are attached to the Eduplan application.</p>' +
    '<h2>PART D: MEDICAL DISCLOSURE</h2><table>' +
    '<tr>' + cell('1. Do you have any special / medical condition that requires the attention of the University?', choose(['Yes', 'No'], f.medical) + (f.medical === 'Yes' ? '<br>' + t(f.medicalInfo, 300) : ''), 3) + '</tr>' +
    '<tr>' + cell('2. Have you had any history of Mental / Psychiatric conditions?', choose(['Yes', 'No'], f.mental) + (f.mental === 'Yes' ? '<br>' + t(f.mentalInfo, 300) : ''), 3) + '</tr>' +
    '<tr>' + cell('3. Have you been diagnosed with any conditions / disorders that may affect your ability to cope with University studies?', choose(['Yes', 'No'], f.cope), 3) + '</tr></table>' +
    '<h2>PART E: ENGLISH LANGUAGE PROFICIENCY (international applicants only)</h2>' +
    '<p>English was the language of instruction in my previous completed studies: ' + (intl ? choose(['Yes', 'No'], f.englishInstruction) : 'Not applicable (Malaysian applicant)') + '</p>' +
    '<table><tr><th>Name of Test / Examination</th><th>Name of Centre / Institution</th><th>Date (to be) Taken</th><th>Results (if known)</th></tr>' + engRows + '</table>' +
    '<h2>PART F: MALAYSIAN IMMIGRATION INFORMATION (international applicants only)</h2>' +
    (intl ? '<p>Currently holding a Malaysian Immigration Pass / Visa: ' + choose(['Yes', 'No'], f.visa) + (f.visa === 'Yes' ? ' &nbsp; Type: ' + t(f.visaType, 40) + ' &nbsp; Expiry: ' + t(dmy(f.visaExpiry), 12) : '') + '</p>' : '<p>Not applicable (Malaysian applicant)</p>') +
    '<h2>PART G: ACCOMMODATION ARRANGEMENTS</h2><p>Do you require APU to arrange your accommodation? ' +
    box(f.accommodation === 'Yes') + ' Yes (please fill up the APU Residence Application Form) &nbsp; ' + box(f.accommodation === 'No') + ' No, I will arrange for my own accommodation</p>' +
    '<h2>PART H: CONDITIONS FOR ENROLMENT</h2><p class="note">Fees for the academic year are as stated in the fee guide. Fee payment refunds are governed by the Fee Refund Policy as stated in the Fee Guide. ' +
    'Students must abide by all academic, administrative and examination rules and regulations and policies at APU.</p>' +
    '<h2>PART J: DECLARATION</h2><p class="note">I declare that all the particulars provided in this form are complete and correct, and I agree to the declaration and the Privacy Notice (Parts J and K) on APU&#39;s application form.</p>' +
    '<table class="sign"><tr><td style="width:34%">&nbsp;</td><td>' + t(f.name, 120) + '</td><td style="width:22%">&nbsp;</td></tr>' +
    '<tr><td class="note" style="height:auto">Signature</td><td class="note" style="height:auto">Name</td><td class="note" style="height:auto">Date</td></tr></table>' +
    '<div class="foot">Prepared by Eduplan from the applicant&#39;s online application ' + applyEsc_(ref) + ' (received ' + applyEsc_(received) + ', Malaysia time), in the layout of APU form AF(UG)/APU/JAN/2026/V1. ' +
    'The applicant signs and dates Part J, and attaches the documents in APU&#39;s Part I checklist, before the form is submitted to APU.</div>' +
    '</body></html>';
  return HtmlService.createHtmlOutput(html).getBlob().getAs(MimeType.PDF);
}

function applySheet_(folder) {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('APPLY_SHEET_ID');
  if (id) { try { return SpreadsheetApp.openById(id).getSheets()[0]; } catch (err) { /* make a new one */ } }
  var ss = SpreadsheetApp.create('Eduplan Applications');
  DriveApp.getFileById(ss.getId()).moveTo(folder);
  var sh = ss.getSheets()[0];
  sh.setName('Applications');
  sh.appendRow(APPLY_HEADERS);
  sh.getRange(1, 1, 1, APPLY_HEADERS.length).setFontWeight('bold').setBackground('#e4f2fa');
  sh.setFrozenRows(1);
  props.setProperty('APPLY_SHEET_ID', ss.getId());
  return sh;
}

/* Applications per day (Malaysia time), so the form cannot be used to fill the Drive. */
function applyAllowed_() {
  var props = PropertiesService.getScriptProperties();
  var limit = Number(props.getProperty('APPLY_DAILY_LIMIT')) || APPLY_DEFAULT_DAILY_LIMIT;
  var key = 'apply-count-' + Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
  var n = Number(props.getProperty(key)) || 0;
  if (n >= limit) return false;
  props.setProperty(key, String(n + 1));
  return true;
}

function applyText_(v, max) { return String(v == null ? '' : v).replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '').slice(0, max || 200).trim(); }

function applySubmit_(body) {
  var f = body.fields || {}, summary = applyText_(body.summary, 40000), files = Array.isArray(body.files) ? body.files : [];
  var name = applyText_(f.name, 120), mobile = applyText_(f.mobile, 40);
  if (!summary || !name || !mobile) return { error: 'bad_request' };
  if (files.length > APPLY_MAX_FILES) return { error: 'too_many_files' };

  // Check every file before saving anything.
  var blobs = [], images = [], total = 0;
  for (var i = 0; i < files.length; i++) {
    var file = files[i] || {}, ext = APPLY_TYPES[file.type];
    if (!ext || typeof file.data !== 'string') return { error: 'bad_file' };
    var bytes;
    try { bytes = Utilities.base64Decode(file.data); } catch (err) { return { error: 'bad_file' }; }
    if (bytes.length > APPLY_MAX_FILE_BYTES) return { error: 'file_too_large' };
    total += bytes.length;
    if (total > APPLY_MAX_TOTAL_BYTES) return { error: 'file_too_large' };
    var doc = applyText_(file.doc, 20).replace(/[^\w-]/g, '') || 'file';
    blobs.push(Utilities.newBlob(bytes, file.type, doc + '-' + (i + 1) + '.' + ext));
    if (file.type === 'image/jpeg' || file.type === 'image/png') images.push({ label: APPLY_DOCS[doc] || doc, type: file.type, data: file.data });
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try {
    if (!applyAllowed_()) return { error: 'daily_limit' };
    var now = new Date();
    var ref = 'EDU-' + Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'yyyyMMdd') + '-' + Utilities.getUuid().slice(0, 4).toUpperCase();
    var received = Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH:mm');
    var folder = applySchoolFolder_(f.institution).createFolder(ref + ' ' + name);
    var pdf;
    try { pdf = applyPdf_(ref, received, summary, images, true); }
    catch (err) { console.error('PDF with photos failed, saving without: ' + err); pdf = applyPdf_(ref, received, summary, images, false); }
    folder.createFile(pdf.setName(ref + ' ' + name + ' - Application.pdf'));
    var form = body.form && APPLY_FORMS[body.form.school];
    if (form) {
      try { folder.createFile(form(ref, received, body.form).setName(ref + ' ' + name + ' - ' + body.form.school + ' Application Form.pdf')); }
      catch (err) { console.error('School form failed: ' + err); }
    }
    blobs.forEach(function (b) { folder.createFile(b); });

    applySheet_(applyFolder_()).appendRow([ref, now, name, applyText_(f.ic, 40), "'" + mobile, applyText_(f.email, 120),
      applyText_(f.university, 120), applyText_(f.programme, 200), applyText_(f.track, 80), applyText_(f.intake, 20),
      applyText_(f.accommodation, 10), blobs.length, folder.getUrl(), 'New', '', '']);
  } finally {
    lock.releaseLock();
  }

  var notify = PropertiesService.getScriptProperties().getProperty('APPLY_NOTIFY_EMAIL');
  if (notify) {
    try {
      // Only what staff need to find the application; the details stay in the private folder.
      MailApp.sendEmail(notify, 'New Eduplan application ' + ref,
        'Reference: ' + ref + '\nName: ' + name + '\nProgramme: ' + applyText_(f.programme, 200) + ' (' + applyText_(f.university, 120) + ')\n' +
        'Folder: ' + folder.getUrl());
    } catch (err) { console.error('Notification email failed: ' + err); }
  }
  return { ok: true, ref: ref };
}

/* Run from the Apps Script editor (select applyTest, Run) to create the folder and sheet and store one test application.
   The test includes a blue-and-white striped picture as the "NRIC or passport" photo: open the test PDF and check that
   the stripes appear on the last page. Delete the TEST row and folder afterwards. */
var APPLY_TEST_PNG = 'iVBORw0KGgoAAAANSUhEUgAAAPAAAAB4CAIAAABD1OhwAAACOklEQVR42u3dwQnDQBAEwXk7WMXlLO0cJARHU8v+CyaB3uf63v7fg+Ny33BnZW7JnZW5JXdW5pbcWZlbcmdlbsmdlbkld1bmltxZmVtyZ2VuyZ2VuSV3VuaW3FmZW3JnZW7JnZW5JXdW5pbcWZlbcmdlbsmdlbkld1bmltxZmVtyZ2VuyZ2VuSV3VuaW3FmZW3JnZW7JnZW5JXdW5pbcWZlbcmdlbsmdlbkld1bmltxZmVtyZ2VuyZ2VuSV3VuaW3FmZW3JnZW7JnZW5JXdW5pbcWZlbcnUKuSlXp5CbcnUKuSlXp5CbcnUKuSlXp5CbcnUKuSlXp5CrU2hl7qmuTiE35eoUclOuTiE35eoUclOuTiE35eoUclOuTiE35eoUclOuTiE35eoUclOuTiE35eoUclOuTiE35eoUclOuTiE35eoUclOuTiE35eoUclOuTiFXp9DK3FNdnUJuytUp5KZcnUJuytUp5KZcnUJuytUp5KZcnUJuytUp5KZcnUJuytUp5KZcnUJuytUp5KZcnUJuytUp5KZcnUJuytUp5KZcnUJuytUp5KZcnUKuTqGVuae6OoXclKtTyE25OoXclKtTyE25OoXclKtTyE25OoXclKtTyE25OoXclKtTyE25OoXclKtTyE25OoXclKtTyE25OoXclKtTyE25OoXclKtTyE25OoVcnUIrc091dQq5KVenkJtydQq5KVenkJtydQq5KVenkJtydQq5KVenkJtydQq5KVenkJty/8uzbMoSUlp+AAAAAElFTkSuQmCC';
function applyTest() {
  console.log(JSON.stringify(applySubmit_({
    summary: 'EDUPLAN APPLICATION\n(test from the Apps Script editor)',
    fields: { name: 'TEST APPLICANT', mobile: '000', programme: 'Test programme', university: 'TEST' },
    files: [{ doc: 'ic', type: 'image/png', data: APPLY_TEST_PNG },
      { doc: 'test', type: 'application/pdf', data: Utilities.base64Encode('%PDF-1.4\n%%EOF') }]
  })));
}
