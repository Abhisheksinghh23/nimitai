require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
const router = express.Router();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ── Mock fallback for demo/testing when no API key is set ──────────────────
const MOCK_RESPONSE = {
  signals: [
    {
      type: "pricing_concern",
      quote: "That seems steep.",
      tip: "Reframe cost as ROI — show the payback period immediately.",
    },
    {
      type: "competitor_mention",
      quote: "We pay under $200 currently.",
      tip: "Ask what's included at that price and highlight your differentiators.",
    },
    {
      type: "next_step",
      quote: "Send me a pricing deck and I'll get back to you.",
      tip: "Confirm a specific follow-up date when you send the deck.",
    },
  ],
};

// ── System prompt for the LLM ──────────────────────────────────────────────
const SYSTEM_PROMPT = `You are a sales call analyst. Analyze the meeting transcript and identify important sales signals. Return ONLY valid JSON. Do not include markdown, explanations, or extra text.`;

// ── User prompt builder ────────────────────────────────────────────────────
function buildUserPrompt(transcript) {
  return `Analyze the following sales meeting transcript and identify signals of these types:
- buying_interest
- objection
- confusion
- pricing_concern
- competitor_mention
- next_step
- hesitation

For each signal found, return:
- "type": one of the signal types above
- "quote": the exact sentence or phrase from the transcript that indicates the signal
- "tip": a one-line coaching tip for the sales rep on how to respond

Return ONLY this JSON structure with no markdown, no explanation, no extra text:
{
  "signals": [
    {
      "type": "string",
      "quote": "string",
      "tip": "string"
    }
  ]
}

Transcript:
${transcript}`;
}

function parseAiJson(rawContent) {
  const cleaned = String(rawContent || "").replace(/```json|```/gi, "").trim();
  return JSON.parse(cleaned);
}

async function callOpenAI(transcript) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(transcript) },
      ],
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    const message = data?.error?.message || `OpenAI request failed with status ${response.status}`;
    throw new Error(message);
  }

  const rawContent = data?.choices?.[0]?.message?.content || "";
  return parseAiJson(rawContent);
}

async function callGemini(transcript) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured.");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: SYSTEM_PROMPT,
  });

  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: buildUserPrompt(transcript) }] }],
    generationConfig: { temperature: 0.2 },
  });

  const rawContent = result.response?.text?.() || "";
  return parseAiJson(rawContent);
}

// ── POST /analyse ──────────────────────────────────────────────────────────
router.post("/analyse", async (req, res) => {
  const { transcript } = req.body;

  // Validate input
  if (!transcript || typeof transcript !== "string" || transcript.trim() === "") {
    return res.status(400).json({ error: "Transcript is required and must be a non-empty string." });
  }

  try {
    let parsed;

    if (process.env.OPENAI_API_KEY) {
      try {
        parsed = await callOpenAI(transcript);
      } catch (err) {
        console.warn("⚠️  OpenAI request failed — trying Gemini fallback.", err.message);
      }
    }

    if (!parsed && process.env.GEMINI_API_KEY) {
      try {
        parsed = await callGemini(transcript);
      } catch (err) {
        console.warn("⚠️  Gemini request failed — falling back to demo response.", err.message);
      }
    }

    if (!parsed) {
      console.warn("⚠️  No AI API key configured — returning mock response for demo.");
      return res.status(200).json({
        ...MOCK_RESPONSE,
        _mock: true,
        warning: "Demo mode: add OPENAI_API_KEY or GEMINI_API_KEY to enable real analysis.",
      });
    }

    // Ensure the expected shape exists
    if (!Array.isArray(parsed?.signals)) {
      return res.status(502).json({
        error: "AI response was missing the expected `signals` array.",
        raw: rawContent,
      });
    }

    return res.status(200).json(parsed);
  } catch (err) {
    const message = err?.message || "Unknown AI error";
    const shouldFallback = /401|403|404|429|5\d\d|incorrect api key|authentication|unauthorized|high demand|temporarily|service unavailable|failed to fetch|network|timeout/i.test(message);

    if (shouldFallback) {
      console.warn("⚠️  AI request failed — falling back to mock response for demo.");
      return res.status(200).json({
        ...MOCK_RESPONSE,
        _mock: true,
        warning: "Demo mode: AI request failed; showing mock signals.",
      });
    }

    console.error("AI API error:", message);
    return res.status(500).json({ error: `AI API error: ${message}` });
  }
});

// ── Health check ───────────────────────────────────────────────────────────
router.get("/health", (_, res) => res.json({ status: "ok" }));

app.use(router);
app.use("/api", router);

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`✅ Backend running at http://localhost:${PORT}`);
    if (!process.env.GEMINI_API_KEY && !process.env.OPENAI_API_KEY) {
      console.log("⚠️  No Gemini/OpenAI API key found — mock mode active.");
    }
  });
}

module.exports = app;
