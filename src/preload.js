const { webFrame, ipcRenderer } = require('electron')

console.log('[mod] preload attached to Slack')

const css = ipcRenderer.sendSync('mod:get-css')
webFrame.insertCSS(css)


// window.addEventListener('DOMContentLoaded', () => {

//     const text = 'boo'

//     function apply() {
//         const el = document.querySelector('.p-ssb_landing__header')
//         if (el && el.textContent !== text) el.textContent = text
//     }

//     new MutationObserver(apply).observe(document.documentElement, {
//         childList: true,
//         subtree: true,
//         characterData: true
//     })
//     apply()
// })