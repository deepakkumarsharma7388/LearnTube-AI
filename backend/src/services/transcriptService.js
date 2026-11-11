import fs from "fs";
import os from "os";
import path from "path";
import { YouTubeTranscriptApi } from "youtube-transcript-ts";
import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";

const yt = new YouTubeTranscriptApi();

const youtubeId = (url) => {
  const m = String(url).match(/(?:v=|youtu\.be\/|shorts\/|embed\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] || null;
};

const driveId = (url) =>
  String(url).match(/[?&]id=([A-Za-z0-9_-]+)/)?.[1] ||
  String(url).match(/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)/)?.[1] ||
  String(url).match(/drive\.google\.com\/open\?id=([A-Za-z0-9_-]+)/)?.[1] ||
  null;

async function downloadDriveFile(url) {
  const id = driveId(url);
  if (!id) throw new Error("Could not find a Google Drive file ID. Use a Drive file sharing URL.");

  const response = await fetch(`https://drive.google.com/uc?export=download&id=${id}`);
  if (!response.ok) {
    throw new Error(`Google Drive download failed (${response.status}). Make sure the file is shared so the backend can access it.`);
  }

  const type = response.headers.get("content-type") || "application/octet-stream";
  const length = Number(response.headers.get("content-length") || 0);
  const max = Number(process.env.MAX_MEDIA_BYTES || 100000000);

  if (length && length > max) throw new Error(`Drive file is larger than the configured ${Math.round(max / 1000000)} MB limit.`);

  const buffer = Buffer.from(await response.arrayBuffer());
  if (buffer.length > max) throw new Error(`Drive file is larger than the configured ${Math.round(max / 1000000)} MB limit.`);

  let ext = ".bin";
  if (type.includes("mpeg")) ext = ".mp3";
  else if (type.includes("wav")) ext = ".wav";
  else if (type.includes("webm")) ext = ".webm";
  else if (type.includes("mp4")) ext = ".mp4";
  else if (type.includes("quicktime")) ext = ".mov";
  else if (type.includes("ogg")) ext = ".ogg";

  const file = path.join(os.tmpdir(), `lecture-${Date.now()}${ext}`);
  await fs.promises.writeFile(file, buffer);
  return { file, mimeType: type };
}

async function transcribeDriveMedia(file, mimeType) {
  if (!process.env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is missing in backend/.env");

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  let uploaded = await ai.files.upload({
    file,
    config: { mimeType }
  });

  // Gemini may need a few seconds to process video files before they can be used.
  if (mimeType.startsWith("video/") && uploaded.name) {
    for (let i = 0; i < 60; i++) {
      const state = uploaded.state?.toString?.() || uploaded.state || "";
      if (!state || state === "ACTIVE") break;
      if (state === "FAILED") throw new Error("Gemini could not process the uploaded Drive video.");
      await new Promise((resolve) => setTimeout(resolve, 5000));
      uploaded = await ai.files.get({ name: uploaded.name });
    }
  }

  const response = await ai.models.generateContent({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash",
    contents: createUserContent([
      `Transcribe this lecture accurately and completely. Preserve the spoken meaning, important terminology, numbers, examples, steps, definitions and tool names. Do not summarize. Return only the transcript text. If the audio is unclear, mark the unclear portion rather than inventing words.`,
      createPartFromUri(uploaded.uri, uploaded.mimeType || mimeType)
    ]),
    config: { temperature: 0.1 }
  });

  return response.text || "";
}

export const getTranscript = async ({ url, source }) => {
  if (source === "YouTube") {
    const id = youtubeId(url);
    if (!id) throw new Error("Invalid YouTube URL.");

    try {
      const response = await yt.fetchTranscript(id, { languages: ["en", "hi"] });
      const text = response.transcript.snippets
        .map((s) => s.text)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();

      if (!text) throw new Error("No YouTube transcript/captions were available for this lecture.");
      return text;
    } catch (error) {
      throw new Error(`YouTube transcript could not be fetched. Make sure captions/transcript are available. ${error.message || ""}`.trim());
    }
  }

  if (source === "Google Drive") {
    const { file, mimeType } = await downloadDriveFile(url);
    try {
      const transcript = await transcribeDriveMedia(file, mimeType);
      if (!transcript.trim()) throw new Error("Gemini could not extract a transcript from this Drive media file.");
      return transcript.trim();
    } finally {
      await fs.promises.unlink(file).catch(() => {});
    }
  }

  throw new Error("Automatic transcription is currently supported for YouTube captions and accessible Google Drive audio/video files.");
};
