# Meeting Transcript Signal Analyzer — NimitAI Intern Assignment

A full-stack web application that analyses sales meeting transcripts using AI and surfaces actionable sales signals with coaching tips.

---

## What It Does

Paste any sales call transcript into the interface and click **Analyse Transcript**. The app sends the transcript to a Node.js/Express backend, which forwards it to OpenAI's GPT-4o-mini model with a structured prompt. The AI identifies sales signals such as buying interest, objections, pricing concerns, and competitor mentions — returning each signal with an exact quote from the transcript and a one-line coaching tip for the sales rep.

---

## Tech Stack

| Layer     | Technology                      |
|-----------|---------------------------------|
| Frontend  | React 18 + Vite                 |
| Backend   | Node.js + Express               |
| AI / LLM  | OpenAI GPT-4o-mini              |
| Styling   | Custom CSS (dark editorial UI)  |

---

## LLM Used

**OpenAI GPT-4o-mini** — fast, cost-effective, and highly capable at structured JSON output. The system prompt enforces JSON-only responses with no markdown or extra text.

---

## Project Structure

```
nimitai-transcript-analyzer/
  backend/
    server.js         # Express API server
    package.json
    .env.example      # Copy to .env and add your key
  frontend/
    src/
      App.jsx         # Main React component
      main.jsx        # Entry point
      App.css         # Styles
    package.json
    vite.config.js
    index.html
  README.md
```

---

## Setup & Installation

### 1. Clone / Download the project

```bash
cd nimitai-transcript-analyzer
```

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
# Open .env and add your OpenAI API key
```

### 3. Frontend Setup

```bash
cd ../frontend
npm install
```

---

## Environment Variables

Create `backend/.env` from the example:

```
OPENAI_API_KEY=your_openai_api_key_here
```

Get your key at [platform.openai.com/api-keys](https://platform.openai.com/api-keys).

> **No key?** The app runs in **mock/demo mode** automatically — it returns a pre-built sample response so you can explore the UI without an API key.

---

## Running the App

### Start the backend (Terminal 1)

```bash
cd backend
npm start
# Or for hot-reload during development:
npm run dev
```

Backend runs at: `http://localhost:5000`

### Start the frontend (Terminal 2)

```bash
cd frontend
npm run dev
```

Frontend runs at: `http://localhost:3000`

---

## Example Test Transcript

```
Rep: Pricing is $499/seat/month.
Prospect: That seems steep. We pay under $200 currently.
Rep: If your team closes one extra deal per quarter, it pays for itself 10x.
Prospect: Send me a pricing deck and I'll get back to you.
```

**Expected signals detected:**
- `pricing_concern` — "That seems steep"
- `competitor_mention` — "We pay under $200 currently"
- `next_step` — "Send me a pricing deck and I'll get back to you"

Click the **Load sample ↓** button in the UI to paste this automatically.

---

## API Endpoint

### `POST /analyse`

**Request body:**
```json
{
  "transcript": "Your sales call transcript text here"
}
```

**Success response (`200`):**
```json
{
  "signals": [
    {
      "type": "pricing_concern",
      "quote": "That seems steep.",
      "tip": "Reframe cost as ROI — show the payback period immediately."
    },
    {
      "type": "next_step",
      "quote": "Send me a pricing deck and I'll get back to you.",
      "tip": "Confirm a specific follow-up date when you send the deck."
    }
  ]
}
```

**Error response (`400` / `500`):**
```json
{
  "error": "Transcript is required and must be a non-empty string."
}
```

**Detected signal types:**
- `buying_interest` — Prospect shows genuine interest
- `objection` — Explicit pushback or concern
- `confusion` — Prospect unclear on something
- `pricing_concern` — Reacting negatively to cost
- `competitor_mention` — References another tool or vendor
- `next_step` — Agreement to move forward in some way
- `hesitation` — Uncertainty without explicit objection

### `GET /health`

Returns `{ "status": "ok" }` — useful for confirming the backend is running.

---

## Notes on JSON-Only LLM Output

The backend system prompt explicitly instructs the model:

> *"Return ONLY valid JSON. Do not include markdown, explanations, or extra text."*

The response is also stripped of any accidental markdown fences (` ```json `) before parsing. A `try/catch` block handles any case where the model returns malformed JSON — returning a clear `502` error rather than crashing.

Temperature is set to `0.2` to keep output consistent and structured.

---

## Demo Mode

If `OPENAI_API_KEY` is not set, the backend returns a hardcoded mock response and sets `_mock: true` in the JSON. The frontend displays a yellow **"Demo mode"** badge to inform the viewer.

---

Built for the **NimitAI Intern Assignment** by [Your Name].
