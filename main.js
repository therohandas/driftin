const { app, BrowserWindow, ipcMain, shell, globalShortcut, Tray, Menu } = require('electron');
const path = require('path');

// Isolate development user data/cache from production instance to prevent file locks
if (!app.isPackaged) {
  app.setPath('userData', path.join(app.getPath('appData'), 'driftin-desktop-dev'));
}

let mainWindow;
let tray = null;
let isQuitting = false;
let miniWindow = null;
let miniWindowSize = { width: 300, height: 380 };

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 750,
    minWidth: 800,
    minHeight: 600,
    frame: false, // Frameless window for custom styling
    backgroundColor: '#000000',
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      if (miniWindow) {
        miniWindow.close();
        miniWindow = null;
      }
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createMiniWindow() {
  miniWindow = new BrowserWindow({
    width: miniWindowSize.width,
    height: miniWindowSize.height,
    minWidth: 200,
    minHeight: 250,
    maxWidth: 600,
    maxHeight: 800,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    transparent: true,
    titleBarStyle: 'hidden',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });

  miniWindow.loadFile(path.join(__dirname, 'renderer', 'miniplayer.html'));

  miniWindow.on('resize', () => {
    const [width, height] = miniWindow.getSize();
    miniWindowSize.width = width;
    miniWindowSize.height = height;
  });

  miniWindow.on('closed', () => {
    miniWindow = null;
    if (!isQuitting && mainWindow && !mainWindow.isVisible()) {
      mainWindow.show();
      mainWindow.webContents.send('miniplayer-closed');
    }
  });
}

app.whenReady().then(() => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.daydreamin.driftin');
  }
  createMainWindow();
  createTray();

  // Register Global Media Shortcuts
  globalShortcut.register('MediaPlayPause', () => {
    if (miniWindow) miniWindow.webContents.send('media-play-pause');
    else if (mainWindow) mainWindow.webContents.send('media-play-pause');
  });
  globalShortcut.register('MediaNextTrack', () => {
    if (miniWindow) miniWindow.webContents.send('media-next');
    else if (mainWindow) mainWindow.webContents.send('media-next');
  });
  globalShortcut.register('MediaPreviousTrack', () => {
    if (miniWindow) miniWindow.webContents.send('media-prev');
    else if (mainWindow) mainWindow.webContents.send('media-prev');
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow();
    }
  });
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// IPC listeners for Custom Titlebar Controls
ipcMain.on('window-minimize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.minimize();
});

ipcMain.on('window-maximize', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize();
    } else {
      win.maximize();
    }
  }
});

ipcMain.on('window-close', (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win === mainWindow) {
      mainWindow.close();
    } else {
      win.close();
    }
  }
});

// Always on top control
ipcMain.on('window-set-always-on-top', (event, value) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.setAlwaysOnTop(value);
});

// Windows boot startup control
ipcMain.on('app-set-login-item', (event, value) => {
  app.setLoginItemSettings({
    openAtLogin: value,
    path: app.getPath('exe')
  });
});

// Spotify OAuth interceptor
ipcMain.handle('spotify-login', async (event, authUrl) => {
  return new Promise((resolve, reject) => {
    const loginWindow = new BrowserWindow({
      width: 550,
      height: 680,
      parent: mainWindow,
      modal: true,
      show: false,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true
      }
    });

    loginWindow.loadURL(authUrl);

    loginWindow.once('ready-to-show', () => {
      loginWindow.show();
    });

    const handleRedirect = (url) => {
      if (url.startsWith('driftin://spotify-auth')) {
        const parsedUrl = new URL(url);
        const code = parsedUrl.searchParams.get('code');
        const error = parsedUrl.searchParams.get('error');

        if (code) {
          resolve({ code });
        } else if (error) {
          reject(new Error(error));
        }
        loginWindow.destroy();
      }
    };

    // Intercept redirects
    loginWindow.webContents.on('will-redirect', (e, url) => {
      handleRedirect(url);
    });

    loginWindow.webContents.on('will-navigate', (e, url) => {
      handleRedirect(url);
    });

    loginWindow.on('closed', () => {
      resolve({ cancelled: true });
    });
  });
});

// Window toggle miniplayer
ipcMain.on('window-toggle-miniplayer', (event, isMini) => {
  if (isMini) {
    if (!miniWindow) {
      createMiniWindow();
    }
    if (mainWindow) {
      mainWindow.hide();
    }
  } else {
    if (miniWindow) {
      miniWindow.close();
      miniWindow = null;
    }
    if (mainWindow) {
      mainWindow.show();
    }
  }
});

function createTray() {
  const iconPath = path.join(__dirname, 'icon.ico');
  tray = new Tray(iconPath);
  
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show Driftin',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
          if (miniWindow) {
            miniWindow.close();
            miniWindow = null;
          }
        }
      }
    },
    { type: 'separator' },
    {
      label: 'Play / Pause',
      click: () => {
        if (mainWindow) mainWindow.webContents.send('media-play-pause');
      }
    },
    {
      label: 'Next Track',
      click: () => {
        if (mainWindow) mainWindow.webContents.send('media-next');
      }
    },
    {
      label: 'Previous Track',
      click: () => {
        if (mainWindow) mainWindow.webContents.send('media-prev');
      }
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        isQuitting = true;
        app.quit();
      }
    }
  ]);
  
  tray.setToolTip('Driftin Player');
  tray.setContextMenu(contextMenu);
  
  tray.on('double-click', () => {
    if (mainWindow) {
      mainWindow.show();
      if (miniWindow) {
        miniWindow.close();
        miniWindow = null;
      }
    }
  });
}
