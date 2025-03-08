import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());

app.get("/api/weather", async (req, res) => {
    const { city, lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (!apiKey) {
        console.error("❌ Missing API Key in .env file");
        return res.status(500).json({ error: "API key is missing. Please check your .env file." });
    }

    let url = "";
    if (lat && lon) {
        // Fetch weather using latitude & longitude
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`;
    } else if (city) {
        // Fetch weather using city name
        url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${apiKey}`;
    } else {
        return res.status(400).json({ error: "No location provided." });
    }

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error from OpenWeather API: ${response.statusText}`);
        }
        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("❌ Failed to fetch weather:", error.message);
        res.status(500).json({ error: "Failed to fetch weather from OpenWeather API." });
    }
});

app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
