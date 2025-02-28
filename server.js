import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());

app.get('/weather', async (req, res) => {
    const { lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and Longitude are required." });
    }

    try {
        const weatherRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${apiKey}`);
        const weatherData = await weatherRes.json();

        res.json({
            temperature: Math.round(weatherData.main.temp),
            city: weatherData.name,
            weatherIcon: weatherData.weather[0]?.icon || null,
        });

    } catch (err) {
        console.error("Weather Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch weather data." });
    }
});

app.get('/air-quality', async (req, res) => {
    const { lat, lon } = req.query;
    const apiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (!lat || !lon) {
        return res.status(400).json({ error: "Latitude and Longitude are required." });
    }

    try {
        const airQualityRes = await fetch(`https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`);
        const airQualityData = await airQualityRes.json();

        res.json({
            aqi: airQualityData.list[0]?.main.aqi || null,
        });

    } catch (err) {
        console.error("Air Quality Fetch Error:", err);
        res.status(500).json({ error: "Failed to fetch air quality data." });
    }
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
