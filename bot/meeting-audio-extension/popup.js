const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const transcripts = document.getElementById("transcripts");
const status = document.getElementById("status");

let isStreaming = false;

initialize();

async function initialize() {
  stopBtn.disabled = true;
  status.textContent = "Ready to start";

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "TRANSCRIPT" && msg.text) {
      const prefix = msg.isFinal ? "" : "… ";
      transcripts.textContent += `${prefix}${msg.text}\n`;
      transcripts.scrollTop = transcripts.scrollHeight;
      return;
    }

    if (msg.action === "STATUS") {
      status.textContent = msg.status;
      if (msg.status.startsWith("Recording")) {
        isStreaming = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
      } else if (msg.status === "Stopped" || msg.status === "Disconnected") {
        isStreaming = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }
      return;
    }

    if (msg.action === "ERROR") {
      status.textContent = `Error: ${msg.message}`;
      isStreaming = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  });

  const state = await sendMessage({ action: "GET_STATE" });
  if (state?.ok && state.isStreaming) {
    isStreaming = true;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    status.textContent = `Recording tab ${state.tabId ?? ""}`.trim();
  }

  startBtn.addEventListener("click", async () => {
    if (isStreaming) return;

    startBtn.disabled = true;
    status.textContent = "Selecting tab...";

    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const tabId = tab?.id;
      const response = await sendMessage({ action: "START", tabId });

      if (!response?.ok) {
        throw new Error(response?.message || "Failed to start streaming");
      }
    } catch (error) {
      status.textContent = `Error: ${error.message}`;
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  });

  stopBtn.addEventListener("click", async () => {
    if (!isStreaming) return;

    await sendMessage({ action: "STOP" });
    isStreaming = false;
    status.textContent = "Stopped";
    startBtn.disabled = false;
    stopBtn.disabled = true;
  });
}

function sendMessage(payload) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(payload, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(response);
    });
  });
}
