// electron.js
const { app, BrowserWindow, Menu, nativeTheme, ipcMain, desktopCapturer } = require('electron');
const path = require('path');

const isDev = !app.isPackaged;

nativeTheme.themeSource = 'dark';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      backgroundThrottling: false,
    },
    icon: path.join(__dirname, 'build/icon.png')
  });

  // Sadeleştirilmiş menü şablonu
  const viewSubmenu = [
    { role: 'reload', label: 'Yenile' },
    { role: 'togglefullscreen', label: 'Tam Ekrana Geç' }
  ];

  if (isDev) {
    // Geliştirme için hata ayıklama araçlarını ve zorla yenilemeyi ekle
    viewSubmenu.unshift({ type: 'separator' });
    viewSubmenu.unshift({ role: 'toggleDevTools', label: 'Geliştirici Araçlarını Aç' });
    viewSubmenu.splice(2, 0, { role: 'forceReload', label: 'Yenilemeye Zorla' });
  }

  const menuTemplate = [
    {
      label: 'Görünüm',
      submenu: viewSubmenu
    }
  ];

  if (process.platform === 'darwin') {
    menuTemplate.unshift({
      label: app.name,
      submenu: [
        { role: 'about', label: `${app.name} Hakkında` },
        { type: 'separator' },
        { role: 'quit', label: `${app.name} uygulamasından çık` }
      ]
    });
  }

  const menu = Menu.buildFromTemplate(menuTemplate);
  Menu.setApplicationMenu(menu);

  const startUrl = isDev
    ? 'http://localhost:3000'
    : `file://${path.join(__dirname, 'build/index.html')}`;

  win.loadURL(startUrl);
}

app.whenReady().then(() => {
  // Agora'nın Electron'da ekran paylaşımı için beklediği IPC işleyicisi
  ipcMain.handle('DESKTOP_CAPTURER_GET_SOURCES', (event, opts) =>
    desktopCapturer.getSources(opts)
  );

  createWindow();
});


app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
