import express from "express";
import cors from "cors";
import fetch from "node-fetch";

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 8080;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

app.post("/", async (req, res) => {
  try {
    const { action, text } = req.body;

    if (!action) {
      return res.json({ output: "Invalid action" });
    }

    let prompt = "";

    if (action === "title") {
      prompt = "Generate a professional resume title for a fresher.";
    } else if (action === "summary") {
      prompt = `Write a professional resume summary for: ${text || "a fresher"}`;
    } else if (action === "skills") {
      prompt = "List key resume skills for a fresher.";
    } else {
      return res.json({ output: "Invalid action" });
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }]
        })
      }
    );

    const data = await response.json();
    const output =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI generated no text. Please retry.";

    res.json({ output });

  } catch (err) {
    console.error(err);
    res.status(500).json({ output: "AI service error" });
  }
});

app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
