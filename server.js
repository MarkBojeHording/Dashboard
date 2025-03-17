import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer";
import NodeCache from "node-cache";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5002; // Render will override PORT if needed
const weatherCache = new NodeCache({ stdTTL: 600 }); // Cache for 10 minutes
const aqiCache = new NodeCache({ stdTTL: 600 }); // Cache for air quality data

// Log API keys for debugging (masked in production)
console.log("🔑 OPENWEATHER_API_KEY:", process.env.OPENWEATHER_API_KEY ? "Set" : "Missing");
console.log("🔑 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "Set" : "Missing");
console.log("🔑 PEXELS_API_KEY:", process.env.PEXELS_API_KEY ? "Set" : "Missing");

// Allow requests from a broader range of origins, including Netlify
app.use(cors({
    origin: (origin, callback) => {
        const allowedOrigins = [
            "http://localhost:8000",
            "http://127.0.0.1:5501",
            /\.netlify\.app$/ // Matches any .netlify.app domain
        ];
        if (!origin || allowedOrigins.some(allowed => allowed.test ? allowed.test(origin) : allowed === origin)) {
            callback(null, true);
        } else {
            callback(new Error(`CORS policy blocked request from ${origin}`));
        }
    },
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Configure Multer for Image Uploads (though not currently used in your routes)
const upload = multer({ storage: multer.memoryStorage() });

const openaiApiKey = process.env.OPENAI_API_KEY;
const pexelsApiKey = process.env.PEXELS_API_KEY;

// 🌦️ Weather API Route
app.get("/api/weather", async (req, res) => {
    console.log("📥 Received request for /api/weather:", req.query);
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    const cacheKey = `weather_${lat}_${lon}`;
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData) {
        console.log("✅ Serving weather data from cache");
        return res.json(cachedData);
    }

    try {
        if (!process.env.OPENWEATHER_API_KEY) {
            throw new Error("OpenWeatherMap API key is missing in environment variables.");
        }

        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(process.env.OPENWEATHER_API_KEY)}&units=metric`;
        console.log(`🌦 Fetching weather from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ OpenWeatherMap Response: ${errorText}`);
            throw new Error(`Weather API Error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log("✅ Weather API Response:", data);

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

    if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    const cacheKey = `aqi_${lat}_${lon}`;
    const cachedData = aqiCache.get(cacheKey);
    if (cachedData) {
        console.log("✅ Serving air quality data from cache");
        return res.json(cachedData);
    }

    try {
        if (!process.env.OPENWEATHER_API_KEY) {
            throw new Error("OpenWeatherMap API key is missing in environment variables.");
        }

        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(process.env.OPENWEATHER_API_KEY)}`;
        console.log(`🌫 Fetching air quality from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`❌ OpenWeatherMap AQI Response: ${errorText}`);
            throw new Error(`Air Quality API Error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log("✅ Air Quality API Response:", data);

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
    const { message } = req.body || {};

    if (!message) {
        return res.status(400).json({ error: "Message is required." });
    }

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
        res.status(500).json({ error: `Failed to fetch response from OpenAI API: ${error.message}` });
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

        if (!response.ok) {
            throw new Error(`❌ Pexels API Error: ${response.statusText}`);
        }

        const data = await response.json();
        if (data.photos && data.photos.length > 0) {
            res.json({ imageUrl: data.photos[0].src.original });
        } else {
            res.status(404).json({ error: "No images found." });
        }
    } catch (error) {
        console.error("❌ Error fetching image from Pexels:", error);
        res.status(500).json({ error: `Failed to fetch image from Pexels: ${error.message}` });
    }
});

// 🚀 Start Server
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
