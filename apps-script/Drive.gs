/**
 * Eduplan's Google Drive, in one private folder "Eduplan Databases" (My Drive) with five parts:
 *
 *   Eduplan Databases/
 *     1. School databases/                    (was "Eduplan School Data", SCHOOL_FOLDER_ID in Code.gs)
 *          master sheet, one folder per school with its sheet. School staff get access to their own school sheet only.
 *     2. Student applications (private)/      (was "Eduplan Applications (private)", Apply.gs)
 *          <SCHOOL>/<EDU-... NAME>/  the application PDF, the school's own form filled in, the uploaded documents
 *          "Eduplan Applications"    one row per application
 *     3. Students and visitors (private)/
 *          "Eduplan Student Portfolios"  Students, Sign-in log, Visits (guests are counted, never identified), Overview
 *     4. Payments (private)/
 *          "Eduplan Payments"        one row per payment request (Payments.gs)
 *          Receipts/<yyyy-MM>/<PAY-...>/  a PDF payment record for every payment marked Paid; add the bank slip or the
 *                                         gateway's receipt to the same folder
 *     5. Exhibitions (private)/
 *          "Eduplan Exhibitions"     organisers, schools, events and booth registrations (Exhibition.gs)
 *          Event covers (public links)/  cover images of exhibition events, viewable by anyone with the link
 *
 * Run driveOrganize once from the editor (select driveOrganize, Run): it creates the missing folders, moves the existing
 * folders and spreadsheets into place (their links, IDs and sharing stay the same), moves the old "Payments" tab into
 * "Eduplan Payments" and turns on the automatic payment records. It can be run again safely. It only moves folders and
 * files; it does not open student applications.
 */

var DRIVE_TOP = 'Eduplan Databases';
var DRIVE_NAMES = {
  school: '1. School databases',
  apply: '2. Student applications (private)',
  people: '3. Students and visitors (private)',
  pay: '4. Payments (private)',
  expo: '5. Exhibitions (private)',
  receipts: 'Receipts'
};

/* A file or folder this project made earlier, unless it was moved to the trash (then the caller makes a new one).
   An ID in Script Properties that cannot be opened at all (a typo, or a file of another account) stops the request
   with a clear error: making a new, empty file instead would quietly split Eduplan's data over several sheets. */
function driveLive_(item) { return item && !item.isTrashed() ? item : null; }
function driveCleanId_(id) { return String(id || '').replace(/[\s'"`]/g, ''); }
function driveSheetLive_(id) {
  driveOwnerCheck_();
  id = driveCleanId_(id);
  var file;
  try { file = DriveApp.getFileById(id); } catch (err) { throw new Error('cannot open sheet ' + id + ' from Script Properties: check the ID'); }
  return driveLive_(file) ? SpreadsheetApp.openById(id) : null;
}
/* The folder whose ID is in Script Property prop, or null when it is not set or in the trash. */
function driveFolderLive_(prop) {
  var id = driveCleanId_(PropertiesService.getScriptProperties().getProperty(prop)), folder;
  if (!id) return null;
  try { folder = DriveApp.getFolderById(id); } catch (err) { throw new Error('cannot open folder ' + id + ' (' + prop + ' in Script Properties): check the ID'); }
  return driveLive_(folder);
}

/* Script Property DRIVE_OWNER: the Google account whose Drive holds Eduplan's data (admin.eduplan@gmail.com). Run as any
   other account, the project cannot open those files and would quietly start new, empty ones in that account's Drive;
   it stops with this message instead. Fix: Deploy > Manage deployments > Edit > Execute as: that account. */
function driveOwnerCheck_() {
  var owner = PropertiesService.getScriptProperties().getProperty('DRIVE_OWNER'), me = '';
  if (!owner) return;
  try { me = Session.getEffectiveUser().getEmail(); } catch (err) { return; }
  if (me && me.toLowerCase() !== owner.trim().toLowerCase())
    throw new Error('wrong account: running as ' + me + ', data is in the Drive of ' + owner.trim());
}

function driveTop_() {
  driveOwnerCheck_();
  var props = PropertiesService.getScriptProperties(), t = driveFolderLive_('DRIVE_TOP_ID');
  if (t) return t;
  var found = DriveApp.getRootFolder().getFoldersByName(DRIVE_TOP);
  var folder = found.hasNext() ? found.next() : DriveApp.createFolder(DRIVE_TOP);
  props.setProperty('DRIVE_TOP_ID', folder.getId());
  return folder;
}

/* "people", "pay", "expo" (in Eduplan Databases) or "receipts" (in 4. Payments), created when missing. */
function driveFolder_(key) {
  driveOwnerCheck_();
  var props = PropertiesService.getScriptProperties(), prop = 'DRIVE_' + key.toUpperCase() + '_ID', f = driveFolderLive_(prop);
  if (f) return f;
  var parent = key === 'receipts' ? driveFolder_('pay') : driveTop_(), found = parent.getFoldersByName(DRIVE_NAMES[key]);
  var folder = found.hasNext() ? found.next() : parent.createFolder(DRIVE_NAMES[key]);
  props.setProperty(prop, folder.getId());
  return folder;
}

/* Moves a folder or file into a parent (same ID, link and sharing) and gives it a name; logs instead of failing. */
function driveMove_(item, parent, name) {
  try {
    var inside = false, ps = item.getParents();
    while (ps.hasNext()) if (ps.next().getId() === parent.getId()) inside = true;
    if (!inside) item.moveTo(parent);
    if (name && item.getName() !== name) item.setName(name);
    return true;
  } catch (err) {
    console.error('Could not move "' + item.getName() + '": ' + err);
    return false;
  }
}

function driveOrganize() {
  var top = driveTop_();
  driveMove_(DriveApp.getFolderById(SCHOOL_FOLDER_ID), top, DRIVE_NAMES.school);
  var apply = applyFolder_();
  driveMove_(apply, top, DRIVE_NAMES.apply);
  applySheet_(apply);   // makes "Eduplan Applications" if it is missing
  var people = driveFolder_('people');
  driveMove_(DriveApp.getFileById(accountSheet_().getParent().getId()), people);
  var payBook = payTab_().getParent();
  driveMove_(DriveApp.getFileById(payBook.getId()), driveFolder_('pay'));
  driveFolder_('receipts');
  payMoveOldTab_();
  paySetupTrigger_();
  console.log('Eduplan Databases: ' + top.getUrl());
  console.log('  ' + DRIVE_NAMES.school + ': ' + DriveApp.getFolderById(SCHOOL_FOLDER_ID).getUrl());
  console.log('  ' + DRIVE_NAMES.apply + ': ' + apply.getUrl());
  console.log('  ' + DRIVE_NAMES.people + ': ' + people.getUrl());
  console.log('  ' + DRIVE_NAMES.pay + ': ' + driveFolder_('pay').getUrl() + '  (Eduplan Payments: ' + payBook.getUrl() + ')');
}
