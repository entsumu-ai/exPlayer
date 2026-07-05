const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  openDirectory: () => ipcRenderer.invoke('dialog:open-directory'),
  readDirectory: (dirPath) => ipcRenderer.invoke('directory:read', dirPath),
  getSystemRoots: () => ipcRenderer.invoke('system:get-roots'),
  setCompactMode: (isCompact) => ipcRenderer.send('window:set-compact', isCompact),
  setAlwaysOnTop: (alwaysOnTop) => ipcRenderer.send('window:set-always-on-top', alwaysOnTop),
  checkAssociation: () => ipcRenderer.invoke('system:check-association'),
  setAssociation: (enable) => ipcRenderer.invoke('system:set-association', enable),
  getStartFile: () => ipcRenderer.invoke('system:get-start-file'),
  onOpenFile: (callback) => ipcRenderer.on('open-file', (event, filePath) => callback(filePath))
});
