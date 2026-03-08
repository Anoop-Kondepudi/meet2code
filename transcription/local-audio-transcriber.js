import { spawn } from "node:child_process";
import { AssemblyAI } from "assemblyai";
import dotenv from "dotenv";

dotenv.config();

const apiKey = process.env.ASSEMBLYAI_API_KEY;
if (!apiKey) {
  console.error("Missing ASSEMBLYAI_API_KEY in environment.");
  process.exit(1);
}

const speechModel = process.env.ASSEMBLYAI_SPEECH_MODEL || "u3-rt-pro";
const sampleRate = Number(process.env.AUDIO_SAMPLE_RATE || 16000);
const ffmpegFormat = process.env.AUDIO_INPUT_FORMAT || defaultInputFormat();
const inputDevicePrimary = process.env.AUDIO_INPUT_DEVICE || defaultInputDevice();
const inputDeviceSecondary = process.env.AUDIO_INPUT_DEVICE_2 || defaultSecondaryInputDevice();

const enableSpeakerLabels = (process.env.ASSEMBLYAI_SPEAKER_LABELS || "true").toLowerCase() === "true";
const maxSpeakers = process.env.ASSEMBLYAI_MAX_SPEAKERS ? Number(process.env.ASSEMBLYAI_MAX_SPEAKERS) : undefined;

const client = new AssemblyAI({ apiKey });
const transcriber = client.streaming.transcriber({
  sampleRate,
  speechModel,
  formatTurns: true,
  speakerLabels: enableSpeakerLabels,
  ...(Number.isInteger(maxSpeakers) ? { maxSpeakers } : {}),
  endOfTurnConfidenceThreshold: 0.4,
  minEndOfTurnSilenceWhenConfident: 160,
  maxTurnSilence: 400,
});

let ffmpegProcess;
let ready = false;
const queuedChunks = [];

transcriber.on("open", ({ id }) => {
  ready = true;
  console.log(`AssemblyAI session opened: ${id}`);

  while (queuedChunks.length > 0) {
    transcriber.sendAudio(queuedChunks.shift());
  }
});

import { appendFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_FILE = path.join(__dirname, "debug-transcription.log");
const TRANSCRIPT_DIR = path.join(__dirname, "..", "data", "transcripts");
const TRANSCRIPT_FILE = path.join(TRANSCRIPT_DIR, "live_meeting.json");

// Ensure transcript directory exists
mkdirSync(TRANSCRIPT_DIR, { recursive: true });

// In-memory transcript chunks (written to file for the pipeline)
const transcriptChunks = [];

function saveTranscript() {
  writeFileSync(TRANSCRIPT_FILE, JSON.stringify(transcriptChunks, null, 2));
}

appendFileSync(LOG_FILE, `\n--- Session started ${new Date().toISOString()} ---\n`);

transcriber.on("turn", (turn) => {
  const words = turn.words || [];
  const text = (turn.transcript || "").trim();
  const speaker = turn.speaker_label || "?";

  if (turn.end_of_turn) {
    // Final — print clean line
    const formatted = turn.turn_is_formatted ? text : words.map(w => w.text).join(" ");
    process.stdout.write(`\r${"".padEnd(120)}\r`);
    console.log(`[${speaker}] ${formatted}`);
    appendFileSync(LOG_FILE, `[final][${speaker}] ${formatted}\n`);

    // Save to transcript file for pipeline consumption
    if (formatted.trim()) {
      transcriptChunks.push({
        speaker: speaker,
        text: formatted,
        timestamp: new Date().toISOString(),
      });
      saveTranscript();
    }
  } else if (words.length > 0) {
    // Partial — show words building up in real time
    const partial = words.map(w => w.text).join(" ");
    process.stdout.write(`\r[${speaker}] ${partial}${"".padEnd(30)}`);
    appendFileSync(LOG_FILE, `[partial][${speaker}] ${partial}\n`);
  }
});

transcriber.on("error", (error) => {
  console.error("AssemblyAI streaming error:", error?.message || error);
});

transcriber.on("close", (code, reason) => {
  ready = false;
  console.log("AssemblyAI streaming closed:", code, reason || "");
});

await transcriber.connect();
console.log("Connected to AssemblyAI streaming API");
console.log(
  inputDeviceSecondary
    ? `Starting audio capture via ffmpeg: ${inputDevicePrimary} + ${inputDeviceSecondary}`
    : `Starting audio capture via ffmpeg: ${inputDevicePrimary}`
);
console.log("Press Ctrl+C to stop.\n");

ffmpegProcess = spawn("ffmpeg", buildFfmpegArgs(), {
  stdio: ["ignore", "pipe", "pipe"]
});

// Buffer audio to meet AssemblyAI's 50-1000ms chunk duration requirement
// At 16kHz mono 16-bit: 16000 samples/s * 2 bytes = 32000 bytes/s
// 100ms = 3200 bytes
const CHUNK_DURATION_MS = 100;
const BYTES_PER_CHUNK = Math.floor(sampleRate * 2 * CHUNK_DURATION_MS / 1000);
let audioBuffer = Buffer.alloc(0);

ffmpegProcess.stdout.on("data", (chunk) => {
  audioBuffer = Buffer.concat([audioBuffer, chunk]);

  while (audioBuffer.length >= BYTES_PER_CHUNK) {
    const sendChunk = audioBuffer.subarray(0, BYTES_PER_CHUNK);
    audioBuffer = audioBuffer.subarray(BYTES_PER_CHUNK);

    if (ready) {
      try {
        transcriber.sendAudio(sendChunk);
      } catch (e) {
        console.error("Error sending audio, socket may have closed:", e.message);
        ready = false;
      }
    } else {
      queuedChunks.push(sendChunk);
    }
  }
});

ffmpegProcess.stderr.on("data", (data) => {
  const msg = data.toString().trim();
  if (msg) console.error("ffmpeg:", msg);
});

ffmpegProcess.on("error", (error) => {
  console.error("Failed to start ffmpeg. Is it installed and on PATH?", error.message);
  shutdown(1);
});

ffmpegProcess.on("close", (code) => {
  console.log(`ffmpeg process exited with code ${code}`);
  shutdown(code === 0 ? 0 : 1);
});

process.on("SIGINT", () => shutdown(0));
process.on("SIGTERM", () => shutdown(0));

let shuttingDown = false;
async function shutdown(exitCode) {
  if (shuttingDown) return;
  shuttingDown = true;

  if (ffmpegProcess && !ffmpegProcess.killed) {
    ffmpegProcess.kill("SIGTERM");
  }

  try {
    await transcriber.close();
  } catch (error) {
    console.error("Error closing transcriber:", error?.message || error);
  }

  // Signal the pipeline that the meeting ended
  if (transcriptChunks.length > 0) {
    transcriptChunks.push({
      speaker: "SYSTEM",
      text: "MEETING_ENDED",
      timestamp: new Date().toISOString(),
    });
    saveTranscript();
    console.log(`\nTranscript saved: ${TRANSCRIPT_FILE} (${transcriptChunks.length - 1} turns)`);
  }

  process.exit(exitCode);
}

function buildFfmpegArgs() {
  const args = ["-hide_banner", "-loglevel", "error"];

  args.push("-f", ffmpegFormat, "-i", inputDevicePrimary);

  if (inputDeviceSecondary) {
    args.push("-f", ffmpegFormat, "-i", inputDeviceSecondary);
    args.push("-filter_complex", "[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2");
  }

  args.push("-ac", "1", "-ar", String(sampleRate), "-f", "s16le", "pipe:1");
  return args;
}

function defaultInputFormat() {
  if (process.platform === "darwin") return "avfoundation";
  if (process.platform === "win32") return "dshow";
  return "pulse";
}

function defaultInputDevice() {
  if (process.platform === "darwin") return ":0";
  if (process.platform === "win32") return "audio=CABLE Output (VB-Audio Virtual Cable)";
  return "default";
}

function defaultSecondaryInputDevice() {
  if (process.platform === "win32") return "audio=Microphone (2- Realtek(R) Audio)";
  return "";
}
