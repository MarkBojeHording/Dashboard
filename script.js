document.addEventListener("DOMContentLoaded", () => {
  updateDateTime();
  setInterval(updateDateTime, 1000);
  fetchWeatherByLocation();
  setupSidebar();
  setupThemeToggle();
  setupChatbot();
  updateBackgroundImage(); // ✅ Ensure this function exists before calling it
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

// ✅ Fetch Weather Data
async function fetchWeatherByLocation() {
  if (!navigator.geolocation) {
      console.error("❌ Geolocation is not supported by this browser.");
      setDefaultCity();
      return;
  }

  navigator.geolocation.getCurrentPosition(async (position) => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;

      console.log(`📍 User Location: ${lat}, ${lon}`);

      const url = `http://localhost:5001/api/weather?lat=${lat}&lon=${lon}`;

      try {
          const response = await fetch(url);
          if (!response.ok) {
              throw new Error(`Error fetching weather: ${response.statusText}`);
          }
          const data = await response.json();
          updateWeatherUI(data);
      } catch (error) {
          console.error("Error fetching weather:", error);
          setDefaultCity();
      }
  }, (error) => {
      console.error("❌ Geolocation error:", error.message || "Unknown error");
      setDefaultCity();
  });
}

// ✅ Default to Chiang Mai if location is unavailable
function setDefaultCity() {
  console.log("🌍 Using default location: Chiang Mai");
  fetchWeather("Chiang Mai");
}

async function fetchWeather(city) {
  const url = `http://localhost:5001/api/weather?city=${city}`;

  try {
      const response = await fetch(url);
      if (!response.ok) {
          throw new Error(`Error fetching weather: ${response.statusText}`);
      }
      const data = await response.json();
      updateWeatherUI(data);
  } catch (error) {
      console.error("Error fetching weather:", error);
      document.getElementById("weather-container").innerHTML = `<p>⚠️ Unable to fetch weather data</p>`;
  }
}

// ✅ Update Weather UI
function updateWeatherUI(data) {
  if (!data || !data.main) {
      console.error("❌ Invalid weather data received:", data);
      return;
  }

  document.getElementById("city-name").innerText = data.name || "Unknown";
  document.getElementById("temperature").innerText = `${Math.round(data.main.temp)}°C`;
  document.getElementById("weather-description").innerText = data.weather[0]?.description || "No description";
  document.getElementById("feels-like").innerText = `${Math.round(data.main.feels_like)}°C`;
  document.getElementById("humidity").innerText = `${data.main.humidity}%`;
  document.getElementById("wind-speed").innerText = `${Math.round(data.wind.speed)} m/s`;
  document.getElementById("clouds").innerText = `${data.clouds?.all || 0}%`;
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
