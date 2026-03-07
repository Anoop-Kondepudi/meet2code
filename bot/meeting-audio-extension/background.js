let ws;
let mediaStream;
let audioContext;
let processor;
let isStreaming = false;
let activeCaptureTabId = null;

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
    sendResponse({
      ok: true,
      isStreaming,
      tabId: activeCaptureTabId
    });
    return true;
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
      if (data.type === "TRANSCRIPT") {
        chrome.runtime.sendMessage(data);
      } else if (data.type === "ERROR") {
        sendStatusError(data.message || "Unknown backend error");
      }
    } catch (error) {
      console.error("Invalid backend message:", error);
    }
  };

  ws.onerror = () => {
    sendStatusError("Could not connect to ws://localhost:3001");
    stopStreaming();
  };

  ws.onclose = () => {
    if (isStreaming) {
      sendStatus("Disconnected");
    }
    cleanupAudio();
    isStreaming = false;
    activeCaptureTabId = null;
  };

  await waitForWebSocketOpen(ws);

  mediaStream = await captureTabAudio();

  audioContext = new AudioContext({ sampleRate: 16000 });
  const source = audioContext.createMediaStreamSource(mediaStream);
  processor = audioContext.createScriptProcessor(4096, 1, 1);

  source.connect(processor);
  processor.connect(audioContext.destination);

  processor.onaudioprocess = (event) => {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    const floatData = event.inputBuffer.getChannelData(0);
    ws.send(floatTo16BitPCM(floatData));
  };

  isStreaming = true;
  sendStatus(`Recording tab ${activeCaptureTabId}`);
}

function stopStreaming() {
  isStreaming = false;

  cleanupAudio();

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

function cleanupAudio() {
  if (processor) {
    try {
      processor.disconnect();
    } catch (error) {
      console.error("Error disconnecting processor:", error);
    }
    processor = null;
  }

  if (audioContext) {
    audioContext.close().catch(() => {});
    audioContext = null;
  }

  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    mediaStream = null;
  }
}

function captureTabAudio() {
  return new Promise((resolve, reject) => {
    chrome.tabCapture.capture({ audio: true, video: false }, (stream) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      if (!stream) {
        reject(new Error("Tab audio capture failed. Start from the tab you want to capture."));
        return;
      }

      resolve(stream);
    });
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

function waitForWebSocketOpen(socket) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error("Timed out while connecting to backend.")), 5000);

    socket.addEventListener("open", () => {
      clearTimeout(timeout);
      resolve();
    }, { once: true });

    socket.addEventListener("error", () => {
      clearTimeout(timeout);
      reject(new Error("WebSocket connection failed."));
    }, { once: true });
  });
}

function sendStatus(status) {
  chrome.runtime.sendMessage({ action: "STATUS", status });
}

function sendStatusError(message) {
  chrome.runtime.sendMessage({ action: "ERROR", message });
}

function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);

  for (let i = 0; i < float32Array.length; i++) {
    const sample = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(i * 2, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
  }

  return buffer;
}
