self.addEventListener("install", () => {
  console.log("SW Installed");
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.log("SW Activated");
});

self.addEventListener("fetch", () => {
  // สำหรับ offline mode เพิ่มได้ภายหลัง
});