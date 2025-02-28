async function fetchBackground() {
  try {
      const res = await fetch("https://apis.scrimba.com/unsplash/photos/random?orientation=landscape&query=nature");
      const data = await res.json();
      document.body.style.backgroundImage = `url(${data.urls.regular})`;
      // document.getElementById("author").textContent = `By: ${data.user.name}`;
  } catch (err) {
      document.body.style.backgroundImage = `url(https://images.unsplash.com/photo-1560008511-11c63416e52d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=MnwyMTEwMjl8MHwxfHJhbmRvbXx8fHx8fHx8fDE2MjI4NDIxMTc&ixlib=rb-1.2.1&q=80&w=1080)`;
      // document.getElementById("author").textContent = `By: Dodi Achmad`;
  }
}

async function fetchCrypto() {
  try {
      const res = await fetch("https://api.coingecko.com/api/v3/coins/dogecoin");
      if (!res.ok) {
          throw Error("Something went wrong");
      }
      // const data = await res.json();
      // document.getElementById("crypto-top").innerHTML = `
      //     <img src="${data.image.small}" />
      //     <span>${data.name}</span>
      // `;

  //     document.getElementById("crypto").innerHTML += `
  //     <p>&#127919;: $${data.market_data.current_price.usd}</p> <!-- 🎯 -->
  //     <p>&#128070;: $${data.market_data.high_24h.usd}</p> <!-- 👆 -->
  //     <p>&#128071;: $${data.market_data.low_24h.usd}</p> <!-- 👇 -->
  // `;
  } catch (err) {
      console.error(err);
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
          console.log("Fetching weather data...");

          const lat = position.coords.latitude;
          const lon = position.coords.longitude;

          const res = await fetch(`http://localhost:3000/weather?lat=${lat}&lon=${lon}`);
          if (!res.ok) {
              throw Error("Weather data not available");
          }

          const data = await res.json();
          console.log("Weather Data:", data);

          const iconUrl = `http://openweathermap.org/img/wn/${data.weatherIcon}@2x.png`;

          const airQualityLevels = ["Good", "Fair", "Moderate", "Poor", "Very Poor"];
          const airQuality = airQualityLevels[data.airQuality - 1];

          const weatherDiv = document.getElementById("weather");
          if (!weatherDiv) {
              console.error("The weather div is missing from the HTML.");
              return;
          }

          weatherDiv.innerHTML = `
              <img src="${iconUrl}" alt="Weather Icon"/>
              <p class="weather-temp">${data.temperature}&deg;C</p>
              <p class="weather-city">${data.city}</p>
              <p class="air-quality">🌫️ Air Quality: <strong>${airQuality}</strong></p>
          `;

      } catch (err) {
          console.error("Weather Fetch Error:", err);
      }
  }, (error) => {
      console.error("Geolocation error:", error);
  });
}

fetchBackground();
fetchCrypto();
fetchWeather();
