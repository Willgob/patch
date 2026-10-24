const CHECK_URL = 'https://auth.hackclub.com/api/external/check';

async function isVerified(slackId) {
  try {
    const url = new URL(CHECK_URL);
    url.searchParams.set('slack_id', slackId);
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

    const data = await response.json();
    return data.result === 'verified_eligible';
  } catch (error) {
    console.error('[mod] IDV check failed:', error);
    return false;
  }
}

function getSlackId(button) {
  for (const attribute of ['data-member-id', 'data-user-id', 'data-sender-id']) {
    const owner = button.closest(`[${attribute}]`);
    const slackId = owner?.getAttribute(attribute);
    if (slackId) return slackId;
  }
  return null;
}

function setUnverified(button, unverified) {
  if (unverified) {
    button.setAttribute('data-hc-unverified', 'true');
  } else {
    button.removeAttribute('data-hc-unverified');
  }
}

module.exports = {
  name: 'idv',
  start() {
    const results = new Map();
    const pending = new Map();

    const scan = () => {
      try {
        for (const button of document.querySelectorAll('.c-message__sender_button')) {
          const slackId = getSlackId(button);
          if (!slackId) continue;

          if (results.has(slackId)) {
            setUnverified(button, !results.get(slackId));
            continue;
          }

          if (!pending.has(slackId)) {
            const check = isVerified(slackId);
            pending.set(slackId, check);
            check.then((verified) => {
              results.set(slackId, verified);
              pending.delete(slackId);
              scan();
            });
          }
        }
      } catch (error) {
        console.warn('[mod] IDV scan stopped because the WebContents closed:', error)
      }
    };

    try {
      new MutationObserver(scan).observe(document.documentElement, {
        childList: true,
        subtree: true,
      });
    } catch (error) {
      console.warn('[mod] IDV observer was not started:', error)
    }
    scan();
  },
};