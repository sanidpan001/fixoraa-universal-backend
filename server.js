import express from "express";
import cors from "cors";
import rateLimit from "express-rate-limit";

const app = express();

// Sirf apni website + saare subdomains allow karo (abuse rokne ke liye)
app.use(cors({
  origin: [
    "https://fixoraa.tech",
    /\.fixoraa\.tech$/ // saare subdomains (tool1.fixoraa.tech, tool2.fixoraa.tech, etc.)
  ]
}));

app.use(express.json());

// Rate limiting — API key ka misuse/abuse rokne ke liye
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,             // per IP max 30 requests/minute
  message: { error: "Too many requests, thoda ruk ke try karo." }
});
app.use(limiter);

// ---------- Groq ----------
app.post("/api/groq", async (req, res) => {
  try {
    const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`
      },
      body: JSON.stringify(req.body)
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    console.error("Groq error:", err);
    res.status(500).json({ error: "Groq request failed" });
  }
});

// ---------- Gemini ----------
app.post("/api/gemini", async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt) {
      return res.status(400).json({ error: "prompt field zaroori hai" });
    }

    const r = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
      }
    );
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (err) {
    console.error("Gemini error:", err);
    res.status(500).json({ error: "Gemini request failed" });
  }
});

app.get("/", (req, res) => res.send("Fixoraa Universal Backend is Live"));

// Render khud PORT deta hai — isse hardcode mat karo
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => console.log(`Running on port ${PORT}`));
