import Recording from "../models/Recording.js";
import { generateLectureNotes, answerFromLectures } from "./aiService.js";
import { getTranscript } from "./transcriptService.js";

const extractKeywords = (text = "") => [...new Set((text.toLowerCase().match(/[a-z0-9][a-z0-9+#.-]{2,}/g) || []).filter(w => !["the","and","for","with","that","this","from","you","are","was","will","have","has","about","into","your","they","their","then","than","what","when","where","which","lecture","day"].includes(w)))] .slice(0, 100);

export const processRecording = async (id) => {
  const rec = await Recording.findById(id);
  if (!rec) return;
  await Recording.findByIdAndUpdate(id, { status: "processing", aiError: "" });
  try {
    const transcript = rec.transcript || await getTranscript({ url: rec.url, source: rec.source });
    const notes = await generateLectureNotes({ title: rec.title, day: rec.day, transcript });
    await Recording.findByIdAndUpdate(id, {
      transcript,
      notes,
      keywords: extractKeywords(`${rec.title} ${rec.topics.join(" ")} ${notes}`),
      status: "ready",
      processedAt: new Date(),
      aiError: ""
    });
  } catch (error) {
    await Recording.findByIdAndUpdate(id, { status: "error", aiError: error.message || "AI processing failed" });
  }
};

export const answerQuestion = async (question) => {
  const words = [...new Set(question.toLowerCase().match(/[a-z0-9+#.-]{3,}/g) || [])];
  const records = await Recording.find({ status: "ready" }).sort({ day: 1 }).lean();
  const scored = records.map(r => {
    const hay = `${r.title} ${r.topics.join(" ")} ${r.keywords.join(" ")} ${r.notes}`.toLowerCase();
    const score = words.reduce((n, w) => n + (hay.includes(w) ? 1 : 0), 0);
    return { r, score };
  }).sort((a, b) => b.score - a.score);
  const selected = scored.filter(x => x.score > 0).slice(0, 12);
  const fallback = scored.slice(0, 6);
  const rows = (selected.length ? selected : fallback).map(({ r }) => `\n--- Day ${r.day}: ${r.title} ---\nTopics: ${r.topics.join(", ")}\nNotes:\n${r.notes}\nTranscript excerpt:\n${r.transcript.slice(0, 5000)}`).join("\n");
  if (!rows) return { answer: "There are no AI-processed lectures yet. Import a lecture and wait for its notes to be generated.", sources: [] };
  const answer = await answerFromLectures({ question, context: rows.slice(0, 70000) });
  return { answer, sources: (selected.length ? selected : fallback).map(({ r }) => ({ id: r._id, day: r.day, title: r.title })) };
};
