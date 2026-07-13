const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlay', {
  onConfig: (callback) => ipcRenderer.on('config', (_e, value) => callback(value)),
  onInput: (callback) => ipcRenderer.on('input', (_e, value) => callback(value)),
  onStatus: (callback) => ipcRenderer.on('input-status', (_e, value) => callback(value)),
  onSkin: (callback) => ipcRenderer.on('skin', (_e, value) => callback(value)),
  onClickThrough: (callback) => ipcRenderer.on('click-through', (_e, value) => callback(value)),
  onMoveMode: (callback) => ipcRenderer.on('move-mode', (_e, value) => callback(value)),
  onConfigMode: (callback) => ipcRenderer.on('config-mode', (_e, value) => callback(value)),
  onProfileMode: (callback) => ipcRenderer.on('profile-mode', (_e, value) => callback(value)),
  localInput: (value) => ipcRenderer.send('local-input', value),
  toggleClickThrough: () => ipcRenderer.send('toggle-click-through'),
  toggleMoveMode: () => ipcRenderer.send('toggle-move-mode'),
  toggleConfigMode: () => ipcRenderer.send('toggle-config-mode'),
  toggleProfileMode: () => ipcRenderer.send('toggle-profile-mode'),
  listProfiles: () => ipcRenderer.invoke('list-profiles'),
  saveProfile: (name) => ipcRenderer.invoke('save-profile', name),
  loadProfile: (name) => ipcRenderer.invoke('load-profile', name),
  deleteProfile: (name) => ipcRenderer.invoke('delete-profile', name),
  setMapping: (button, code) => ipcRenderer.invoke('set-mapping', { button, code }),
  adjustWindowSize: (direction) => ipcRenderer.send('adjust-window-size', direction),
  setInteractiveHover: (interactive) => ipcRenderer.send('interactive-hover', interactive)
});
