const { app, ipcMain} = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

ipcMain.on('mod:get-css', (event) => {
  event.returnValue = fs.readFileSync(path.join(__dirname, 'theme.css'), 'utf8');
})

ipcMain.on('mod:preload-ready', () => {
  console.log('[mod] preload attached to Slack');
});

ipcMain.on('mod:idv-scan', (_event, buttonCount, foundIds) => {
  console.log(`[mod] IDV scan: ${buttonCount} sender buttons, ${foundIds} IDs`);
});

ipcMain.handle('mod:check-idv', async (_event, slackId) => {
  console.log('[mod] IDV request:', slackId);
  if (typeof slackId !== 'string' || !/^[UW][A-Z0-9]+$/.test(slackId)) {
    return false;
  }

  try {
    const url = new URL('https://auth.hackclub.com/api/external/check');
    url.searchParams.set('slack_id', slackId);
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    const verified = data?.result === 'verified_eligible';
    console.log('[mod] IDV result:', slackId, data?.result);
    return verified;
  } catch (error) {
    console.error('[mod] IDV check failed:', error);
    return false;
  }
});

function findAsar() {
  
}

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