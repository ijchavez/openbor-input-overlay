const buttons = new Map([...document.querySelectorAll('[data-button]')].map((element) => [element.dataset.button, element]));
const pressedCodes = new Map();
let config = null;
let mappingMode = false;
let selectedMappingButton = null;
let keyboardStatus = { source: 'local', message: 'Inicializando…' };
let activeGamepadName = null;

function setLayout(layout) {
  document.body.classList.toggle('layout-reversed', layout === 'reversed');
}

function setProfileDirectory(directory) {
  const element = document.querySelector('#profileDirectory');
  element.textContent = directory || 'Carpeta de perfiles';
  element.title = directory || '';
}

function renderInputStatus() {
  const element = document.querySelector('#status');
  const shortGamepadName = activeGamepadName?.length > 30 ? `${activeGamepadName.slice(0, 27)}…` : activeGamepadName;
  const status = shortGamepadName
    ? { source: 'global', message: `Gamepad USB: ${shortGamepadName}` }
    : keyboardStatus;
  element.className = `status ${status.source}`;
  element.querySelector('span').textContent = status.message;
}

function codeLabel(code) {
  const labels = { ArrowUp: '↑', ArrowDown: '↓', ArrowLeft: '←', ArrowRight: '→', ShiftLeft: 'SHIFT IZQ', ShiftRight: 'SHIFT DER', ControlLeft: 'CTRL IZQ', ControlRight: 'CTRL DER', AltLeft: 'ALT IZQ', AltRight: 'ALT DER', Space: 'ESPACIO', Enter: 'ENTER', Escape: 'ESC' };
  return labels[code] || code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'NUM ');
}

function refreshMappingLabels() {
  if (!config) return;
  for (const element of document.querySelectorAll('[data-map-action]')) {
    const code = Object.entries(config.mapping).find(([, button]) => button === element.dataset.mapAction)?.[0];
    element.querySelector('kbd').textContent = code ? codeLabel(code) : 'SIN TECLA';
  }
  for (const [button, element] of buttons) {
    const code = Object.entries(config.mapping).find(([, action]) => action === button)?.[0];
    const label = element.querySelector('small');
    if (label && code) label.textContent = codeLabel(code);
  }
}

function clearPressed(includeGamepad = false) {
  for (const [code, button] of [...pressedCodes]) {
    if (!includeGamepad && code.startsWith('Gamepad:')) continue;
    handleInput({ code, button, pressed: false });
  }
}

function renderProfiles(profiles, activeProfile, selectedProfile = null) {
  const list = document.querySelector('#profileList');
  const selected = selectedProfile || activeProfile || list.value;
  list.replaceChildren();
  if (!profiles.length) {
    const option = new Option('No hay perfiles guardados', '');
    option.disabled = true;
    option.selected = true;
    list.add(option);
    return;
  }
  for (const name of profiles) list.add(new Option(name === activeProfile ? `${name} (activo)` : name, name));
  if (profiles.includes(selected)) list.value = selected;
}

async function refreshProfiles(selectedProfile = null) {
  const data = await window.overlay.listProfiles();
  renderProfiles(data.profiles, data.activeProfile, selectedProfile);
  setProfileDirectory(data.directory);
}

function updateFitScale() {
  const configuredScale = Number(config?.scale) || 1;
  const fit = Math.min(window.innerWidth / 760, window.innerHeight / 330, 1);
  document.documentElement.style.setProperty('--fit-scale', fit * configuredScale);
}

const skinLabels = {
  playstation: { triangle: '△', circle: '○', cross: '✕', square: '□' },
  xbox: { triangle: 'Y', circle: 'B', cross: 'A', square: 'X' },
  arcade: { triangle: '4', circle: '3', cross: '2', square: '1' }
};

function setSkin(skin) {
  const overlay = document.querySelector('#overlay');
  overlay.className = `skin-${skin}`;
  for (const [button, label] of Object.entries(skinLabels[skin] || skinLabels.playstation)) buttons.get(button).querySelector('span').textContent = label;
}

function updateButton(button) {
  const active = [...pressedCodes.values()].includes(button);
  buttons.get(button)?.classList.toggle('pressed', active);
  if (['up', 'down', 'left', 'right'].includes(button)) updateStick();
}

function updateStick() {
  const active = new Set(pressedCodes.values());
  const x = (active.has('right') ? 1 : 0) - (active.has('left') ? 1 : 0);
  const y = (active.has('down') ? 1 : 0) - (active.has('up') ? 1 : 0);
  document.documentElement.style.setProperty('--stick-x', `${x * 22}px`);
  document.documentElement.style.setProperty('--stick-y', `${y * 22}px`);
  document.querySelector('.analog-stick').classList.toggle('active', x !== 0 || y !== 0);
}

function handleInput({ code, button, pressed }) {
  if (!buttons.has(button)) return;
  if (pressed) pressedCodes.set(code, button); else pressedCodes.delete(code);
  updateButton(button);
}

const GAMEPAD_BUTTONS = { cross: 0, circle: 1, square: 2, triangle: 3, select: 8, start: 9 };
const GAMEPAD_DPAD = { up: 12, down: 13, left: 14, right: 15 };
const GAMEPAD_ACTIONS = [...Object.keys(GAMEPAD_BUTTONS), ...Object.keys(GAMEPAD_DPAD)];

function gamepadButtonPressed(gamepad, index) {
  const button = gamepad?.buttons?.[index];
  return Boolean(button && (button.pressed || button.value > 0.5));
}

function setGamepadAction(action, pressed) {
  const code = `Gamepad:${action}`;
  if (pressed === pressedCodes.has(code)) return;
  handleInput({ code, button: action, pressed });
}

function releaseGamepad() {
  for (const action of GAMEPAD_ACTIONS) setGamepadAction(action, false);
}

function pollGamepads() {
  const gamepads = typeof navigator.getGamepads === 'function' ? [...navigator.getGamepads()] : [];
  const gamepad = gamepads.find(Boolean);
  if (!gamepad) {
    if (activeGamepadName) {
      activeGamepadName = null;
      releaseGamepad();
      renderInputStatus();
    }
    requestAnimationFrame(pollGamepads);
    return;
  }

  const name = gamepad.id || `Gamepad ${gamepad.index + 1}`;
  if (activeGamepadName !== name) {
    activeGamepadName = name;
    renderInputStatus();
  }

  const axisX = Number(gamepad.axes?.[0]) || 0;
  const axisY = Number(gamepad.axes?.[1]) || 0;
  const deadzone = 0.45;
  setGamepadAction('up', gamepadButtonPressed(gamepad, GAMEPAD_DPAD.up) || axisY < -deadzone);
  setGamepadAction('down', gamepadButtonPressed(gamepad, GAMEPAD_DPAD.down) || axisY > deadzone);
  setGamepadAction('left', gamepadButtonPressed(gamepad, GAMEPAD_DPAD.left) || axisX < -deadzone);
  setGamepadAction('right', gamepadButtonPressed(gamepad, GAMEPAD_DPAD.right) || axisX > deadzone);
  for (const [action, index] of Object.entries(GAMEPAD_BUTTONS)) setGamepadAction(action, gamepadButtonPressed(gamepad, index));
  requestAnimationFrame(pollGamepads);
}

function normalizeCode(event) {
  if (event.key === 'Shift') return event.location === 2 ? 'ShiftRight' : 'ShiftLeft';
  return event.code === 'NumpadEnter' ? 'Enter' : event.code;
}

async function localKey(event, pressed) {
  if (!config) return;
  const code = normalizeCode(event);
  if (mappingMode) {
    event.preventDefault();
    if (!pressed || event.repeat || !selectedMappingButton) return;
    const button = selectedMappingButton;
    const result = await window.overlay.setMapping(button, code);
    const help = document.querySelector('#mappingHelp');
    if (result.ok) {
      config.mapping = result.mapping;
      clearPressed();
      refreshMappingLabels();
      document.querySelector(`[data-map-action="${button}"]`)?.classList.remove('selected');
      selectedMappingButton = null;
      help.textContent = `${codeLabel(code)} guardada. Elegí otro control.`;
    } else {
      help.textContent = `No se pudo guardar: ${result.error}`;
    }
    return;
  }
  const button = config.mapping[code];
  if (!button || (pressed && event.repeat)) return;
  event.preventDefault();
  window.overlay.localInput({ code, button, pressed });
}

window.addEventListener('keydown', (event) => localKey(event, true));
window.addEventListener('keyup', (event) => localKey(event, false));
window.addEventListener('blur', () => clearPressed());
window.addEventListener('gamepadconnected', ({ gamepad }) => {
  activeGamepadName = gamepad.id || `Gamepad ${gamepad.index + 1}`;
  renderInputStatus();
});
window.addEventListener('gamepaddisconnected', () => {
  activeGamepadName = null;
  releaseGamepad();
  renderInputStatus();
});
requestAnimationFrame(pollGamepads);

window.overlay.onConfig((value) => {
  config = value;
  setSkin(config.skin);
  setLayout(config.layout);
  document.body.classList.toggle('use-stick', config.directionControl === 'stick');
  document.documentElement.style.setProperty('--ui-scale', config.scale);
  updateFitScale();
  document.documentElement.style.setProperty('--ui-opacity', config.opacity);
  document.body.classList.toggle('hide-labels', !config.showLabels);
  refreshMappingLabels();
});
window.overlay.onInput(handleInput);
window.overlay.onSkin(setSkin);
window.overlay.onLayout((layout) => { config.layout = layout; setLayout(layout); });
window.overlay.onStatus((status) => { keyboardStatus = status; renderInputStatus(); });
window.overlay.onClickThrough((enabled) => { document.querySelector('#clickMode').textContent = `Click-through: ${enabled ? 'ON' : 'OFF'}`; });
window.overlay.onStreamMode((enabled) => {
  document.body.classList.toggle('stream-mode', enabled);
  const button = document.querySelector('#streamMode');
  button.classList.toggle('active', enabled);
  button.textContent = enabled ? 'Modo OBS: ON' : 'Modo OBS';
});
window.overlay.onMoveMode((enabled) => {
  document.body.classList.toggle('move-mode', enabled);
  const button = document.querySelector('#moveMode');
  button.classList.toggle('active', enabled);
  button.textContent = enabled ? 'Terminar de mover' : 'Ctrl+Shift+M · Mover';
});
window.overlay.onProfileMode(async (enabled) => {
  document.body.classList.toggle('profile-mode', enabled);
  document.querySelector('#profileMode').classList.toggle('active', enabled);
  document.querySelector('#profileMode').textContent = enabled ? 'Cerrar perfiles' : 'Perfiles';
  document.querySelector('#profileStatus').textContent = '';
  if (enabled) await refreshProfiles();
});
window.overlay.onConfigMode((enabled) => {
  mappingMode = enabled;
  selectedMappingButton = null;
  clearPressed();
  document.body.classList.toggle('mapping-mode', enabled);
  document.querySelector('#configureMode').classList.toggle('active', enabled);
  document.querySelector('#configureMode').textContent = enabled ? 'Terminar configuración' : 'Configurar teclas';
  document.querySelector('#mappingHelp').textContent = 'Elegí un control y después presioná una tecla';
  for (const element of document.querySelectorAll('[data-map-action]')) element.classList.remove('selected');
});

document.querySelector('#clickMode').addEventListener('click', () => window.overlay.toggleClickThrough());
document.querySelector('#moveMode').addEventListener('click', () => window.overlay.toggleMoveMode());
document.querySelector('#configureMode').addEventListener('click', () => window.overlay.toggleConfigMode());
document.querySelector('#profileMode').addEventListener('click', () => window.overlay.toggleProfileMode());
document.querySelector('#streamMode').addEventListener('click', () => window.overlay.toggleStreamMode());
document.querySelector('#swapLayout').addEventListener('click', () => window.overlay.toggleLayout());
document.querySelector('#chooseProfileDirectory').addEventListener('click', async () => {
  const result = await window.overlay.chooseProfilesDirectory();
  if (!result.ok) {
    if (!result.canceled) document.querySelector('#profileStatus').textContent = result.error;
    return;
  }
  renderProfiles(result.profiles, result.activeProfile);
  setProfileDirectory(result.directory);
  document.querySelector('#profileStatus').textContent = 'Carpeta de perfiles actualizada';
});
document.querySelector('#saveProfile').addEventListener('click', async () => {
  const name = document.querySelector('#profileName').value.trim();
  const result = await window.overlay.saveProfile(name);
  const status = document.querySelector('#profileStatus');
  if (!result.ok) { status.textContent = result.error; return; }
  renderProfiles(result.profiles, result.activeProfile, result.activeProfile);
  setProfileDirectory(result.directory);
  status.textContent = `Perfil “${result.activeProfile}” guardado`;
});
document.querySelector('#loadProfile').addEventListener('click', async () => {
  const name = document.querySelector('#profileList').value;
  if (!name) return;
  const result = await window.overlay.loadProfile(name);
  const status = document.querySelector('#profileStatus');
  if (!result.ok) { status.textContent = result.error; return; }
  config.mapping = result.mapping;
  config.skin = result.skin;
  config.layout = result.layout || 'standard';
  setSkin(result.skin);
  setLayout(config.layout);
  clearPressed();
  refreshMappingLabels();
  await refreshProfiles(name);
  status.textContent = `Perfil “${name}” cargado`;
});
document.querySelector('#deleteProfile').addEventListener('click', async () => {
  const name = document.querySelector('#profileList').value;
  if (!name || !confirm(`¿Eliminar el perfil “${name}”?`)) return;
  const result = await window.overlay.deleteProfile(name);
  const status = document.querySelector('#profileStatus');
  if (!result.ok) { status.textContent = result.error; return; }
  renderProfiles(result.profiles, result.activeProfile);
  setProfileDirectory(result.directory);
  status.textContent = `Perfil “${name}” eliminado`;
});
for (const element of document.querySelectorAll('[data-map-action]')) {
  element.addEventListener('click', () => {
    for (const other of document.querySelectorAll('[data-map-action]')) other.classList.remove('selected');
    element.classList.add('selected');
    selectedMappingButton = element.dataset.mapAction;
    document.querySelector('#mappingHelp').textContent = 'Ahora presioná la tecla que querés usar';
  });
}
document.querySelector('#sizeDown').addEventListener('click', () => window.overlay.adjustWindowSize(-1));
document.querySelector('#sizeUp').addEventListener('click', () => window.overlay.adjustWindowSize(1));

let interactiveHover = false;
window.addEventListener('mousemove', (event) => {
  const next = Boolean(event.target.closest?.('#clickMode, #configureMode, #profileMode, #streamMode'));
  if (next === interactiveHover) return;
  interactiveHover = next;
  window.overlay.setInteractiveHover(next);
});
window.addEventListener('mouseleave', () => {
  interactiveHover = false;
  window.overlay.setInteractiveHover(false);
});
window.addEventListener('resize', updateFitScale);