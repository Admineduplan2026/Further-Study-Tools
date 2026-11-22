/**
 * EDUPLAN latest news ("最新消息"): Claude drafts one email about what is new on the website (new activities, schools,
 * programmes and scholarships since the last news), an EDUPLAN staff member checks and edits it on the staff page
 * (#staff), and only after they approve it is it emailed, in the background, to every student with an EDUPLAN account.
 * Nothing is ever sent without that approval.
 *
 * The website POSTs {"action":"account_news","token":<staff session>,"op":...} (Account.gs sends it here):
 *   op "get"      the current draft, how many people it would go to, the sending progress and the last sends
 *   op "draft"    makes a new draft from the changes since the last news (Claude, or a plain list without a key);
 *                 with "all": true it covers every upcoming activity, even ones announced before
 *   op "blank"    an empty draft that staff write themselves
 *   op "save"     saves the staff member's edits {subject, body}
 *   op "approve"  sends the draft (in batches within the Gmail quota; the daily trigger carries on the next day)
 *   op "discard"  drops the draft; its changes count as announced, so the next draft starts after them
 *
 * Who gets it: the students in Eduplan Student Portfolios (column A), each email with the same stop link as the
 * activity emails (Exhibition.gs, Unsubscribed tab). People who only signed up for one activity are not emailed.
 * WhatsApp (phase two, not built yet): students tick "WhatsApp updates" in My profile; "get" counts them so EDUPLAN
 * can see the list grow. Sending by WhatsApp needs the WhatsApp Business Platform (Meta) and approved templates.
 *
 * Run newsSetup once from the editor: it records today's school data and activities as already announced (so the first
 * draft is not the whole website) and turns on the Monday 9am draft (staff get an email when a draft is ready) and the
 * daily trigger that continues sending. Script Properties used: NEWS_SEEN, NEWS_DRAFT, NEWS_JOB, NEWS_LOG (set here),
 * ANTHROPIC_API_KEY and CHAT_MODEL (Chat.gs) for the wording.
 */

var NEWS_MAX_BODY = 6000;

function newsProps_() { return PropertiesService.getScriptProperties(); }
function newsGet_(k) { try { return JSON.parse(newsProps_().getProperty(k) || 'null'); } catch (err) { return null; } }
function newsSet_(k, v) { if (v == null) newsProps_().deleteProperty(k); else newsProps_().setProperty(k, JSON.stringify(v)); }
function newsShort_(s) { return accountHash_('news:' + s).slice(0, 10); }
function newsStamp_() { return Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', "yyyy-MM-dd'T'HH:mm"); }

/* What is on the website now: short fingerprints per kind (fits in Script Properties) and readable items. */
function newsNow_() {
  var d = JSON.parse(apiJson_(false)), today = expoToday_(), byInst = {};
  (d.institutions || []).forEach(function (i) { byInst[i.institution_id] = i.short_name || i.name; });
  var items = {
    inst: (d.institutions || []).map(function (i) { return { k: i.institution_id, t: i.name + (i.city ? ' (' + i.city + ')' : '') }; }),
    prog: (d.programmes || []).map(function (p) { return { k: p.programme_id, t: p.programme_name + ' — ' + (byInst[p.institution_id] || p.institution_id) + (p.level ? ', ' + p.level : '') }; }),
    sch: (d.campus_scholarships || []).map(function (c) { return { k: c.scholarship_id, t: (c.scholarship_name || c.type || 'Scholarship') + ' — ' + (byInst[c.institution_id] || c.institution_id) }; })
      .concat((d.foundation_scholarships || []).map(function (f) { return { k: 'F' + f.option_id + f.scholarship_name, t: f.scholarship_name + (f.organiser ? ' — ' + f.organiser : '') }; })),
    ev: []
  };
  try {
    var site = expoSite_();
    expoStore_().table('events').all().forEach(function (e) {
      if (e.status !== 'published' || e.date < today) return;
      var tr = expoTr_(e);
      items.ev.push({ k: e.id, t: tr.title_zh + (tr.title_en !== tr.title_zh ? ' / ' + tr.title_en : '') + ' — ' + e.date + ' ' + e.start_time + '–' + e.end_time + ', ' +
        [e.venue, e.city, e.state].filter(Boolean).join(', ') + ' — ' + site + (e.share_page ? 'e/' + e.id + '.html' : '#/e/' + e.id) });
    });
  } catch (err) { console.warn('news: activities not read: ' + err); }
  var seen = {};
  Object.keys(items).forEach(function (k) { seen[k] = items[k].map(function (x) { return newsShort_(x.k); }).join(' '); });
  return { items: items, seen: seen };
}
/* The items not in the last announced set. */
function newsChanges_(now) {
  var last = newsGet_('NEWS_SEEN') || {}, out = {};
  Object.keys(now.items).forEach(function (k) {
    var had = {};
    String(last[k] || '').split(' ').forEach(function (h) { if (h) had[h] = 1; });
    out[k] = now.items[k].filter(function (x) { return !had[newsShort_(x.k)]; }).map(function (x) { return x.t; });
  });
  return out;
}
function newsCount_(c) { return (c.ev || []).length + (c.inst || []).length + (c.prog || []).length + (c.sch || []).length; }

/* The email text: Claude writes it from the list of changes only; without a key, a plain bilingual list. */
function newsWrite_(c) {
  var site = expoSite_().replace(/exhibition\/?$/, ''), list = function (a, n) { return a.slice(0, n).map(function (t) { return '• ' + t; }).join('\n') + (a.length > n ? '\n• … +' + (a.length - n) : ''); };
  var facts = 'New activities (talks and fairs):\n' + (c.ev.length ? list(c.ev, 10) : '(none)') +
    '\n\nNew universities and colleges:\n' + (c.inst.length ? list(c.inst, 10) : '(none)') +
    '\n\nNew programmes:\n' + (c.prog.length ? list(c.prog, 15) : '(none)') +
    '\n\nNew scholarships:\n' + (c.sch.length ? list(c.sch, 10) : '(none)') + '\n\nWebsite: ' + site;
  var key = newsProps_().getProperty('ANTHROPIC_API_KEY');
  if (key) {
    try {
      var res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
        method: 'post', contentType: 'application/json', muteHttpExceptions: true,
        headers: { 'x-api-key': key, 'anthropic-version': '2023-06-01' },
        payload: JSON.stringify({
          model: newsProps_().getProperty('CHAT_MODEL') || 'claude-haiku-5-5', max_tokens: 2500,
          system: 'You write the EDUPLAN update email for Malaysian students who finished SPM and their parents. EDUPLAN is always written in capitals. ' +
            'Use only the facts given: never add dates, fees, names, requirements or promises that are not in them. Write the Simplified Chinese part first, ' +
            'then the English part, each short and friendly: a one-line greeting, the new activities first (each with its date, place and link), then the other ' +
            'news grouped, and end by inviting them to the website. Plain text, no markdown, at most about 250 words per language. ' +
            'Reply with only a JSON object: {"subject": "...", "body": "..."} (the subject in Chinese and English, under 90 characters).',
          messages: [{ role: 'user', content: facts }]
        })
      });
      if (res.getResponseCode() === 200) {
        var data = JSON.parse(res.getContentText());
        var text = (data.content || []).filter(function (b) { return b.type === 'text'; }).map(function (b) { return b.text; }).join('');
        var m = text.match(/\{[\s\S]*\}/), o = m && JSON.parse(m[0]);
        if (o && o.subject && o.body) return { subject: String(o.subject).slice(0, 150), body: String(o.body).slice(0, NEWS_MAX_BODY), ai: true };
      } else console.warn('news draft ' + res.getResponseCode() + ': ' + res.getContentText().slice(0, 300));
    } catch (err) { console.warn('news draft failed: ' + err); }
  }
  return { subject: 'EDUPLAN 最新消息 · What is new on EDUPLAN', ai: false,
    body: ('你好！EDUPLAN 网站有以下更新：\nHi! Here is what is new on EDUPLAN:\n\n' + facts).slice(0, NEWS_MAX_BODY) };
}

/* A new draft from the changes now; {error: 'no_changes'} when nothing is new. allEvents: every upcoming activity. */
function newsDraft_(by, allEvents) {
  var now = newsNow_(), c = newsChanges_(now);
  if (allEvents) c.ev = now.items.ev.map(function (x) { return x.t; });
  var n = newsCount_(c);
  if (!n) return { error: 'no_changes' };
  var w = newsWrite_(c);
  var draft = { subject: w.subject, body: w.body, ai: w.ai, counts: { ev: c.ev.length, inst: c.inst.length, prog: c.prog.length, sch: c.sch.length },
    seen: now.seen, made_at: newsStamp_(), made_by: by || 'weekly' };
  newsSet_('NEWS_DRAFT', draft);
  return { ok: true };
}

/* Students to email: unique emails from the portfolio sheet, without those who stopped the emails. */
function newsList_() {
  var off = {}, seen = {}, out = [];
  try { expoStore_().table('unsubscribed').all().forEach(function (u) { off[u.h] = 1; }); } catch (err) { /* no activity sheet yet */ }
  expoStudentEmails_().forEach(function (v) { var e = accountEmail_(v); if (e && !seen[e] && !off[accountHash_(e)]) { seen[e] = 1; out.push(e); } });
  return out;
}
/* Students who ticked "WhatsApp updates" and gave a number (for phase two). */
function newsWhatsAppCount_() {
  var sh = accountSheet_(), n = sh.getLastRow(), count = 0;
  if (n < 2) return 0;
  sh.getRange(2, ACCOUNT_COL.data, n - 1, 1).getValues().forEach(function (r) {
    try { var f = (JSON.parse(r[0] || '{}').profile || {}).f || {}; if (f.wa_ok && String(f.phone || '').replace(/\D/g, '').length >= 9) count++; } catch (err) { /* skip */ }
  });
  return count;
}

function accountNews_(body) {
  var who = accountStaffEmail_(body);   // Account.gs: staff only
  if (who.error) return who;
  var op = String(body.op || 'get'), lock = LockService.getScriptLock();
  if (op !== 'get' && !lock.tryLock(30000)) return { error: 'busy' };
  try {
    var job = newsGet_('NEWS_JOB');
    if (op === 'draft') {
      if (job && !job.done_at) return { error: 'sending' };
      var r = newsDraft_(who.email, body.all === true);
      if (r.error) return r;
    } else if (op === 'blank') {
      if (job && !job.done_at) return { error: 'sending' };
      newsSet_('NEWS_DRAFT', { subject: 'EDUPLAN 最新消息 · News from EDUPLAN', body: '', ai: true, counts: null, seen: newsNow_().seen,
        made_at: newsStamp_(), made_by: who.email });
    } else if (op === 'save') {
      var d = newsGet_('NEWS_DRAFT');
      if (!d) return { error: 'not_found' };
      d.subject = String(body.subject || '').replace(/[\r\n]+/g, ' ').trim().slice(0, 150);
      d.body = String(body.body || '').replace(/\r/g, '').trim().slice(0, NEWS_MAX_BODY);
      if (!d.subject || !d.body) return { error: 'missing' };
      d.edited_by = who.email; d.edited_at = newsStamp_();
      newsSet_('NEWS_DRAFT', d);
    } else if (op === 'approve') {
      var dr = newsGet_('NEWS_DRAFT');
      if (!dr) return { error: 'not_found' };
      if (job && !job.done_at) return { error: 'sending' };
      newsSet_('NEWS_SEEN', dr.seen);
      newsSet_('NEWS_JOB', { subject: dr.subject, body: dr.body, next: 0, sent: 0, total: newsList_().length, by: who.email, at: newsStamp_(), done_at: '' });
      newsSet_('NEWS_DRAFT', null);
      newsSoon_();
    } else if (op === 'discard') {
      var dd = newsGet_('NEWS_DRAFT');
      if (dd) newsSet_('NEWS_SEEN', dd.seen);
      newsSet_('NEWS_DRAFT', null);
    }
    var draft = newsGet_('NEWS_DRAFT');
    if (draft) delete draft.seen;
    return { draft: draft, recipients: newsList_().length, whatsapp: newsWhatsAppCount_(), job: newsGet_('NEWS_JOB'), log: newsGet_('NEWS_LOG') || [],
      ai: !!newsProps_().getProperty('ANTHROPIC_API_KEY') };
  } finally {
    if (op !== 'get') lock.releaseLock();
  }
}

/* ---------- Sending (background, within the Gmail quota) ---------- */

function newsSoon_() {
  try { ScriptApp.newTrigger('newsSendNow').timeBased().after(60 * 1000).create(); }
  catch (err) { console.warn('news trigger not made (run newsSetup once): ' + err); }
}
function newsSendNow() {
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'newsSendNow') ScriptApp.deleteTrigger(t); });
  newsSendRun_();
}
function newsSendRun_() {
  var cache = CacheService.getScriptCache();
  if (cache.get('news-run')) return { busy: true };
  cache.put('news-run', '1', 600);
  try {
    var job = newsGet_('NEWS_JOB');
    if (!job || job.done_at) return { sent: 0 };
    var list = newsList_(), budget = MailApp.getRemainingDailyQuota() - EXPO_MAIL_RESERVE, site = expoSite_().replace(/exhibition\/?$/, ''), n = 0;
    while (budget > 0 && job.next < list.length) {
      var to = list[job.next];
      try {
        MailApp.sendEmail({ to: to, name: 'EDUPLAN', subject: job.subject,
          body: job.body + '\n\n— EDUPLAN ' + site + '\n\n不想再收到 EDUPLAN 消息？Stop these emails:\n' + expoUnsubLink_(to) });
      } catch (err) { console.error('news send failed: ' + err); break; }   // try again with the next run
      budget--; job.next++; job.sent++; n++;
      if (n % 20 === 0) newsSet_('NEWS_JOB', job);
    }
    if (job.next >= list.length) {
      job.done_at = newsStamp_();
      var log = newsGet_('NEWS_LOG') || [];
      log.unshift({ at: job.at, subject: job.subject, sent: job.sent, by: job.by, done_at: job.done_at });
      newsSet_('NEWS_LOG', log.slice(0, 10));
    }
    newsSet_('NEWS_JOB', job);
    return { sent: n };
  } finally { cache.remove('news-run'); }
}

/* Daily (8am): carries on sending; on Mondays, makes a draft when something is new and tells the staff. */
function newsDaily() {
  newsSendRun_();
  if (Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'u') !== '1') return;
  var job = newsGet_('NEWS_JOB');
  if (newsGet_('NEWS_DRAFT') || (job && !job.done_at)) return;
  var r = newsDraft_('weekly');
  if (r.error) return;
  var staff = String(newsProps_().getProperty('STAFF_EMAILS') || 'admin.eduplan@gmail.com').split(/[,;\s]+/).filter(Boolean);
  try {
    MailApp.sendEmail({ to: staff.join(','), name: 'EDUPLAN', subject: 'EDUPLAN 最新消息草稿待审核 · News draft to review',
      body: '本周的 EDUPLAN 最新消息草稿已经写好，请到员工门户审核后再发出：\nThis week\'s EDUPLAN news draft is ready. Please review it on the staff page before it is sent:\n\n' +
        expoSite_().replace(/exhibition\/?$/, '') + '#staff' });
  } catch (err) { console.warn('news staff email failed: ' + err); }
}

/* Run once from the editor (select newsSetup, Run). */
function newsSetup() {
  if (!newsGet_('NEWS_SEEN')) newsSet_('NEWS_SEEN', newsNow_().seen);   // today's website counts as announced
  ScriptApp.getProjectTriggers().forEach(function (t) { if (t.getHandlerFunction() === 'newsDaily') ScriptApp.deleteTrigger(t); });
  ScriptApp.newTrigger('newsDaily').timeBased().everyDays(1).atHour(8).inTimezone('Asia/Kuala_Lumpur').create();
  console.log('Latest news on: a draft every Monday when something is new (staff are emailed), sending continues daily. ' +
    'Students with an account: ' + newsList_().length + '.');
}
