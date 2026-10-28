document.addEventListener("htmx:configRequest", (event) => {
  const token = document.querySelector('meta[name="csrf-token"]');
  if (token) event.detail.headers["X-CSRFToken"] = token.content;
});

document.addEventListener("toast", (event) => showToast(event.detail.value));

function showToast(message) {
  const zone = document.getElementById("toasts");
  if (!zone || !message) return;
  const item = document.createElement("div");
  item.className = "rounded-xl bg-brand-900 px-4 py-3 text-sm text-white shadow-lg transition";
  item.textContent = message;
  zone.appendChild(item);
  setTimeout(() => item.remove(), 3500);
}

document.addEventListener("click", (event) => {
  const toggle = event.target.closest("[data-toggle]");
  if (toggle) {
    document.getElementById(toggle.dataset.toggle)?.classList.toggle("hidden");
    return;
  }
  document.querySelectorAll("[data-dropdown]").forEach((menu) => {
    if (!menu.parentElement.contains(event.target)) menu.classList.add("hidden");
  });
});

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("[data-autodismiss]").forEach((el) => {
    setTimeout(() => el.remove(), 5000);
  });
});
