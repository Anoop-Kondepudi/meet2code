document.addEventListener('DOMContentLoaded', function() {
  const startBtn = document.getElementById("startBtn");
  const stopBtn = document.getElementById("stopBtn");
  const transcripts = document.getElementById("transcripts");
  const status = document.getElementById("status");

  let isStreaming = false;

  // Initialize button states
  stopBtn.disabled = true;
  status.textContent = "Ready to start";

  startBtn.onclick = () => {
    if (!isStreaming) {
      console.log("Start button clicked");
      startBtn.disabled = true;
      status.textContent = "Starting...";
      chrome.runtime.sendMessage({ action: "START" });
    }
  };
  
  stopBtn.onclick = () => {
    if (isStreaming) {
      console.log("Stop button clicked");
      stopBtn.disabled = true;
      status.textContent = "Stopping...";
      chrome.runtime.sendMessage({ action: "STOP" });
    }
  };

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((msg) => {
    console.log("Message received:", msg);
    
    if (msg.type === "TRANSCRIPT") {
      transcripts.textContent += msg.text + "\n";
      // Auto-scroll to bottom
      transcripts.scrollTop = transcripts.scrollHeight;
    } else if (msg.action === "STATUS") {
      status.textContent = msg.status;
      
      if (msg.status === "Recording") {
        isStreaming = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
      } else if (msg.status === "Stopped" || msg.status === "Disconnected") {
        isStreaming = false;
        startBtn.disabled = false;
        stopBtn.disabled = true;
      }
    } else if (msg.action === "ERROR") {
      status.textContent = "Error: " + msg.message;
      console.error("Extension error:", msg.message);
      isStreaming = false;
      startBtn.disabled = false;
      stopBtn.disabled = true;
    }
  });

  // Handle any runtime errors
  chrome.runtime.lastError && console.error("Runtime error:", chrome.runtime.lastError);
});