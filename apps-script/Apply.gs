/**
 * Eduplan application form: receives applications from the website (#apply and #stay) and keeps them in
 * Eduplan's own Google Drive. Nothing here is public:
 *   - a private Drive folder "Eduplan Applications (private)" gets one sub-folder per application with
 *     application.txt (the full form) and the uploaded documents;
 *   - a private spreadsheet "Eduplan Applications" in that folder gets one row per application to track it.
 * Both are created on the first application, in the Drive of the account that deploys the web app, and are not
 * shared with anyone. Share them only with Eduplan staff who handle applications.
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
var APPLY_HEADERS = ['Reference', 'Received', 'Name', 'NRIC / passport', 'Mobile', 'Email', 'University', 'Programme', 'Track', 'Intake',
  'Accommodation help', 'Documents', 'Folder', 'Status', 'Counsellor', 'Notes'];

function applyFolder_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('APPLY_FOLDER_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (err) { /* deleted or no access: make a new one */ } }
  var folder = DriveApp.createFolder('Eduplan Applications (private)');
  props.setProperty('APPLY_FOLDER_ID', folder.getId());
  return folder;
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
  var blobs = [], total = 0;
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
  }

  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try {
    if (!applyAllowed_()) return { error: 'daily_limit' };
    var now = new Date();
    var ref = 'EDU-' + Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'yyyyMMdd') + '-' + Utilities.getUuid().slice(0, 4).toUpperCase();
    var root = applyFolder_();
    var folder = root.createFolder(ref + ' ' + name);
    folder.createFile('application.txt', 'Reference: ' + ref + '\nReceived: ' +
      Utilities.formatDate(now, 'Asia/Kuala_Lumpur', 'yyyy-MM-dd HH:mm') + ' (Malaysia time)\n\n' + summary, MimeType.PLAIN_TEXT);
    blobs.forEach(function (b) { folder.createFile(b); });

    applySheet_(root).appendRow([ref, now, name, applyText_(f.ic, 40), "'" + mobile, applyText_(f.email, 120),
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
   Delete the TEST row and folder afterwards. */
function applyTest() {
  console.log(JSON.stringify(applySubmit_({
    summary: 'EDUPLAN APPLICATION\n(test from the Apps Script editor)',
    fields: { name: 'TEST APPLICANT', mobile: '000', programme: 'Test programme', university: 'TEST' },
    files: [{ doc: 'test', type: 'application/pdf', data: Utilities.base64Encode('%PDF-1.4\n%%EOF') }]
  })));
}
