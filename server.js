import express from "express";
import cors from "cors";

const app = express();
app.use(cors({ origin: "*" })); // Teri saari website ko allow karega
app.use(express.json());

// Groq ke liye
app.post("/api/groq", async (req, res) => {
  const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
    },
    body: JSON.stringify(req.body)
  });
  const data = await r.json();
  res.json(data);
});

// Gemini ke liye
app.post("/api/gemini", async (req, res) => {
  const { prompt } = req.body;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  const data = await r.json();
  res.json(data);
});

app.get("/", (req, res) => res.send("Fixoraa Universal Backend is Live"));

app.listen(10000, () => console.log("Running"));
