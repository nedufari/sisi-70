/**
 * Sisi mi @ 70: puts guests' video messages into a Google Drive folder.
 *
 * The website asks this script for an upload link, then sends the video straight to Drive,
 * so large phone videos work and nothing passes through a server of ours.
 * Deploy: Deploy > New deployment > Web app, "Execute as: Me", "Who has access: Anyone".
 */

// The Drive folder's id: the last part of its address, drive.google.com/drive/folders/<THIS>
const FOLDER_ID = 'PASTE_THE_FOLDER_ID_HERE';
const MAX_MB = 200;

function doPost(e) {
  try {
    const req = JSON.parse(e.postData.contents);
    if (req.action !== 'start') return reply({ ok: false, error: 'Unknown request' });

    const size = Number(req.size) || 0;
    const mimeType = String(req.mimeType || '');
    if (!/^video\//.test(mimeType)) return reply({ ok: false, error: 'Only video files can be sent' });
    if (size <= 0 || size > MAX_MB * 1024 * 1024) return reply({ ok: false, error: 'The video is larger than ' + MAX_MB + ' MB' });

    const guest = clean(req.name) || 'A guest';
    const ext = mimeType.indexOf('mp4') > -1 ? 'mp4' : mimeType.indexOf('quicktime') > -1 ? 'mov' : 'webm';
    const when = Utilities.formatDate(new Date(), 'Africa/Lagos', 'd MMM yyyy, HH.mm');
    const name = guest + (req.code ? ' · ' + clean(req.code) : '') + ' · ' + when + '.' + ext;

    const res = UrlFetchApp.fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&fields=id,name', {
      method: 'post',
      contentType: 'application/json; charset=UTF-8',
      headers: {
        Authorization: 'Bearer ' + ScriptApp.getOAuthToken(),
        'X-Upload-Content-Type': mimeType,
        'X-Upload-Content-Length': String(size),
      },
      payload: JSON.stringify({ name: name, parents: [FOLDER_ID], description: 'Birthday video message for Sisi mi from ' + guest }),
      muteHttpExceptions: true,
    });
    if (res.getResponseCode() !== 200) return reply({ ok: false, error: 'Drive refused the upload (' + res.getResponseCode() + ')' });

    const headers = res.getHeaders();
    return reply({ ok: true, uploadUrl: headers.Location || headers.location });
  } catch (err) {
    return reply({ ok: false, error: 'Something went wrong starting the upload' });
  }
}

/** Run this once from the editor (Run > authorize) so Google asks for permission to use Drive. */
function authorize() {
  Logger.log('Videos will go into: ' + DriveApp.getFolderById(FOLDER_ID).getName());
}

function clean(s) {
  return String(s || '').replace(/[\\/:*?"<>|\n\r]+/g, ' ').trim().slice(0, 80);
}

function reply(o) {
  return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON);
}
