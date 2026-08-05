const fs = require('node:fs');
const path = require('node:path');
const { app, BrowserWindow } = require('electron');

app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  const rendererDirectory = path.join(__dirname, '..', 'renderer');
  const temporaryDirectory = path.join(app.getPath('temp'), 'openbor-input-overlay-previews');
  fs.mkdirSync(temporaryDirectory, { recursive: true });
  fs.copyFileSync(path.join(rendererDirectory, 'styles.css'), path.join(temporaryDirectory, 'styles.css'));
  fs.copyFileSync(path.join(rendererDirectory, 'overlay-v12.css'), path.join(temporaryDirectory, 'overlay-v12.css'));

  const source = fs.readFileSync(path.join(rendererDirectory, 'index.html'), 'utf8');
  const html = source
    .replace('<body>', '<body class="stream-mode move-mode"><style>:root{--fit-scale:1.25}</style>')
    .replace(/<script src="app\.js[^"]*"><\/script>/, '');
  const temporaryHtml = path.join(temporaryDirectory, 'overlay-obs-move-guide.html');
  fs.writeFileSync(temporaryHtml, html);

  const preview = new BrowserWindow({
    width: 950,
    height: 443,
    show: false,
    frame: false,
    transparent: true,
    webPreferences: { javascript: false }
  });
  await preview.loadFile(temporaryHtml);
  await new Promise((resolve) => setTimeout(resolve, 250));
  const image = await preview.webContents.capturePage();
  const outputPath = path.join(temporaryDirectory, 'overlay-obs-move-guide.png');
  fs.writeFileSync(outputPath, image.toPNG());
  process.stdout.write(`${outputPath}\n`);
  preview.destroy();
  app.exit(0);
});
