import express from "express";
import cors from "cors";

const app = express();

/* ---------- MIDDLEWARE ---------- */
app.use(cors({
  origin: "https://www.dealconnect.store",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

/* ---------- HEALTH CHECK ---------- */
app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

/* ---------- GEMINI CALL ---------- */
async function callGemini(prompt) {
  const API_KEY = process.env.GEMINI_API_KEY;
  if (!API_KEY) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const url =
    "https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=" +
    API_KEY;

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          parts: [{ text: prompt }]
        }
      ]
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("Gemini API error:", errText);
    throw new Error("Gemini API failed");
  }

  const data = await response.json();
  return (
    data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || ""
  );
}

/* ---------- AI ENDPOINT ---------- */
app.post("/run-ai", async (req, res) => {
  try {
    const { action, text } = req.body;

    if (!action || !text) {
      return res.status(400).json({ output: "Invalid input" });
    }

    let prompt = "";

    if (action === "title") {
      prompt = `Suggest a professional resume title for: ${text}`;
    } else if (action === "summary") {
      prompt = `Write a professional resume summary for: ${text}`;
    } else if (action === "skills") {
      prompt = `List key resume skills for: ${text}`;
    } else {
      return res.status(400).json({ output: "Invalid action" });
    }

    const aiText = await callGemini(prompt);

    if (!aiText) {
      return res.json({ output: "AI generated no text. Please retry." });
    }

    res.json({ output: aiText });
  } catch (err) {
    console.error("RUN-AI ERROR:", err);
    res.status(500).json({ output: "AI service error" });
  }
});

/* ---------- START SERVER ---------- */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
