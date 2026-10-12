const { webFrame } = require('electron')

console.log('[mod] preload attached to Slack')

webFrame.insertCSS('body { background: red !important }')

window.addEventListener('DOMContentLoaded', () => {
    const el = document.querySelector('p-ssb_landing_header')
    if (el) el.textContent = 'boo'
})