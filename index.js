import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();

/* ---------- BASIC MIDDLEWARE ---------- */
app.use(express.json());

app.use(
  cors({
    origin: "https://www.dealconnect.store",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"],
  })
);

/* ---------- HEALTH CHECK ---------- */
app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

/* ---------- GEMINI CALL (PRODUCTION SAFE) ---------- */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: prompt }],
          },
        ],
      }),
    }
  );

  const text = await response.text();

  if (!response.ok) {
    console.error("Gemini raw error:", text);
    throw new Error("Gemini API failed");
  }

  const data = JSON.parse(text);
  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/* ---------- MAIN AI ENDPOINT ---------- */
app.post("/run-ai", async (req, res) => {
  try {
    const { action, text } = req.body;

    if (!action) {
      return res.status(400).json({ output: "Invalid action" });
    }

    let prompt = "";

    if (action === "title") {
      prompt = `Generate a professional resume title for: ${text || "a fresher candidate"}`;
    } else if (action === "summary") {
      prompt = `Write a professional resume summary for: ${text || "a fresher candidate"}`;
    } else if (action === "skills") {
      prompt = `List resume-ready skills for: ${text || "a fresher candidate"}`;
    } else {
      return res.status(400).json({ output: "Invalid action" });
    }

    const result = await callGemini(prompt);

    if (!result) {
      return res.json({ output: "AI generated no text. Please retry." });
    }

    res.json({ output: result });
  } catch (err) {
    console.error("RUN-AI ERROR:", err);
    res.status(500).json({ output: "AI service error" });
  }
});

/* ---------- SERVER START ---------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
