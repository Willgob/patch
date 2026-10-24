const { webFrame, ipcRenderer } = require('electron')

async function isVerified(slackId) {
	const verified = await ipcRenderer.invoke('mod:check-idv', slackId)
	console.log(`[mod] IDV ${slackId}: ${verified ? 'verified' : 'unverified'}`)
	return verified
}

function getSlackId(button) {
	const isSlackUserId = (value) => typeof value === 'string' && /^[UW][A-Z0-9]{6,}$/.test(value)

	let element = button
	for (let depth = 0; element && depth < 8; depth += 1) {
		for (const attribute of element.attributes) {
			if (isSlackUserId(attribute.value)) return attribute.value
		}
		element = element.parentElement
	}

	const visited = new WeakSet()
	const findId = (value, depth = 0) => {
		if (!value || typeof value !== 'object' || depth > 6 || visited.has(value)) return null
		visited.add(value)

		for (const [key, child] of Object.entries(value)) {
			if (/(user|member|sender|author|bot).*id|id.*(user|member|sender|author|bot)/i.test(key) && isSlackUserId(child)) {
				return child
			}
		}

		for (const valueChild of Object.values(value)) {
			const nestedId = findId(valueChild, depth + 1)
			if (nestedId) return nestedId
		}
		return null
	}

	for (const key of Object.keys(button)) {
		if (!key.startsWith('__reactFiber$') && !key.startsWith('__reactProps$')) continue
		let value = button[key]
		for (let depth = 0; value && depth < 14; depth += 1) {
			const slackId = findId(value.memoizedProps ?? value.pendingProps ?? value)
			if (slackId) return slackId
			value = value.return
		}
	}

	return null
}

function startIdv() {
	const results = new Map()
	const pending = new Map()
	let lastScanReport = ''

	const scan = () => {
		try {
			const buttons = document.querySelectorAll('.c-message__sender_button')
			let foundIds = 0
			for (const button of buttons) {
				const slackId = getSlackId(button)
				if (!slackId) continue
				foundIds += 1
				if (results.has(slackId)) {
					if (results.get(slackId)) button.removeAttribute('data-hc-unverified')
					else button.setAttribute('data-hc-unverified', 'true')
					continue
				}

				if (!pending.has(slackId)) {
					const check = isVerified(slackId)
					pending.set(slackId, check)
					check.then((verified) => {
						results.set(slackId, verified)
						pending.delete(slackId)
						scan()
					}, () => {
						pending.delete(slackId)
					})
				}
			}
			const scanReport = `${buttons.length}:${foundIds}`
			if (scanReport !== lastScanReport) {
				lastScanReport = scanReport
				console.log(`[mod] IDV scan: ${buttons.length} sender buttons, ${foundIds} IDs`)
				ipcRenderer.send('mod:idv-scan', buttons.length, foundIds)
			}
		} catch (error) {
			console.warn('[mod] IDV scan stopped because the WebContents closed:', error)
		}
	}

	try {
		new MutationObserver(scan).observe(document, {
			childList: true,
			subtree: true,
		})
	} catch (error) {
		console.warn('[mod] IDV observer was not started:', error)
	}
	scan()
}

const plugins = [
	{ name: 'idv', start: startIdv },
]

ipcRenderer.send('mod:preload-ready')
console.log('[mod] preload attached to Slack')

try {
	const css = ipcRenderer.sendSync('mod:get-css')
	const insertion = webFrame.insertCSS(css)
	if (insertion && typeof insertion.then === 'function') {
		insertion.catch((error) => {
			console.warn('[mod] CSS was not inserted because the WebContents closed:', error)
		})
	}
} catch (error) {
	console.warn('[mod] CSS setup was skipped:', error)
}

for (const plugin of plugins) {
	try {
		plugin.start()
	} catch (error) {
		console.error(`[mod] Plugin "${plugin.name}" failed to start:`, error)
	}
}


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