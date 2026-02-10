// ====================================================
// 1) MSAL CONFIG (สำหรับ Login Microsoft)
// ====================================================
const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID_HERE",
    redirectUri: window.location.origin
  }
};

const msalInstance = new msal.PublicClientApplication(msalConfig);
let accessToken = "";


// ====================================================
// 2) LOGIN
// ====================================================
document.getElementById("btnLogin").onclick = login;

async function login() {
  try {
    await msalInstance.loginPopup({
      scopes: ["User.Read", "Files.ReadWrite"]
    });

    accessToken = await getToken();
    document.getElementById("formSection").style.display = "block";
  }
  catch (err) {
    alert("Login ไม่สำเร็จ");
    console.log(err);
  }
}

async function getToken() {
  const resp = await msalInstance.acquireTokenSilent({
    scopes: ["User.Read", "Files.ReadWrite"]
  }).catch(() => msalInstance.acquireTokenPopup({
    scopes: ["User.Read", "Files.ReadWrite"]
  }));

  return resp.accessToken;
}


// ====================================================
// 3) EXCEL SESSION
// ====================================================
async function createExcelSession(filePath) {
  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:${filePath}:/workbook/createSession`,
    {
      method: "POST",
      headers: { 
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ persistChanges: true })
    }
  );
  return res.json();
}


// ====================================================
// 4) WRITE ROW TO EXCEL
// ====================================================
async function appendToExcel(row) {
  const filePath = "/vehicle-log.xlsx";
  const session = await createExcelSession(filePath);

  await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:${filePath}:/workbook/tables/LogsTable/rows/add`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        "workbook-session-id": session.id
      },
      body: JSON.stringify({ values: [row] })
    }
  );
}


// ====================================================
// 5) READ DATA FROM EXCEL
// ====================================================
async function readExcelRows() {
  const filePath = "/vehicle-log.xlsx";
  const session = await createExcelSession(filePath);

  const res = await fetch(
    `https://graph.microsoft.com/v1.0/me/drive/root:${filePath}:/workbook/tables/LogsTable/rows`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "workbook-session-id": session.id
      }
    }
  );

  const data = await res.json();
  return data.value;
}


// ====================================================
// 6) SAVE BUTTON
// ====================================================
document.getElementById("btnSave").onclick = async () => {

  const row = [
    document.getElementById("dateInput").value,
    document.getElementById("vehicleInput").value,
    Number(document.getElementById("distanceInput").value),
    Number(document.getElementById("fuelInput").value)
  ];

  await appendToExcel(row);
  alert("บันทึกข้อมูลเรียบร้อย!");
};


// ====================================================
// 7) DASHBOARD ขั้นสูง
// ====================================================
document.getElementById("btnDashboard").onclick = loadDashboard;

async function loadDashboard() {

  const rows = await readExcelRows();

  const monthlyDistance = {};
  const monthlyCost = {};
  const vehicleUsage = {};

  rows.forEach(r => {
    const c = r.values[0];

    const date = new Date(c[0]);
    const month = `${date.getFullYear()}-${date.getMonth()+1}`;
    const vehicle = c[1];
    const distance = Number(c[2]);
    const fuel = Number(c[3]);

    // สะสมระยะทางต่อเดือน
    monthlyDistance[month] = (monthlyDistance[month] || 0) + distance;

    // สะสมค่าใช้จ่ายรายเดือน (mock price 35)
    monthlyCost[month] = (monthlyCost[month] || 0) + (fuel * 35);

    // นับจำนวนการใช้งานแต่ละรถ
    vehicleUsage[vehicle] = (vehicleUsage[vehicle] || 0) + 1;
  });

  // 1) กราฟระยะทางรายเดือน
  new Chart(document.getElementById("distanceMonthly"), {
    type: "line",
    data: {
      labels: Object.keys(monthlyDistance),
      datasets: [{
        label: "ระยะทางรวมรายเดือน (กม.)",
        data: Object.values(monthlyDistance),
        borderColor: "blue",
        fill: false
      }]
    }
  });

  // 2) กราฟค่าใช้จ่ายรายเดือน
  new Chart(document.getElementById("costMonthly"), {
    type: "bar",
    data: {
      labels: Object.keys(monthlyCost),
      datasets: [{
        label: "ค่าใช้จ่ายรายเดือน (บาท)",
        data: Object.values(monthlyCost),
        backgroundColor: "orange"
      }]
    }
  });

  // 3) กราฟสัดส่วนรถที่ใช้งาน
  new Chart(document.getElementById("vehicleUsage"), {
    type: "doughnut",
    data: {
      labels: Object.keys(vehicleUsage),
      datasets: [{
        data: Object.values(vehicleUsage),
        backgroundColor: ["blue", "green", "orange", "purple"]
      }]
    }
  });
}