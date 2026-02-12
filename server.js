require("dotenv").config();
const express = require("express");
const path = require("path");
const OpenAI = require("openai");

const app = express();
const PORT = process.env.PORT || 3000;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
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
    });

    const botReply = completion.choices[0].message.content;

    res.json({ reply: botReply });

  } catch (error) {
    console.error("OpenAI Error:", error.message);

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
