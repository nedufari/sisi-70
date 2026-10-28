/**
 * Sisi mi @ 70: the Google side, in one Apps Script project.
 *
 * 1. setup() (run once from the editor): creates the RSVP form with its questions (no sign-in needed),
 *    the Google Sheet its answers go to, and the Drive folder for video messages, then logs the
 *    details the website's config.js needs.
 * 2. doPost(): once deployed as a web app, the website asks it for an upload link and sends each video
 *    straight into that folder, so large phone videos work and nothing passes through a server of ours.
 *
 * Deploy: Deploy > New deployment > Web app, "Execute as: Me", "Who has access: Anyone".
 */

const MAX_MB = 200;

const QUESTIONS = [
  ['response', 'Will you be joining us?', 'choice', ['Joyfully accept', 'Regretfully decline']],
  ['firstName', 'First name', 'text'],
  ['lastName', 'Last name', 'text'],
  ['whatsapp', 'WhatsApp number', 'text'],
  ['email', 'Email', 'text'],
  ['attending', 'Which part of the day?', 'choice', ['Thanksgiving service and reception', 'Thanksgiving service only', 'Reception only']],
  ['wish', 'Birthday wish', 'paragraph'],
  ['video', 'Video message', 'text'],
  ['passCode', 'Pass code', 'text'],
];

function setup() {
  const props = PropertiesService.getScriptProperties();
  if (props.getProperty('FORM_ID')) {
    Logger.log('Already set up. The details for config.js:');
    return report_();
  }

  const form = FormApp.create('Sisi mi @ 70 · RSVP')
    .setDescription("RSVPs from Sisi mi's 70th birthday website. Guests answer on the website; this form only collects them.")
    .setCollectEmail(false)
    .setLimitOneResponsePerUser(false) // either of these would make guests sign in to Google
    .setAllowResponseEdits(false)
    .setShowLinkToRespondAgain(false);
  try { form.setRequireLogin(false); } catch (e) { /* only exists on Workspace accounts */ }

  for (const [, title, type, options] of QUESTIONS) {
    // every question optional: the website does the checking, and Google rejects a reply that leaves a required one blank
    if (type === 'choice') form.addMultipleChoiceItem().setTitle(title).setChoiceValues(options).setRequired(false);
    else if (type === 'paragraph') form.addParagraphTextItem().setTitle(title).setRequired(false);
    else form.addTextItem().setTitle(title).setRequired(false);
  }

  const sheet = SpreadsheetApp.create('Sisi mi @ 70 · RSVPs');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, sheet.getId());

  const folder = DriveApp.createFolder('Sisi mi @ 70 · Video messages');

  props.setProperties({ FORM_ID: form.getId(), SHEET_ID: sheet.getId(), FOLDER_ID: folder.getId() });
  Logger.log('Created the form, the sheet and the video folder.');
  return report_();
}

/** The form's field numbers, read from a pre-filled link, and everything else the website needs. */
function report_() {
  const props = PropertiesService.getScriptProperties();
  const form = FormApp.openById(props.getProperty('FORM_ID'));
  const items = form.getItems();
  let resp = form.createResponse();
  items.forEach((item, i) => {
    const [, , type, options] = QUESTIONS[i];
    if (type === 'choice') resp = resp.withItemResponse(item.asMultipleChoiceItem().createResponse(options[0]));
    else if (type === 'paragraph') resp = resp.withItemResponse(item.asParagraphTextItem().createResponse('q' + i));
    else resp = resp.withItemResponse(item.asTextItem().createResponse('q' + i));
  });
  const ids = (resp.toPrefilledUrl().match(/entry\.\d+/g) || []).map((e) => e.replace('entry.', ''));
  const entries = {};
  QUESTIONS.forEach(([key], i) => { entries[key] = ids[i] || ''; });
  const out = {
    form: { action: form.getPublishedUrl().replace(/\/viewform.*$/, '/formResponse'), entries: entries },
    formEditUrl: form.getEditUrl(),
    sheetUrl: SpreadsheetApp.openById(props.getProperty('SHEET_ID')).getUrl(),
    folderUrl: DriveApp.getFolderById(props.getProperty('FOLDER_ID')).getUrl(),
  };
  Logger.log('SISIMI_CONFIG ' + JSON.stringify(out));
  return out;
}

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.action !== 'start') return reply({ ok: false, error: 'Unknown request' });

    const size = Number(req.size) || 0;
    const mimeType = String(req.mimeType || '');
    if (!/^video\//.test(mimeType)) return reply({ ok: false, error: 'Only video files can be sent' });
    if (size <= 0 || size > MAX_MB * 1024 * 1024) return reply({ ok: false, error: 'The video is larger than ' + MAX_MB + ' MB' });

    const folderId = PropertiesService.getScriptProperties().getProperty('FOLDER_ID');
    if (!folderId) return reply({ ok: false, error: 'Video messages are not set up yet' });

    const guest = clean(req.name) || 'A guest';
    const ext = mimeType.indexOf('mp4') > -1 ? 'mp4' : mimeType.indexOf('quicktime') > -1 ? 'mov' : 'webm';
    const when = Utilities.formatDate(new Date(), 'Africa/Lagos', 'd MMM yyyy, HH.mm');
    const name = guest + (req.code ? ' · ' + clean(req.code) : '') + ' · ' + when + '.' + ext;

    // Drive only lets a web page upload to the link if the link was made for that page's address
    const origin = /^https:\/\/[a-z0-9.-]+(:\d+)?$|^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(String(req.origin || '')) ? req.origin : '';
    const headers = {
      Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
      'X-Upload-Content-Type': mimeType,
      'X-Upload-Content-Length': String(size),
    };
    if (origin) headers.Origin = origin;
    const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name', {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      headers: headers,
      payload: JSON.stringify({ name: name, parents: [folderId], description: 'Birthday video message for Sisi mi from ' + guest }),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) return reply({ ok: false, error: 'Drive refused the upload (' + res.getResponseCode() + ')' });

    const sent = res.getHeaders();
    return reply({ ok: true, uploadUrl: sent.Location || sent.location });
  } catch (err) {
    return reply({ ok: false, error: 'Something went wrong starting the upload' });
  }
}

function clean(s) {
  return String(s || '').replace(/[\\/:*?"<>|\n\r]+/g, ' ').trim().slice(0, 80);
}

function reply(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
