import express from "express";
import fetch from "node-fetch";

const app = express();

/* REQUIRED: parse JSON body */
app.use(express.json());

/* ---------------- GEMINI CALL ---------------- */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const response = await fetch(
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=" + apiKey,
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
    const errText = await response.text();
    console.error("Gemini API error:", errText);
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
      return res.status(400).json({ output: "Invalid action or text" });
    }

    let prompt = "";

    if (action === "title") {
      prompt = `Generate a professional resume title for the following profile:\n${text}`;
    } else if (action === "summary") {
      prompt = `Write a professional resume summary for the following profile:\n${text}`;
    } else if (action === "skills") {
      prompt = `List professional resume skills for the following profile:\n${text}`;
    } else {
      return res.status(400).json({ output: "Invalid action" });
    }

    const aiText = await callGemini(prompt);

    res.json({
      output: aiText || "AI generated no text. Please retry."
    });
  } catch (err) {
    console.error("RUN-AI ERROR:", err);
    res.status(500).json({ output: "AI service error" });
  }
});

/* ---------------- HEALTH CHECK ---------------- */
app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

/* ---------------- START SERVER ---------------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
