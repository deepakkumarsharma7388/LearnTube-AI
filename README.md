# LearnTube AI — AI-Powered Video Learning & Smart Notes Generator

LearnTube AI is an AI-powered video learning platform that imports YouTube and Google Drive lectures, extracts transcripts, generates structured study notes, and lets users ask questions across their processed learning materials.

## Stack
- Frontend: React + Vite + JavaScript/JSX
- Backend: Node.js + Express.js
- Database: MongoDB Atlas + Mongoose
- AI: Google Gemini API via `@google/genai`
- YouTube captions: `youtube-transcript-ts`

## Main flow
1. Paste WhatsApp-style lecture text containing Day/title + YouTube or Google Drive URL.
2. Backend stores the lecture in MongoDB Atlas.
3. YouTube lectures use available captions/transcript.
4. Google Drive audio/video is downloaded temporarily and sent to Gemini for transcription.
5. Gemini generates structured lecture notes.
6. Notes + transcript + keywords are stored in MongoDB Atlas.
7. AI Chat searches the processed lectures and asks Gemini to answer using those lecture materials only.
8. Each lecture has an Open Original Lecture button.

## Setup
1. Extract this ZIP.
2. Run `setup-windows.bat` (PowerShell: `./setup-windows.bat`).
3. Open `backend/.env` and set:

```env
PORT=8000
MONGO_URI=your-mongodb-atlas-uri
ADMIN_TOKEN=your-long-secret
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key
GEMINI_MODEL=gemini-2.5-flash
MAX_MEDIA_BYTES=100000000
```

4. Start everything with `start-windows.bat`, or run separately:

```powershell
cd backend
npm run dev
```

and in another terminal:

```powershell
cd frontend
npm run dev
```

5. Open `http://localhost:5173`.

## MongoDB Atlas
You do not need to manually create collections. The first imported lecture creates the `recordings` collection through Mongoose.

Create a MongoDB Atlas database user and allow your development IP in Network Access. Keep your MongoDB URI private.

## Gemini API
Create your key in Google AI Studio and put it only in `backend/.env` as `GEMINI_API_KEY`. Never expose it in the frontend or commit `.env` to GitHub.

## YouTube notes
The automatic YouTube path depends on captions/transcript availability. If a video has no accessible transcript, that lecture will show an AI processing error rather than inventing notes.

## Google Drive notes
The Drive file must be accessible to the backend through its sharing URL. Audio/video is temporarily downloaded, transcribed with Gemini, then deleted from the local temp folder. The app does not store the raw media in MongoDB.

## Security
- `.env` files are ignored by Git.
- Admin endpoints require `X-Admin-Token`.
- Gemini API key stays server-side.
