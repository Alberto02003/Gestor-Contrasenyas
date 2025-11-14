const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electron', {
  platform: process.platform,
  isElectron: true,
  setTheme: (theme) => ipcRenderer.send('theme-changed', theme),
  onSystemThemeChanged: (callback) => ipcRenderer.on('system-theme-changed', (_, isDark) => callback(isDark)),
});

contextBridge.exposeInMainWorld('netShare', {
  listPeers: () => ipcRenderer.invoke('network:list-peers'),
  sharePassword: (payload) => ipcRenderer.invoke('network:share-password', payload),
  onPeersUpdated: (callback) => {
    const handler = (_event, peers) => callback(peers);
    ipcRenderer.on('network:peers-updated', handler);
    return () => ipcRenderer.removeListener('network:peers-updated', handler);
  },
  onPasswordReceived: (callback) => {
    const handler = (_event, payload) => callback(payload);
    ipcRenderer.on('network:password-received', handler);
    return () => ipcRenderer.removeListener('network:password-received', handler);
  },
});
