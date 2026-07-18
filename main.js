const path = require('node:path');
const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, dialog } = require('electron');
const { loadConfig, saveConfig, saveMapping } = require('./src/config');
const { InputManager } = require('./src/input-manager');
const { ProfileStore } = require('./src/profile-store');

let window;
let input;
let config;
let profileStore;
let tray;
let saveTimer;
let quitting = false;
let visible = true;
let clickThrough = false;
let moveMode = false;
let clickThroughBeforeMove = false;
let configMode = false;
let clickThroughBeforeConfig = false;
let profileMode = false;
let clickThroughBeforeProfile = false;
let pointerInteractive = false;

const skins = ['playstation', 'xbox', 'arcade'];
const MAX_WINDOW = { width: 760, height: 330 };
const MIN_WINDOW = { width: 380, height: 165 };
const MAPPABLE_BUTTONS = new Set(['up', 'down', 'left', 'right', 'square', 'cross', 'circle', 'triangle', 'start', 'select']);

function defaultProfilesDirectory() {
  if (!app.isPackaged) return path.join(__dirname, 'profiles');
  if (process.env.PORTABLE_EXECUTABLE_DIR) return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'profiles');
  return path.join(app.getPath('userData'), 'profiles');
}

function listProfileNames() {
  try { return profileStore?.list() || []; }
  catch (error) { console.error('No se pudo leer la carpeta de perfiles:', error); return []; }
}

function send(channel, payload) {
  if (window && !window.isDestroyed()) window.webContents.send(channel, payload);
}

function persistState() {
  if (!config) return;
  if (window && !window.isDestroyed()) {
    const { x, y, width, height } = window.getBounds();
    config.window = { x, y, width, height };
  }
  try { saveConfig(config); }
  catch (error) { console.error('No se pudo guardar el estado:', error); }
}

function scheduleStateSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistState, 250);
}

function createWindow() {
  const size = config.window;
  window = new BrowserWindow({
    width: size.width,
    height: size.height,
    x: Number.isInteger(size.x) ? size.x : undefined,
    y: Number.isInteger(size.y) ? size.y : undefined,
    minWidth: MIN_WINDOW.width,
    minHeight: MIN_WINDOW.height,
    maxWidth: MAX_WINDOW.width,
    maxHeight: MAX_WINDOW.height,
    transparent: true,
    frame: false,
    resizable: true,
    hasShadow: false,
    alwaysOnTop: config.alwaysOnTop,
    skipTaskbar: false,
    backgroundColor: '#00000000',
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, backgroundThrottling: false }
  });
  if (config.alwaysOnTop) window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  clickThrough = Boolean(config.clickThrough);
  window.setIgnoreMouseEvents(clickThrough, { forward: true });
  window.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  window.webContents.once('did-finish-load', () => {
    send('config', config);
    const status = input.start();
    send('input-status', status);
    send('click-through', clickThrough);
    send('stream-mode', Boolean(config.streamMode));
  });
  window.on('move', scheduleStateSave);
  window.on('resize', scheduleStateSave);
  window.on('close', (event) => {
    if (quitting) return;
    event.preventDefault();
    window.hide();
    visible = false;
    updateTrayMenu();
  });
  window.on('closed', () => { window = null; });
}

function showWindow(focus = false) {
  if (!window || window.isDestroyed()) createWindow();
  visible = true;
  focus ? window.show() : window.showInactive();
  if (focus) window.focus();
  updateTrayMenu();
}

function toggleVisibility() {
  if (visible) {
    window.hide();
    visible = false;
  } else {
    showWindow(false);
  }
  updateTrayMenu();
}

function cycleSkin() {
  const next = skins[(skins.indexOf(config.skin) + 1) % skins.length];
  config.skin = next;
  send('skin', next);
  scheduleStateSave();
  updateTrayMenu();
}

function applyMouseMode() {
  window.setIgnoreMouseEvents(clickThrough && !pointerInteractive, { forward: true });
}

function setClickThrough(enabled) {
  clickThrough = enabled;
  applyMouseMode();
  send('click-through', enabled);
  updateTrayMenu();
}

function toggleClickThrough() {
  if (moveMode || configMode || profileMode) return;
  setClickThrough(!clickThrough);
  config.clickThrough = clickThrough;
  scheduleStateSave();
}

function toggleMoveMode() {
  if (configMode || profileMode) return;
  moveMode = !moveMode;
  if (moveMode) {
    clickThroughBeforeMove = clickThrough;
    setClickThrough(false);
    showWindow(true);
  } else {
    setClickThrough(clickThroughBeforeMove);
  }
  send('move-mode', moveMode);
  updateTrayMenu();
}

function toggleConfigMode() {
  if (moveMode || profileMode) return;
  configMode = !configMode;
  if (configMode) {
    clickThroughBeforeConfig = clickThrough;
    setClickThrough(false);
    showWindow(true);
  } else {
    setClickThrough(clickThroughBeforeConfig);
  }
  send('config-mode', configMode);
  updateTrayMenu();
}

function toggleProfileMode() {
  if (moveMode || configMode) return;
  profileMode = !profileMode;
  if (profileMode) {
    clickThroughBeforeProfile = clickThrough;
    setClickThrough(false);
    showWindow(true);
  } else {
    setClickThrough(clickThroughBeforeProfile);
  }
  send('profile-mode', profileMode);
  updateTrayMenu();
}

function toggleStreamMode() {
  if (moveMode || configMode || profileMode) return;
  config.streamMode = !config.streamMode;
  send('stream-mode', config.streamMode);
  scheduleStateSave();
  updateTrayMenu();
}
function toggleLayout() {
  config.layout = config.layout === 'reversed' ? 'standard' : 'reversed';
  send('layout', config.layout);
  scheduleStateSave();
  updateTrayMenu();
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
  window.setBounds({
    x: Math.round(bounds.x + (bounds.width - width) / 2),
    y: Math.round(bounds.y + (bounds.height - height) / 2),
    width,
    height
  }, false);
}

function registerShortcut(accelerator, callback) {
  if (!globalShortcut.register(accelerator, callback)) console.warn(`No se pudo registrar el atajo ${accelerator}`);
}

function applyProfile(name) {
  let profile;
  try { profile = profileStore.load(name); }
  catch (error) { return { ok: false, error: error.message }; }
  config.mapping = { ...(profile.mapping || config.mapping) };
  config.skin = skins.includes(profile.skin) ? profile.skin : skins[0];
  config.layout = profile.layout === 'reversed' ? 'reversed' : 'standard';
  config.activeProfile = name;
  applyProfileSize(profile.window);
  const [width, height] = window.getSize();
  config.window = { ...config.window, width, height };
  try {
    persistState();
    const status = input.updateMapping(config.mapping);
    send('input-status', status);
    send('skin', config.skin);
    send('layout', config.layout);
    updateTrayMenu();
    return { ok: true, mapping: config.mapping, skin: config.skin, layout: config.layout, activeProfile: name };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

function updateTrayMenu() {
  if (!tray) return;
  const profileNames = listProfileNames();
  const profileItems = profileNames.length
    ? profileNames.map((name) => ({ label: name, type: 'radio', checked: config.activeProfile === name, click: () => applyProfile(name) }))
    : [{ label: 'Sin perfiles guardados', enabled: false }];
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: visible ? 'Ocultar overlay' : 'Mostrar overlay', click: toggleVisibility },
    { label: 'Modo mover', type: 'checkbox', checked: moveMode, click: toggleMoveMode },
    { label: 'Modo transmisión limpio', type: 'checkbox', checked: Boolean(config?.streamMode), click: toggleStreamMode },
    { label: 'Click-through', type: 'checkbox', checked: clickThrough, click: toggleClickThrough },
    { type: 'separator' },
    { label: 'Perfiles', submenu: profileItems },
    { label: profileMode ? 'Cerrar perfiles' : 'Administrar perfiles', click: toggleProfileMode },
    { label: configMode ? 'Cerrar configuración' : 'Configurar teclas', click: toggleConfigMode },
    { label: 'Cambiar skin', click: cycleSkin },
    { label: 'Controles invertidos', type: 'checkbox', checked: config?.layout === 'reversed', click: toggleLayout },
    { type: 'separator' },
    { label: 'Salir', click: () => app.quit() }
  ]));
}

async function createTray() {
  const icon = await app.getFileIcon(process.execPath, { size: 'small' });
  tray = new Tray(icon);
  tray.setToolTip('OpenBOR Input Overlay');
  tray.on('click', toggleVisibility);
  updateTrayMenu();
}

app.whenReady().then(async () => {
  app.setAppUserModelId('com.openbor.inputoverlay');
  config = loadConfig(app);
  profileStore = new ProfileStore(config.profilesDirectory || defaultProfilesDirectory());
  profileStore.migrate(config.profiles);
  config.profiles = {};
  config.profilesDirectory = profileStore.getDirectory();
  config.layout = config.layout === 'reversed' ? 'reversed' : 'standard';
  saveConfig(config);
  input = new InputManager(config.mapping, (event) => send('input', event));
  createWindow();
  await createTray();
  registerShortcut(config.hotkeys.toggleVisibility, toggleVisibility);
  registerShortcut(config.hotkeys.cycleSkin, cycleSkin);
  registerShortcut(config.hotkeys.toggleClickThrough, toggleClickThrough);
  registerShortcut(config.hotkeys.toggleMoveMode || 'CommandOrControl+Shift+M', toggleMoveMode);
  registerShortcut(config.hotkeys.toggleStreamMode || 'CommandOrControl+Shift+S', toggleStreamMode);
  registerShortcut('CommandOrControl+Shift+Down', () => adjustWindowSize(-1));
  registerShortcut('CommandOrControl+Shift+Up', () => adjustWindowSize(1));
});

ipcMain.on('local-input', (_event, data) => send('input', { ...data, source: 'local' }));
ipcMain.on('toggle-click-through', toggleClickThrough);
ipcMain.on('toggle-move-mode', toggleMoveMode);
ipcMain.on('toggle-config-mode', toggleConfigMode);
ipcMain.on('toggle-profile-mode', toggleProfileMode);
ipcMain.on('toggle-stream-mode', toggleStreamMode);
ipcMain.on('toggle-layout', toggleLayout);
ipcMain.on('adjust-window-size', (_event, direction) => adjustWindowSize(Math.sign(Number(direction))));
ipcMain.on('interactive-hover', (_event, interactive) => {
  pointerInteractive = Boolean(interactive);
  if (window && !window.isDestroyed()) applyMouseMode();
});

ipcMain.handle('list-profiles', () => ({
  profiles: listProfileNames(),
  activeProfile: config.activeProfile || null,
  directory: profileStore.getDirectory()
}));

ipcMain.handle('choose-profiles-directory', async () => {
  const result = await dialog.showOpenDialog(window, {
    title: 'Elegir carpeta de perfiles',
    defaultPath: profileStore.getDirectory(),
    buttonLabel: 'Usar esta carpeta',
    properties: ['openDirectory', 'createDirectory']
  });
  if (result.canceled || !result.filePaths[0]) return { ok: false, canceled: true };
  try {
    profileStore.setDirectory(result.filePaths[0]);
    config.profilesDirectory = profileStore.getDirectory();
    config.activeProfile = null;
    persistState();
    updateTrayMenu();
    return { ok: true, profiles: listProfileNames(), activeProfile: null, directory: profileStore.getDirectory() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('save-profile', (_event, requestedName) => {
  const { width, height } = window.getBounds();
  try {
    const name = profileStore.save(requestedName, {
      mapping: { ...config.mapping },
      skin: config.skin,
      layout: config.layout,
      window: { width, height }
    });
    config.activeProfile = name;
    persistState();
    updateTrayMenu();
    return { ok: true, profiles: listProfileNames(), activeProfile: name, directory: profileStore.getDirectory() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('load-profile', (_event, name) => applyProfile(name));

ipcMain.handle('delete-profile', (_event, name) => {
  try {
    profileStore.delete(name);
    if (config.activeProfile === name) config.activeProfile = null;
    persistState();
    updateTrayMenu();
    return { ok: true, profiles: listProfileNames(), activeProfile: config.activeProfile, directory: profileStore.getDirectory() };
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

app.on('activate', () => showWindow(true));
app.on('before-quit', () => {
  quitting = true;
  clearTimeout(saveTimer);
  persistState();
});
app.on('will-quit', () => {
  input?.stop();
  globalShortcut.unregisterAll();
  tray?.destroy();
});
