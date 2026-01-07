import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();

app.use(cors({ origin: "*" }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

async function callGemini(prompt) {
  if (!process.env.GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY not set");
  }

  const url =
    "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-001:generateContent" +
    "?key=" +
    process.env.GEMINI_API_KEY;

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

app.post("/run-ai", async (req, res) => {
  try {
    const { action, text } = req.body;

    if (!action || !text) {
      return res.json({ output: "Invalid input" });
    }

    let prompt = "";

    if (action === "title") {
      prompt = `Suggest a professional resume title for: ${text}`;
    } else if (action === "summary") {
      prompt = `Write a concise professional resume summary for: ${text}`;
    } else if (action === "skills") {
      prompt = `List 6 professional resume skills for: ${text}`;
    } else {
      return res.json({ output: "Invalid action" });
    }

    const aiText = await callGemini(prompt);
    res.json({ output: aiText });

  } catch (err) {
    console.error("RUN-AI ERROR:", err);
    res.status(500).json({ output: "AI service error" });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
