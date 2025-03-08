function updateDateTime() {
  const now = new Date();

  // Format time (HH:MM:SS AM/PM)
  const formattedTime = now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
  });

  // Format date (Day, Month Date, Year)
  const formattedDate = now.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
  });

  // Update the elements
  document.getElementById("time").innerText = formattedTime;
  document.getElementById("date").innerText = formattedDate;
}

// Update every second
setInterval(updateDateTime, 1000);
updateDateTime(); // Initial call

// Dark/Light Mode Toggle
const themeToggle = document.getElementById("theme-toggle");
const body = document.body;

themeToggle.addEventListener("click", () => {
  body.classList.toggle("light-mode");

  // Change icon based on mode
  if (body.classList.contains("light-mode")) {
      themeToggle.innerText = "🌙"; // Moon icon for dark mode
  } else {
      themeToggle.innerText = "🌞"; // Sun icon for light mode
  }
});
