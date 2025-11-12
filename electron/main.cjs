const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, nativeTheme } = require('electron');
const path = require('path');

let mainWindow = null;
let tray = null;
let isQuitting = false;

const WINDOW_WIDTH = 400;
const WINDOW_HEIGHT = 600;

// Theme colors
const THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b',
};

function createWindow() {
  mainWindow = new BrowserWindow({
    width: WINDOW_WIDTH,
    height: WINDOW_HEIGHT,
    minWidth: 350,
    minHeight: 500,
    maxWidth: 500,
    maxHeight: 800,
    frame: true,
    resizable: true,
    autoHideMenuBar: true, // Hide menu bar on Windows/Linux
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.cjs'),
    },
    icon: path.join(__dirname, '../public/icon.png'),
    show: false,
    backgroundColor: '#ffffff',
  });

  // Remove menu completely
  Menu.setApplicationMenu(null);

  // Load the app
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    // In production, dist/client is copied to dist in the asar
    const indexPath = path.join(__dirname, '../dist/index.html');
    mainWindow.loadFile(indexPath);
    // Open DevTools to debug
    mainWindow.webContents.openDevTools();
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Prevent window from closing, minimize to tray instead
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
      return false;
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

function createTray() {
  // Create a simple icon for the tray (you'll want to replace this with a proper icon)
  const trayIcon = nativeImage.createFromDataURL(
    'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QA/wD/AP+gvaeTAAAAn0lEQVQ4jWNgGAWMDAwMDP+J8D8RGBgYmBgYGBgYiNX8nwg9DMQaQIoGRgYGBiZSNDMyMDBg08zIwMDARKwBMBfgMoCJWAPwGcBErAH4DGAi1gCYAWQ5gVgD/v8nTy8DAwMDA8N/MjH5Cv//Jwfw5QJiDP5PioP//yfG4P/EGvyfmLrIxFigmf+J1AsDRDv5/39GBgYGxv9kYAYGBkZGhqHvBACJ8i9t0c6kDAAAAABJRU5ErkJggg=='
  );

  tray = new Tray(trayIcon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir Gestor de Contraseñas',
      click: () => {
        if (mainWindow) {
          mainWindow.show();
        } else {
          createWindow();
        }
      },
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        isQuitting = true;
        app.quit();
      },
    },
  ]);

  tray.setToolTip('Gestor de Contraseñas');
  tray.setContextMenu(contextMenu);

  // Show window on tray icon click
  tray.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isVisible()) {
        mainWindow.hide();
      } else {
        mainWindow.show();
      }
    } else {
      createWindow();
    }
  });
}

// Handle theme change from renderer
ipcMain.on('theme-changed', (event, theme) => {
  if (mainWindow) {
    let bgColor;
    if (theme === 'system') {
      bgColor = nativeTheme.shouldUseDarkColors ? THEME_COLORS.dark : THEME_COLORS.light;
    } else {
      bgColor = THEME_COLORS[theme] || THEME_COLORS.light;
    }
    mainWindow.setBackgroundColor(bgColor);
  }
});

// Listen to system theme changes
nativeTheme.on('updated', () => {
  if (mainWindow) {
    mainWindow.webContents.send('system-theme-changed', nativeTheme.shouldUseDarkColors);
  }
});

app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    } else if (mainWindow) {
      mainWindow.show();
    }
  });
});

app.on('window-all-closed', (e) => {
  e.preventDefault();
});

app.on('before-quit', () => {
  isQuitting = true;
});
