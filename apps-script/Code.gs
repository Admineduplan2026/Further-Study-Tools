/**
 * Eduplan school data API (Google Apps Script).
 *
 * Data lives in one Google Drive folder ("Eduplan School Data", SCHOOL_FOLDER_ID below):
 *   - one Google Sheet per school (TARUMT, UTAR, UCSI, ...) with the tabs
 *     Institutions, Programmes and Campus Scholarships (+ a hidden Lists tab for the dropdowns);
 *   - this master sheet (the one this script is bound to), Eduplan only, with
 *     Foundation Scholarships and Lists.
 * Each school sheet is named after its institution_id (UTAR, UCSI, ...) and may only publish that
 * institution. Files whose name starts with "_" (for example "_Template") are ignored.
 *
 * Paste this file into the master sheet (Extensions > Apps Script), then
 * Deploy > Manage deployments > Edit > Version: New version > Deploy (the /exec URL stays the same).
 * The account that deploys it must be able to open the folder. See docs/google-sheet-api-setup.md.
 *
 * GET <url>            -> JSON with every row marked Published = Yes
 * GET <url>?nocache=1  -> same, rebuilt from the sheets now
 * POST <url> {"action":"chat",...} -> AI study assistant reply (see Chat.gs and docs/ai-chatbot-setup.md)
 * Edits show up within about a minute: each request compares the folder's last-edit times
 * (checked at most every FRESH_SECONDS) with the cached copy.
 *
 * Only the public columns listed in FIELDS are returned. Internal columns
 * (contact_person, contact_email) are never sent to the website.
 */

var SCHOOL_FOLDER_ID = '1YlVGAe04L2BTQo7bzoLzG6wQl3mhaaoS';
var MASTER_SHEET_ID = '1htCbXcJsB8juU0pY4uKu8nIeJYyfG611g9WlNFka3Es';  // used when the script is not opened from the master sheet

/** The master sheet: the sheet this script is bound to, or MASTER_SHEET_ID for a standalone script. */
function master_() {
  return SpreadsheetApp.getActiveSpreadsheet() || SpreadsheetApp.openById(MASTER_SHEET_ID);
}
var SCHOOL_TABS = ['institutions', 'programmes', 'campus'];
var MASTER_TABS = ['foundation', 'lists'];
var SHEETS = {
  institutions: 'Institutions',
  programmes: 'Programmes',
  campus: 'Campus Scholarships',
  foundation: 'Foundation Scholarships',
  lists: 'Lists'
};
var KEY_ROW = 2;      // row holding the API keys
var FIRST_ROW = 4;    // first data row
var CACHE_KEY = 'eduplan-api-v2';
var FRESH_SECONDS = 30;       // how often the folder's last-edit times are re-checked
var CACHE_SECONDS = 21600;    // cached JSON is kept up to 6 hours, but replaced as soon as a sheet changes

// Public fields per sheet. Fields ending in * are required.
var FIELDS = {
  institutions: ['institution_id*', 'name*', 'short_name', 'type*', 'state', 'city', 'website', 'virtual_tour_url', 'admissions_email',
    'admissions_phone', 'whatsapp', 'hostel', 'hostel_fee_min', 'hostel_fee_max', 'last_updated'],
  programmes: ['programme_id*', 'institution_id*', 'course*', 'also_in_courses', 'programme_name*', 'level*', 'study_mode', 'duration_years',
    'intakes', 'campus', 'entry_spm', 'entry_uec', 'entry_olevel', 'entry_stpm', 'entry_other', 'english_requirement', 'tuition_fee_rm', 'mqa_reference',
    'application_deadline', 'apply_url', 'notes', 'last_updated'],
  campus: ['scholarship_id*', 'institution_id*', 'scholarship_name', 'type', 'qualification*', 'minimum_result*',
    'waiver_percent', 'fixed_amount_rm', 'applies_to', 'other_conditions', 'deadline', 'info_url', 'last_updated'],
  foundation: ['option_id*', 'scholarship_name*', 'organiser', 'requirements*', 'award_value', 'deadline', 'info_url', 'last_updated']
};
var NUMBERS = ['hostel_fee_min', 'hostel_fee_max', 'duration_years', 'tuition_fee_rm', 'waiver_percent', 'fixed_amount_rm'];

/* ---------------- Web app entry points ---------------- */

function doGet(e) {
  var json = apiJson_(e && e.parameter && e.parameter.nocache);
  return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON);
}

/* The published data as a JSON string, from the cache when no sheet has changed. Also used by the AI chat (Chat.gs). */
function apiJson_(noCache) {
  var cache = CacheService.getScriptCache();
  var stamp = cache.get(CACHE_KEY + ':stamp');
  if (!stamp || noCache) {
    stamp = editStamp_();
    cache.put(CACHE_KEY + ':stamp', stamp, FRESH_SECONDS);
  }
  var key = CACHE_KEY + ':' + stamp;
  var json = noCache ? null : cacheGet_(cache, key);
  if (!json) {
    json = JSON.stringify(buildFromSheets_());
    cachePut_(cache, key, json);
  }
  return json;
}

/* CacheService keeps at most 100 KB per value, so the JSON is stored in numbered pieces. */
var CACHE_PIECE = 90000;
function cachePut_(cache, key, text) {
  var parts = {}, n = Math.ceil(text.length / CACHE_PIECE);
  if (n > 50) return;  // too large to cache; rebuilt on every request
  for (var i = 0; i < n; i++) parts[key + ':' + i] = text.substr(i * CACHE_PIECE, CACHE_PIECE);
  parts[key + ':n'] = String(n);
  cache.putAll(parts, CACHE_SECONDS);
}
function cacheGet_(cache, key) {
  var n = Number(cache.get(key + ':n'));
  if (!n) return null;
  var keys = [];
  for (var i = 0; i < n; i++) keys.push(key + ':' + i);
  var got = cache.getAll(keys), out = '';
  for (var j = 0; j < n; j++) { if (got[keys[j]] == null) return null; out += got[keys[j]]; }
  return out;
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
    'School sheets read: ' + (d.sources || []).join(', '),
    '',
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
  CacheService.getScriptCache().remove(CACHE_KEY + ':stamp');
  SpreadsheetApp.getUi().alert('Done. The website shows the latest published data on its next load.');
}

/** School sheets in the folder (not starting with "_"), sorted by name. */
function schoolFiles_() {
  var out = [], it = DriveApp.getFolderById(SCHOOL_FOLDER_ID).getFilesByType(MimeType.GOOGLE_SHEETS);
  var master = master_().getId();
  while (it.hasNext()) {
    var f = it.next();
    if (f.getId() !== master && f.getName().charAt(0) !== '_' && !f.isTrashed()) out.push(f);
  }
  return out.sort(function (a, b) { return a.getName() < b.getName() ? -1 : 1; });
}

/** Changes whenever any school sheet or the master sheet is edited, added or removed. */
function editStamp_() {
  var parts = schoolFiles_().map(function (f) { return f.getId() + ':' + f.getLastUpdated().getTime(); });
  parts.push(DriveApp.getFileById(master_().getId()).getLastUpdated().getTime());
  var digest = Utilities.computeDigest(Utilities.DigestAlgorithm.MD5, parts.join('|'));
  return Utilities.base64EncodeWebSafe(digest).slice(0, 22);
}

function tabValues_(ss, keys) {
  var out = {};
  keys.forEach(function (k) {
    var sh = ss.getSheetByName(SHEETS[k]);
    out[k] = sh ? sh.getDataRange().getValues() : [];
  });
  return out;
}

function buildFromSheets_() {
  var master = master_();
  var tz = master.getSpreadsheetTimeZone();
  var values = tabValues_(master, MASTER_TABS);
  values.schools = schoolFiles_().map(function (f) {
    var v = tabValues_(SpreadsheetApp.openById(f.getId()), SCHOOL_TABS);
    v.name = f.getName();
    return v;
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

  // Each school sheet is read on its own; a row may only use an institution_id that the same
  // file defines on its Institutions tab, so one school cannot publish data for another.
  // Older single-sheet data (institutions/programmes/campus at the top level) is read as one source.
  var schools = values.schools || [{ name: '', institutions: values.institutions, programmes: values.programmes, campus: values.campus }];

  function read(sheetKey, rows, label) {
    rows = rows || [];
    if (rows.length < KEY_ROW) return [];
    var keys = rows[KEY_ROW - 1].map(function (k) { return String(k).trim(); });
    var spec = FIELDS[sheetKey];
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
      if (missing.length) { skipped.push({ sheet: label + SHEETS[sheetKey], row: r + 1, reason: 'missing ' + missing.join(', ') }); continue; }
      obj._row = r + 1;
      obj._sheet = label + SHEETS[sheetKey];
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

  var institutions = [], programmes = [], campus = [], known = {}, sources = [];
  schools.forEach(function (school) {
    var label = school.name ? school.name + ' \u203a ' : '';
    if (school.name) sources.push(school.name);
    var own = {}, fileId = String(school.name || '').split(/[\s(]/)[0].toUpperCase();
    read('institutions', school.institutions, label).forEach(function (i) {
      if (fileId && String(i.institution_id).toUpperCase() !== fileId) {
        skipped.push({ sheet: i._sheet, row: i._row, reason: 'institution_id ' + i.institution_id + ' belongs in its own sheet (this file is ' + school.name + ')' });
        return;
      }
      if (known[i.institution_id]) {
        skipped.push({ sheet: i._sheet, row: i._row, reason: 'institution_id ' + i.institution_id + ' is already used in ' + known[i.institution_id] });
        return;
      }
      known[i.institution_id] = school.name || 'this sheet';
      own[i.institution_id] = true;
      institutions.push(i);
    });
    function mine(list) {
      return list.filter(function (x) {
        if (own[x.institution_id]) return true;
        skipped.push({ sheet: x._sheet, row: x._row, reason: 'institution_id ' + x.institution_id + ' is not a published institution in this sheet' });
        return false;
      });
    }
    mine(read('programmes', school.programmes, label)).forEach(function (p) {
      p.course_id = courseIds[p.course] || '';
      // Optional extra courses the programme is also listed under (one dropdown label per line).
      p.also_course_ids = [];
      String(p.also_in_courses || '').split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean).forEach(function (l) {
        if (courseIds[l]) { if (p.also_course_ids.indexOf(courseIds[l]) < 0 && courseIds[l] !== p.course_id) p.also_course_ids.push(courseIds[l]); }
        else skipped.push({ sheet: p._sheet, row: p._row, reason: 'also_in_courses "' + l + '" is not in the Lists sheet (the programme is still shown under its main course)' });
      });
      delete p.also_in_courses;
      if (p.course_id) { programmes.push(p); return; }
      skipped.push({ sheet: p._sheet, row: p._row, reason: 'course "' + p.course + '" is not in the Lists sheet' });
    });
    mine(read('campus', school.campus, label)).forEach(function (c) {
      if (c.waiver_percent !== null || c.fixed_amount_rm !== null) { campus.push(c); return; }
      skipped.push({ sheet: c._sheet, row: c._row, reason: 'fill in waiver_percent or fixed_amount_rm' });
    });
  });

  var foundation = read('foundation', values.foundation, '').map(function (f) {
    f.requirements = f.requirements.split(/\r?\n/).map(function (s) { return s.trim(); }).filter(Boolean);
    return f;
  });

  function strip(list) { return list.map(function (x) { delete x._row; delete x._sheet; return x; }); }
  return {
    version: 1,
    generated_at: generatedAt || new Date().toISOString(),
    institutions: strip(institutions),
    programmes: strip(programmes),
    campus_scholarships: strip(campus),
    foundation_scholarships: strip(foundation),
    sources: sources,
    skipped: skipped
  };
}
