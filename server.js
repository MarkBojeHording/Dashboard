import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json()); // Allows JSON parsing in requests

const openaiApiKey = process.env.OPENAI_API_KEY;

// 🌦️ Weather API Route
app.get("/api/weather", async (req, res) => {
    const { city, lat, lon } = req.query;
    const weatherApiKey = process.env.OPENWEATHERMAP_API_KEY;

    if (!weatherApiKey) {
        console.error("❌ Missing OpenWeather API Key in .env file");
        return res.status(500).json({ error: "Weather API key is missing. Please check your .env file." });
    }

    let url = "";
    if (lat && lon) {
        url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${weatherApiKey}`;
    } else if (city) {
        url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&units=metric&appid=${weatherApiKey}`;
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

// 🤖 Chatbot API Route
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!openaiApiKey) {
      return res.status(500).json({ error: "OpenAI API key is missing." });
  }

  // Detect if the user is requesting an image
  const isImageRequest = message.toLowerCase().includes("generate an image of") || message.toLowerCase().includes("create an image of");

  try {
      if (isImageRequest) {
          // Extract the prompt
          const prompt = message.replace(/generate an image of|create an image of/gi, "").trim();
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
                  size: "512x512"
              })
          });

          if (!response.ok) {
              throw new Error(`OpenAI Image API Error: ${response.statusText}`);
          }

          const data = await response.json();
          console.log("✅ OpenAI Image API Response:", data);

          // Return the image URL
          res.json({ imageUrl: data.data[0].url });

      } else {
          // Handle Normal Chat Responses
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
          res.json({ reply: data.choices[0].message.content });
      }
  } catch (error) {
      console.error("❌ OpenAI API Error:", error);

      // Ensure chatbot does NOT falsely say DALL·E is unavailable
      if (error.message.includes("403")) {
          res.status(500).json({ error: "⚠️ Image generation is currently unavailable for this account." });
      } else {
          res.status(500).json({ error: "Failed to fetch response from OpenAI API." });
      }
  }
});

// 🚀 Start Server
app.listen(PORT, () => console.log(`🌍 Server running on port ${PORT}`));
