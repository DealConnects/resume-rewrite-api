import express from "express";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

/* ---------------- CORS ---------------- */
app.use(
  cors({
    origin: "https://www.dealconnect.store",
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type"]
  })
);
app.options("*", cors());

/* ---------------- MIDDLEWARE ---------------- */
app.use(express.json());

/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

/* ---------------- GEMINI CALL ---------------- */
async function callGemini(prompt) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
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
    console.error("Gemini error:", err);
    throw new Error("Gemini API failed");
  }

  const data = await response.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/* ---------------- AI ENDPOINT ---------------- */
app.post("/run-ai", async (req, res) => {
  try {
    const { action, text } = req.body;

    if (!action || !text) {
      return res.status(400).json({ output: "Missing action or text" });
    }

    let prompt = "";

    if (action === "title") {
      prompt = `Generate a professional resume title for:\n${text}`;
    } else if (action === "summary") {
      prompt = `Write a concise ATS-friendly resume summary for:\n${text}`;
    } else if (action === "skills") {
      prompt = `Generate ATS-optimized resume skills (comma separated) for:\n${text}`;
    } else {
      return res.status(400).json({ output: "Invalid action" });
    }

    const result = await callGemini(prompt);
    res.json({ output: result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ output: "AI service error" });
  }
});

/* ---------------- START SERVER ---------------- */
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
