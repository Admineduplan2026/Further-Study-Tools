/**
 * Eduplan's Google Drive, in one private folder "Eduplan Databases" (My Drive) with four parts:
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
  receipts: 'Receipts'
};

function driveTop_() {
  var props = PropertiesService.getScriptProperties(), id = props.getProperty('DRIVE_TOP_ID');
  if (id) { try { return DriveApp.getFolderById(id); } catch (err) { /* deleted: make a new one */ } }
  var found = DriveApp.getRootFolder().getFoldersByName(DRIVE_TOP);
  var folder = found.hasNext() ? found.next() : DriveApp.createFolder(DRIVE_TOP);
  props.setProperty('DRIVE_TOP_ID', folder.getId());
  return folder;
}

/* "people", "pay" (in Eduplan Databases) or "receipts" (in 4. Payments), created when missing. */
function driveFolder_(key) {
  var props = PropertiesService.getScriptProperties(), prop = 'DRIVE_' + key.toUpperCase() + '_ID', id = props.getProperty(prop);
  if (id) { try { return DriveApp.getFolderById(id); } catch (err) { /* deleted: make a new one */ } }
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
