const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('windowControls', {
  minimize: () => ipcRenderer.send('window-minimize'),
  maximize: () => ipcRenderer.send('window-maximize'),
  close: () => ipcRenderer.send('window-close'),
  toggleMiniPlayer: (isMini) => ipcRenderer.send('window-toggle-miniplayer', isMini),
  onMiniplayerClosed: (callback) => ipcRenderer.on('miniplayer-closed', (e) => callback()),
  setAlwaysOnTop: (value) => ipcRenderer.send('window-set-always-on-top', value),
  setLoginItem: (value) => ipcRenderer.send('app-set-login-item', value),
  setFullScreen: (value) => ipcRenderer.send('window-set-fullscreen', value)
});

contextBridge.exposeInMainWorld('spotify', {
  login: (authUrl) => ipcRenderer.invoke('spotify-login', authUrl),
  onMediaPlayPause: (callback) => ipcRenderer.on('media-play-pause', (e) => callback()),
  onMediaNext: (callback) => ipcRenderer.on('media-next', (e) => callback()),
  onMediaPrev: (callback) => ipcRenderer.on('media-prev', (e) => callback())
});
