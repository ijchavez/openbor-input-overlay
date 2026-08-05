const path = require('node:path');
const { app, BrowserWindow, globalShortcut, ipcMain, Tray, Menu, dialog, screen } = require('electron');
const { loadConfig, saveConfig, saveMapping } = require('./src/config');
const { InputManager } = require('./src/input-manager');
const { ProfileStore } = require('./src/profile-store');
const { OverlayStateController } = require('./src/overlay-state');

let window;
let settingsWindow;
let input;
let config;
let profileStore;
let overlayState;
let tray;
let saveTimer;
let quitting = false;
let visible = true;
let pointerInteractive = false;
let pendingSettingsTab = 'general';

const skins = ['playstation', 'xbox', 'arcade'];
const BASE_WINDOW = { width: 760, height: 354 };
const MAX_WINDOW = { width: 950, height: 443 };
const MIN_WINDOW = { width: 380, height: 177 };
const DEFAULT_SETTINGS_WINDOW = { width: 940, height: 680 };
const MIN_SETTINGS_WINDOW = { width: 760, height: 560 };
const MAPPABLE_BUTTONS = new Set([
  'up', 'down', 'left', 'right',
  'square', 'cross', 'circle', 'triangle',
  'leftShoulder', 'rightShoulder', 'start', 'select'
]);
const SETTINGS_TABS = new Set(['general', 'controls', 'appearance', 'profiles', 'shortcuts']);
const DEFAULT_LIGHTING = {
  buttonColor: '#59e4ff',
  buttonIntensity: 1,
  dpadColor: '#59e4ff',
  dpadIntensity: 0.65,
  trailEnabled: true,
  trailDuration: 240,
  trailIntensity: 0.55
};

function normalizeLighting(value) {
  const lighting = value && typeof value === 'object' ? value : {};
  const color = (candidate, fallback) => /^#[0-9a-f]{6}$/i.test(candidate || '') ? candidate.toLowerCase() : fallback;
  const intensity = (candidate, fallback) => {
    const number = Number(candidate);
    return Number.isFinite(number) ? Math.max(0, Math.min(1, number)) : fallback;
  };
  const duration = Number(lighting.trailDuration);
  return {
    buttonColor: color(lighting.buttonColor, DEFAULT_LIGHTING.buttonColor),
    buttonIntensity: intensity(lighting.buttonIntensity, DEFAULT_LIGHTING.buttonIntensity),
    dpadColor: color(lighting.dpadColor, DEFAULT_LIGHTING.dpadColor),
    dpadIntensity: intensity(lighting.dpadIntensity, DEFAULT_LIGHTING.dpadIntensity),
    trailEnabled: lighting.trailEnabled !== false,
    trailDuration: Number.isFinite(duration) ? Math.round(Math.max(80, Math.min(600, duration))) : DEFAULT_LIGHTING.trailDuration,
    trailIntensity: intensity(lighting.trailIntensity, DEFAULT_LIGHTING.trailIntensity)
  };
}

function defaultProfilesDirectory() {
  if (!app.isPackaged) return path.join(__dirname, 'profiles');
  if (process.env.PORTABLE_EXECUTABLE_DIR) return path.join(process.env.PORTABLE_EXECUTABLE_DIR, 'profiles');
  return path.join(app.getPath('userData'), 'profiles');
}

function listProfileNames() {
  try { return profileStore?.list() || []; }
  catch (error) {
    console.error('No se pudo leer la carpeta de perfiles:', error);
    return [];
  }
}

function send(channel, payload) {
  if (window && !window.isDestroyed()) window.webContents.send(channel, payload);
}

function sendSettings(channel, payload) {
  if (settingsWindow && !settingsWindow.isDestroyed()) settingsWindow.webContents.send(channel, payload);
}

function broadcastConfig() {
  send('config', config);
  sendSettings('config', config);
}

function persistState() {
  if (!config) return;
  if (window && !window.isDestroyed()) {
    const { x, y, width, height } = window.getBounds();
    config.window = { x, y, width, height };
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    const { x, y, width, height } = settingsWindow.getBounds();
    config.settingsWindow = { x, y, width, height };
  }
  try { saveConfig(config); }
  catch (error) { console.error('No se pudo guardar el estado:', error); }
}

function scheduleStateSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(persistState, 250);
}

function applyMouseMode() {
  if (!window || window.isDestroyed() || !overlayState) return;
  const { clickThrough } = overlayState.snapshot();
  window.setIgnoreMouseEvents(clickThrough && !pointerInteractive, { forward: true });
}

function syncOverlayState({ persist = true } = {}) {
  const state = overlayState.snapshot();
  config.clickThrough = state.clickThrough;
  config.streamMode = state.streamMode;
  applyMouseMode();
  send('overlay-state', state);
  send('click-through', state.clickThrough);
  send('move-mode', state.interaction === 'move');
  send('stream-mode', state.streamMode);
  sendSettings('overlay-state', state);
  updateTrayMenu();
  if (persist) scheduleStateSave();
  return state;
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
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      backgroundThrottling: false
    }
  });
  if (config.alwaysOnTop) window.setAlwaysOnTop(true, 'screen-saver');
  window.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  applyMouseMode();
  window.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  window.webContents.once('did-finish-load', () => {
    send('config', config);
    const status = input.start();
    send('input-status', status);
    syncOverlayState({ persist: false });
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

function visibleSettingsBounds() {
  const stored = config.settingsWindow || DEFAULT_SETTINGS_WINDOW;
  const width = Math.max(MIN_SETTINGS_WINDOW.width, Number(stored.width) || DEFAULT_SETTINGS_WINDOW.width);
  const height = Math.max(MIN_SETTINGS_WINDOW.height, Number(stored.height) || DEFAULT_SETTINGS_WINDOW.height);
  if (!Number.isInteger(stored.x) || !Number.isInteger(stored.y)) return { width, height };
  const display = screen.getDisplayNearestPoint({ x: stored.x, y: stored.y });
  const area = display.workArea;
  const x = Math.min(Math.max(stored.x, area.x), area.x + Math.max(0, area.width - width));
  const y = Math.min(Math.max(stored.y, area.y), area.y + Math.max(0, area.height - height));
  return { x, y, width: Math.min(width, area.width), height: Math.min(height, area.height) };
}

function createSettingsWindow() {
  settingsWindow = new BrowserWindow({
    ...visibleSettingsBounds(),
    minWidth: MIN_SETTINGS_WINDOW.width,
    minHeight: MIN_SETTINGS_WINDOW.height,
    title: 'Configuracion - OpenBOR Input Overlay',
    backgroundColor: '#0b1019',
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  settingsWindow.loadFile(path.join(__dirname, 'renderer', 'settings.html'));
  settingsWindow.webContents.once('did-finish-load', () => {
    sendSettings('config', config);
    sendSettings('overlay-state', overlayState.snapshot());
    sendSettings('select-settings-tab', pendingSettingsTab);
    settingsWindow.show();
    settingsWindow.focus();
  });
  settingsWindow.on('move', scheduleStateSave);
  settingsWindow.on('resize', scheduleStateSave);
  settingsWindow.on('close', () => {
    const { x, y, width, height } = settingsWindow.getBounds();
    config.settingsWindow = { x, y, width, height };
    scheduleStateSave();
  });
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

function showWindow(focus = false) {
  if (!window || window.isDestroyed()) createWindow();
  visible = true;
  focus ? window.show() : window.showInactive();
  if (focus) window.focus();
  updateTrayMenu();
}

function openSettings(tab = 'general') {
  pendingSettingsTab = SETTINGS_TABS.has(tab) ? tab : 'general';
  overlayState.prepareForSettings();
  pointerInteractive = false;
  syncOverlayState();
  if (!settingsWindow || settingsWindow.isDestroyed()) {
    createSettingsWindow();
    return;
  }
  sendSettings('config', config);
  sendSettings('overlay-state', overlayState.snapshot());
  sendSettings('select-settings-tab', pendingSettingsTab);
  if (settingsWindow.isMinimized()) settingsWindow.restore();
  settingsWindow.show();
  settingsWindow.focus();
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
  config.skin = skins[(skins.indexOf(config.skin) + 1) % skins.length];
  broadcastConfig();
  scheduleStateSave();
  updateTrayMenu();
}

function toggleClickThrough() {
  overlayState.toggleClickThrough();
  pointerInteractive = false;
  syncOverlayState();
}

function toggleMoveMode() {
  overlayState.toggleMove();
  const state = syncOverlayState();
  if (state.interaction === 'move') showWindow(true);
}

function toggleStreamMode() {
  overlayState.toggleStreamMode();
  syncOverlayState();
}

function toggleLayout() {
  config.layout = config.layout === 'reversed' ? 'standard' : 'reversed';
  broadcastConfig();
  scheduleStateSave();
  updateTrayMenu();
}

function resizeWindowForScale(previousScale, nextScale) {
  if (!window || window.isDestroyed() || previousScale === nextScale) return;
  const bounds = window.getBounds();
  const ratio = nextScale / previousScale;
  const width = Math.max(MIN_WINDOW.width, Math.min(MAX_WINDOW.width, Math.round(bounds.width * ratio)));
  const height = Math.round(width * BASE_WINDOW.height / BASE_WINDOW.width);
  window.setBounds({
    x: Math.round(bounds.x + (bounds.width - width) / 2),
    y: Math.round(bounds.y + (bounds.height - height) / 2),
    width,
    height
  }, false);
  config.window = { ...config.window, x: window.getBounds().x, y: window.getBounds().y, width, height };
}
function applyProfileSize(size) {
  const bounds = window.getBounds();
  const width = Math.max(MIN_WINDOW.width, Math.min(MAX_WINDOW.width, Number(size?.width) || BASE_WINDOW.width));
  const height = Math.round(width * BASE_WINDOW.height / BASE_WINDOW.width);
  window.setBounds({
    x: Math.round(bounds.x + (bounds.width - width) / 2),
    y: Math.round(bounds.y + (bounds.height - height) / 2),
    width,
    height
  }, false);
}

function adjustWindowSize(direction) {
  if (overlayState.snapshot().interaction !== 'move' || !window || !direction) return;
  const bounds = window.getBounds();
  const width = Math.max(MIN_WINDOW.width, Math.min(MAX_WINDOW.width, bounds.width + direction * 76));
  if (width === bounds.width) return;
  const height = Math.round(width * BASE_WINDOW.height / BASE_WINDOW.width);
  window.setBounds({
    x: Math.round(bounds.x + (bounds.width - width) / 2),
    y: Math.round(bounds.y + (bounds.height - height) / 2),
    width,
    height
  }, false);
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
    broadcastConfig();
    updateTrayMenu();
    return { ok: true, mapping: config.mapping, skin: config.skin, layout: config.layout, activeProfile: name };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}

const shortcutActions = {
  toggleVisibility,
  cycleSkin,
  toggleClickThrough,
  toggleMoveMode,
  toggleStreamMode
};

function normalizedHotkeys(value) {
  const source = value && typeof value === 'object' ? value : {};
  const result = {};
  for (const [name, fallback] of Object.entries(config.hotkeys)) {
    const candidate = String(source[name] || fallback).trim();
    result[name] = candidate.slice(0, 80);
  }
  return result;
}

function registerAllShortcuts(hotkeys = config.hotkeys) {
  globalShortcut.unregisterAll();
  for (const [name, callback] of Object.entries(shortcutActions)) {
    const accelerator = hotkeys[name];
    if (!accelerator || !globalShortcut.register(accelerator, callback)) {
      globalShortcut.unregisterAll();
      return { ok: false, error: `No se pudo registrar el atajo ${accelerator || name}` };
    }
  }
  const sizeShortcuts = [
    ['CommandOrControl+Shift+Down', () => adjustWindowSize(-1)],
    ['CommandOrControl+Shift+Up', () => adjustWindowSize(1)]
  ];
  for (const [accelerator, callback] of sizeShortcuts) {
    if (!globalShortcut.register(accelerator, callback)) {
      globalShortcut.unregisterAll();
      return { ok: false, error: `No se pudo registrar el atajo ${accelerator}` };
    }
  }
  return { ok: true };
}

function updateTrayMenu() {
  if (!tray || !config || !overlayState) return;
  const state = overlayState.snapshot();
  const profileNames = listProfileNames();
  const profileItems = profileNames.length
    ? profileNames.map((name) => ({ label: name, type: 'radio', checked: config.activeProfile === name, click: () => applyProfile(name) }))
    : [{ label: 'Sin perfiles guardados', enabled: false }];
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: visible ? 'Ocultar overlay' : 'Mostrar overlay', click: toggleVisibility },
    { label: 'Modo mover', type: 'checkbox', checked: state.interaction === 'move', click: toggleMoveMode },
    { label: 'Modo OBS', type: 'checkbox', checked: state.streamMode, click: toggleStreamMode },
    { label: 'Click-through', type: 'checkbox', checked: state.clickThrough, click: toggleClickThrough },
    { type: 'separator' },
    { label: 'Configuracion', click: () => openSettings('general') },
    { label: 'Controles y mapping', click: () => openSettings('controls') },
    { label: 'Apariencia e iluminacion', click: () => openSettings('appearance') },
    { label: 'Perfiles', submenu: profileItems },
    { label: 'Administrar perfiles', click: () => openSettings('profiles') },
    { label: 'Atajos y OBS', click: () => openSettings('shortcuts') },
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
  config.lighting = normalizeLighting(config.lighting);
  config.layout = config.layout === 'reversed' ? 'reversed' : 'standard';
  config.directionControl = config.directionControl === 'dpad' ? 'dpad' : 'stick';
  config.hotkeys = normalizedHotkeys(config.hotkeys);
  profileStore = new ProfileStore(config.profilesDirectory || defaultProfilesDirectory());
  profileStore.migrate(config.profiles);
  config.profiles = {};
  config.profilesDirectory = profileStore.getDirectory();
  overlayState = new OverlayStateController({
    clickThrough: config.clickThrough,
    streamMode: config.streamMode
  });
  saveConfig(config);
  input = new InputManager(config.mapping, (event) => send('input', event));
  createWindow();
  await createTray();
  const shortcutStatus = registerAllShortcuts();
  if (!shortcutStatus.ok) console.warn(shortcutStatus.error);
});

ipcMain.on('local-input', (_event, data) => send('input', { ...data, source: 'local' }));
ipcMain.on('toggle-click-through', toggleClickThrough);
ipcMain.on('toggle-move-mode', toggleMoveMode);
ipcMain.on('toggle-stream-mode', toggleStreamMode);
ipcMain.on('toggle-layout', toggleLayout);
ipcMain.on('open-settings', (_event, tab) => openSettings(tab));
ipcMain.on('adjust-window-size', (_event, direction) => adjustWindowSize(Math.sign(Number(direction))));
ipcMain.on('interactive-hover', (_event, interactive) => {
  pointerInteractive = Boolean(interactive);
  applyMouseMode();
});

ipcMain.handle('get-settings', () => ({
  config,
  state: overlayState.snapshot(),
  profiles: listProfileNames(),
  directory: profileStore.getDirectory()
}));

ipcMain.handle('update-settings', (_event, patch) => {
  const value = patch && typeof patch === 'object' ? patch : {};
  if (skins.includes(value.skin)) config.skin = value.skin;
  if (['stick', 'dpad'].includes(value.directionControl)) config.directionControl = value.directionControl;
  if (['standard', 'reversed'].includes(value.layout)) config.layout = value.layout;
  if (value.scale !== undefined) {
    const previousScale = Math.max(0.65, Math.min(1.25, Number(config.scale) || 1));
    const nextScale = Math.max(0.65, Math.min(1.25, Number(value.scale) || 1));
    config.scale = nextScale;
    resizeWindowForScale(previousScale, nextScale);
  }
  if (value.opacity !== undefined) config.opacity = Math.max(0.2, Math.min(1, Number(value.opacity) || 0.96));
  if (value.showLabels !== undefined) config.showLabels = Boolean(value.showLabels);
  if (value.alwaysOnTop !== undefined) {
    config.alwaysOnTop = Boolean(value.alwaysOnTop);
    if (window && !window.isDestroyed()) window.setAlwaysOnTop(config.alwaysOnTop, 'screen-saver');
  }
  broadcastConfig();
  scheduleStateSave();
  updateTrayMenu();
  return { ok: true, config };
});

ipcMain.handle('set-hotkeys', (_event, value) => {
  const previous = { ...config.hotkeys };
  const candidate = normalizedHotkeys(value);
  const result = registerAllShortcuts(candidate);
  if (!result.ok) {
    registerAllShortcuts(previous);
    return result;
  }
  config.hotkeys = candidate;
  broadcastConfig();
  scheduleStateSave();
  return { ok: true, hotkeys: candidate };
});

ipcMain.handle('list-profiles', () => ({
  profiles: listProfileNames(),
  activeProfile: config.activeProfile || null,
  directory: profileStore.getDirectory()
}));

ipcMain.handle('choose-profiles-directory', async () => {
  const result = await dialog.showOpenDialog(settingsWindow || window, {
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
    broadcastConfig();
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
    broadcastConfig();
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
    broadcastConfig();
    return { ok: true, profiles: listProfileNames(), activeProfile: config.activeProfile, directory: profileStore.getDirectory() };
  } catch (error) {
    return { ok: false, error: error.message };
  }
});

ipcMain.handle('set-lighting', (_event, value) => {
  config.lighting = normalizeLighting(value);
  broadcastConfig();
  scheduleStateSave();
  return { ok: true, lighting: config.lighting };
});

ipcMain.handle('set-mapping', (_event, { button, code }) => {
  if (!MAPPABLE_BUTTONS.has(button) || typeof code !== 'string' || code.length > 40) {
    return { ok: false, error: 'Asignacion invalida' };
  }
  const mapping = Object.fromEntries(
    Object.entries(config.mapping)
      .filter(([existingCode, existingButton]) => existingCode !== code && existingButton !== button)
  );
  mapping[code] = button;
  try {
    saveMapping(config.configPath, mapping);
    config.mapping = mapping;
    const status = input.updateMapping(mapping);
    send('input-status', status);
    broadcastConfig();
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
});
