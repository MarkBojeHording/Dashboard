document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM Content Loaded! Running scripts...");
  updateDateTime();
  setInterval(updateDateTime, 1000);
  fetchWeatherByLocation();
  setupSidebar();
  setupThemeToggle();
  setupChatbot();
  updateBackgroundImage();
});

// ✅ Function to Update Time & Date
function updateDateTime() {
  const now = new Date();
  document.getElementById("time").innerText = now.toLocaleTimeString("en-US", {
      hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true
  });
  document.getElementById("date").innerText = now.toLocaleDateString("en-US", {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
  });
}

// ✅ Sidebar Toggle
function setupSidebar() {
  const menuButton = document.getElementById("menu-btn");
  const sidebar = document.getElementById("sidebar");
  const closeButton = document.getElementById("close-sidebar");

  if (!menuButton || !sidebar || !closeButton) {
      console.error("❌ Sidebar elements missing in DOM.");
      return;
  }

  menuButton.addEventListener("click", () => {
      sidebar.classList.add("open");
      document.body.classList.add("sidebar-open");
  });

  closeButton.addEventListener("click", () => {
      sidebar.classList.remove("open");
      document.body.classList.remove("sidebar-open");
  });

  document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
          sidebar.classList.remove("open");
          document.body.classList.remove("sidebar-open");
      }
  });
}

// ✅ Dark/Light Mode Toggle
function setupThemeToggle() {
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  if (!themeToggle) {
      console.error("❌ Theme toggle button missing.");
      return;
  }

  if (localStorage.getItem("theme") === "light") {
      body.classList.add("light-mode");
      themeToggle.innerText = "🌙";
  } else {
      body.classList.remove("light-mode");
      themeToggle.innerText = "🌞";
  }

  themeToggle.addEventListener("click", () => {
      body.classList.toggle("light-mode");

      if (body.classList.contains("light-mode")) {
          localStorage.setItem("theme", "light");
          themeToggle.innerText = "🌙";
      } else {
          localStorage.setItem("theme", "dark");
          themeToggle.innerText = "🌞";
      }
  });
}

// ✅ Fetch Weather Data with Improved Error Handling
async function fetchWeatherByLocation() {
  console.log("🌍 Fetching weather data...");

  if (!navigator.geolocation) {
      console.error("❌ Geolocation is not supported.");
      useDefaultLocation();
      return;
  }

  navigator.geolocation.getCurrentPosition(
      async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          console.log(`📍 User Location: ${lat}, ${lon}`);
          fetchWeather(lat, lon);
      },
      (error) => {
          console.warn("⚠️ Geolocation failed, using default location.");
          useDefaultLocation();
      }
  );
}

function useDefaultLocation() {
  // Default to Ho Chi Minh City (Vietnam) if geolocation fails
  const lat = 10.7769;
  const lon = 106.7009;
  console.log(`📍 Using default location: ${lat}, ${lon}`);
  fetchWeather(lat, lon);
}

async function fetchWeather(lat, lon) {
  const url = `http://localhost:5001/api/weather?lat=${lat}&lon=${lon}`;
  console.log(`🔗 Fetching from: ${url}`);

  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`⚠️ API Error: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("🌦 Weather Data:", data);
      updateWeatherUI(data);
  } catch (error) {
      console.error("❌ Weather fetch failed:", error.message);
  }
}

// ✅ Fallback: Show Weather Error
function displayWeatherError() {
  const weatherContainer = document.getElementById("weather-container");
  if (weatherContainer) {
      weatherContainer.innerHTML = `<p>⚠️ Unable to fetch weather data</p>`;
  } else {
      console.error("❌ Weather container not found in DOM.");
  }
}

// ✅ Chatbot Setup
function setupChatbot() {
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const messagesContainer = document.getElementById("messages");

  if (!chatInput || !sendBtn || !messagesContainer) {
      console.error("❌ Chatbot elements missing in DOM.");
      return;
  }

  sendBtn.addEventListener("click", () => sendMessage());
  chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") sendMessage();
  });
}

// ✅ Send Message
async function sendMessage() {
  const chatInput = document.getElementById("chat-input");
  const messagesContainer = document.getElementById("messages");

  if (!chatInput || !messagesContainer) return;

  const userMessage = chatInput.value.trim();
  if (!userMessage) return;

  displayMessage(userMessage, "user-message");
  chatInput.value = "";

  try {
      const botMessage = displayMessage("...", "bot-message");

      const response = await fetch("http://localhost:5001/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage })
      });

      const data = await response.json();
      botMessage.innerText = "";

      if (data.imageUrl) {
          displayImage(data.imageUrl);
      }

      if (data.reply) {
          typeText(botMessage, data.reply);
      }
  } catch (error) {
      console.error("❌ Error fetching chatbot response:", error);
      displayMessage("⚠️ Unable to fetch response.", "bot-message");
  }
}

// ✅ Typing Effect
function typeText(element, text, i = 0) {
  if (i < text.length) {
      element.innerText += text.charAt(i);
      setTimeout(() => typeText(element, text, i + 1), 20);
  }
}

// ✅ Display Message in Chat
function displayMessage(message, className) {
  const messagesContainer = document.getElementById("messages");
  if (!messagesContainer) return;

  const messageDiv = document.createElement("div");
  messageDiv.classList.add("message", className);
  messageDiv.innerText = message;
  messagesContainer.appendChild(messageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
  return messageDiv;
}

// ✅ Display Image in Chat
function displayImage(imageUrl) {
  const messagesContainer = document.getElementById("messages");
  if (!messagesContainer) return;

  const imageDiv = document.createElement("div");
  imageDiv.classList.add("message", "bot-message");

  const image = document.createElement("img");
  image.src = imageUrl;
  image.alt = "Generated Image";
  image.style.maxWidth = "100%";
  image.style.borderRadius = "10px";
  image.style.marginTop = "10px";
  image.style.display = "none"; // Hide until loaded

  image.onload = () => {
      image.style.display = "block";
  };

  image.onerror = () => {
      imageDiv.innerText = "⚠️ Failed to load image.";
  };

  imageDiv.appendChild(image);
  messagesContainer.appendChild(imageDiv);
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// ✅ Fetch Random Nature Background from Pexels
async function updateBackgroundImage() {
  try {
      const response = await fetch(`http://localhost:5001/api/pexels?t=${new Date().getTime()}`);
      const data = await response.json();

      if (data.imageUrl) {
          document.body.style.backgroundImage = `url('${data.imageUrl}')`;
          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundPosition = "center";
          document.body.style.backgroundAttachment = "fixed";
      } else {
          console.warn("⚠️ No image URL received.");
      }
  } catch (error) {
      console.error("❌ Error fetching Pexels image:", error);
  }
}
