import mongoose from "mongoose";

const recordingSchema = new mongoose.Schema(
  {
    day: { type: Number, required: true, index: true },
    title: { type: String, required: true, trim: true },
    original: { type: String, required: true, trim: true },
    url: { type: String, required: true, unique: true, index: true },
    source: { type: String, enum: ["YouTube", "Google Drive", "Other"], default: "Other" },
    topics: { type: [String], default: [] },
    status: { type: String, enum: ["pending", "processing", "ready", "error"], default: "pending", index: true },
    transcript: { type: String, default: "" },
    notes: { type: String, default: "" },
    keywords: { type: [String], default: [] },
    aiError: { type: String, default: "" },
    processedAt: { type: Date, default: null }
  },
  { timestamps: true }
);

const Recording = mongoose.model("Recording", recordingSchema);
export default Recording;
