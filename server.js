require("dotenv").config({ quiet: true });
const express = require("express");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Health check route
app.get("/health", (req, res) => {
  res.json({ status: "OK", message: "Anish AI running." });
});

app.post("/chat", async (req, res) => {
  try {
    const userMessage = req.body.message;

    if (!userMessage || userMessage.trim() === "") {
      return res.status(400).json({ reply: "Message cannot be empty." });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const baseURL = process.env.GEMINI_BASE_URL || "https://generativelanguage.googleapis.com/v1beta/openai/";
    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const response = await fetch(`${baseURL}chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: "You are Anish AI, a smart, friendly and helpful assistant."
          },
          {
            role: "user",
            content: userMessage
          }
        ],
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", response.status, errorText);
      return res.status(500).json({
        reply: "Anish AI is thinking...try again!"
      });
    }

    const completion = await response.json();
    const botReply = completion.choices[0].message.content;

    res.json({ reply: botReply });

  } catch (error) {
    console.error("Chat Error:", error.message);

    res.status(500).json({
      reply: "Anish AI is thinking...try again!"
    });
  }
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ message: "Route not found" });
});

function startServer() {
  return app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer();
}

module.exports = { startServer };