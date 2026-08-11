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
  onOpenFile: (callback) => ipcRenderer.on('open-file', (event, filePath) => callback(filePath)),
  updateThumbarState: (isPlaying) => ipcRenderer.send('thumbar:update-state', isPlaying),
  setProgressBar: (progress) => ipcRenderer.send('thumbar:set-progress', progress),
  onThumbarAction: (callback) => ipcRenderer.on('thumbar:action', (event, action) => callback(action)),
  showMainWindow: () => ipcRenderer.send('flyout:show-main'),
  hideFlyoutWindow: () => ipcRenderer.send('flyout:hide'),
  toggleFlyoutWindow: () => ipcRenderer.send('flyout:toggle'),
  sendFlyoutControl: (action) => ipcRenderer.send('flyout:control', action),
  updateFlyoutState: (state) => ipcRenderer.send('flyout:update-state', state),
  onUpdateFlyoutState: (callback) => ipcRenderer.on('flyout:state-changed', (event, state) => callback(state)),
  onFlyoutControl: (callback) => ipcRenderer.on('flyout:control-received', (event, action) => callback(action)),
  toggleTaskbarBarWindow: () => ipcRenderer.send('taskbar-bar:toggle'),
  hideTaskbarBarWindow: () => ipcRenderer.send('taskbar-bar:hide'),
  sendTaskbarBarControl: (action) => ipcRenderer.send('taskbar-bar:control', action),
  updateTaskbarBarState: (state) => ipcRenderer.send('taskbar-bar:update-state', state),
  onUpdateTaskbarBarState: (callback) => ipcRenderer.on('taskbar-bar:state-changed', (event, state) => callback(state)),
  onTaskbarBarControl: (callback) => ipcRenderer.on('taskbar-bar:control-received', (event, action) => callback(action))
});
