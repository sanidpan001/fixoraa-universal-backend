import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();

app.use(cors({
  origin: [
    "https://fixoraa.tech",
    /\.fixoraa\.tech$/,
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:5500"
  ]
}));

app.use(express.json({ limit: "1mb" }));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,   // 30 se badha diya
  message: { error: "Too many requests, thoda ruk ke try karo." }
});
app.use(limiter);

function withTimeout(ms = 55000) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, done: () => clearTimeout(t) };
}

app.post("/api/groq", async (req, res) => {
  const { signal, done } = withTimeout();
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify({ ...req.body, stream: false }),
      signal
    });
    done();
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    done();
    console.error("Groq error:", err?.message);
    if (err?.name === "AbortError") {
      return res.status(504).json({ error: "AI took too long, please try again." });
    }
    res.status(500).json({ error: "Groq request failed" });
  }
});

app.post("/api/gemini", async (req, res) => {
  const { signal, done } = withTimeout();
  try {
    const { prompt } = req.body;
    if (!prompt) { done(); return res.status(400).json({ error: "prompt field zaroori hai" }); }
    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
        signal
      }
    );
    done();
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    done();
    console.error("Gemini error:", err?.message);
    if (err?.name === "AbortError") {
      return res.status(504).json({ error: "AI took too long, please try again." });
    }
    res.status(500).json({ error: "Gemini request failed" });
  }
});

app.get("/", (req, res) => res.send("Fixoraa Universal Backend is Live"));
app.get("/health", (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
