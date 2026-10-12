const { app} = require('electron');
const fs = require('fs');
const path = require('path');

const ASAR = '/usr/lib/slack/resources/app.asar';

const pkg = JSON.parse(fs.readFileSync(path.join(ASAR, 'package.json'), 'utf8'));
console.log('[mod] Slack main entry:', pkg.main);

app.setPath('userData', path.join(app.getPath('appData'), 'slack-mod'))

app.on('session-created', (session) => {
  session.registerPreloadScript({
    type: 'frame',
    filePath: path.join(__dirname, 'preload.js'),
  })
})

require(path.join(ASAR, pkg.main))