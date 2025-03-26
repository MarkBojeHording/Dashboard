// 🛠️ Required Packages
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer";
import NodeCache from "node-cache";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5002;
const weatherCache = new NodeCache({ stdTTL: 600 });
const aqiCache = new NodeCache({ stdTTL: 600 });

// ✅ CORS Configuration with Dynamic Origin Check
const allowedOrigins = [
  "http://localhost:8000",
  "http://127.0.0.1:5501",
  "http://localhost:5501",
  "https://dashboard-d2i9.onrender.com"
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`❌ CORS blocked for origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    }
  },
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

app.use(express.json());
const upload = multer({ storage: multer.memoryStorage() });

// ✅ Environment Validation
const requiredEnvVars = ["OPENWEATHER_API_KEY", "OPENAI_API_KEY", "PEXELS_API_KEY"];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
  console.error(`❌ Missing required environment variables: ${missingEnvVars.join(", ")}`);
  process.exit(1);
}

const openaiApiKey = process.env.OPENAI_API_KEY;
const pexelsApiKey = process.env.PEXELS_API_KEY;

// ✅ Health Check
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "OK",
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development",
    requiredEnvVars: requiredEnvVars.reduce((acc, varName) => {
      acc[varName] = process.env[varName] ? "Set" : "Missing";
      return acc;
    }, {})
  });
});

// ✅ Weather API
app.get("/api/weather", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "Latitude and longitude are required." });

  const cacheKey = `weather_${lat}_${lon}`;
  const cachedData = weatherCache.get(cacheKey);
  if (cachedData) return res.status(200).json(cachedData);

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(process.env.OPENWEATHER_API_KEY)}&units=metric`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API Error: ${response.status} - ${await response.text()}`);
    const data = await response.json();
    weatherCache.set(cacheKey, data);
    res.status(200).json(data);
  } catch (error) {
    console.error(`❌ Weather Error: ${error.message}`);
    res.status(500).json({ error: `Failed to fetch weather data: ${error.message}` });
  }
});

// ✅ Air Quality API
app.get("/api/air-quality", async (req, res) => {
  const { lat, lon } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: "Latitude and longitude are required." });

  const cacheKey = `aqi_${lat}_${lon}`;
  const cachedData = aqiCache.get(cacheKey);
  if (cachedData) return res.status(200).json(cachedData);

  try {
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(process.env.OPENWEATHER_API_KEY)}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Air Quality API Error: ${response.status} - ${await response.text()}`);
    const data = await response.json();
    aqiCache.set(cacheKey, data);
    res.status(200).json(data);
  } catch (error) {
    console.error(`❌ AQI Error: ${error.message}`);
    res.status(500).json({ error: `Failed to fetch air quality data: ${error.message}` });
  }
});

// ✅ Chat API
app.post("/chat", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required." });
  if (!openaiApiKey) return res.status(500).json({ error: "OpenAI API key is missing." });

  const isImageRequest = /\b(show|display|see|generate|create).+(image|picture|photo|drawing|illustration)\b/i.test(message);

  try {
    if (isImageRequest) {
      const prompt = message.replace(/\b(show|display|see|generate|create)\b/gi, "").trim();
      const response = await fetch("https://api.openai.com/v1/images/generations", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiApiKey}` },
        body: JSON.stringify({ prompt, n: 1, size: "1024x1024" })
      });
      if (!response.ok) throw new Error(`OpenAI Image API Error: ${response.status} - ${await response.text()}`);
      const data = await response.json();
      res.status(200).json({ reply: "Here is your image:", imageUrl: data.data[0].url });
    } else {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${openaiApiKey}` },
        body: JSON.stringify({ model: "gpt-3.5-turbo", messages: [{ role: "user", content: message }] })
      });
      if (!response.ok) throw new Error(`OpenAI API Error: ${response.status} - ${await response.text()}`);
      const data = await response.json();
      res.status(200).json({ reply: data.choices[0].message.content });
    }
  } catch (error) {
    console.error(`❌ Chat Error: ${error.message}`);
    res.status(500).json({ error: `Failed to fetch response from OpenAI API: ${error.message}` });
  }
});

// ✅ Pexels Image API
app.get("/api/pexels", async (req, res) => {
  try {
    if (!pexelsApiKey) throw new Error("Pexels API key is missing");
    const randomPage = Math.floor(Math.random() * 50) + 1;
    const url = `https://api.pexels.com/v1/search?query=nature&per_page=1&page=${randomPage}`;
    const response = await fetch(url, { headers: { Authorization: pexelsApiKey } });
    if (!response.ok) throw new Error(`Pexels API Error: ${response.status} - ${await response.text()}`);
    const data = await response.json();
    if (data.photos?.length > 0) {
      res.status(200).json({ imageUrl: data.photos[0].src.original });
    } else {
      res.status(404).json({ error: "No images found." });
    }
  } catch (error) {
    console.error(`❌ Pexels Error: ${error.message}`);
    res.status(500).json({ error: `Failed to fetch image from Pexels: ${error.message}` });
  }
});

// ✅ Start Server
app.listen(PORT, () => {
  console.log(`🌍 Server running on port ${PORT}`);
});

app.get("/", (req, res) => {
  res.send("✅ Server is live. Try /api/weather or /health");
});
