import { GoogleGenAI } from "@google/genai";

const getAI = () => {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is missing in backend/.env");
  }
  return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
};

const model = () => process.env.GEMINI_MODEL || "gemini-2.5-flash";

const generate = async (prompt) => {
  const response = await getAI().models.generateContent({
    model: model(),
    contents: prompt,
    config: {
      temperature: 0.2,
      maxOutputTokens: 8000
    }
  });
  return response.text || "";
};

export const generateLectureNotes = async ({ title, day, transcript }) => {
  const prompt = `You are the AI study-notes engine for a private 90-day Advanced Digital Marketing course.

Lecture: Day ${day || "?"} — ${title}

Create accurate, detailed study notes ONLY from the supplied lecture transcript. Do not invent facts. If something is unclear or absent, say so.

Return clean Markdown using exactly these sections:
# Lecture Summary
# What Was Taught
# Key Concepts
# Step-by-Step / Framework
# Examples Mentioned
# Practical Action Items
# Important Terms
# Quick Revision
# Questions to Test Myself

Requirements:
- Explain concepts in simple language.
- Preserve useful examples, tools, numbers, definitions and procedures from the lecture.
- Make the notes useful for someone revising later.
- Separate what the lecturer actually taught from your organization of the material.

TRANSCRIPT:
${transcript}`;

  return generate(prompt);
};

export const answerFromLectures = async ({ question, context }) => {
  const prompt = `You are a private AI study assistant for a 90-day Digital Marketing course.

Answer the user's question using ONLY the supplied lecture material. The material may come from multiple lectures.

Rules:
- Do not invent information.
- If the answer is not supported by the supplied lectures, say that clearly.
- Explain the answer in simple but complete language.
- Mention relevant Day numbers and lecture titles when supported.
- If several lectures support the answer, combine them logically.
- Do not claim that a topic was taught unless the supplied material supports it.

USER QUESTION:
${question}

LECTURE MATERIAL:
${context}`;

  return generate(prompt);
};
