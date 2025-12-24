const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.resolve(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // WAJIB untuk Next.js
    },
  });

  // 🔥 URL NEXT.JS
  const url = isDev
  ? "http://localhost:3000"
  : `file://${path.join(__dirname, "../out/index.html")}`;

  win.loadURL(url);

  if (isDev) win.webContents.openDevTools();
}

// ==========================
// EXCEL HANDLER
// ==========================
ipcMain.handle("read-excel", async (event, filePath) => {
  const XLSX = require("xlsx"); // import di sini agar aman
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json(sheet);
});

ipcMain.handle("write-excel", async (event, filePath, data) => {
  const XLSX = require("xlsx");
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  XLSX.writeFile(wb, filePath);
  return true;
});

// ==========================
// PRINT NOTA
// ==========================
ipcMain.handle("print-nota", async (event, text) => {
  try {
    const escpos = require("escpos");
    const USB = require("escpos-usb");

    const device = new USB();
    const printer = new escpos.Printer(device);

    printer
      .align("ct")
      .text("===== NOTA KASIR =====")
      .text(text)
      .cut()
      .close();

    return true;
  } catch (err) {
    return { error: err.message };
  }
});

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
