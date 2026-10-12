const { webFrame } = require('electron')

console.log('[mod] preload attached to Slack')

try {
    require('fs')
    console.log('[mod] fs works :3')
} catch (e) {
    console.log('[mod] fs blocked:', e.message)
}

window.addEventListener('DOMContentLoaded', () => {

    const stype = document.createElement('style')
    stype.textContent= 'body { background: blue !important}'
    document.head.appendChild(stype)


    const text = 'boo'

    function apply() {
        const el = document.querySelector('.p-ssb_landing__header')
        if (el && el.textContent !== text) el.textContent = text
    }

    new MutationObserver(apply).observe(document.documentElement, {
        childList: true,
        subtree: true,
        characterData: true
    })
    apply()
})