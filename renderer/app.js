const buttons = new Map(
  [...document.querySelectorAll('[data-button]')].map((element) => [element.dataset.button, element])
);
const pressedCodes = new Map();
let config = null;
let keyboardStatus = { source: 'local', message: 'Inicializando…' };
let activeGamepadName = null;
let lastStickPosition = { x: 0, y: 0 };
let interactiveHover = false;

function setLayout(layout) {
  document.body.classList.toggle('layout-reversed', layout === 'reversed');
}

function renderInputStatus() {
  const element = document.querySelector('#status');
  const shortGamepadName = activeGamepadName?.length > 30
    ? `${activeGamepadName.slice(0, 27)}…`
    : activeGamepadName;
  const status = shortGamepadName
    ? { source: 'global', message: `Gamepad USB: ${shortGamepadName}` }
    : keyboardStatus;
  element.className = `status ${status.source}`;
  element.querySelector('span').textContent = status.message;
}

function codeLabel(code) {
  const labels = {
    ArrowUp: '↑',
    ArrowDown: '↓',
    ArrowLeft: '←',
    ArrowRight: '→',
    ShiftLeft: 'SHIFT IZQ',
    ShiftRight: 'SHIFT DER',
    ControlLeft: 'CTRL IZQ',
    ControlRight: 'CTRL DER',
    AltLeft: 'ALT IZQ',
    AltRight: 'ALT DER',
    Space: 'ESPACIO',
    Enter: 'ENTER',
    Escape: 'ESC'
  };
  return labels[code] || code.replace(/^Key/, '').replace(/^Digit/, '').replace(/^Numpad/, 'NUM ');
}

function refreshMappingLabels() {
  if (!config) return;
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

function normalizeLighting(value = {}) {
  const clamp = (number, fallback) => Number.isFinite(Number(number))
    ? Math.max(0, Math.min(1, Number(number)))
    : fallback;
  const color = (candidate, fallback) => /^#[0-9a-f]{6}$/i.test(candidate || '')
    ? candidate.toLowerCase()
    : fallback;
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
  document.body.classList.toggle('trail-enabled', lighting.trailEnabled);
  document.documentElement.style.setProperty('--trail-duration', `${lighting.trailDuration}ms`);
  document.documentElement.style.setProperty('--trail-opacity', lighting.trailIntensity);
  if (!lighting.trailEnabled) {
    document.querySelectorAll('.stick-trail').forEach((element) => element.remove());
    document.querySelectorAll('.dpad-key.afterglow').forEach((element) => element.classList.remove('afterglow'));
  }
}

function updateFitScale() {
  const configuredScale = Number(config?.scale) || 1;
  const availableScale = Math.min(window.innerWidth / 760, window.innerHeight / 354);
  document.documentElement.style.setProperty('--fit-scale', Math.min(configuredScale, availableScale));
}

const skinLabels = {
  playstation: { triangle: '△', circle: '○', cross: '✕', square: '□' },
  xbox: { triangle: 'Y', circle: 'B', cross: 'A', square: 'X' },
  arcade: { triangle: '4', circle: '3', cross: '2', square: '1' }
};

function setSkin(skin) {
  const overlay = document.querySelector('#overlay');
  overlay.className = `skin-${skin}`;
  for (const [button, label] of Object.entries(skinLabels[skin] || skinLabels.playstation)) {
    buttons.get(button).querySelector('span').textContent = label;
  }
}

function triggerDpadAfterglow(element) {
  if (!config?.lighting?.trailEnabled || !element) return;
  clearTimeout(element.afterglowTimer);
  element.classList.remove('afterglow');
  void element.offsetWidth;
  element.classList.add('afterglow');
  element.afterglowTimer = setTimeout(
    () => element.classList.remove('afterglow'),
    config.lighting.trailDuration + 40
  );
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
  if (pressed) pressedCodes.set(code, button);
  else pressedCodes.delete(code);
  updateButton(button);
}

const GAMEPAD_BUTTONS = {
  cross: 0,
  circle: 1,
  square: 2,
  triangle: 3,
  leftShoulder: 4,
  rightShoulder: 5,
  select: 8,
  start: 9
};
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
  for (const [action, index] of Object.entries(GAMEPAD_BUTTONS)) {
    setGamepadAction(action, gamepadButtonPressed(gamepad, index));
  }
  requestAnimationFrame(pollGamepads);
}

function normalizeCode(event) {
  if (event.key === 'Shift') return event.location === 2 ? 'ShiftRight' : 'ShiftLeft';
  return event.code === 'NumpadEnter' ? 'Enter' : event.code;
}

function localKey(event, pressed) {
  if (!config) return;
  const code = normalizeCode(event);
  const button = config.mapping[code];
  if (!button || (pressed && event.repeat)) return;
  event.preventDefault();
  window.overlay.localInput({ code, button, pressed });
}

function applyConfig(value) {
  config = value;
  setSkin(config.skin);
  setLayout(config.layout);
  document.body.classList.toggle('use-stick', config.directionControl === 'stick');
  document.documentElement.style.setProperty('--ui-scale', config.scale);
  updateFitScale();
  document.documentElement.style.setProperty('--ui-opacity', config.opacity);
  document.body.classList.toggle('hide-shoulders', config.showShoulders === false);
  applyLighting(config.lighting);
  document.body.classList.toggle('hide-labels', !config.showLabels);
  refreshMappingLabels();
}

function applyOverlayState(state) {
  const moving = state.interaction === 'move';
  document.body.classList.toggle('move-mode', moving);
  document.body.classList.toggle('stream-mode', state.streamMode);

  const moveButton = document.querySelector('#moveMode');
  moveButton.classList.toggle('active', moving);
  moveButton.textContent = moving ? 'Terminar de mover' : 'Ctrl+Shift+M · Mover';

  const streamButton = document.querySelector('#streamMode');
  streamButton.classList.toggle('active', state.streamMode);
  streamButton.textContent = state.streamMode ? 'Modo OBS: ON' : 'Modo OBS';

  const clickButton = document.querySelector('#clickMode');
  clickButton.classList.toggle('active', state.clickThrough);
  clickButton.textContent = `Click-through: ${state.clickThrough ? 'ON' : 'OFF'}`;
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
window.addEventListener('resize', updateFitScale);

window.overlay.onConfig(applyConfig);
window.overlay.onInput(handleInput);
window.overlay.onStatus((status) => {
  keyboardStatus = status;
  renderInputStatus();
});
window.overlay.onOverlayState(applyOverlayState);
window.overlay.onClickThrough((enabled) => {
  const button = document.querySelector('#clickMode');
  button.classList.toggle('active', enabled);
  button.textContent = `Click-through: ${enabled ? 'ON' : 'OFF'}`;
});
window.overlay.onMoveMode((enabled) => {
  document.body.classList.toggle('move-mode', enabled);
});
window.overlay.onStreamMode((enabled) => {
  document.body.classList.toggle('stream-mode', enabled);
});

document.querySelector('#clickMode').addEventListener('click', () => window.overlay.toggleClickThrough());
document.querySelector('#moveMode').addEventListener('click', () => window.overlay.toggleMoveMode());
document.querySelector('#streamMode').addEventListener('click', () => window.overlay.toggleStreamMode());
document.querySelector('#settingsMode').addEventListener('click', () => window.overlay.openSettings('general'));
document.querySelector('#swapLayout').addEventListener('click', () => window.overlay.toggleLayout());
document.querySelector('#sizeDown').addEventListener('click', () => window.overlay.adjustWindowSize(-1));
document.querySelector('#sizeUp').addEventListener('click', () => window.overlay.adjustWindowSize(1));

window.addEventListener('mousemove', (event) => {
  const next = Boolean(event.target.closest?.('#clickMode, #settingsMode, #streamMode, #moveMode, #sizeControls'));
  if (next === interactiveHover) return;
  interactiveHover = next;
  window.overlay.setInteractiveHover(next);
});
window.addEventListener('mouseleave', () => {
  interactiveHover = false;
  window.overlay.setInteractiveHover(false);
});

requestAnimationFrame(pollGamepads);
