const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isElectron: true,
  setTheme: (theme) => ipcRenderer.send('theme-changed', theme),
  onSystemThemeChanged: (callback) => ipcRenderer.on('system-theme-changed', (_, isDark) => callback(isDark)),
});
