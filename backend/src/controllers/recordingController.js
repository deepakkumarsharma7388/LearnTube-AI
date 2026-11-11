import Recording from "../models/Recording.js";
import { parseRecordings } from "../utils/parser.js";
import { processRecording, answerQuestion } from "../services/recordingService.js";

export const getRecordings = async (req, res) => {
  try { res.json(await Recording.find().sort({ day: 1, createdAt: 1 }).lean()); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

export const getRecording = async (req, res) => {
  try {
    const r = await Recording.findById(req.params.id).lean();
    if (!r) return res.status(404).json({ message: "Recording not found" });
    res.json(r);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const importRecordings = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Text is required" });
    const items = parseRecordings(text);
    if (!items.length) return res.status(400).json({ message: "No lecture URLs found in the imported text." });
    const added = [], skipped = [];
    for (const item of items) {
      const exists = await Recording.findOne({ url: item.url });
      if (exists) { skipped.push(exists.url); continue; }
      const created = await Recording.create(item);
      added.push(created);
      processRecording(created._id).catch(console.error);
    }
    res.status(202).json({ added: added.length, skipped: skipped.length, ids: added.map(x => x._id), message: "Imported. AI processing started in the background." });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const processOne = async (req, res) => {
  try {
    const r = await Recording.findById(req.params.id);
    if (!r) return res.status(404).json({ message: "Recording not found" });
    processRecording(r._id).catch(console.error);
    res.status(202).json({ message: "AI processing started" });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

export const deleteRecording = async (req, res) => {
  try { await Recording.findByIdAndDelete(req.params.id); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

export const deleteAllRecordings = async (req, res) => {
  try { await Recording.deleteMany({}); res.json({ ok: true }); }
  catch (e) { res.status(500).json({ message: e.message }); }
};

export const askAI = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question?.trim()) return res.status(400).json({ message: "Question is required" });
    res.json(await answerQuestion(question));
  } catch (e) { res.status(500).json({ message: e.message }); }
};
