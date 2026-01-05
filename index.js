import express from "express";
import fetch from "node-fetch";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" }));
app.use(express.json());

/* Health check */
app.get("/", (req, res) => {
  res.json({ status: "OK" });
});

/* POST /run-ai */
app.post("/run-ai", async (req, res) => {
  try {
    const { action, text } = req.body;

    if (!action || !["title", "summary", "skills"].includes(action)) {
      return res.status(400).json({ output: "Invalid action" });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY not set");
    }

    let prompt = "";
    if (action === "title") {
      prompt = `Generate a professional resume title for: ${text}`;
    }
    if (action === "summary") {
      prompt = `Write a concise professional summary for: ${text}`;
    }
    if (action === "skills") {
      prompt = `List relevant resume skills for: ${text}`;
    }

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
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

    const data = await response.json();

    if (!response.ok) {
      console.error("Gemini RAW ERROR:", data);
      throw new Error("Gemini API failed");
    }

    const output =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ||
      "AI generated no text";

    res.json({ output });

  } catch (err) {
    console.error("RUN-AI ERROR:", err);
    res.status(500).json({ output: "AI service error" });
  }
});

/* Start server */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
