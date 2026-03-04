/**
 * EKOVIA ViaBox - Google Sheets Database API
 * 
 * INSTRUCTIONS:
 * 1. Create a new Google Sheet.
 * 2. Create three tabs: "Orders_Active", "Orders_Archive", "Survey_Results".
 * 3. In "Orders_Active" and "Orders_Archive", set headers in row 1:
 *    orderId, createdAt, fullName, city, email, phone, address, note, vBoxTheme, dominantNeed, intensity, recommendationSummary, recommendationRaw, archivedAt (only for Archive)
 * 4. Go to Extensions > Apps Script.
 * 5. Paste this code.
 * 6. Update API_KEY if needed.
 * 7. Deploy > New Deployment > Web App.
 * 8. Set "Execute as: Me" and "Who has access: Anyone".
 * 9. Copy the Web App URL and set it as VITE_GOOGLE_SHEETS_API_URL in your .env file.
 */

const API_KEY = "EKOVIA_DEMO_KEY_123";

function doPost(e) {
  const auth = e.parameter['x-api-key'] || e.postData.contents && JSON.parse(e.postData.contents).apiKey;
  // Note: Standard headers are hard to read in Apps Script doPost without specific setup, 
  // so we check both parameters and body for simplicity in this prototype.
  
  const data = JSON.parse(e.postData.contents);
  if (data.apiKey !== API_KEY) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const path = data.path;
  const payload = data.payload;

  if (path === "/order/create") {
    return createOrder(payload);
  } else if (path === "/order/archive") {
    return archiveOrder(payload.orderId);
  } else if (path === "/survey/save") {
    return saveSurvey(payload);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: "Invalid Path" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet(e) {
  const apiKey = e.parameter['apiKey'];
  if (apiKey !== API_KEY) {
    return ContentService.createTextOutput(JSON.stringify({ error: "Unauthorized" }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  const path = e.parameter['path'];

  if (path === "/orders/active") {
    return getRows("Orders_Active");
  } else if (path === "/orders/archive") {
    return getRows("Orders_Archive");
  }

  return ContentService.createTextOutput(JSON.stringify({ error: "Invalid Path" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function createOrder(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Orders_Active");
  
  sheet.appendRow([
    payload.orderId,
    payload.createdAt,
    payload.fullName,
    payload.city,
    payload.email,
    payload.phone,
    payload.address,
    payload.note,
    payload.vBoxTheme,
    payload.dominantNeed,
    payload.intensity,
    payload.recommendationSummary,
    payload.recommendationRaw
  ]);

  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}

function archiveOrder(orderId) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const activeSheet = ss.getSheetByName("Orders_Active");
  const archiveSheet = ss.getSheetByName("Orders_Archive");
  
  const data = activeSheet.getDataRange().getValues();
  let rowIndex = -1;
  let orderData = null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === orderId) {
      rowIndex = i + 1;
      orderData = data[i];
      break;
    }
  }

  if (rowIndex !== -1) {
    const archivedAt = new Date().toISOString();
    const newRow = [...orderData, archivedAt];
    archiveSheet.appendRow(newRow);
    activeSheet.deleteRow(rowIndex);
    return ContentService.createTextOutput(JSON.stringify({ success: true }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return ContentService.createTextOutput(JSON.stringify({ error: "Order not found" }))
    .setMimeType(ContentService.MimeType.JSON);
}

function getRows(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = data[i][index];
    });
    rows.push(obj);
  }

  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}

function saveSurvey(payload) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName("Survey_Results");
  sheet.appendRow([
    new Date().toISOString(),
    payload.primaryType,
    payload.intensity,
    JSON.stringify(payload.answers)
  ]);
  return ContentService.createTextOutput(JSON.stringify({ success: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
