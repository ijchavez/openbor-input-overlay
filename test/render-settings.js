const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const preview = new BrowserWindow({
    width: 940,
    height: 680,
    show: false,
    backgroundColor: '#0b1019',
    webPreferences: {
      javascript: false
    }
  });
  await preview.loadFile(path.join(__dirname, '..', 'renderer', 'settings.html'));
  await new Promise((resolve) => setTimeout(resolve, 500));
  const image = await preview.webContents.capturePage();
  const outputDirectory = path.join(app.getPath('temp'), 'openbor-input-overlay-previews');
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, 'settings-preview.png'), image.toPNG());
  app.quit();
});
