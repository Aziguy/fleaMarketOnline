document.addEventListener("htmx:configRequest", (event) => {
  const token = document.querySelector('meta[name="csrf-token"]');
  if (token) event.detail.headers["X-CSRFToken"] = token.content;
});

document.addEventListener("toast", (event) => showToast(event.detail.value));

function showToast(message) {
  const zone = document.getElementById("toasts");
  if (!zone || !message) return;
  const item = document.createElement("div");
  item.className = "glass animate-pop-in rounded-xl border px-4 py-3 text-sm font-medium text-stone-900 shadow-glow";
  item.textContent = message;
  zone.appendChild(item);
  setTimeout(() => item.remove(), 3500);
}
window.showToast = showToast;

/* Thème : clair, sombre ou système (préférence mémorisée). */
const Theme = {
  get() {
    try {
      return localStorage.getItem("theme") || "system";
    } catch {
      return "system";
    }
  },
  set(choice) {
    try {
      if (choice === "system") localStorage.removeItem("theme");
      else localStorage.setItem("theme", choice);
    } catch {}
    if (choice === "system") delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = choice;
    Theme.mark();
  },
  mark() {
    const current = Theme.get();
    document.querySelectorAll("[data-theme-choice]").forEach((el) => {
      const active = el.dataset.themeChoice === current;
      el.setAttribute("aria-checked", active);
      el.classList.toggle("nav-link-active", active);
    });
  },
};

document.addEventListener("click", (event) => {
  const choice = event.target.closest("[data-theme-choice]");
  if (choice) {
    const apply = () => Theme.set(choice.dataset.themeChoice);
    document.startViewTransition ? document.startViewTransition(apply) : apply();
    choice.closest("[data-dropdown]")?.classList.add("hidden");
    return;
  }
  const toggle = event.target.closest("[data-toggle]");
  if (toggle) {
    document.querySelectorAll("[data-dropdown]").forEach((menu) => {
      if (menu.id !== toggle.dataset.toggle) menu.classList.add("hidden");
    });
    document.getElementById(toggle.dataset.toggle)?.classList.toggle("hidden");
    return;
  }
  document.querySelectorAll("[data-dropdown]").forEach((menu) => {
    if (!menu.parentElement.contains(event.target)) menu.classList.add("hidden");
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") document.querySelectorAll("[data-dropdown]").forEach((m) => m.classList.add("hidden"));
});

/* Apparition au défilement. */
function reveal(root = document) {
  const items = root.querySelectorAll("[data-reveal]:not(.is-visible)");
  if (!("IntersectionObserver" in window)) {
    items.forEach((el) => el.classList.add("is-visible"));
    return;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { rootMargin: "0px 0px -8% 0px" },
  );
  items.forEach((el, i) => {
    el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
    observer.observe(el);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  Theme.mark();
  reveal();
  document.querySelectorAll("[data-autodismiss]").forEach((el) => setTimeout(() => el.remove(), 5000));
});
document.addEventListener("htmx:afterSwap", (event) => reveal(event.target));
