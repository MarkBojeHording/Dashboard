require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = 3000;

app.use(cors());

app.get('/weather', async (req, res) => {
    const { lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and Longitude are required." });
    }

    try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${apiKey}`);
        const weatherData = await weatherRes.json();

        res.json({
            temperature: Math.round((weatherData.main.temp - 32) * 5 / 9),
            city: weatherData.name,
        });

    } catch (err) {
        console.error("Weather Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch weather data." });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
