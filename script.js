async function fetchWeatherByLocation() {
  if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (position) => {
          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          console.log(`📍 User Location: ${lat}, ${lon}`);

          const url = `http://localhost:5001/api/weather?lat=${lat}&lon=${lon}`; // ✅ Using geolocation

          try {
              const response = await fetch(url);
              if (!response.ok) {
                  throw new Error(`Error fetching weather: ${response.statusText}`);
              }
              const data = await response.json();
              updateWeatherUI(data);
          } catch (error) {
              console.error("Error fetching weather:", error);
              setDefaultCity(); // Default to Chiang Mai if API request fails
          }
      }, (error) => {
          console.error("❌ Geolocation error:", error);
          setDefaultCity(); // Default to Chiang Mai if user denies location access
      });
  } else {
      console.error("❌ Geolocation is not supported by this browser.");
      setDefaultCity(); // Default to Chiang Mai if geolocation is unavailable
  }
}

// ✅ Function to Fetch Weather for Chiang Mai (Fallback)
async function setDefaultCity() {
  console.log("🌍 Using default location: Chiang Mai");
  fetchWeather("Chiang Mai");
}

// ✅ Fetch Weather by City Name
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

// ✅ Function to Update the Weather UI
function updateWeatherUI(data) {
  document.getElementById("city-name").innerText = data.name;
  document.getElementById("temperature").innerText = `${Math.round(data.main.temp)}°C`;
  document.getElementById("weather-description").innerText = data.weather[0].description;
  document.getElementById("feels-like").innerText = `${Math.round(data.main.feels_like)}°C`;
  document.getElementById("humidity").innerText = `${data.main.humidity}%`;
  document.getElementById("wind-speed").innerText = `${Math.round(data.wind.speed)} m/s`;
  document.getElementById("clouds").innerText = `${data.clouds.all}%`;

  const date = new Date();
  document.getElementById("current-date").innerText = date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric"
  });
}

// ✅ Function to Update Time & Date
function updateDateTime() {
  const now = new Date();

  document.getElementById("time").innerText = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
  });

  document.getElementById("date").innerText = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
  });
}

// ✅ Event Listeners for Sidebar, Theme Toggle, and Clock
document.addEventListener("DOMContentLoaded", () => {
  // 🌗 Dark/Light Mode Toggle
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  themeToggle.addEventListener("click", () => {
      body.classList.toggle("light-mode");
      themeToggle.innerText = body.classList.contains("light-mode") ? "🌙" : "🌞";
  });

  // ☰ Sidebar Toggle
  const menuButton = document.getElementById("menu-btn");
  const sidebar = document.getElementById("sidebar");
  const closeButton = document.getElementById("close-sidebar");

  if (menuButton && sidebar && closeButton) {
      // Open sidebar on click
      menuButton.addEventListener("click", () => {
          sidebar.classList.add("open");
          document.body.classList.add("sidebar-open"); // Prevents scrolling when sidebar is open
      });

      // Close sidebar on button click
      closeButton.addEventListener("click", () => {
          sidebar.classList.remove("open");
          document.body.classList.remove("sidebar-open");
      });

      // Close sidebar when clicking outside of it
      document.addEventListener("click", (event) => {
          if (!sidebar.contains(event.target) && !menuButton.contains(event.target)) {
              sidebar.classList.remove("open");
              document.body.classList.remove("sidebar-open");
          }
      });

      // Close sidebar with 'Escape' key
      document.addEventListener("keydown", (event) => {
          if (event.key === "Escape") {
              sidebar.classList.remove("open");
              document.body.classList.remove("sidebar-open");
          }
      });

  } else {
      console.error("❌ Sidebar elements not found in the DOM.");
  }

  // ⏳ Ensure Clock & Date Are Visible
  updateDateTime();
  setInterval(updateDateTime, 1000);

  // 🌍 Fetch Weather
  fetchWeatherByLocation();
});
