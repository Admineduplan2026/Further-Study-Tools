/**
 * Eduplan school data API (Google Apps Script).
 *
 * Paste this file into the Google Sheet made from data/eduplan-school-data.xlsx
 * (Extensions > Apps Script), then Deploy > New deployment > Web app,
 * "Execute as: Me", "Who has access: Anyone". The /exec URL it gives you goes into
 * assets/js/config.js on the website. See docs/google-sheet-api-setup.md.
 *
 * GET <url>            -> JSON with every row marked Published = Yes
 * GET <url>?nocache=1  -> same, skipping the 5-minute cache
 *
 * Only the public columns listed in FIELDS are returned. Internal columns
 * (contact_person, contact_email) are never sent to the website.
 */

var SHEETS = {
  institutions: 'Institutions',
  programmes: 'Programmes',
  campus: 'Campus Scholarships',
  foundation: 'Foundation Scholarships',
  lists: 'Lists'
};
var KEY_ROW = 2;      // row holding the API keys
var FIRST_ROW = 4;    // first data row
var CACHE_KEY = 'eduplan-api-v1';
var CACHE_SECONDS = 300;

// Public fields per sheet. Fields ending in * are required.
var FIELDS = {
  institutions: ['institution_id*', 'name*', 'short_name', 'type*', 'state', 'city', 'website', 'admissions_email',
    'admissions_phone', 'whatsapp', 'hostel', 'hostel_fee_min', 'hostel_fee_max', 'last_updated'],
  programmes: ['programme_id*', 'institution_id*', 'course*', 'programme_name*', 'level*', 'study_mode', 'duration_years',
    'intakes', 'campus', 'entry_spm', 'entry_other', 'english_requirement', 'tuition_fee_rm', 'mqa_reference',
    'application_deadline', 'apply_url', 'notes', 'last_updated'],
  campus: ['scholarship_id*', 'institution_id*', 'scholarship_name', 'type', 'qualification*', 'minimum_result*',
    'waiver_percent', 'fixed_amount_rm', 'applies_to', 'other_conditions', 'deadline', 'info_url', 'last_updated'],
  foundation: ['option_id*', 'scholarship_name*', 'organiser', 'requirements*', 'award_value', 'deadline', 'info_url', 'last_updated']
};
var NUMBERS = ['hostel_fee_min', 'hostel_fee_max', 'duration_years', 'tuition_fee_rm', 'waiver_percent', 'fixed_amount_rm'];

/* ---------------- Web app entry points ---------------- */

function doGet(e) {
  var cache = CacheService.getScriptCache();
  var noCache = e && e.parameter && e.parameter.nocache;
  var json = noCache ? null : cache.get(CACHE_KEY);
  if (!json) {
    json = JSON.stringify(buildFromSheets_());
    if (json.length < 90000) cache.put(CACHE_KEY, json, CACHE_SECONDS);
  }
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

function onOpen() {
  SpreadsheetApp.getUi().createMenu('Eduplan')
    .addItem('Check data (what the website will show)', 'showCheck')
    .addItem('Refresh website data now', 'clearCache')
    .addToUi();
}

function showCheck() {
  var d = buildFromSheets_();
  var lines = [
    'Published rows the website will show:',
    '  Institutions: ' + d.institutions.length,
    '  Programmes: ' + d.programmes.length,
    '  Campus scholarship tiers: ' + d.campus_scholarships.length,
    '  Foundation scholarships: ' + d.foundation_scholarships.length,
    '',
    d.skipped.length ? 'Rows skipped (fix these):' : 'No problems found.'
  ];
  d.skipped.forEach(function (s) { lines.push('  ' + s.sheet + ' row ' + s.row + ': ' + s.reason); });
  SpreadsheetApp.getUi().alert(lines.join('\n'));
}

function clearCache() {
  CacheService.getScriptCache().remove(CACHE_KEY);
  SpreadsheetApp.getUi().alert('Done. The website shows the latest published data on its next load.');
}

function buildFromSheets_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var tz = ss.getSpreadsheetTimeZone();
  var values = {};
  Object.keys(SHEETS).forEach(function (k) {
    var sh = ss.getSheetByName(SHEETS[k]);
    values[k] = sh ? sh.getDataRange().getValues() : [];
  });
  return buildEduplanData(values, function (d) { return Utilities.formatDate(d, tz, 'yyyy-MM-dd'); }, new Date().toISOString());
}

/* ---------------- Pure transform (no Google services; tested outside Apps Script) ---------------- */

function buildEduplanData(values, formatDate, generatedAt) {
  var skipped = [];
  formatDate = formatDate || function (d) { return d.toISOString().slice(0, 10); };

  function clean(v, key) {
    if (v === null || v === undefined) return '';
    if (Object.prototype.toString.call(v) === '[object Date]') return isNaN(v) ? '' : formatDate(v);
    if (NUMBERS.indexOf(key) > -1) {
      if (v === '') return null;
      var n = typeof v === 'number' ? v : Number(String(v).replace(/[,\sRMrm]/g, ''));
      return isFinite(n) ? n : null;
    }
    return String(v).trim();
  }

  function read(sheetKey, fieldKey) {
    var rows = values[sheetKey] || [];
    if (rows.length < KEY_ROW) return [];
    var keys = rows[KEY_ROW - 1].map(function (k) { return String(k).trim(); });
    var spec = FIELDS[fieldKey || sheetKey];
    var out = [];
    for (var r = FIRST_ROW - 1; r < rows.length; r++) {
      var raw = {};
      keys.forEach(function (k, i) { if (k) raw[k] = rows[r][i]; });
      var published = String(raw.published || '').trim().toLowerCase() === 'yes';
      var empty = spec.every(function (f) { var v = raw[f.replace('*', '')]; return v === '' || v === null || v === undefined; });
      if (empty || !published) continue;
      var obj = {}, missing = [];
      spec.forEach(function (f) {
        var key = f.replace('*', ''), v = clean(raw[key], key);
        if (f.slice(-1) === '*' && (v === '' || v === null)) missing.push(key);
        obj[key] = v;
      });
      if (missing.length) { skipped.push({ sheet: SHEETS[sheetKey], row: r + 1, reason: 'missing ' + missing.join(', ') }); continue; }
      obj._row = r + 1;
      out.push(obj);
    }
    return out;
  }

  // Course dropdown label -> website course_id, from the Lists sheet (columns J and K).
  var courseIds = {};
  (values.lists || []).slice(1).forEach(function (row) {
    var label = String(row[9] || '').trim(), id = String(row[10] || '').trim();
    if (label && id) courseIds[label] = id;
  });

  var institutions = read('institutions');
  var known = {};
  institutions.forEach(function (i) { known[i.institution_id] = true; });

  function needsInstitution(list, sheetKey) {
    return list.filter(function (x) {
      if (known[x.institution_id]) return true;
      skipped.push({ sheet: SHEETS[sheetKey], row: x._row, reason: 'institution_id ' + x.institution_id + ' is not a published institution' });
      return false;
    });
  }

  var programmes = needsInstitution(read('programmes'), 'programmes').filter(function (p) {
    p.course_id = courseIds[p.course] || '';
    if (p.course_id) return true;
    skipped.push({ sheet: SHEETS.programmes, row: p._row, reason: 'course "' + p.course + '" is not in the Lists sheet' });
    return false;
  });

  var campus = needsInstitution(read('campus'), 'campus').filter(function (s) {
    if (s.waiver_percent !== null || s.fixed_amount_rm !== null) return true;
    skipped.push({ sheet: SHEETS.campus, row: s._row, reason: 'fill in waiver_percent or fixed_amount_rm' });
    return false;
  });

  var foundation = read('foundation').map(function (f) {
    f.requirements = f.requirements.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    return f;
  });

  function strip(list) { return list.map(function (x) { delete x._row; return x; }); }
  return {
    version: 1,
    generated_at: generatedAt || new Date().toISOString(),
    institutions: strip(institutions),
    programmes: strip(programmes),
    campus_scholarships: strip(campus),
    foundation_scholarships: strip(foundation),
    skipped: skipped
  };
}
