# AI study assistant (chat bubble): setup

The chat bubble at the bottom right of every page answers students' questions about courses, universities,
entry requirements, fees and scholarships. It answers only from the school data published in the Google Sheets
(the same data the website shows) and sends students to a free consultation when the data does not cover a question.

How it works:

1. The student types a question in the chat bubble (`assets/js/chat.js`).
2. The website sends the conversation to the Apps Script `/exec` URL that already serves the school data.
3. Apps Script (`apps-script/Chat.gs`) adds the instructions and the published school data
   (`apps-script/ChatKnowledge.gs`), sends them to Claude with the Anthropic API key kept in Script Properties,
   and returns the answer. The key is never sent to the browser.

Until steps 1 to 4 below are done, the bubble tells students the assistant is not switched on yet and offers a free consultation.

## 1. Create an Anthropic API key

1. Sign in at <https://platform.claude.com> with the Eduplan account and add billing (pay as you go).
2. Open **API keys**, create a key named `eduplan-website`, and copy it (it starts with `sk-ant-`).
3. Optional but recommended: set a monthly spend limit in the console.

## 2. Add the two chat files to Apps Script

In the master sheet: **Extensions > Apps Script**.

1. Replace `Code.gs` with the latest `apps-script/Code.gs` from GitHub (it now shares its data cache with the chat).
2. Click **+ > Script**, name it `Chat`, and paste `apps-script/Chat.gs`.
3. Click **+ > Script**, name it `ChatKnowledge`, and paste `apps-script/ChatKnowledge.gs`.
4. Save.

## 3. Store the key in Script Properties

**Project Settings (gear icon) > Script Properties > Add script property**:

| Property | Value |
|---|---|
| `ANTHROPIC_API_KEY` | the key from step 1 |
| `CHAT_DAILY_LIMIT` | optional, default `300` answers per day for the whole website |
| `CHAT_MODEL` | optional, default `claude-opus-5-5` |

## 4. Test, then deploy a new version

1. In the editor choose the function `chatTest` and click **Run** (allow the permission to connect to an external service).
   The log should show `{"reply":"..."}` with an answer about XMUM foundation programmes.
   - `not_configured`: the key is missing or wrong, or the model name is wrong. **Executions** shows the exact error.
   - `busy`: Anthropic is overloaded or rate-limiting; try again in a minute.
2. **Deploy > Manage deployments > Edit > Version: New version > Deploy**. The `/exec` URL stays the same,
   so nothing changes on the website.

## Cost and limits

- Each answer reads the whole published data set (about 23,000 tokens today) plus the conversation. That part is
  cached for a few minutes between questions, so busy periods cost much less than quiet ones.
- `CHAT_DAILY_LIMIT` caps answers per day (Malaysia time). When it is reached, students are asked to try again
  tomorrow or book a consultation.
- Answers use low effort and at most 2,000 output tokens, which suits short chat replies.
- To spend less per answer, set `CHAT_MODEL` to `claude-sonnet-5-5` or `claude-haiku-5-5`. Check a few answers after changing it.

## What the assistant will and will not do

- It replies in the student's language (English, Chinese or Malay).
- It quotes fees, entry requirements and scholarship percentages only from the published data, and says so when something is not listed.
- It links to the website's pages (faculties, universities, scholarships, interest quiz, consultation).
- It declines questions unrelated to studies, and asks students not to share personal details.
- The rules are in `EDUPLAN_CHAT_SYSTEM` at the top of `ChatKnowledge.gs`. Keep `assets/js/chat-knowledge.js` and
  `apps-script/ChatKnowledge.gs` identical: `tools/build-artifact.py` stops if they differ.

## The Claude artifact preview

The artifact version of the site cannot call the Apps Script URL. There, the chat uses the artifact's built-in
Claude access instead (the viewer is asked once for permission) and answers from the data snapshot embedded in the page.
