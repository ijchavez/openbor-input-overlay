const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const preview = new BrowserWindow({
    width: 760,
    height: 330,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: {
      javascript: false
    }
  });
  await preview.loadFile(path.join(__dirname, '..', 'renderer', 'index.html'));
  await new Promise((resolve) => setTimeout(resolve, 200));
  const image = await preview.webContents.capturePage();
  const outputDirectory = path.join(app.getPath('temp'), 'openbor-input-overlay-previews');
  fs.mkdirSync(outputDirectory, { recursive: true });
  fs.writeFileSync(path.join(outputDirectory, 'overlay-preview.png'), image.toPNG());
  app.quit();
});
