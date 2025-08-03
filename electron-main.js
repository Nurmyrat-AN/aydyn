// electron-main.js
const { app, BrowserWindow } = require('electron');
const path = require('path');
const { fork } = require('child_process');

let backendProcess = null;

function createWindow() {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // Optional: for secure Node.js access in renderer
      nodeIntegration: false, // Keep false for security
      contextIsolation: true, // Keep true for security
    },
  });

  // Start the Node.js backend server
  // We pass the Electron app's user data path to the backend via an environment variable
  // This ensures SQLite database is stored in a persistent, user-specific location
  backendProcess = fork(path.join(__dirname, 'server', 'index.js'), {
    env: {
      ...process.env, // Inherit existing environment variables
      ELECTRON_RUNNING: 'true', // Custom flag for backend to detect Electron environment
      ELECTRON_SQLITE_PATH: app.getPath('userData'), // Pass user data path for SQLite storage
    },
    silent: false, // Set to true to suppress backend console output in Electron's console
  });

  backendProcess.on('message', (message) => {
    console.log('Backend message:', message);
  });

  backendProcess.on('exit', (code) => {
    console.log(`Backend process exited with code ${code}`);
    if (code !== 0) {
      // Если бэкенд завершился с ошибкой, можно показать сообщение пользователю
      mainWindow.webContents.send('backend-error', `Backend crashed with code: ${code}`);
    }
    // Optionally, handle backend crashes here (e.g., restart backend or show error)
  });

  // Load the React app's index.html
  // In a production build, 'build' folder will be relative to electron-main.js
  // In development, React dev server will be running on localhost:3000
  const startUrl = process.env.NODE_ENV === 'development'
    ? 'http://localhost:3000' // React development server
    : `file://${path.join(__dirname, 'client', 'dist', 'index.html')}`; // React production build

  mainWindow.loadURL(startUrl);

  // Open the DevTools in development mode
  if (process.env.NODE_ENV === 'development') {
    mainWindow.webContents.openDevTools();
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Kill the backend process when Electron app is quitting
app.on('will-quit', () => {
  if (backendProcess && !backendProcess.killed) {
    console.log('Killing backend process...');
    backendProcess.kill();
  }
});

// Optional: Create a preload script for security (if needed)
// electron-main.js -> webPreferences -> preload
// This file would live at `electron/preload.js`
// const preloadPath = path.join(__dirname, 'preload.js');
// if (fs.existsSync(preloadPath)) {
//   mainWindow.webContents.session.setPreloads([preloadPath]);
// }
