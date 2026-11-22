/**
 * Eduplan AI study assistant (the chat bubble on the website).
 *
 * The website POSTs {"action":"chat","messages":[{"role":"user"|"assistant","content":"..."}]} to the same /exec URL (doPost in Code.gs).
 * This script adds the instructions and the published school data (ChatKnowledge.gs) and asks Claude for the reply.
 * The Anthropic API key stays here, in Script Properties; it is never sent to the browser.
 *
 * Script Properties (Project Settings > Script Properties):
 *   ANTHROPIC_API_KEY  required. Create one at https://platform.claude.com (API keys).
 *   CHAT_MODEL         optional, default claude-haiku-5-5 (lowest cost). claude-sonnet-5-5 or claude-opus-5-5 give more careful answers at a higher cost.
 *   CHAT_DAILY_LIMIT   optional, default 300. Replies per day for the whole website; protects the API bill.
 * See docs/ai-chatbot-setup.md.
 */

var CHAT_DEFAULT_MODEL = 'claude-haiku-5-5';
var CHAT_DEFAULT_DAILY_LIMIT = 300;
var CHAT_MAX_TURNS = 12;        // only the latest messages are sent
var CHAT_MAX_CHARS = 1500;      // per message
var CHAT_FALLBACK_MODELS = ['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-sonnet-5-5'];  // accept fallbacks: "default" (Haiku does not)

function chatJson_(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}

/* Keep only well-formed turns: user/assistant alternating, starting and ending with the student. */
function chatMessages_(list) {
  if (!Array.isArray(list)) return null;
  var out = [];
  list.slice(-CHAT_MAX_TURNS).forEach(function (m) {
    if (!m || (m.role !== 'user' && m.role !== 'assistant') || typeof m.content !== 'string') return;
    var text = m.content.trim().slice(0, CHAT_MAX_CHARS);
    if (!text) return;
    if (out.length && out[out.length - 1].role === m.role) out[out.length - 1].content += '\n' + text;
    else out.push({ role: m.role, content: text });
  });
  while (out.length && out[0].role !== 'user') out.shift();
  if (!out.length || out[out.length - 1].role !== 'user') return null;
  return out;
}

/* Counts replies per day (Malaysia time) so the website cannot run up an unlimited bill. */
function chatAllowed_() {
  var props = PropertiesService.getScriptProperties();
  var limit = Number(props.getProperty('CHAT_DAILY_LIMIT')) || CHAT_DEFAULT_DAILY_LIMIT;
  var key = 'chat-count-' + Utilities.formatDate(new Date(), 'Asia/Kuala_Lumpur', 'yyyy-MM-dd');
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(5000)) return false;
  try {
    var n = Number(props.getProperty(key)) || 0;
    if (n >= limit) return false;
    props.setProperty(key, String(n + 1));
    return true;
  } finally { lock.releaseLock(); }
}

function chatReply_(list) {
  var messages = chatMessages_(list);
  if (!messages) return { error: 'bad_request' };
  var props = PropertiesService.getScriptProperties();
  var apiKey = props.getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) return { error: 'not_configured' };
  if (!chatAllowed_()) return { error: 'daily_limit' };

  var model = props.getProperty('CHAT_MODEL') || CHAT_DEFAULT_MODEL;
  var knowledge = eduplanKnowledge(JSON.parse(apiJson_(false)));
  var request = {
    model: model,
    max_tokens: 2000,
    output_config: { effort: 'low' },  // short chat answers; raise to 'medium' if answers need more care
    system: [
      { type: 'text', text: EDUPLAN_CHAT_SYSTEM },
      // The school data is the same for every student, so it is cached between requests (cheaper and faster).
      { type: 'text', text: '<eduplan_data>\n' + knowledge + '\n</eduplan_data>', cache_control: { type: 'ephemeral' } }
    ],
    messages: messages
  };
  var headers = { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' };
  if (CHAT_FALLBACK_MODELS.indexOf(model) > -1) {
    // If a safety check declines a question, Anthropic retries it on its recommended fallback model.
    request.fallbacks = 'default';
    headers['anthropic-beta'] = 'server-side-fallback-2026-07-01';
  }

  var res;
  try {
    res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
      method: 'post', contentType: 'application/json', headers: headers,
      payload: JSON.stringify(request), muteHttpExceptions: true
    });
  } catch (err) {
    console.error('Claude API not reachable: ' + err);
    return { error: 'busy' };
  }
  var status = res.getResponseCode(), data;
  try { data = JSON.parse(res.getContentText()); } catch (err) { data = null; }
  if (status !== 200 || !data) {
    console.error('Claude API ' + status + ': ' + res.getContentText().slice(0, 500));
    if (status === 429 || status === 529 || status >= 500) return { error: 'busy' };
    return { error: 'not_configured' };  // 400/401/403/404: key, model or request settings need checking
  }
  if (data.stop_reason === 'refusal') return { error: 'declined' };
  var text = (data.content || []).filter(function (b) { return b.type === 'text'; })
    .map(function (b) { return b.text; }).join('').trim();
  if (!text) return { error: 'busy' };
  return { reply: text };
}

/* Run from the Apps Script editor (select chatTest, Run) to check the key and the model. The answer appears in the log. */
function chatTest() {
  console.log(JSON.stringify(chatReply_([{ role: 'user', content: 'Which XMUM foundation programmes are there?' }])));
}
