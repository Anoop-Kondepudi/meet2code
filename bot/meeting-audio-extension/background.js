let ws;
let mediaStream;
let audioContext;
let processor;
let isStreaming = false;

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "START") {
    console.log("START received");
    if (!isStreaming) {
      startStreaming();
    }
  }
  if (msg.action === "STOP") {
    console.log("STOP received");
    if (isStreaming) {
      stopStreaming();
    }
  }
});

function startStreaming() {
  try {
    ws = new WebSocket("ws://localhost:3001");

    ws.onopen = () => {
      console.log("Connected to backend");
      isStreaming = true;
      chrome.runtime.sendMessage({ action: "STATUS", status: "Connected" });
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === "TRANSCRIPT") {
          chrome.runtime.sendMessage(data);
        } else if (data.type === "ERROR") {
          chrome.runtime.sendMessage({ action: "ERROR", message: data.message });
        }
      } catch (error) {
        console.error("Error parsing message from backend:", error);
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      chrome.runtime.sendMessage({ action: "ERROR", message: "Connection error" });
      stopStreaming();
    };

    ws.onclose = () => {
      console.log("WebSocket closed");
      isStreaming = false;
      chrome.runtime.sendMessage({ action: "STATUS", status: "Disconnected" });
    };

    // Capture tab audio
    chrome.tabCapture.capture({ audio: true, video: false }).then(stream => {
      if (!stream) {
        throw new Error("Failed to capture audio");
      }
      
      mediaStream = stream;
      audioContext = new AudioContext({ sampleRate: 16000 });
      const source = audioContext.createMediaStreamSource(mediaStream);

      processor = audioContext.createScriptProcessor(4096, 1, 1);
      source.connect(processor);
      processor.connect(audioContext.destination);

      processor.onaudioprocess = (e) => {
        if (ws && ws.readyState === WebSocket.OPEN) {
          const floatData = e.inputBuffer.getChannelData(0);
          ws.send(floatTo16BitPCM(floatData));
        }
      };

      chrome.runtime.sendMessage({ action: "STATUS", status: "Recording" });
    }).catch(error => {
      console.error("Error capturing audio:", error);
      chrome.runtime.sendMessage({ action: "ERROR", message: "Failed to capture audio" });
      stopStreaming();
    });

  } catch (error) {
    console.error("Error starting streaming:", error);
    chrome.runtime.sendMessage({ action: "ERROR", message: "Failed to start streaming" });
  }
}

function stopStreaming() {
  console.log("Stopping streaming");
  isStreaming = false;
  
  if (processor) {
    processor.disconnect();
    processor = null;
  }
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  if (mediaStream) {
    mediaStream.getTracks().forEach((t) => t.stop());
    mediaStream = null;
  }
  if (ws) {
    ws.close();
    ws = null;
  }
  
  chrome.runtime.sendMessage({ action: "STATUS", status: "Stopped" });
}

// Convert Float32 to PCM16
function floatTo16BitPCM(float32Array) {
  const buffer = new ArrayBuffer(float32Array.length * 2);
  const view = new DataView(buffer);
  let offset = 0;
  for (let i = 0; i < float32Array.length; i++, offset += 2) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buffer;
}