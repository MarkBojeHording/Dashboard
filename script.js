async function fetchWeatherByLocation() {
  if (navigator.geolocation) {
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

async function setDefaultCity() {
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

// ✅ Sidebar, Theme Toggle, and Chatbot Functionality
document.addEventListener("DOMContentLoaded", () => {
  const themeToggle = document.getElementById("theme-toggle");
  const body = document.body;

  // Check saved theme from localStorage
  if (localStorage.getItem("theme") === "light") {
    body.classList.add("light-mode");
    themeToggle.innerText = "🌙"; // Show moon icon for dark mode
  }

  // Toggle theme on button click
  themeToggle.addEventListener("click", () => {
    body.classList.toggle("light-mode");

    if (body.classList.contains("light-mode")) {
      localStorage.setItem("theme", "light");
      themeToggle.innerText = "🌙"; // Show moon icon
    } else {
      localStorage.setItem("theme", "dark");
      themeToggle.innerText = "🌞"; // Show sun icon
    }
  });

  // ☰ Sidebar Toggle
  const menuButton = document.getElementById("menu-btn");
  const sidebar = document.getElementById("sidebar");
  const closeButton = document.getElementById("close-sidebar");

  if (menuButton && sidebar && closeButton) {
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
  } else {
    console.error("❌ Sidebar elements not found in the DOM.");
  }

  // 🤖 Chatbot Functionality
  const chatInput = document.getElementById("chat-input");
  const sendBtn = document.getElementById("send-btn");
  const messagesContainer = document.getElementById("messages");

  sendBtn.addEventListener("click", () => sendMessage());
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") sendMessage();
  });

  async function sendMessage() {
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
        botMessage.innerText = ""; // Clear "..." after response arrives

        // 🖼 If there's an image, display it
        if (data.imageUrl) {
            botMessage.innerText = "Generating image..."; // Temporary loading message
            displayImage(data.imageUrl, botMessage);
        }

        // 💬 If there's text, display it
        if (data.reply) {
            typeText(botMessage, data.reply);
        }
    } catch (error) {
        console.error("❌ Error:", error);
        displayMessage("⚠️ Unable to fetch response.", "bot-message");
    }
}

// 🖼 Function to Display Image in Chat
function displayImage(imageUrl, messageDiv) {
    const imageDiv = document.createElement("div");
    imageDiv.classList.add("message", "bot-message");

    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "Generated Image";
    image.style.maxWidth = "100%";
    image.style.borderRadius = "10px";
    image.style.marginTop = "10px";
    image.style.display = "none"; // Hide until loaded

    // When the image loads, show it
    image.onload = () => {
        image.style.display = "block";
        messageDiv.innerText = ""; // Remove "Generating image..."
    };

    // Handle image loading errors
    image.onerror = () => {
        messageDiv.innerText = "⚠️ Failed to load image.";
    };

    imageDiv.appendChild(image);
    messagesContainer.appendChild(imageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// 💬 Function to Type Out Text Messages Letter by Letter
function typeText(element, text, i = 0) {
    if (i < text.length) {
        element.innerText += text.charAt(i);
        setTimeout(() => typeText(element, text, i + 1), 20);
    }
}

// 💬 Function to Display Normal Messages in Chat
function displayMessage(message, className) {
    const messageDiv = document.createElement("div");
    messageDiv.classList.add("message", className);
    messageDiv.innerText = message;
    messagesContainer.appendChild(messageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
    return messageDiv;
}

// 🖼 Function to Display Image in Chat
function displayImage(imageUrl, messageDiv) {
    const imageDiv = document.createElement("div");
    imageDiv.classList.add("message", "bot-message");

    const image = document.createElement("img");
    image.src = imageUrl;
    image.alt = "Generated Image";
    image.style.maxWidth = "100%";
    image.style.borderRadius = "10px";
    image.style.marginTop = "10px";
    image.style.display = "none"; // Hide until loaded

    // When the image loads, show it
    image.onload = () => {
        image.style.display = "block";
        messageDiv.innerText = ""; // Remove "Generating image..."
    };

    // Handle image loading errors
    image.onerror = () => {
        messageDiv.innerText = "⚠️ Failed to load image.";
    };

    imageDiv.appendChild(image);
    messagesContainer.appendChild(imageDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

  function typeText(element, text, i = 0) {
    if (i < text.length) {
      element.innerText += text.charAt(i);
      setTimeout(() => typeText(element, text, i + 1), 20);
    }
  }

  updateDateTime();
  setInterval(updateDateTime, 1000);
  fetchWeatherByLocation();
});
