import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* --------------------------------------------------
   CORS CONFIG — FINAL & VERIFIED
-------------------------------------------------- */
app.use(
  cors({
    origin: "https://www.dealconnect.store",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);

/* Handle browser preflight requests */
app.options("*", cors());

/* Parse JSON bodies */
app.use(express.json());

/* --------------------------------------------------
   HEALTH CHECK (Cloud Run)
-------------------------------------------------- */
app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

/* --------------------------------------------------
   GEMINI HELPER
-------------------------------------------------- */
async function callGemini(prompt) {
  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" +
      GEMINI_API_KEY,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }]
          }
        ]
      })
    }
  );

  if (!response.ok) {
    const err = await response.text();
    console.error("Gemini API Error:", err);
    throw new Error("Gemini API failed");
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/* --------------------------------------------------
   AI ENDPOINT
-------------------------------------------------- */
app.post("/run-ai", async (req, res) => {
  try {
    const { action, text } = req.body;

    if (!action || !text) {
      return res.status(400).json({
        output: "Missing required fields: action or text"
      });
    }

    let prompt = "";

    switch (action) {
      case "title":
        prompt = `Generate a professional resume title for the following profile:\n${text}`;
        break;

      case "summary":
        prompt = `Write a concise, ATS-friendly professional resume summary for:\n${text}`;
        break;

      case "skills":
        prompt = `Generate ATS-optimized resume skills (comma separated) for:\n${text}`;
        break;

      default:
        return res.status(400).json({ output: "Invalid action" });
    }

    const aiText = await callGemini(prompt);
    res.json({ output: aiText });
  } catch (error) {
    console.error("AI Error:", error);
    res.status(500).json({ output: "AI service error" });
  }
});

/* --------------------------------------------------
   START SERVER (REQUIRED FOR CLOUD RUN)
-------------------------------------------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
