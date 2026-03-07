import WebSocket, { WebSocketServer } from "ws";
import { AssemblyAI } from "assemblyai";
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT || 3001);
const apiKey = process.env.ASSEMBLYAI_API_KEY;

if (!apiKey) {
  console.error("Missing ASSEMBLYAI_API_KEY in environment.");
  process.exit(1);
}

const client = new AssemblyAI({ apiKey });
const wss = new WebSocketServer({ port });

wss.on("connection", async (socket) => {
  console.log("Extension connected.");

  const transcriber = client.realtime.transcriber({ sampleRate: 16000 });
  let transcriberReady = false;
  const audioBufferQueue = [];

  transcriber.on("open", ({ sessionId }) => {
    transcriberReady = true;
    console.log("AssemblyAI realtime session open:", sessionId);

    while (audioBufferQueue.length > 0) {
      const chunk = audioBufferQueue.shift();
      transcriber.sendAudio(chunk);
    }
  });

  transcriber.on("transcript", (transcript) => {
    if (!transcript.text) return;

    const cleanText = transcript.text.trim();
    if (!cleanText) return;

    console.log("Transcript:", cleanText);

    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "TRANSCRIPT", text: cleanText }));
    }
  });

  transcriber.on("error", (error) => {
    console.error("AssemblyAI realtime error:", error);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ERROR", message: "AssemblyAI transcription error" }));
    }
  });

  transcriber.on("close", (code, reason) => {
    transcriberReady = false;
    console.log("AssemblyAI realtime closed:", code, reason || "");
  });

  try {
    await transcriber.connect();
  } catch (error) {
    console.error("Failed to connect to AssemblyAI realtime API:", error);
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: "ERROR", message: "Could not connect to AssemblyAI" }));
      socket.close();
    }
    return;
  }

  socket.on("message", (audioChunk) => {
    const chunk = Buffer.isBuffer(audioChunk) ? audioChunk : Buffer.from(audioChunk);
    if (!chunk.length) return;

    if (transcriberReady) {
      transcriber.sendAudio(chunk);
    } else {
      audioBufferQueue.push(chunk);
    }
  });

  socket.on("close", () => {
    console.log("Extension disconnected.");
    try {
      transcriber.close();
    } catch (error) {
      console.error("Error closing AssemblyAI transcriber:", error);
    }
  });

  socket.on("error", (error) => {
    console.error("Extension websocket error:", error);
  });
});

console.log(`Backend websocket server running at ws://localhost:${port}`);
