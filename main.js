const path = require('node:path');
const { app, BrowserWindow, globalShortcut, ipcMain, screen } = require('electron');
const { loadConfig, saveConfig, saveMapping } = require('./src/config');
const { InputManager } = require('./src/input-manager');

let window; let input; let config; let visible = true; let clickThrough = false; let moveMode = false; let clickThroughBeforeMove = false; let configMode = false; let clickThroughBeforeConfig = false; let profileMode = false; let clickThroughBeforeProfile = false; let pointerInteractive = false;
const skins = ['playstation', 'xbox', 'arcade'];
const MAX_WINDOW = { width: 760, height: 330 };
const MIN_WINDOW = { width: 380, height: 165 };
const MAPPABLE_BUTTONS = new Set(['up', 'down', 'left', 'right', 'square', 'cross', 'circle', 'triangle', 'start', 'select']);

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
  if (moveMode || configMode || profileMode) return;
  setClickThrough(!clickThrough);
}

function toggleMoveMode() {
  if (configMode || profileMode) return;
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

function toggleConfigMode() {
  if (moveMode || profileMode) return;
  configMode = !configMode;
  if (configMode) {
    clickThroughBeforeConfig = clickThrough;
    setClickThrough(false);
    window.show();
    window.focus();
  } else {
    setClickThrough(clickThroughBeforeConfig);
  }
  send('config-mode', configMode);
}

function toggleProfileMode() {
  if (moveMode || configMode) return;
  profileMode = !profileMode;
  if (profileMode) {
    clickThroughBeforeProfile = clickThrough;
    setClickThrough(false);
    window.show();
    window.focus();
  } else {
    setClickThrough(clickThroughBeforeProfile);
  }
  send('profile-mode', profileMode);
}

function applyProfileSize(size) {
  const bounds = window.getBounds();
  const width = Math.max(MIN_WINDOW.width, Math.min(MAX_WINDOW.width, Number(size?.width) || MAX_WINDOW.width));
  const height = Math.round(width * MAX_WINDOW.height / MAX_WINDOW.width);
  window.setBounds({
    x: Math.round(bounds.x + (bounds.width - width) / 2),
    y: Math.round(bounds.y + (bounds.height - height) / 2),
    width,
    height
  }, false);
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
ipcMain.on('toggle-config-mode', toggleConfigMode);
ipcMain.on('toggle-profile-mode', toggleProfileMode);
ipcMain.on('adjust-window-size', (_event, direction) => adjustWindowSize(Math.sign(Number(direction))));
ipcMain.on('interactive-hover', (_event, interactive) => {
  pointerInteractive = Boolean(interactive);
  if (window && !window.isDestroyed()) applyMouseMode();
});

ipcMain.handle('list-profiles', () => ({ profiles: Object.keys(config.profiles || {}).sort(), activeProfile: config.activeProfile || null }));

ipcMain.handle('save-profile', (_event, requestedName) => {
  const name = String(requestedName || '').trim().slice(0, 40);
  if (!name) return { ok: false, error: 'Escribí un nombre para el perfil' };
  const { width, height } = window.getBounds();
  config.profiles ||= {};
  config.profiles[name] = { mapping: { ...config.mapping }, skin: config.skin, window: { width, height } };
  config.activeProfile = name;
  try {
    saveConfig(config);
    return { ok: true, profiles: Object.keys(config.profiles).sort(), activeProfile: name };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('load-profile', (_event, name) => {
  const profile = config.profiles?.[name];
  if (!profile) return { ok: false, error: 'Perfil no encontrado' };
  config.mapping = { ...profile.mapping };
  config.skin = skins.includes(profile.skin) ? profile.skin : skins[0];
  config.activeProfile = name;
  applyProfileSize(profile.window);
  const [width, height] = window.getSize();
  config.window = { ...config.window, width, height };
  try {
    saveConfig(config);
    const status = input.updateMapping(config.mapping);
    send('input-status', status);
    send('skin', config.skin);
    return { ok: true, mapping: config.mapping, skin: config.skin, activeProfile: name };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('delete-profile', (_event, name) => {
  if (!config.profiles?.[name]) return { ok: false, error: 'Perfil no encontrado' };
  delete config.profiles[name];
  if (config.activeProfile === name) config.activeProfile = null;
  try {
    saveConfig(config);
    return { ok: true, profiles: Object.keys(config.profiles).sort(), activeProfile: config.activeProfile };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});
ipcMain.handle('set-mapping', (_event, { button, code }) => {
  if (!MAPPABLE_BUTTONS.has(button) || typeof code !== 'string' || code.length > 40) return { ok: false, error: 'Asignación inválida' };
  const mapping = Object.fromEntries(Object.entries(config.mapping).filter(([existingCode, existingButton]) => existingCode !== code && existingButton !== button));
  mapping[code] = button;
  try {
    saveMapping(config.configPath, mapping);
    config.mapping = mapping;
    const status = input.updateMapping(mapping);
    send('input-status', status);
    return { ok: true, mapping };
  } catch (error) {
    console.error('No se pudo guardar el mapping:', error);
    return { ok: false, error: error.message };
  }
});
app.on('will-quit', () => { input?.stop(); globalShortcut.unregisterAll(); });
app.on('window-all-closed', () => app.quit());
