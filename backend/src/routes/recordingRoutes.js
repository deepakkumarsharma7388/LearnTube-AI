import express from "express";
import { getRecordings, getRecording, importRecordings, processOne, deleteRecording, deleteAllRecordings, askAI } from "../controllers/recordingController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();
router.use(authMiddleware);
router.get("/recordings", getRecordings);
router.get("/recordings/:id", getRecording);
router.post("/import", importRecordings);
router.post("/recordings/:id/process", processOne);
router.delete("/recordings/:id", deleteRecording);
router.delete("/recordings", deleteAllRecordings);
router.post("/ask", askAI);
export default router;
