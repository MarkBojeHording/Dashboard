async function fetchBackground() {
  try {
      const res = await fetch("https://apis.scrimba.com/unsplash/photos/random?orientation=landscape&query=nature");
      const data = await res.json();
      document.body.style.backgroundImage = `url(${data.urls.regular})`;
  } catch (err) {
      document.body.style.backgroundImage = `url(https://images.unsplash.com/photo-1560008511-11c63416e52d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwyMTEwMjl8MHwxfHJhbmRvbXx8fHx8fHx8fDE2MjI4NDIxMTc&ixlib=rb-1.2.1&q=80&w=1080)`;
  }
}

function getCurrentTime() {
  const date = new Date();
  document.getElementById("time").textContent = date.toLocaleTimeString("en-us", { timeStyle: "short" });
}

setInterval(getCurrentTime, 1000);
async function fetchWeather() {
  navigator.geolocation.getCurrentPosition(async (position) => {
      try {
          console.log("Fetching weather and air quality data...");

          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const weatherRes = await fetch(`http://localhost:3000/weather?lat=${lat}&lon=${lon}`);
          const weatherData = await weatherRes.json();
          console.log("Weather Data Received:", weatherData);

          const airQualityRes = await fetch(`http://localhost:3000/air-quality?lat=${lat}&lon=${lon}`);
          const airQualityData = await airQualityRes.json();
          console.log("Air Quality Data Received:", airQualityData);

          if (!weatherData || !weatherData.temperature || !weatherData.city) {
              console.error("Incomplete weather data received:", weatherData);
              return;
          }

          if (!airQualityData || airQualityData.aqi === undefined) {
              console.error("Incomplete air quality data received:", airQualityData);
          }

          const aqiNumber = airQualityData.aqi || "Unknown";

          // ✅ Fix: Ensure weatherIcon exists
          const weatherIcon = weatherData.weatherIcon
              ? `http://openweathermap.org/img/wn/${weatherData.weatherIcon}@2x.png`
              : "";

          const weatherDiv = document.getElementById("weather");
          if (!weatherDiv) {
              console.error("The weather div is missing from the HTML.");
              return;
          }

          weatherDiv.innerHTML = `
              <img src="${weatherIcon}" alt="Weather Icon"/>
              <p class="weather-temp">🌡 Temperature: <strong>${weatherData.temperature}&deg;C</strong></p>
              <p class="weather-city">🏙 City: <strong>${weatherData.city}</strong></p>
              <p class="weather-aqi">🌫️ Air Quality Index: <strong>${aqiNumber}</strong></p>
          `;

      } catch (err) {
          console.error("Weather Fetch Error:", err);
      }
  }, (error) => {
      console.error("Geolocation error:", error);
  });
}


fetchWeather();
fetchBackground();
