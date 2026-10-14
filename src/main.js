const { app, ipcMain} = require('electron');
const fs = require('fs');
const path = require('path');

ipcMain.on('mod:get-css', (event) => {
  event.returnValue = fs.readFileSync(path.join(__dirname, 'theme.css'), 'utf8');
})

// const ASAR = '/usr/lib/slack/resources/app.asar';
const ASAR = '/Applications/Slack.app/Contents/Resources/app.asar';

const pkg = JSON.parse(fs.readFileSync(path.join(ASAR, 'package.json'), 'utf8'));
console.log('[mod] Slack main entry:', pkg.main);

app.setPath('userData', path.join(app.getPath('appData'), 'slack-mod'))

app.on('session-created', (session) => {
  session.registerPreloadScript({
    type: 'frame',
    filePath: path.join(__dirname, 'preload.js'),
  })
})

if (!app.requestSingleInstanceLock()) {
  app.quit()
} else {
  require(path.join(ASAR, pkg.main))
}