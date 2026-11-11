import express from "express";
import cors from "cors";
import recordingRoutes from "./routes/recordingRoutes.js";

const app = express();
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(express.json({ limit: "2mb" }));
app.get("/health", (req, res) => res.json({ ok: true, version: "6.0.0", ai: Boolean(process.env.GEMINI_API_KEY), provider: "Google Gemini" }));
app.use("/api", recordingRoutes);
app.use((err, req, res, next) => { console.error(err); res.status(500).json({ message: err.message || "Server error" }); });
export default app;
