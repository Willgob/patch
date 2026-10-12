console.log('[preload] running')

function inject() {
    const style = document.createElement('style')
    style.textContent = 'body { background: #111 !important; color: #eee !important; }'
    document.head.appendChild(style)
}

window.addEventListener('DOMContentLoaded', inject)