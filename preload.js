const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('overlay', {
  onConfig: (callback) => ipcRenderer.on('config', (_e, value) => callback(value)),
  onInput: (callback) => ipcRenderer.on('input', (_e, value) => callback(value)),
  onStatus: (callback) => ipcRenderer.on('input-status', (_e, value) => callback(value)),
  onSkin: (callback) => ipcRenderer.on('skin', (_e, value) => callback(value)),
  onClickThrough: (callback) => ipcRenderer.on('click-through', (_e, value) => callback(value)),
  onMoveMode: (callback) => ipcRenderer.on('move-mode', (_e, value) => callback(value)),
  localInput: (value) => ipcRenderer.send('local-input', value),
  toggleClickThrough: () => ipcRenderer.send('toggle-click-through'),
  toggleMoveMode: () => ipcRenderer.send('toggle-move-mode'),
  adjustWindowSize: (direction) => ipcRenderer.send('adjust-window-size', direction),
  setInteractiveHover: (interactive) => ipcRenderer.send('interactive-hover', interactive)
});
