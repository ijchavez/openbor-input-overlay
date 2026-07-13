const path = require('node:path');
const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const { loadConfig } = require('./src/config');
const { InputManager } = require('./src/input-manager');

let window; let input; let config; let visible = true; let clickThrough = false; let moveMode = false; let clickThroughBeforeMove = false; let pointerInteractive = false;
const skins = ['playstation', 'xbox', 'arcade'];
const MAX_WINDOW = { width: 760, height: 330 };
const MIN_WINDOW = { width: 380, height: 165 };

function send(channel, payload) { if (window && !window.isDestroyed()) window.webContents.send(channel, payload); }

function createWindow() {
  const size = config.window;
  window = new BrowserWindow({
    width: size.width, height: size.height, x: Number.isInteger(size.x) ? size.x : undefined, y: Number.isInteger(size.y) ? size.y : undefined,
    minWidth: MIN_WINDOW.width, minHeight: MIN_WINDOW.height, maxWidth: MAX_WINDOW.width, maxHeight: MAX_WINDOW.height, transparent: true, frame: false, resizable: true, hasShadow: false,
    alwaysOnTop: config.alwaysOnTop, skipTaskbar: false, backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false }
  });
  if (config.alwaysOnTop) window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  clickThrough = config.clickThrough;
  window.setIgnoreMouseEvents(clickThrough, { forward: true });
  window.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  window.webContents.once('did-finish-load', () => {
    send('config', config);
    const status = input.start();
    send('input-status', status);
    send('click-through', clickThrough);
  });
  window.on('closed', () => { window = null; });
}

function toggleVisibility() { visible = !visible; visible ? window.showInactive() : window.hide(); }
function cycleSkin() { const next = skins[(skins.indexOf(config.skin) + 1) % skins.length]; config.skin = next; send('skin', next); }
function applyMouseMode() {
  window.setIgnoreMouseEvents(clickThrough && !pointerInteractive, { forward: true });
}

function setClickThrough(enabled) {
  clickThrough = enabled;
  applyMouseMode();
  send('click-through', enabled);
}

function toggleClickThrough() {
  if (moveMode) return;
  setClickThrough(!clickThrough);
}

function toggleMoveMode() {
  moveMode = !moveMode;
  if (moveMode) {
    clickThroughBeforeMove = clickThrough;
    setClickThrough(false);
    window.show();
    window.focus();
  } else {
    setClickThrough(clickThroughBeforeMove);
  }
  send('move-mode', moveMode);
}

function adjustWindowSize(direction) {
  if (!moveMode || !window || !direction) return;
  const bounds = window.getBounds();
  const width = Math.max(MIN_WINDOW.width, Math.min(MAX_WINDOW.width, bounds.width + direction * 76));
  if (width === bounds.width) return;
  const height = Math.round(width * MAX_WINDOW.height / MAX_WINDOW.width);
  const x = Math.round(bounds.x + (bounds.width - width) / 2);
  const y = Math.round(bounds.y + (bounds.height - height) / 2);
  window.setBounds({ x, y, width, height }, false);
}

function registerShortcut(accelerator, callback) {
  if (!globalShortcut.register(accelerator, callback)) console.warn(`No se pudo registrar el atajo ${accelerator}`);
}

app.whenReady().then(() => {
  config = loadConfig(app);
  input = new InputManager(config.mapping, (event) => send('input', event));
  createWindow();
  registerShortcut(config.hotkeys.toggleVisibility, toggleVisibility);
  registerShortcut(config.hotkeys.cycleSkin, cycleSkin);
  registerShortcut(config.hotkeys.toggleClickThrough, toggleClickThrough);
  registerShortcut(config.hotkeys.toggleMoveMode || 'CommandOrControl+Shift+M', toggleMoveMode);
  registerShortcut('CommandOrControl+Shift+Down', () => adjustWindowSize(-1));
  registerShortcut('CommandOrControl+Shift+Up', () => adjustWindowSize(1));
});

ipcMain.on('local-input', (_event, data) => send('input', { ...data, source: 'local' }));
ipcMain.on('toggle-click-through', toggleClickThrough);
ipcMain.on('toggle-move-mode', toggleMoveMode);
ipcMain.on('adjust-window-size', (_event, direction) => adjustWindowSize(Math.sign(Number(direction))));
ipcMain.on('interactive-hover', (_event, interactive) => {
  pointerInteractive = Boolean(interactive);
  if (window && !window.isDestroyed()) applyMouseMode();
});
app.on('will-quit', () => { input?.stop(); globalShortcut.unregisterAll(); });
app.on('window-all-closed', () => app.quit());
