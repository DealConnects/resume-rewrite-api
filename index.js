import express from "express";
import cors from "cors";

const app = express();

/* ---- Middleware ---- */
app.use(cors({ origin: "*" }));
app.use(express.json());

/* ---- Health check ---- */
app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

/* ---- Gemini call ---- */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const url =
    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
    apiKey;

  const response = await fetch(url, {
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
  });

  const data = await response.json();

  if (!response.ok) {
    console.error("Gemini API ERROR:", data);
    throw new Error("Gemini API failed");
  }

  return data.candidates?.[0]?.content?.parts?.[0]?.text || "";
}

/* ---- AI endpoint ---- */
app.post("/run-ai", async (req, res) => {
  try {
    const { action, text } = req.body;

    if (!action || !text) {
      return res.status(400).json({ output: "Invalid input" });
    }

    let prompt;

    switch (action) {
      case "title":
        prompt = `Suggest a professional resume title for: ${text}`;
        break;
      case "summary":
        prompt = `Write a concise professional resume summary for: ${text}`;
        break;
      case "skills":
        prompt = `List 6 relevant professional skills for: ${text}`;
        break;
      default:
        return res.status(400).json({ output: "Invalid action" });
    }

    const aiText = await callGemini(prompt);
    res.json({ output: aiText });

  } catch (err) {
    console.error("RUN-AI ERROR:", err);
    res.status(500).json({ output: "AI service error" });
  }
});

/* ---- Start server ---- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
