function updateDateTime() {
  const now = new Date();

  const formattedTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
  });

  const formattedDate = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
  });

  document.getElementById("time").innerText = formattedTime;
  document.getElementById("date").innerText = formattedDate;
}

setInterval(updateDateTime, 1000);
updateDateTime();

const themeToggle = document.getElementById("theme-toggle");
const body = document.body;

themeToggle.addEventListener("click", () => {
  body.classList.toggle("light-mode");

  if (body.classList.contains("light-mode")) {
      themeToggle.innerText = "🌙";
  } else {
      themeToggle.innerText = "🌞";
  }
});

const menuButton = document.getElementById("menu-btn");
const closeButton = document.getElementById("close-sidebar");
const sidebar = document.getElementById("sidebar");

// Hide sidebar on page load
document.addEventListener("DOMContentLoaded", () => {
    sidebar.classList.remove("open");
});

menuButton.addEventListener("click", () => {
    sidebar.classList.add("open");
});

closeButton.addEventListener("click", () => {
    sidebar.classList.remove("open");
});
