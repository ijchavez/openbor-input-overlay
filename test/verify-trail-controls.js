const path = require('node:path');
const { app, BrowserWindow, ipcMain } = require('electron');

const config = {
  skin: 'playstation',
  directionControl: 'stick',
  layout: 'standard',
  scale: 1,
  opacity: 0.96,
  showLabels: true,
  alwaysOnTop: true,
  activeProfile: null,
  mapping: {},
  hotkeys: {},
  lighting: {
    buttonColor: '#59e4ff',
    buttonIntensity: 1,
    dpadColor: '#59e4ff',
    dpadIntensity: 0.65,
    trailEnabled: true,
    trailDuration: 240,
    trailIntensity: 0.55
  }
};

ipcMain.handle('get-settings', () => ({
  config,
  state: { interaction: 'idle', clickThrough: false, streamMode: false },
  profiles: [],
  directory: ''
}));
ipcMain.handle('list-profiles', () => ({ profiles: [], activeProfile: null, directory: '' }));

app.whenReady().then(async () => {
  const preview = new BrowserWindow({
    width: 940,
    height: 680,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, '..', 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });
  await preview.loadFile(path.join(__dirname, '..', 'renderer', 'settings.html'));
  await new Promise((resolve) => setTimeout(resolve, 250));
  const result = await preview.webContents.executeJavaScript(`
    selectTab('appearance');
    const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
    const inspectRange = (selector, nextValue, outputSelector) => {
      const range = document.querySelector(selector);
      descriptor.set.call(range, nextValue);
      let writesDuringInput = 0;
      Object.defineProperty(range, 'value', {
        configurable: true,
        get() { return descriptor.get.call(this); },
        set(value) {
          writesDuringInput += 1;
          descriptor.set.call(this, value);
        }
      });
      range.dispatchEvent(new Event('input', { bubbles: true }));
      return {
        value: range.value,
        output: document.querySelector(outputSelector).value,
        writesDuringInput
      };
    };
    ({
      duration: inspectRange('#trailDuration', '480', '#trailDurationValue'),
      intensity: inspectRange('#trailIntensity', '82', '#trailIntensityValue')
    });
  `);
  process.stdout.write(`${JSON.stringify(result)}\n`);
  preview.destroy();
  app.exit(0);
});
