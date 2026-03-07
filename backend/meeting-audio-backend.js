import WebSocket, { WebSocketServer } from "ws";
import { AssemblyAI } from "assemblyai";
import dotenv from "dotenv";

dotenv.config();

const client = new AssemblyAI({ apiKey: process.env.ASSEMBLYAI_API_KEY });
const wss = new WebSocketServer({ port: 3001 });

wss.on("connection", async (socket) => {
  console.log("Client connected");

  if (!process.env.ASSEMBLYAI_API_KEY) {
    console.error("AssemblyAI API key not found in environment");
    socket.close();
    return;

  }

  let transcriber;
  try {
    transcriber = await client.realtime.transcriber({
      sampleRate: 16000
    });
  } catch (error) {
    console.error("Failed to create transcriber:", error);
    socket.close();
    return;
  }

  let isReady = false;
  let buffer = [];

  transcriber.on("open", () => {
    console.log("Transcriber ready");
    isReady = true;
    buffer.forEach((chunk) => transcriber.sendAudio(chunk));
    buffer = [];
  });

  transcriber.on("transcript", (t) => {
    if (t.text) {
      console.log("Transcript:", t.text);
      socket.send(JSON.stringify({ type: "TRANSCRIPT", text: t.text }));
    }
  });

  transcriber.on("error", (error) => {
    console.error("Transcriber error:", error);
    socket.send(JSON.stringify({ type: "ERROR", message: "Transcription error" }));
  });

  socket.on("message", (audioChunk) => {
    try {
      // Handle both ArrayBuffer and Buffer
      const audioData = Buffer.isBuffer(audioChunk) ? audioChunk : Buffer.from(audioChunk);
      if (isReady) transcriber.sendAudio(audioData);
      else buffer.push(audioData);
    } catch (error) {
      console.error("Error processing audio chunk:", error);
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");
    if (transcriber) {
      try {
        transcriber.close();
      } catch (error) {
        console.error("Error closing transcriber:", error);
      }
    }
  });

  socket.on("error", (error) => {
    console.error("WebSocket error:", error);
  });
});

console.log("Backend running on ws://localhost:3001");