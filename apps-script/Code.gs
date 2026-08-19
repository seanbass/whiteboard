/**
 * Family Events — Google Apps Script backend
 *
 * SETUP (one time, ~5 minutes):
 * 1. Go to https://sheets.new and create a Google Sheet named "Family Events".
 *    In row 1 add headers: id | title | date | time | notes | created
 * 2. In the sheet: Extensions > Apps Script. Delete the default code, paste this file.
 * 3. Click Deploy > New deployment > type: Web app.
 *      - Execute as: Me
 *      - Who has access: Anyone
 *    Click Deploy and authorize.
 * 4. Copy the Web App URL and paste it into API_URL in app.js.
 *
 * Note: "Anyone" means anyone WITH THE URL can read/write events. The URL is
 * long and unguessable — fine for a two-person family app with no sensitive data.
 */

const SHEET_NAME = "Sheet1"; // change if you renamed the tab

function getSheet_() {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(SHEET_NAME);
}

function jsonOut_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(
    ContentService.MimeType.JSON
  );
}

// GET -> list all events
function doGet() {
  const sheet = getSheet_();
  const rows = sheet.getDataRange().getValues();
  const events = [];
  for (let i = 1; i < rows.length; i++) {
    const [id, title, date, time, notes] = rows[i];
    if (!id) continue;
    events.push({
      id: String(id),
      title: String(title),
      date: date instanceof Date ? Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM-dd") : String(date),
      time: time instanceof Date ? Utilities.formatDate(time, Session.getScriptTimeZone(), "HH:mm") : String(time || ""),
      notes: String(notes || ""),
    });
  }
  return jsonOut_({ events });
}

// POST -> { action: "add", title, date, time, notes } or { action: "delete", id }
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const body = JSON.parse(e.postData.contents);
    const sheet = getSheet_();

    if (body.action === "add") {
      const title = String(body.title || "").slice(0, 100).trim();
      const date = String(body.date || "").slice(0, 10);
      if (!title || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        return jsonOut_({ ok: false, error: "Invalid title or date" });
      }
      const id = Utilities.getUuid();
      sheet.appendRow([
        id,
        title,
        date,
        String(body.time || "").slice(0, 5),
        String(body.notes || "").slice(0, 300),
        new Date(),
      ]);
      return jsonOut_({ ok: true, id });
    }

    if (body.action === "delete") {
      const id = String(body.id || "");
      const rows = sheet.getDataRange().getValues();
      for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][0]) === id) {
          sheet.deleteRow(i + 1);
          return jsonOut_({ ok: true });
        }
      }
      return jsonOut_({ ok: false, error: "Not found" });
    }

    return jsonOut_({ ok: false, error: "Unknown action" });
  } finally {
    lock.releaseLock();
  }
}
