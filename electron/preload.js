const { contextBridge, ipcRenderer } = require ('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  readExcel: (path) => ipcRenderer.invoke("read-excel", path),
  writeExcel: (path, data) => ipcRenderer.invoke("write-excel", path, data),
  printNota: (text) => ipcRenderer.invoke("print-nota", text)
});
