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

// Validate required environment variables
const requiredEnvVars = ["OPENWEATHER_API_KEY", "OPENAI_API_KEY", "PEXELS_API_KEY"];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);
if (missingEnvVars.length > 0) {
    console.error(`❌ Missing required environment variables: ${missingEnvVars.join(", ")}`);
    process.exit(1); // Exit the process if required variables are missing
}

// Log API keys for debugging (masked in production)
console.log("🔑 OPENWEATHER_API_KEY:", process.env.OPENWEATHER_API_KEY ? "Set" : "Missing");
console.log("🔑 OPENAI_API_KEY:", process.env.OPENAI_API_KEY ? "Set" : "Missing");
console.log("🔑 PEXELS_API_KEY:", process.env.PEXELS_API_KEY ? "Set" : "Missing");

// Allow requests from local development and the Render domain
app.use(cors({
    origin: [
        "http://localhost:8000",
        "http://127.0.0.1:5501",
        "https://dashboard-d2i9.onrender.com" // Allow the Render domain
    ],
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-Type", "Authorization"]
}));
app.use(express.json());

// Configure Multer for Image Uploads (though not currently used in your routes)
const upload = multer({ storage: multer.memoryStorage() });

const openaiApiKey = process.env.OPENAI_API_KEY;
const pexelsApiKey = process.env.PEXELS_API_KEY;

// Health Check Endpoint
app.get("/health", (req, res) => {
    const healthStatus = {
        status: "OK",
        uptime: process.uptime(),
        environment: process.env.NODE_ENV || "development",
        requiredEnvVars: requiredEnvVars.reduce((acc, varName) => {
            acc[varName] = process.env[varName] ? "Set" : "Missing";
            return acc;
        }, {})
    };
    res.status(200).json(healthStatus);
});

// 🌦️ Weather API Route
app.get("/api/weather", async (req, res) => {
    console.log("📥 [Weather] Request received:", req.query);
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        console.warn("⚠️ [Weather] Missing lat or lon parameters");
        return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    const cacheKey = `weather_${lat}_${lon}`;
    const cachedData = weatherCache.get(cacheKey);
    if (cachedData) {
        console.log("✅ [Weather] Serving data from cache");
        return res.status(200).json(cachedData);
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/weather?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(process.env.OPENWEATHER_API_KEY)}&units=metric`;
        console.log(`🌦 [Weather] Fetching data from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [Weather] OpenWeatherMap Response: ${errorText}`);
            throw new Error(`Weather API Error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log("✅ [Weather] API Response:", JSON.stringify(data, null, 2));

        weatherCache.set(cacheKey, data);
        res.status(200).json(data);
    } catch (error) {
        console.error(`❌ [Weather] Error: ${error.message}`);
        res.status(500).json({ error: `Failed to fetch weather data: ${error.message}` });
    }
});

// 🌫 Air Quality API Route
app.get("/api/air-quality", async (req, res) => {
    console.log("📥 [Air Quality] Request received:", req.query);
    const { lat, lon } = req.query;

    if (!lat || !lon) {
        console.warn("⚠️ [Air Quality] Missing lat or lon parameters");
        return res.status(400).json({ error: "Latitude and longitude are required." });
    }

    const cacheKey = `aqi_${lat}_${lon}`;
    const cachedData = aqiCache.get(cacheKey);
    if (cachedData) {
        console.log("✅ [Air Quality] Serving data from cache");
        return res.status(200).json(cachedData);
    }

    try {
        const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&appid=${encodeURIComponent(process.env.OPENWEATHER_API_KEY)}`;
        console.log(`🌫 [Air Quality] Fetching data from: ${url}`);
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [Air Quality] OpenWeatherMap AQI Response: ${errorText}`);
            throw new Error(`Air Quality API Error: ${response.status} - ${errorText}`);
        }
        const data = await response.json();
        console.log("✅ [Air Quality] API Response:", JSON.stringify(data, null, 2));

        aqiCache.set(cacheKey, data);
        res.status(200).json(data);
    } catch (error) {
        console.error(`❌ [Air Quality] Error: ${error.message}`);
        res.status(500).json({ error: `Failed to fetch air quality data: ${error.message}` });
    }
});

// 🤖 Chatbot API Route
app.post("/chat", async (req, res) => {
    console.log("📥 [Chat] Request received:", req.body);
    const { message } = req.body || {};

    if (!message) {
        console.warn("⚠️ [Chat] Missing message in request body");
        return res.status(400).json({ error: "Message is required." });
    }

    if (!openaiApiKey) {
        console.error("❌ [Chat] OpenAI API key is missing");
        return res.status(500).json({ error: "OpenAI API key is missing." });
    }

    const isImageRequest = /\b(show|display|see|generate|create).+(image|picture|photo|drawing|illustration)\b/i.test(message);

    try {
        if (isImageRequest) {
            const prompt = message.replace(/\b(show|display|see|generate|create)\b/gi, "").trim();
            console.log(`🖼 [Chat] Generating image for prompt: ${prompt}`);

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
                const errorText = await response.text();
                console.error(`❌ [Chat] OpenAI Image API Error: ${errorText}`);
                throw new Error(`OpenAI Image API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log("✅ [Chat] OpenAI Image API Response:", JSON.stringify(data, null, 2));

            if (!data || !data.data || data.data.length === 0) {
                console.warn("⚠️ [Chat] No image returned from OpenAI API");
                return res.status(500).json({ error: "No image returned from OpenAI API." });
            }

            return res.status(200).json({ reply: "Here is your image:", imageUrl: data.data[0].url });
        } else {
            console.log(`💬 [Chat] Processing text request: ${message}`);
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
                const errorText = await response.text();
                console.error(`❌ [Chat] OpenAI API Error: ${errorText}`);
                throw new Error(`OpenAI API Error: ${response.status} - ${errorText}`);
            }

            const data = await response.json();
            console.log("✅ [Chat] OpenAI API Response:", JSON.stringify(data, null, 2));
            return res.status(200).json({ reply: data.choices[0].message.content });
        }
    } catch (error) {
        console.error(`❌ [Chat] Error: ${error.message}`);
        res.status(500).json({ error: `Failed to fetch response from OpenAI API: ${error.message}` });
    }
});

// 🌿 API Route to Fetch a Random Nature Image from Pexels
app.get("/api/pexels", async (req, res) => {
    console.log("📥 [Pexels] Request received");
    try {
        if (!pexelsApiKey) {
            console.error("❌ [Pexels] Pexels API key is missing");
            throw new Error("Pexels API key is missing in environment variables.");
        }

        const randomPage = Math.floor(Math.random() * 50) + 1;
        const PEXELS_URL = `https://api.pexels.com/v1/search?query=nature&per_page=1&page=${randomPage}`;

        console.log(`📸 [Pexels] Fetching image from: ${PEXELS_URL}`);
        const response = await fetch(PEXELS_URL, {
            headers: { Authorization: pexelsApiKey }
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [Pexels] Pexels API Error: ${errorText}`);
            throw new Error(`Pexels API Error: ${response.status} - ${errorText}`);
        }

        const data = await response.json();
        console.log("✅ [Pexels] API Response:", JSON.stringify(data, null, 2));

        if (data.photos && data.photos.length > 0) {
            res.status(200).json({ imageUrl: data.photos[0].src.original });
        } else {
            console.warn("⚠️ [Pexels] No images found");
            res.status(404).json({ error: "No images found." });
        }
    } catch (error) {
        console.error(`❌ [Pexels] Error: ${error.message}`);
        res.status(500).json({ error: `Failed to fetch image from Pexels: ${error.message}` });
    }
});

// 🚀 Start Server
app.listen(PORT, () => {
    console.log(`🌍 Server running on port ${PORT}`);
    console.log("Available routes:");
    console.log("- GET /health");
    console.log("- GET /api/weather");
    console.log("- GET /api/air-quality");
    console.log("- POST /chat");
    console.log("- GET /api/pexels");
});
