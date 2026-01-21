/**
 * Electron Main Process
 * Handles window creation and native functionality for Windows desktop
 */

import { app, BrowserWindow, Menu, ipcMain } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * Create the main application window
 */
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#0f172a', // Tailwind slate-900
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
    },
    icon: path.join(__dirname, '../assets/icon.png'),
    show: false, // Don't show until ready
  });

  // Load the app
  if (isDevelopment) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Show window when ready
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Create application menu
  createMenu();
}

/**
 * Create application menu
 */
function createMenu() {
  const template: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'File',
      submenu: [
        {
          label: 'Settings',
          accelerator: 'CmdOrCtrl+,',
          click: () => {
            mainWindow?.webContents.send('navigate', '/settings');
          },
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectAll' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About',
          click: () => {
            mainWindow?.webContents.send('show-about');
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

/**
 * IPC Handlers for renderer process communication
 */

// Load vocabulary file from local filesystem
ipcMain.handle('load-vocabulary', async (event, filePath: string) => {
  try {
    const fullPath = path.join(__dirname, '../data', filePath);
    const data = await fs.promises.readFile(fullPath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load file',
    };
  }
});

// Save user data to local filesystem
ipcMain.handle('save-user-data', async (event, key: string, data: any) => {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, `${key}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save data',
    };
  }
});

// Load user data from local filesystem
ipcMain.handle('load-user-data', async (event, key: string) => {
  try {
    const userDataPath = app.getPath('userData');
    const filePath = path.join(userDataPath, `${key}.json`);

    if (!fs.existsSync(filePath)) {
      return { success: true, data: null };
    }

    const data = await fs.promises.readFile(filePath, 'utf-8');
    return { success: true, data: JSON.parse(data) };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to load data',
    };
  }
});

/**
 * App lifecycle events
 */

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    // On macOS, re-create window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // On macOS, keep app running until user quits explicitly
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    // Focus the existing window if user tries to open another instance
    if (mainWindow) {
      if (mainWindow.isMinimized()) {
        mainWindow.restore();
      }
      mainWindow.focus();
    }
  });
}
