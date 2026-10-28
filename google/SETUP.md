# Connecting the site to the client's Google account

Do this signed in to **the client's** Google account. It takes about 10 minutes. Until it's done, the site runs in preview mode: everything works, but nothing is sent.

## 1. The RSVP form (answers go to a Google Sheet)

1. Go to [forms.google.com](https://forms.google.com) and start a **blank form**. Call it **Sisi mi @ 70 · RSVP**.
2. Add these questions, in this order, with this wording. Leave **every question optional**: the site does the checking, and Google silently rejects a reply that leaves a required question blank (for example, someone declining has no "which part of the day").

   | # | Question | Type | Options (type them exactly) |
   |---|---|---|---|
   | 1 | Will you be joining us? | Multiple choice | `Joyfully accept` · `Regretfully decline` |
   | 2 | First name | Short answer | |
   | 3 | Last name | Short answer | |
   | 4 | WhatsApp number | Short answer | |
   | 5 | Email | Short answer | |
   | 6 | Which part of the day? | Multiple choice | `Thanksgiving service and reception` · `Thanksgiving service only` · `Reception only` |
   | 7 | Birthday wish | Paragraph | |
   | 8 | Video message | Short answer | |
   | 9 | Pass code | Short answer | |

3. Open **Settings → Responses** and check that guests won't be asked to sign in:
   - **Collect email addresses:** Do not collect
   - **Limit to 1 response:** off
   - No **file upload** questions. Any of these makes Google require a sign-in, which is what made the old form hard to use.
4. On the **Responses** tab, choose **Link to Sheets** and create a new spreadsheet. That's where every RSVP lands, with the time it came in.
5. Press **Send → link (🔗)** and copy the form's link. The site needs its field numbers, which can be read from that link.

## 2. Video messages (they go to a Google Drive folder)

1. In [Google Drive](https://drive.google.com), create a folder called **Sisi mi @ 70 · Video messages**. Open it and copy the last part of its address, `drive.google.com/drive/folders/`**`THIS_PART`**.
2. Go to [script.google.com](https://script.google.com) → **New project**. Name it **Sisi mi 70 videos**.
3. Replace everything in `Code.gs` with this folder's `Code.gs`, and put the folder id from step 1 in `FOLDER_ID` at the top.
4. **Project Settings (⚙)** → tick **Show "appsscript.json" manifest file** → open `appsscript.json` in the editor and replace it with this folder's `appsscript.json`.
5. Back in the editor, choose the **authorize** function and press **Run**. Google asks for permission: **Review permissions → the client's account → Advanced → Go to Sisi mi 70 videos → Allow**. ("Unverified app" is normal for a script you wrote yourself.) The log should name the folder.
6. **Deploy → New deployment →** type **Web app**:
   - **Execute as:** Me
   - **Who has access:** Anyone
   Press **Deploy** and copy the **Web app URL** (it ends in `/exec`).

Each video arrives in the folder named after the guest, with their pass code and the time, and its link is in the RSVP sheet's "Video message" column.

## 3. Send the two links back

Send the **form link** (step 1.5) and the **Web app URL** (step 2.6). They go into `public/config.js` (`form` and `videoUploadUrl`), and the site starts sending for real.

## At the door

Every guest who accepts gets a pass with a code like `SM-7K3QPA` and a QR code. The same code is in the sheet's "Pass code" column, so ushers can search the sheet to check a guest in.

## If something needs changing later

- **New option wording in the form:** the `answers` in `public/config.js` must match it letter for letter.
- **Changed the script:** use **Deploy → Manage deployments → edit → New version**, so the Web app URL stays the same.
