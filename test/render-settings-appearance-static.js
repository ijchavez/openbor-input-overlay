const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const sourcePath = path.join(__dirname, '..', 'renderer', 'settings.html');
  const temporaryDirectory = path.join(app.getPath('temp'), 'openbor-input-overlay-previews');
  fs.mkdirSync(temporaryDirectory, { recursive: true });
  const temporaryHtml = path.join(temporaryDirectory, 'settings-appearance-static.html');
  fs.copyFileSync(path.join(__dirname, '..', 'renderer', 'settings.css'), path.join(temporaryDirectory, 'settings.css'));
  const html = fs.readFileSync(sourcePath, 'utf8')
    .replace('class="tab-button active" data-tab="general"', 'class="tab-button" data-tab="general"')
    .replace('class="tab-button" data-tab="appearance"', 'class="tab-button active" data-tab="appearance"')
    .replace('class="tab-panel active" data-panel="general"', 'class="tab-panel" data-panel="general"')
    .replace('class="tab-panel" data-panel="appearance"', 'class="tab-panel active" data-panel="appearance"')
    .replace('<h1 id="sectionTitle">General</h1>', '<h1 id="sectionTitle">Apariencia e iluminación</h1>')
    .replace(/<script src="settings\.js[^"]*"><\/script>/, '');
  fs.writeFileSync(temporaryHtml, html);

  const preview = new BrowserWindow({
    width: 940,
    height: 680,
    show: false,
    backgroundColor: '#0b1019',
    webPreferences: { javascript: false }
  });
  await preview.loadFile(temporaryHtml);
  await new Promise((resolve) => setTimeout(resolve, 500));
  const image = await preview.webContents.capturePage();
  const outputPath = path.join(temporaryDirectory, 'settings-appearance-static.png');
  fs.writeFileSync(outputPath, image.toPNG());
  process.stdout.write(`${outputPath}\n`);
  preview.destroy();
  app.exit(0);
});
