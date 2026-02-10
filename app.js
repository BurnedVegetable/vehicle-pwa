// ========= CONFIG =========
const CLIENT_ID = "138952700999-cqqv535u827d2vkfneg0vtfldrucfulq.apps.googleusercontent.com";
const API_KEY = "sheets.googleapis.com";
const SHEET_ID = "https://docs.google.com/spreadsheets/d/1mDME0-n2I9mEe9H_eNUAcEmuq4Z4rJSIdasPuZ0ct7E/edit?usp=sharing";

const SCOPES = "https://www.googleapis.com/auth/spreadsheets";

// ========= INIT =========
function gapiLoaded() {
  gapi.load("client:auth2", initClient);
}

function initClient() {
  gapi.client.init({
    apiKey: API_KEY,
    clientId: CLIENT_ID,
    scope: SCOPES
  });
}

document.getElementById("btnLogin").onclick = async () => {
  await gapi.auth2.getAuthInstance().signIn();
  document.getElementById("app").style.display = "block";
};


// ========= WRITE =========
async function writeRow(values) {
  return gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: SHEET_ID,
    range: "logs",
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    resource: { values: [values] }
  });
}


// ========= READ =========
async function readLogs() {
  const res = await gapi.client.sheets.spreadsheets.values.get({
    spreadsheetId: SHEET_ID,
    range: "logs"
  });
  return res.result.values || [];
}


// ========= SAVE BUTTON =========
document.getElementById("btnSave").onclick = async () => {

  const row = [
    document.getElementById("dateInput").value,
    document.getElementById("vehicleInput").value,
    document.getElementById("distanceInput").value,
    document.getElementById("fuelInput").value
  ];

  await writeRow(row);
  alert("บันทึกเรียบร้อย!");
};


// ========= DASHBOARD =========
document.getElementById("btnDashboard").onclick = async () => {

  const rows = await readLogs();
  rows.shift(); // remove header

  const byMonth = {};
  const costByMonth = {};

  rows.forEach(r => {
    const date = new Date(r[0]);
    const month = `${date.getFullYear()}-${date.getMonth()+1}`;

    const distance = Number(r[2] || 0);
    const fuel = Number(r[3] || 0);

    if (!byMonth[month]) byMonth[month] = 0;
    byMonth[month] += distance;

    if (!costByMonth[month]) costByMonth[month] = 0;
    costByMonth[month] += fuel * 35;
  });

  new Chart(document.getElementById("distanceChart"), {
    type: "line",
    data: {
      labels: Object.keys(byMonth),
      datasets: [{ data: Object.values(byMonth), label: "ระยะทางรวม (กม.)" }]
    }
  });

  new Chart(document.getElementById("costChart"), {
    type: "bar",
    data: {
      labels: Object.keys(costByMonth),
      datasets: [{ data: Object.values(costByMonth), label: "ค่าใช้จ่าย (บาท)" }]
    }
  });
};

