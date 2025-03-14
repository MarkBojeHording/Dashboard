import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer";
import NodeCache from "node-cache";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5002;
const weatherCache = new NodeCache({ stdTTL: 300 }); // Cache for 5 minutes
const aqiCache = new NodeCache({ stdTTL: 300 }); // Cache for air quality data

// Log API keys for debugging
console.log("🔑 OPENWEATHER_API_KEY:", process.env.OPENWEATHER_API_KEY);
console.log("🔑 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "Set" : "Missing");
console.log("🔑 PEXELS_API_KEY:", process.env.PEXELS_API_KEY ? "Set" : "Missing");

// Allow requests from both origins
app.use(cors({
    origin: ["http://localhost:8000", "http://127.0.0.1:5501"],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type"]
}));
app.use(express.json());

// Configure Multer for Image Uploads
const upload = multer({ storage: multer.memoryStorage() });

const openaiApiKey = process.env.OPENAI_API_KEY;
const pexelsApiKey = process.env.PEXELS_API_KEY;

// 🌦️ Weather API Route
app.get("/api/weather", async (req, res) => {
    console.log("📥 Received request for /api/weather:", req.query);
    const { lat, lon } = req.query;
    const cacheKey = `weather_${lat}_${lon}`;

    // Check cache first
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData) {
        console.log("✅ Serving weather data from cache");
        return res.json(cachedData);
    }

    let url;
    try {
        if (!process.env.OPENWEATHER_API_KEY) {
            throw new Error("OpenWeatherMap API key is missing in environment variables.");
        }

        if (!lat || !lon) {
            throw new Error("Latitude and longitude are required.");
        }
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(process.env.OPENWEATHER_API_KEY)}&units=metric`;

        console.log(`🌦 Fetching weather from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ OpenWeatherMap Response: ${errorText}`);
            throw new Error(`Weather API Error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log("✅ Weather API Response:", data);

        // Cache the response
        weatherCache.set(cacheKey, data);
        res.json(data);
    } catch (error) {
        console.error("❌ Weather API Error:", error.message);
        res.status(500).json({ error: `Failed to fetch weather data: ${error.message}` });
    }
});

// 🌫 Air Quality API Route
app.get("/api/air-quality", async (req, res) => {
    console.log("📥 Received request for /api/air-quality:", req.query);
    const { lat, lon } = req.query;
    const cacheKey = `aqi_${lat}_${lon}`;

    // Check cache first
    const cachedData = aqiCache.get(cacheKey);
    if (cachedData) {
        console.log("✅ Serving air quality data from cache");
        return res.json(cachedData);
    }

    let url;
    try {
        if (!process.env.OPENWEATHER_API_KEY) {
            throw new Error("OpenWeatherMap API key is missing in environment variables.");
        }

        if (!lat || !lon) {
            throw new Error("Latitude and longitude are required.");
        }
        url = `http://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${encodeURIComponent(process.env.OPENWEATHER_API_KEY)}`;

        console.log(`🌫 Fetching air quality from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ OpenWeatherMap AQI Response: ${errorText}`);
            throw new Error(`Air Quality API Error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log("✅ Air Quality API Response:", data);

        // Cache the response
        aqiCache.set(cacheKey, data);
        res.json(data);
    } catch (error) {
        console.error("❌ Air Quality API Error:", error.message);
        res.status(500).json({ error: `Failed to fetch air quality data: ${error.message}` });
    }
});

// 🤖 Chatbot API Route
app.post("/chat", async (req, res) => {
    console.log("📥 Received request for /chat:", req.body);
    const { message } = req.body;

    if (!openaiApiKey) {
        return res.status(500).json({ error: "OpenAI API key is missing." });
    }

    const isImageRequest = /\b(show|display|see|generate|create).+(image|picture|photo|drawing|illustration)\b/i.test(message);

    try {
        if (isImageRequest) {
            const prompt = message.replace(/\b(show|display|see|generate|create)\b/gi, "").trim();
            console.log(`🖼 Generating image for: ${prompt}`);

            const response = await fetch("https://api.openai.com/v1/images/generations", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                    prompt: prompt,
                    n: 1,
                    size: "1024x1024"
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI Image API Error: ${response.statusText}`);
            }

            const data = await response.json();
            console.log("✅ OpenAI Image API Response:", data);

            if (!data || !data.data || data.data.length === 0) {
                return res.status(500).json({ error: "⚠️ No image returned from OpenAI API." });
            }

            return res.json({ reply: "Here is your image:", imageUrl: data.data[0].url });
        } else {
            const response = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${openaiApiKey}`
                },
                body: JSON.stringify({
                    model: "gpt-3.5-turbo",
                    messages: [{ role: "user", content: message }]
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API Error: ${response.statusText}`);
            }

            const data = await response.json();
            return res.json({ reply: data.choices[0].message.content });
        }
    } catch (error) {
        console.error("❌ OpenAI API Error:", error);
        res.status(500).json({ error: "Failed to fetch response from OpenAI API." });
    }
});

// 🌿 API Route to Fetch a Random Nature Image from Pexels
app.get("/api/pexels", async (req, res) => {
    console.log("📥 Received request for /api/pexels");
    try {
        const randomPage = Math.floor(Math.random() * 50) + 1;
        const PEXELS_URL = `https://api.pexels.com/v1/search?query=nature&per_page=1&page=${randomPage}`;

        const response = await fetch(PEXELS_URL, {
            headers: { Authorization: pexelsApiKey }
        });

        if (!response.ok) throw new Error(`❌ Pexels API Error: ${response.statusText}`);

        const data = await response.json();
        if (data.photos.length > 0) {
            res.json({ imageUrl: data.photos[0].src.original });
        } else {
            res.status(404).json({ error: "No images found." });
        }
    } catch (error) {
        console.error("❌ Error fetching image from Pexels:", error);
        res.status(500).json({ error: "Failed to fetch image from Pexels" });
    }
});

// 🚀 Start Server
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
