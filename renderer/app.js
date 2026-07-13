const buttons = new Map([...document.querySelectorAll('[data-button]')].map((el) => [el.dataset.button, el]));
const pressedCodes = new Map();
let config = null;

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

function normalizeCode(event) {
  if (event.key === 'Shift') return event.location === 2 ? 'ShiftRight' : 'ShiftLeft';
  return event.code === 'NumpadEnter' ? 'Enter' : event.code;
}

function localKey(event, pressed) {
  if (!config) return;
  const code = normalizeCode(event); const button = config.mapping[code];
  if (!button || (pressed && event.repeat)) return;
  event.preventDefault(); window.overlay.localInput({ code, button, pressed });
}

window.addEventListener('keydown', (event) => localKey(event, true));
window.addEventListener('keyup', (event) => localKey(event, false));
window.addEventListener('blur', () => { for (const [code, button] of pressedCodes) handleInput({ code, button, pressed: false }); });

window.overlay.onConfig((value) => {
  config = value; setSkin(config.skin);
  document.body.classList.toggle('use-stick', config.directionControl === 'stick');
  document.documentElement.style.setProperty('--ui-scale', config.scale);
  updateFitScale();
  document.documentElement.style.setProperty('--ui-opacity', config.opacity);
  document.body.classList.toggle('hide-labels', !config.showLabels);
});
window.overlay.onInput(handleInput);
window.overlay.onSkin(setSkin);
window.overlay.onStatus(({ source, message }) => { const el = document.querySelector('#status'); el.className = `status ${source}`; el.querySelector('span').textContent = message; });
window.overlay.onClickThrough((enabled) => { document.querySelector('#clickMode').textContent = `Click-through: ${enabled ? 'ON' : 'OFF'}`; });
window.overlay.onMoveMode((enabled) => {
  document.body.classList.toggle('move-mode', enabled);
  const button = document.querySelector('#moveMode');
  button.classList.toggle('active', enabled);
  button.textContent = enabled ? 'Terminar de mover' : 'Ctrl+Shift+M · Mover';
});
document.querySelector('#clickMode').addEventListener('click', () => window.overlay.toggleClickThrough());
document.querySelector('#moveMode').addEventListener('click', () => window.overlay.toggleMoveMode());
document.querySelector('#sizeDown').addEventListener('click', () => window.overlay.adjustWindowSize(-1));
document.querySelector('#sizeUp').addEventListener('click', () => window.overlay.adjustWindowSize(1));

let interactiveHover = false;
window.addEventListener('mousemove', (event) => {
  const next = Boolean(event.target.closest?.('#clickMode'));
  if (next === interactiveHover) return;
  interactiveHover = next;
  window.overlay.setInteractiveHover(next);
});
window.addEventListener('mouseleave', () => {
  interactiveHover = false;
  window.overlay.setInteractiveHover(false);
});
window.addEventListener('resize', updateFitScale);