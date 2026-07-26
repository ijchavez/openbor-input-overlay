const buttons = new Map([...document.querySelectorAll('[data-button]')].map((element) => [element.dataset.button, element]));
const pressedCodes = new Map();
let config = null;
let mappingMode = false;
let selectedMappingButton = null;
let keyboardStatus = { source: 'local', message: 'Inicializando…' };
let activeGamepadName = null;
let lastStickPosition = { x: 0, y: 0 };

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

function normalizeLighting(value = {}) {
  const clamp = (number, fallback) => Number.isFinite(Number(number)) ? Math.max(0, Math.min(1, Number(number))) : fallback;
  const color = (candidate, fallback) => /^#[0-9a-f]{6}$/i.test(candidate || '') ? candidate.toLowerCase() : fallback;
  const duration = Number(value.trailDuration);
  return {
    buttonColor: color(value.buttonColor, '#59e4ff'),
    buttonIntensity: clamp(value.buttonIntensity, 1),
    dpadColor: color(value.dpadColor, '#59e4ff'),
    dpadIntensity: clamp(value.dpadIntensity, 0.65),
    trailEnabled: value.trailEnabled !== false,
    trailDuration: Number.isFinite(duration) ? Math.round(Math.max(80, Math.min(600, duration))) : 240,
    trailIntensity: clamp(value.trailIntensity, 0.55)
  };
}

function setLightingVariables(group, color, intensity) {
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  const strength = Math.max(0, Math.min(1, intensity));
  const root = document.documentElement.style;
  const rgba = (alpha) => `rgba(${red},${green},${blue},${Math.max(0, Math.min(1, alpha)).toFixed(3)})`;
  root.setProperty(`--${group}-light-color`, color);
  root.setProperty(`--${group}-light-fill`, rgba(0.12 + strength * 0.8));
  root.setProperty(`--${group}-light-dark`, rgba(0.08 + strength * 0.68));
  root.setProperty(`--${group}-light-shadow`, rgba(strength * 0.9));
  root.setProperty(`--${group}-light-inner`, `rgba(255,255,255,${(strength * 0.35).toFixed(3)})`);
  root.setProperty(`--${group}-light-radius`, `${Math.round(4 + strength * 18)}px`);
}

function applyLighting(value) {
  const lighting = normalizeLighting(value);
  if (config) config.lighting = lighting;
  setLightingVariables('button', lighting.buttonColor, lighting.buttonIntensity);
  setLightingVariables('dpad', lighting.dpadColor, lighting.dpadIntensity);
  document.querySelector('#buttonLightColor').value = lighting.buttonColor;
  document.querySelector('#buttonLightIntensity').value = Math.round(lighting.buttonIntensity * 100);
  document.querySelector('#buttonLightValue').value = `${Math.round(lighting.buttonIntensity * 100)}%`;
  document.querySelector('#dpadLightColor').value = lighting.dpadColor;
  document.querySelector('#dpadLightIntensity').value = Math.round(lighting.dpadIntensity * 100);
  document.querySelector('#dpadLightValue').value = `${Math.round(lighting.dpadIntensity * 100)}%`;
  document.querySelector('#trailEnabled').checked = lighting.trailEnabled;
  document.querySelector('#trailDuration').value = lighting.trailDuration;
  document.querySelector('#trailDurationValue').value = `${lighting.trailDuration} ms`;
  document.querySelector('#trailIntensity').value = Math.round(lighting.trailIntensity * 100);
  document.querySelector('#trailIntensityValue').value = `${Math.round(lighting.trailIntensity * 100)}%`;
  document.body.classList.toggle('trail-enabled', lighting.trailEnabled);
  document.documentElement.style.setProperty('--trail-duration', `${lighting.trailDuration}ms`);
  document.documentElement.style.setProperty('--trail-opacity', lighting.trailIntensity);
  if (!lighting.trailEnabled) {
    document.querySelectorAll('.stick-trail').forEach((element) => element.remove());
    document.querySelectorAll('.dpad-key.afterglow').forEach((element) => element.classList.remove('afterglow'));
  }
  return lighting;
}

function lightingFromInputs() {
  return {
    buttonColor: document.querySelector('#buttonLightColor').value,
    buttonIntensity: Number(document.querySelector('#buttonLightIntensity').value) / 100,
    dpadColor: document.querySelector('#dpadLightColor').value,
    dpadIntensity: Number(document.querySelector('#dpadLightIntensity').value) / 100,
    trailEnabled: document.querySelector('#trailEnabled').checked,
    trailDuration: Number(document.querySelector('#trailDuration').value),
    trailIntensity: Number(document.querySelector('#trailIntensity').value) / 100
  };
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

function triggerDpadAfterglow(element) {
  if (!config?.lighting?.trailEnabled) return;
  clearTimeout(element.afterglowTimer);
  element.classList.remove('afterglow');
  void element.offsetWidth;
  element.classList.add('afterglow');
  element.afterglowTimer = setTimeout(() => element.classList.remove('afterglow'), config.lighting.trailDuration + 40);
}

function emitStickTrail({ x, y }) {
  if (!config?.lighting?.trailEnabled || config.directionControl !== 'stick') return;
  const gate = document.querySelector('.stick-gate');
  const knob = gate?.querySelector('.stick-knob');
  if (!gate || !knob) return;
  const trail = document.createElement('div');
  trail.className = 'stick-trail';
  trail.style.setProperty('--trail-x', `${x * 22}px`);
  trail.style.setProperty('--trail-y', `${y * 22}px`);
  gate.insertBefore(trail, knob);
  const particles = gate.querySelectorAll('.stick-trail');
  if (particles.length > 10) particles[0].remove();
  setTimeout(() => trail.remove(), config.lighting.trailDuration + 40);
}

function updateButton(button) {
  const active = [...pressedCodes.values()].includes(button);
  const element = buttons.get(button);
  const wasActive = element?.classList.contains('pressed');
  element?.classList.toggle('pressed', active);
  if (['up', 'down', 'left', 'right'].includes(button)) {
    if (active) {
      clearTimeout(element?.afterglowTimer);
      element?.classList.remove('afterglow');
    } else if (wasActive) {
      triggerDpadAfterglow(element);
    }
    updateStick();
  }
}

function updateStick() {
  const active = new Set(pressedCodes.values());
  const x = (active.has('right') ? 1 : 0) - (active.has('left') ? 1 : 0);
  const y = (active.has('down') ? 1 : 0) - (active.has('up') ? 1 : 0);
  if (x !== lastStickPosition.x || y !== lastStickPosition.y) emitStickTrail(lastStickPosition);
  lastStickPosition = { x, y };
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
  applyLighting(config.lighting);
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
window.overlay.onLighting((lighting) => applyLighting(lighting));
window.overlay.onLightingMode((enabled) => {
  document.body.classList.toggle('lighting-mode', enabled);
  const button = document.querySelector('#lightingMode');
  button.classList.toggle('active', enabled);
  button.textContent = enabled ? 'Cerrar iluminación' : 'Iluminación';
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
document.querySelector('#lightingMode').addEventListener('click', () => window.overlay.toggleLightingMode());
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
for (const input of document.querySelectorAll('#lightingPanel input')) {
  input.addEventListener('input', () => applyLighting(lightingFromInputs()));
  input.addEventListener('change', async () => {
    const result = await window.overlay.setLighting(lightingFromInputs());
    if (result.ok) applyLighting(result.lighting);
  });
}

document.querySelector('#sizeDown').addEventListener('click', () => window.overlay.adjustWindowSize(-1));
document.querySelector('#sizeUp').addEventListener('click', () => window.overlay.adjustWindowSize(1));

let interactiveHover = false;
window.addEventListener('mousemove', (event) => {
  const next = Boolean(event.target.closest?.('#clickMode, #configureMode, #profileMode, #lightingMode, #streamMode'));
  if (next === interactiveHover) return;
  interactiveHover = next;
  window.overlay.setInteractiveHover(next);
});
window.addEventListener('mouseleave', () => {
  interactiveHover = false;
  window.overlay.setInteractiveHover(false);
});
window.addEventListener('resize', updateFitScale);