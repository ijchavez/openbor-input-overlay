let config = null;
let overlayState = { interaction: 'idle', clickThrough: false, streamMode: false };
let selectedMappingButton = null;
let saveStatusTimer = null;

const sectionTitles = {
  general: 'General',
  controls: 'Controles y mapping',
  appearance: 'Apariencia e iluminación',
  profiles: 'Perfiles',
  shortcuts: 'Atajos y OBS'
};

function selectTab(tab) {
  if (!sectionTitles[tab]) tab = 'general';
  document.querySelectorAll('.tab-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.tab === tab);
  });
  document.querySelectorAll('.tab-panel').forEach((panel) => {
    panel.classList.toggle('active', panel.dataset.panel === tab);
  });
  document.querySelector('#sectionTitle').textContent = sectionTitles[tab];
  if (tab === 'profiles') refreshProfiles();
}

function showSaveStatus(message, type = '') {
  const element = document.querySelector('#saveStatus');
  clearTimeout(saveStatusTimer);
  element.textContent = message;
  element.className = type;
  saveStatusTimer = setTimeout(() => {
    element.textContent = 'Cambios guardados automáticamente';
    element.className = '';
  }, 2200);
}

function setInlineStatus(element, message, type = '') {
  element.textContent = message;
  element.className = `inline-notice ${type}`.trim();
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

function normalizeCode(event) {
  if (event.key === 'Shift') return event.location === 2 ? 'ShiftRight' : 'ShiftLeft';
  return event.code === 'NumpadEnter' ? 'Enter' : event.code;
}

function refreshMappingLabels() {
  if (!config) return;
  for (const element of document.querySelectorAll('[data-map-action]')) {
    const code = Object.entries(config.mapping)
      .find(([, button]) => button === element.dataset.mapAction)?.[0];
    element.querySelector('kbd').textContent = code ? codeLabel(code) : 'SIN TECLA';
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
  for (const name of profiles) {
    list.add(new Option(name === activeProfile ? `${name} (activo)` : name, name));
  }
  if (profiles.includes(selected)) list.value = selected;
}

function setProfileDirectory(directory) {
  const element = document.querySelector('#profileDirectory');
  element.textContent = directory || 'Carpeta de perfiles';
  element.title = directory || '';
}

async function refreshProfiles(selectedProfile = null) {
  const data = await window.overlay.listProfiles();
  renderProfiles(data.profiles, data.activeProfile, selectedProfile);
  setProfileDirectory(data.directory);
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

function renderLiveLightingPreview(lighting) {
  const buttonIntensity = Math.round(Number(lighting.buttonIntensity) * 100);
  const dpadIntensity = Math.round(Number(lighting.dpadIntensity) * 100);
  const trailIntensity = Math.round(Number(lighting.trailIntensity) * 100);
  document.querySelector('#buttonLightValue').value = `${buttonIntensity}%`;
  document.querySelector('#dpadLightValue').value = `${dpadIntensity}%`;
  document.querySelector('#trailDurationValue').value = `${lighting.trailDuration} ms`;
  document.querySelector('#trailIntensityValue').value = `${trailIntensity}%`;

  const root = document.documentElement.style;
  root.setProperty('--button-color', lighting.buttonColor);
  root.setProperty('--button-shadow', hexToRgba(lighting.buttonColor, Math.max(.08, Number(lighting.buttonIntensity))));
  root.setProperty('--dpad-color', lighting.dpadColor);
  root.setProperty('--dpad-shadow', hexToRgba(lighting.dpadColor, Math.max(.08, Number(lighting.dpadIntensity))));
}

function applyLightingPreview(lighting) {
  const buttonIntensity = Math.round(Number(lighting.buttonIntensity) * 100);
  const dpadIntensity = Math.round(Number(lighting.dpadIntensity) * 100);
  const trailIntensity = Math.round(Number(lighting.trailIntensity) * 100);
  document.querySelector('#buttonLightColor').value = lighting.buttonColor;
  document.querySelector('#buttonLightIntensity').value = buttonIntensity;
  document.querySelector('#buttonLightValue').value = `${buttonIntensity}%`;
  document.querySelector('#dpadLightColor').value = lighting.dpadColor;
  document.querySelector('#dpadLightIntensity').value = dpadIntensity;
  document.querySelector('#dpadLightValue').value = `${dpadIntensity}%`;
  document.querySelector('#trailEnabled').checked = lighting.trailEnabled !== false;
  document.querySelector('#trailDuration').value = lighting.trailDuration;
  document.querySelector('#trailDurationValue').value = `${lighting.trailDuration} ms`;
  document.querySelector('#trailIntensity').value = trailIntensity;
  document.querySelector('#trailIntensityValue').value = `${trailIntensity}%`;

  const root = document.documentElement.style;
  root.setProperty('--button-color', lighting.buttonColor);
  root.setProperty('--button-shadow', hexToRgba(lighting.buttonColor, Math.max(.08, Number(lighting.buttonIntensity))));
  root.setProperty('--dpad-color', lighting.dpadColor);
  root.setProperty('--dpad-shadow', hexToRgba(lighting.dpadColor, Math.max(.08, Number(lighting.dpadIntensity))));
}

function hexToRgba(color, alpha) {
  const red = parseInt(color.slice(1, 3), 16);
  const green = parseInt(color.slice(3, 5), 16);
  const blue = parseInt(color.slice(5, 7), 16);
  return `rgba(${red}, ${green}, ${blue}, ${Math.max(0, Math.min(1, alpha))})`;
}

function applyConfig(value) {
  config = value;
  document.querySelector('#skin').value = config.skin;
  document.querySelector('#directionControl').value = config.directionControl;
  document.querySelector('#layout').value = config.layout;
  document.querySelector('#scale').value = Math.round(Number(config.scale) * 100);
  document.querySelector('#scaleValue').value = `${Math.round(Number(config.scale) * 100)}%`;
  document.querySelector('#opacity').value = Math.round(Number(config.opacity) * 100);
  document.querySelector('#opacityValue').value = `${Math.round(Number(config.opacity) * 100)}%`;
  document.querySelector('#showLabels').checked = config.showLabels !== false;
  document.querySelector('#showShoulders').checked = config.showShoulders !== false;
  document.querySelector('#alwaysOnTop').checked = config.alwaysOnTop !== false;
  applyLightingPreview(config.lighting);
  refreshMappingLabels();

  const hotkeys = config.hotkeys || {};
  document.querySelector('#hotkeyToggleVisibility').value = hotkeys.toggleVisibility || '';
  document.querySelector('#hotkeyCycleSkin').value = hotkeys.cycleSkin || '';
  document.querySelector('#hotkeyToggleClickThrough').value = hotkeys.toggleClickThrough || '';
  document.querySelector('#hotkeyToggleMoveMode').value = hotkeys.toggleMoveMode || '';
  document.querySelector('#hotkeyToggleStreamMode').value = hotkeys.toggleStreamMode || '';
}

function applyOverlayState(value) {
  overlayState = value;
  const moving = value.interaction === 'move';
  const detail = moving
    ? 'Modo mover'
    : value.clickThrough
      ? 'Click-through activo'
      : value.streamMode
        ? 'Modo OBS activo'
        : 'Modo normal';
  document.querySelector('#overlayStateDetail').textContent = detail;
  document.querySelector('#overlayStateDot').style.background = value.clickThrough ? '#ffbd62' : '#73e8a5';
  document.querySelector('#toggleObs').textContent = value.streamMode ? 'Desactivar modo OBS' : 'Activar modo OBS';
  document.querySelector('#toggleObs').classList.toggle('active', value.streamMode);
}

async function saveGeneralSettings() {
  showSaveStatus('Guardando…', 'saving');
  const result = await window.overlay.updateSettings({
    skin: document.querySelector('#skin').value,
    directionControl: document.querySelector('#directionControl').value,
    layout: document.querySelector('#layout').value,
    scale: Number(document.querySelector('#scale').value) / 100,
    opacity: Number(document.querySelector('#opacity').value) / 100,
    showLabels: document.querySelector('#showLabels').checked,
    showShoulders: document.querySelector('#showShoulders').checked,
    alwaysOnTop: document.querySelector('#alwaysOnTop').checked
  });
  if (!result.ok) {
    showSaveStatus(result.error || 'No se pudieron guardar los cambios', 'error');
    return;
  }
  showSaveStatus('Cambios guardados', '');
}

for (const button of document.querySelectorAll('.tab-button')) {
  button.addEventListener('click', () => selectTab(button.dataset.tab));
}

for (const id of ['skin', 'directionControl', 'layout', 'showLabels', 'showShoulders', 'alwaysOnTop']) {
  document.querySelector(`#${id}`).addEventListener('change', saveGeneralSettings);
}

for (const id of ['scale', 'opacity']) {
  const input = document.querySelector(`#${id}`);
  input.addEventListener('input', () => {
    document.querySelector(`#${id}Value`).value = `${input.value}%`;
  });
  input.addEventListener('change', saveGeneralSettings);
}

for (const element of document.querySelectorAll('[data-map-action]')) {
  element.addEventListener('click', () => {
    document.querySelectorAll('[data-map-action]').forEach((other) => other.classList.remove('selected'));
    element.classList.add('selected');
    selectedMappingButton = element.dataset.mapAction;
    setInlineStatus(document.querySelector('#mappingHelp'), 'Ahora presioná la tecla que querés usar.');
  });
}

window.addEventListener('keydown', async (event) => {
  if (!selectedMappingButton || event.repeat) return;
  event.preventDefault();
  event.stopPropagation();
  const code = normalizeCode(event);
  const button = selectedMappingButton;
  const result = await window.overlay.setMapping(button, code);
  if (!result.ok) {
    setInlineStatus(document.querySelector('#mappingHelp'), `No se pudo guardar: ${result.error}`, 'error');
    return;
  }
  config.mapping = result.mapping;
  refreshMappingLabels();
  document.querySelector(`[data-map-action="${button}"]`)?.classList.remove('selected');
  selectedMappingButton = null;
  setInlineStatus(document.querySelector('#mappingHelp'), `${codeLabel(code)} guardada. Elegí otro control.`, 'success');
});

async function persistLighting() {
  showSaveStatus('Guardando iluminacion...', 'saving');
  const result = await window.overlay.setLighting(lightingFromInputs());
  if (!result.ok) {
    showSaveStatus(result.error || 'No se pudo guardar la iluminacion', 'error');
    return;
  }
  applyLightingPreview(result.lighting);
  showSaveStatus('Iluminacion guardada');
}

function installPointerRange(input) {
  let dragging = false;

  const updateFromPointer = (event) => {
    const rect = input.getBoundingClientRect();
    const min = Number(input.min);
    const max = Number(input.max);
    const step = Number(input.step) || 1;
    const ratio = Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width));
    const rawValue = min + ratio * (max - min);
    const steppedValue = Math.round((rawValue - min) / step) * step + min;
    input.value = String(Math.max(min, Math.min(max, steppedValue)));
    renderLiveLightingPreview(lightingFromInputs());
  };

  input.addEventListener('pointerdown', (event) => {
    dragging = true;
    input.setPointerCapture(event.pointerId);
    updateFromPointer(event);
    event.preventDefault();
  });
  input.addEventListener('pointermove', (event) => {
    if (!dragging) return;
    updateFromPointer(event);
    event.preventDefault();
  });
  input.addEventListener('pointerup', (event) => {
    if (!dragging) return;
    updateFromPointer(event);
    dragging = false;
    if (input.hasPointerCapture(event.pointerId)) input.releasePointerCapture(event.pointerId);
    input.dispatchEvent(new Event('change', { bubbles: true }));
    event.preventDefault();
  });
  input.addEventListener('pointercancel', () => {
    dragging = false;
  });
}

for (const input of document.querySelectorAll('[data-panel="appearance"] input')) {
  input.addEventListener('input', () => renderLiveLightingPreview(lightingFromInputs()));
  input.addEventListener('change', persistLighting);
}

for (const selector of ['#trailDuration', '#trailIntensity']) {
  installPointerRange(document.querySelector(selector));
}
document.querySelector('#chooseProfileDirectory').addEventListener('click', async () => {
  const result = await window.overlay.chooseProfilesDirectory();
  const status = document.querySelector('#profileStatus');
  if (!result.ok) {
    if (!result.canceled) setInlineStatus(status, result.error, 'error');
    return;
  }
  renderProfiles(result.profiles, result.activeProfile);
  setProfileDirectory(result.directory);
  setInlineStatus(status, 'Carpeta de perfiles actualizada.', 'success');
});

document.querySelector('#saveProfile').addEventListener('click', async () => {
  const name = document.querySelector('#profileName').value.trim();
  const result = await window.overlay.saveProfile(name);
  const status = document.querySelector('#profileStatus');
  if (!result.ok) {
    setInlineStatus(status, result.error, 'error');
    return;
  }
  renderProfiles(result.profiles, result.activeProfile, result.activeProfile);
  setProfileDirectory(result.directory);
  setInlineStatus(status, `Perfil “${result.activeProfile}” guardado.`, 'success');
});

document.querySelector('#loadProfile').addEventListener('click', async () => {
  const name = document.querySelector('#profileList').value;
  if (!name) return;
  const result = await window.overlay.loadProfile(name);
  const status = document.querySelector('#profileStatus');
  if (!result.ok) {
    setInlineStatus(status, result.error, 'error');
    return;
  }
  await refreshProfiles(name);
  setInlineStatus(status, `Perfil “${name}” cargado.`, 'success');
});

document.querySelector('#deleteProfile').addEventListener('click', async () => {
  const name = document.querySelector('#profileList').value;
  if (!name || !confirm(`¿Eliminar el perfil “${name}”?`)) return;
  const result = await window.overlay.deleteProfile(name);
  const status = document.querySelector('#profileStatus');
  if (!result.ok) {
    setInlineStatus(status, result.error, 'error');
    return;
  }
  renderProfiles(result.profiles, result.activeProfile);
  setProfileDirectory(result.directory);
  setInlineStatus(status, `Perfil “${name}” eliminado.`, 'success');
});

document.querySelector('#saveHotkeys').addEventListener('click', async () => {
  const status = document.querySelector('#hotkeyStatus');
  setInlineStatus(status, 'Aplicando atajos…');
  const result = await window.overlay.setHotkeys({
    toggleVisibility: document.querySelector('#hotkeyToggleVisibility').value,
    cycleSkin: document.querySelector('#hotkeyCycleSkin').value,
    toggleClickThrough: document.querySelector('#hotkeyToggleClickThrough').value,
    toggleMoveMode: document.querySelector('#hotkeyToggleMoveMode').value,
    toggleStreamMode: document.querySelector('#hotkeyToggleStreamMode').value
  });
  if (!result.ok) {
    setInlineStatus(status, result.error, 'error');
    return;
  }
  setInlineStatus(status, 'Atajos aplicados correctamente.', 'success');
});

document.querySelector('#toggleObs').addEventListener('click', () => window.overlay.toggleStreamMode());

window.overlay.onConfig(applyConfig);
window.overlay.onOverlayState(applyOverlayState);
window.overlay.onSettingsTab(selectTab);

window.overlay.getSettings().then((data) => {
  applyConfig(data.config);
  applyOverlayState(data.state);
  renderProfiles(data.profiles, data.config.activeProfile);
  setProfileDirectory(data.directory);
});
