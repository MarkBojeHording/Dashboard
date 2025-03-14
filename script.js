// Wait for DOM to load
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ DOM Content Loaded! Running scripts...");
  updateDateTime();
  setInterval(updateDateTime, 1000); // Update time every second
  fetchWeatherByLocation();
  fetchAirQualityByLocation(); // New: Fetch air quality data
  setupSidebar();
  setupThemeToggle();
  setupChatbot();
  updateBackgroundImage();
});

// ✅ Function to Update Time & Date
function updateDateTime() {
  const now = new Date();
  const timeElement = document.getElementById("time");
  const dateElement = document.getElementById("date");

  if (timeElement) {
      timeElement.innerText = now.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
      });
  }
  if (dateElement) {
      dateElement.innerText = now.toLocaleDateString("en-US", {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric"
      });
  }
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
  const weatherContainer = document.getElementById("weather-container");

  if (!navigator.geolocation) {
      console.error("❌ Geolocation is not supported by this browser.");
      useDefaultLocation();
      return;
  }

  navigator.geolocation.getCurrentPosition(
      async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          console.log(`📍 User Location: ${lat}, ${lon}`);
          await fetchWeather(lat, lon);
      },
      (error) => {
          console.warn(`⚠️ Geolocation failed with code ${error.code}: ${error.message}`);
          useDefaultLocation();
      },
      {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
      }
  );
}

function useDefaultLocation() {
  const lat = 10.7769;
  const lon = 106.7009;
  console.log(`📍 Using default location: ${lat}, ${lon}`);
  fetchWeather(lat, lon);
}

async function fetchWeather(lat, lon) {
  const url = `http://localhost:5002/api/weather?lat=${lat}&lon=${lon}`;
  console.log(`🔗 Fetching from: ${url}`);

  try {
      const response = await fetch(url);
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`⚠️ API Error: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      console.log("🌦 Weather Data:", data);
      updateWeatherUI(data);
  } catch (error) {
      console.error("❌ Weather fetch failed:", error.message);
      displayWeatherError(error.message);
  }
}

// ✅ Update Weather UI
function updateWeatherUI(data) {
  const weatherContainer = document.getElementById("weather-container");
  if (!weatherContainer || !data || !data.main) {
      displayWeatherError();
      return;
  }

  const cityName = document.getElementById("city-name");
  const temperature = document.getElementById("temperature");
  const weatherDescription = document.getElementById("weather-description");
  const feelsLike = document.getElementById("feels-like");
  const humidity = document.getElementById("humidity");
  const windSpeed = document.getElementById("wind-speed");
  const clouds = document.getElementById("clouds");
  const currentDate = document.getElementById("current-date");

  if (cityName) cityName.textContent = data.name || "Unknown City";
  if (temperature) temperature.textContent = data.main.temp ? `${Math.round(data.main.temp)}°C` : "N/A";
  if (weatherDescription) weatherDescription.textContent = data.weather?.[0]?.description || "N/A";
  if (feelsLike) feelsLike.textContent = data.main.feels_like ? `${Math.round(data.main.feels_like)}°C` : "N/A";
  if (humidity) humidity.textContent = data.main.humidity ? `${data.main.humidity}%` : "N/A";
  if (windSpeed) windSpeed.textContent = data.wind?.speed ? `${data.wind.speed} m/s` : "N/A";
  if (clouds) clouds.textContent = data.clouds?.all ? `${data.clouds.all}%` : "N/A";
  if (currentDate) currentDate.textContent = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
  });
}

// ✅ Fallback: Show Weather Error
function displayWeatherError(message = "Unable to fetch weather data") {
  const weatherContainer = document.getElementById("weather-container");
  if (weatherContainer) {
      weatherContainer.innerHTML = `<p class="error-message">⚠️ ${message}</p>`;
  } else {
      console.error("❌ Weather container not found in DOM.");
  }
}

// ✅ Fetch Air Quality Data
async function fetchAirQualityByLocation() {
  console.log("🌫 Fetching air quality data...");
  const aqiContainer = document.getElementById("aqi-container");

  if (!navigator.geolocation) {
      console.error("❌ Geolocation is not supported by this browser.");
      useDefaultLocationForAQI();
      return;
  }

  navigator.geolocation.getCurrentPosition(
      async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;
          console.log(`📍 User Location for AQI: ${lat}, ${lon}`);
          await fetchAirQuality(lat, lon);
      },
      (error) => {
          console.warn(`⚠️ Geolocation failed with code ${error.code}: ${error.message}`);
          useDefaultLocationForAQI();
      },
      {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0
      }
  );
}

function useDefaultLocationForAQI() {
  const lat = 10.7769;
  const lon = 106.7009;
  console.log(`📍 Using default location for AQI: ${lat}, ${lon}`);
  fetchAirQuality(lat, lon);
}

async function fetchAirQuality(lat, lon) {
  const url = `http://localhost:5002/api/air-quality?lat=${lat}&lon=${lon}`;
  console.log(`🔗 Fetching AQI from: ${url}`);

  try {
      const response = await fetch(url);
      if (!response.ok) {
          const errorData = await response.json();
          throw new Error(`⚠️ API Error: ${errorData.error || response.statusText}`);
      }
      const data = await response.json();
      console.log("🌫 Air Quality Data:", data);
      updateAirQualityUI(data);
  } catch (error) {
      console.error("❌ Air Quality fetch failed:", error.message);
      displayAirQualityError(error.message);
  }
}

// ✅ Update Air Quality UI
function updateAirQualityUI(data) {
  const aqiContainer = document.getElementById("aqi-container");
  if (!aqiContainer || !data || !data.list || !data.list[0]) {
      displayAirQualityError();
      return;
  }

  const aqiCity = document.getElementById("aqi-city");
  const aqiStatus = document.getElementById("aqi-status");
  const pm25 = document.getElementById("pm25");
  const pm10 = document.getElementById("pm10");
  const co = document.getElementById("co");
  const no2 = document.getElementById("no2");

  const aqiData = data.list[0].components;
  const aqiValue = data.list[0].main.aqi;

  if (aqiCity) aqiCity.textContent = "Ho Chi Minh City" || "Unknown City";
  if (aqiStatus) aqiStatus.textContent = `AQI: ${aqiValue} (${getAQIStatus(aqiValue)})`;
  if (pm25) pm25.textContent = aqiData.pm2_5 ? `${aqiData.pm2_5} µg/m³` : "N/A";
  if (pm10) pm10.textContent = aqiData.pm10 ? `${aqiData.pm10} µg/m³` : "N/A";
  if (co) co.textContent = aqiData.co ? `${aqiData.co} µg/m³` : "N/A";
  if (no2) no2.textContent = aqiData.no2 ? `${aqiData.no2} µg/m³` : "N/A";
}

function getAQIStatus(aqi) {
  if (aqi <= 50) return "Good";
  if (aqi <= 100) return "Moderate";
  if (aqi <= 150) return "Unhealthy for Sensitive Groups";
  if (aqi <= 200) return "Unhealthy";
  if (aqi <= 300) return "Very Unhealthy";
  return "Hazardous";
}

// ✅ Fallback: Show Air Quality Error
function displayAirQualityError(message = "Unable to fetch air quality data") {
  const aqiContainer = document.getElementById("aqi-container");
  if (aqiContainer) {
      aqiContainer.innerHTML = `<p class="error-message">⚠️ ${message}</p>`;
  } else {
      console.error("❌ Air Quality container not found in DOM.");
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

  const botMessage = displayMessage("Thinking...", "bot-message");

  try {
      const response = await fetch("http://localhost:5002/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
          throw new Error(`⚠️ API Error: ${response.statusText}`);
      }

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
      botMessage.innerText = "⚠️ Unable to fetch response.";
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
  image.style.display = "none";

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
      const response = await fetch(`http://localhost:5002/api/pexels?t=${new Date().getTime()}`);
      if (!response.ok) {
          throw new Error(`⚠️ Pexels API Error: ${response.statusText}`);
      }
      const data = await response.json();

      if (data.imageUrl) {
          document.body.style.backgroundImage = `url('${data.imageUrl}')`;
          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundPosition = "center";
          document.body.style.backgroundAttachment = "fixed";
      } else {
          console.warn("⚠️ No image URL received, using fallback.");
          document.body.style.backgroundImage = `linear-gradient(135deg, #0f172a, #1e3a8a)`;
      }
  } catch (error) {
      console.error("❌ Error fetching Pexels image:", error);
      document.body.style.backgroundImage = `linear-gradient(135deg, #0f172a, #1e3a8a)`;
  }
}
