let ws;
let isStreaming = false;
let activeCaptureTabId = null;
const OFFSCREEN_URL = "offscreen.html";

chrome.runtime.onInstalled.addListener(() => {
  console.log("Live Transcriber extension installed.");
});

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === "START") {
    if (isStreaming) {
      sendResponse({ ok: false, message: "Already streaming" });
      return true;
    }

    startStreaming(msg.tabId)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        sendStatusError(error.message);
        sendResponse({ ok: false, message: error.message });
      });
    return true;
  }

  if (msg.action === "STOP") {
    stopStreaming();
    sendResponse({ ok: true });
    return true;
  }

  if (msg.action === "GET_STATE") {
    sendResponse({ ok: true, isStreaming, tabId: activeCaptureTabId });
    return true;
  }

  if (msg.action === "AUDIO_CHUNK") {
    if (ws && ws.readyState === WebSocket.OPEN && msg.chunk) {
      ws.send(msg.chunk);
    }
    return false;
  }

  if (msg.action === "CAPTURE_ERROR") {
    sendStatusError(msg.message || "Audio capture failed");
    stopStreaming();
    return false;
  }

  return false;
});

async function startStreaming(requestedTabId) {
  const tabId = Number.isInteger(requestedTabId) ? requestedTabId : await getCurrentActiveTabId();
  if (!Number.isInteger(tabId)) {
    throw new Error("Could not resolve target tab for capture.");
  }

  activeCaptureTabId = tabId;
  sendStatus("Connecting to backend...");

  ws = new WebSocket("ws://localhost:3001");

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data);
      if (data.type === "TRANSCRIPT") chrome.runtime.sendMessage(data);
      else if (data.type === "ERROR") sendStatusError(data.message || "Unknown backend error");
    } catch (error) {
      console.error("Invalid backend message:", error);
    }
  };

  ws.onerror = () => {
    sendStatusError("Could not connect to ws://localhost:3001");
    stopStreaming();
  };

  ws.onclose = () => {
    if (isStreaming) sendStatus("Disconnected");
    isStreaming = false;
    activeCaptureTabId = null;
    stopOffscreenCapture();
  };

  await waitForWebSocketOpen(ws);
  await ensureOffscreenDocument();

  const streamId = await getTabMediaStreamId(tabId);

  await chrome.runtime.sendMessage({
    action: "START_CAPTURE",
    streamId,
    tabId,
    sampleRate: 16000
  });

  isStreaming = true;
  sendStatus(`Recording tab ${activeCaptureTabId}`);
}

function stopStreaming() {
  isStreaming = false;
  stopOffscreenCapture();

  if (ws) {
    try {
      ws.close();
    } catch (error) {
      console.error("Error closing websocket:", error);
    }
    ws = null;
  }

  activeCaptureTabId = null;
  sendStatus("Stopped");
}

function stopOffscreenCapture() {
  chrome.runtime
    .sendMessage({ action: "STOP_CAPTURE" })
    .catch(() => {
      // No-op: offscreen may not be ready/created.
    });
}

async function ensureOffscreenDocument() {
  if (await chrome.offscreen.hasDocument()) return;

  await chrome.offscreen.createDocument({
    url: OFFSCREEN_URL,
    reasons: ["USER_MEDIA"],
    justification: "Capture tab audio for realtime transcription"
  });
}

function getCurrentActiveTabId() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      resolve(tabs?.[0]?.id);
    });
  });
}

function getTabMediaStreamId(tabId) {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.getMediaStreamId({ targetTabId: tabId }, (streamId) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!streamId) {
        reject(new Error("Failed to create tab media stream id."));
        return;
      }

      resolve(streamId);
    });
  });
}

function waitForWebSocketOpen(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out while connecting to backend.")), 5000);

    socket.addEventListener(
      "open",
      () => {
        clearTimeout(timeout);
        resolve();
      },
      { once: true }
    );

    socket.addEventListener(
      "error",
      () => {
        clearTimeout(timeout);
        reject(new Error("WebSocket connection failed."));
      },
      { once: true }
    );
  });
}

function sendStatus(status) {
  chrome.runtime.sendMessage({ action: "STATUS", status });
}

function sendStatusError(message) {
  chrome.runtime.sendMessage({ action: "ERROR", message });
}
