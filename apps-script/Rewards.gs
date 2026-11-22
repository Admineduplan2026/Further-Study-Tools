/**
 * EDUPLAN game points and gifts ("兑换礼物"): students who are signed in collect the EDUPLAN tools they catch in the mini
 * game (#game); every 100 caught gives 1 point, and points can be exchanged for gifts on the Rewards page (#rewards).
 * EDUPLAN staff list the gifts in the "Gifts" tab of Eduplan School Data and hand them over (Redemptions tab).
 *
 * The website POSTs {"action":"account_game","token":<student session>,"op":...} (Account.gs sends it here):
 *   op "start"   a new game: returns a game id (the server notes when it started)
 *   op "end"     {gid, caught}: adds the tools caught in that game (checked: one report per game, at least 25 seconds
 *                after it started, at most GAME_MAX_PER_ROUND, at most GAME_MAX_PER_DAY a day)
 *   op "status"  points, progress to the next point, the gifts and the student's own exchanges
 *   op "redeem"  {gift_id}: exchanges points for a gift (enough points, gift active and in stock)
 * The checks make points hard to fake but a game in the browser can never be made cheat-proof, so keep gifts modest.
 *
 * Data: tabs "Game points" (one row per student) and "Redemptions" in Eduplan Student Portfolios (private), and "Gifts"
 * in Eduplan School Data, which staff fill in: gift_id, name, name_zh, points, stock, image_url, active (Yes), note.
 * Stock left = stock minus the exchanges of that gift that are not "Cancelled". Run rewardsSetup once to make the tabs.
 * A new exchange emails STAFF_EMAILS (default admin.eduplan@gmail.com) and the student.
 */

var GAME_PER_POINT = 100;
var GAME_MAX_PER_ROUND = 60;      // a 30-second round drops about 45 tools
var GAME_MIN_SECONDS = 25;
var GAME_MAX_PER_DAY = 600;       // at most 6 points a day
var GIFT_COLS = ['gift_id', 'name', 'name_zh', 'points', 'stock', 'image_url', 'active', 'note'];
var POINT_COLS = ['email', 'caught', 'spent', 'today', 'today_caught', 'updated_at'];
var REDEEM_COLS = ['time', 'id', 'email', 'name', 'gift_id', 'gift', 'points', 'status', 'note'];

function rewardsTab_(ss, name, cols, plain) {
  var sh = ss.getSheetByName(name);
  if (!sh) {
    sh = ss.insertSheet(name);
    if (plain) sh.getRange(1, 1, sh.getMaxRows(), cols.length).setNumberFormat('@');
    sh.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold').setBackground('#e4f2fa');
    sh.setFrozenRows(1);
  }
  return sh;
}
function rewardsRows_(sh, cols) {
  var n = sh.getLastRow();
  if (n < 2) return [];
  return sh.getRange(2, 1, n - 1, cols.length).getValues().map(function (r, i) {
    var o = { _row: i + 2 };
    cols.forEach(function (c, j) { o[c] = r[j] instanceof Date ? Utilities.formatDate(r[j], 'Asia/Kuala_Lumpur', "yyyy-MM-dd'T'HH:mm") : String(r[j] == null ? '' : r[j]); });
    return o;
  });
}
function rewardsPoints_() { return rewardsTab_(statsBook_(), 'Game points', POINT_COLS, true); }   // Stats.gs: Eduplan Student Portfolios
function rewardsRedemptions_() { return rewardsTab_(statsBook_(), 'Redemptions', REDEEM_COLS, true); }
function rewardsGifts_() { return rewardsTab_(master_(), 'Gifts', GIFT_COLS, true); }               // Code.gs: Eduplan School Data

/* The gifts staff made active, with the stock left. */
function rewardsGiftList_(redemptions) {
  var used = {};
  redemptions.forEach(function (r) { if (r.status !== 'Cancelled') used[r.gift_id] = (used[r.gift_id] || 0) + 1; });
  return rewardsRows_(rewardsGifts_(), GIFT_COLS).filter(function (g) { return g.gift_id && /^y/i.test(g.active) && Number(g.points) > 0; })
    .map(function (g) {
      var stock = g.stock === '' ? null : Math.max(0, (Number(g.stock) || 0) - (used[g.gift_id] || 0));
      return { id: g.gift_id, name: g.name, name_zh: g.name_zh || '', points: Number(g.points), left: stock, image: /^https:\/\//.test(g.image_url) ? g.image_url : '', note: g.note };
    });
}
function rewardsMine_(email) {
  var sh = rewardsPoints_(), rows = rewardsRows_(sh, POINT_COLS);
  for (var i = 0; i < rows.length; i++) if (rows[i].email === email) return { sh: sh, row: rows[i] };
  return { sh: sh, row: null };
}
function rewardsOut_(rec, email, extra) {
  var caught = Number(rec && rec.caught) || 0, spent = Number(rec && rec.spent) || 0, earned = Math.floor(caught / GAME_PER_POINT);
  var out = { caught: caught, earned: earned, points: Math.max(0, earned - spent), progress: caught % GAME_PER_POINT, per_point: GAME_PER_POINT };
  Object.keys(extra || {}).forEach(function (k) { out[k] = extra[k]; });
  return out;
}
/* The signed-in student's email, or {error}. */
function rewardsWho_(body) {
  var sh = accountSheet_(), s = accountSession_(sh, body.token);
  if (!s) return { error: 'signed_out' };
  return { email: String(sh.getRange(s.row, ACCOUNT_COL.email).getValue()).toLowerCase() };
}

function accountGame_(body) {
  var who = rewardsWho_(body);
  if (who.error) return who;
  var op = String(body.op || 'status'), cache = CacheService.getScriptCache();
  if (op === 'start') {
    var gid = Utilities.getUuid().replace(/-/g, '');
    cache.put('game-' + gid, JSON.stringify({ e: who.email, t: Date.now() }), 1800);
    return { gid: gid };
  }
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(20000)) return { error: 'busy' };
  try {
    var mine = rewardsMine_(who.email), rec = mine.row, today = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
    if (op === 'end') {
      var g = null, gid2 = String(body.gid || '');
      try { g = JSON.parse(cache.get('game-' + gid2) || 'null'); } catch (err) { g = null; }
      if (!g || g.e !== who.email) return rewardsOut_(rec, who.email, { error: 'bad_game' });
      cache.remove('game-' + gid2);   // one report per game
      if (Date.now() - g.t < GAME_MIN_SECONDS * 1000) return rewardsOut_(rec, who.email, { error: 'too_fast' });
      var n = Math.max(0, Math.min(GAME_MAX_PER_ROUND, Math.floor(Number(body.caught) || 0)));
      var tc = rec && rec.today === today ? Number(rec.today_caught) || 0 : 0, add = Math.max(0, Math.min(n, GAME_MAX_PER_DAY - tc));
      var before = Math.floor((Number(rec && rec.caught) || 0) / GAME_PER_POINT);
      var row = { email: who.email, caught: (Number(rec && rec.caught) || 0) + add, spent: Number(rec && rec.spent) || 0, today: today, today_caught: tc + add, updated_at: Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', "yyyy-MM-dd'T'HH:mm") };
      var vals = [POINT_COLS.map(function (c) { return String(row[c]); })];
      if (rec) mine.sh.getRange(rec._row, 1, 1, POINT_COLS.length).setValues(vals);
      else mine.sh.getRange(mine.sh.getLastRow() + 1, 1, 1, POINT_COLS.length).setNumberFormat('@').setValues(vals);
      return rewardsOut_(row, who.email, { added: add, new_points: Math.floor(row.caught / GAME_PER_POINT) - before, day_limit: add < n });
    }
    var redSh = rewardsRedemptions_(), reds = rewardsRows_(redSh, REDEEM_COLS);
    if (op === 'redeem') {
      var gifts = rewardsGiftList_(reds), gift = null;
      gifts.forEach(function (x) { if (x.id === String(body.gift_id || '')) gift = x; });
      if (!gift) return { error: 'not_found' };
      if (gift.left === 0) return { error: 'out_of_stock' };
      var have = rewardsOut_(rec, who.email);
      if (have.points < gift.points) return { error: 'not_enough_points' };
      var id = 'RW-' + Utilities.getUuid().replace(/-/g, '').slice(0, 8).toUpperCase(), now = Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', "yyyy-MM-dd'T'HH:mm");
      var name = '';
      try { var d = accountData_(accountSheet_(), accountFind_(accountSheet_(), ACCOUNT_COL.email, who.email)); name = ((d.profile || {}).f || {}).name || ''; } catch (err) { name = ''; }
      redSh.getRange(redSh.getLastRow() + 1, 1, 1, REDEEM_COLS.length).setNumberFormat('@')
        .setValues([[now, id, who.email, accountCell_(name, 120), gift.id, accountCell_(gift.name, 160), String(gift.points), 'Pending', '']]);
      var spent = (Number(rec && rec.spent) || 0) + gift.points;
      if (rec) mine.sh.getRange(rec._row, POINT_COLS.indexOf('spent') + 1).setValue(String(spent));
      else mine.sh.getRange(mine.sh.getLastRow() + 1, 1, 1, POINT_COLS.length).setNumberFormat('@').setValues([[who.email, '0', String(spent), today, '0', now]]);
      rec = rec || {}; rec.caught = rec.caught || 0; rec.spent = spent;
      try {
        var staff = String(PropertiesService.getScriptProperties().getProperty('STAFF_EMAILS') || 'admin.eduplan@gmail.com').split(/[,;\s]+/).filter(Boolean);
        MailApp.sendEmail({ to: staff.join(','), name: 'EDUPLAN', subject: '礼物兑换 Gift exchange ' + id + ': ' + gift.name,
          body: who.email + (name ? ' (' + name + ')' : '') + ' 用 ' + gift.points + ' points 兑换了「' + gift.name + '」。\nPlease arrange the gift and update the status in the Redemptions tab of Eduplan Student Portfolios.\n\n兑换编号 Reference: ' + id });
        MailApp.sendEmail({ to: who.email, name: 'EDUPLAN', subject: 'EDUPLAN 礼物兑换成功 · Gift exchange ' + id,
          body: '你已用 ' + gift.points + ' points 兑换「' + (gift.name_zh || gift.name) + '」。EDUPLAN 会联络你安排领取。\nYou exchanged ' + gift.points + ' points for "' + gift.name + '". EDUPLAN will contact you about collecting it.\n\n兑换编号 Reference: ' + id });
      } catch (err) { console.warn('gift emails: ' + err); }
      reds = rewardsRows_(redSh, REDEEM_COLS);
      return rewardsOut_(rec, who.email, { redeemed: id, gifts: rewardsGiftList_(reds), mine: rewardsMineList_(reds, who.email) });
    }
    return rewardsOut_(rec, who.email, { gifts: rewardsGiftList_(reds), mine: rewardsMineList_(reds, who.email) });
  } finally {
    lock.releaseLock();
  }
}
function rewardsMineList_(reds, email) {
  return reds.filter(function (r) { return r.email === email; }).reverse().slice(0, 20)
    .map(function (r) { return { id: r.id, time: r.time, gift: r.gift, points: Number(r.points) || 0, status: r.status }; });
}

/* Run once from the editor (select rewardsSetup, Run): makes the Gifts tab (Eduplan School Data) and the Game points and
   Redemptions tabs (Eduplan Student Portfolios). Then add gifts in the Gifts tab, with active = Yes. */
function rewardsSetup() {
  var g = rewardsGifts_(); rewardsPoints_(); rewardsRedemptions_();
  if (g.getLastRow() < 2) g.getRange(1, 1, 1, GIFT_COLS.length).setNote('gift_id: short code (G1, G2 …). points: cost. stock: how many (empty = no limit). active: Yes to show it.');
  console.log('Rewards tabs ready. Add gifts in Eduplan School Data > Gifts (active = Yes).');
}
