import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fetch from "node-fetch";
import multer from "multer";

dotenv.config();
const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// Configure Multer for Image Uploads
const upload = multer({ storage: multer.memoryStorage() });

const openaiApiKey = process.env.OPENAI_API_KEY;

// 🌦️ Weather API Route (No changes)
app.get("/api/weather", async (req, res) => { /* Your existing code here */ });

// 🤖 Chatbot API Route (Text + Image Generation)
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!openaiApiKey) {
      return res.status(500).json({ error: "OpenAI API key is missing." });
  }

  const isImageRequest = message.toLowerCase().includes("generate an image of") || message.toLowerCase().includes("create an image of");

  try {
      if (isImageRequest) {
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
                  size: "1024x1024" // Bigger images
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
      res.status(500).json({ error: "Failed to fetch response from OpenAI API." });
  }
});

// 🤖 Chatbot API Route
app.post("/chat", async (req, res) => {
  const { message } = req.body;

  if (!openaiApiKey) {
      return res.status(500).json({ error: "OpenAI API key is missing." });
  }

  // ✅ Smarter Image Detection (Detects "show", "display", "see", "generate", etc.)
  const isImageRequest = /\b(show|display|see|generate|create).+(image|picture|photo|drawing|illustration)\b/i.test(message);

  try {
      if (isImageRequest) {
          // ✅ Extract meaningful prompt
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
          return res.json({ reply: data.choices[0].message.content });
      }
  } catch (error) {
      console.error("❌ OpenAI API Error:", error);
      res.status(500).json({ error: "Failed to fetch response from OpenAI API." });
  }
});

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

// 🌿 API Route to Fetch a Random Nature Image from Pexels
app.get("/api/pexels", async (req, res) => {
    try {
        const randomPage = Math.floor(Math.random() * 50) + 1; // Get a random page number
        const PEXELS_URL = `https://api.pexels.com/v1/search?query=nature&per_page=1&page=${randomPage}`;

        const response = await fetch(PEXELS_URL, {
            headers: { Authorization: PEXELS_API_KEY }
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
