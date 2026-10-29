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

/* Palette de recherche : Ctrl+K, Cmd+K ou « / ». */
const Palette = {
  el: () => document.getElementById("palette"),
  open() {
    const dialog = Palette.el();
    if (!dialog || dialog.open) return;
    dialog.showModal();
    const input = document.getElementById("palette-input");
    input.select();
    htmx.trigger(input, "palette:open");
  },
  close() {
    Palette.el()?.close();
  },
  items: () => [...document.querySelectorAll("#palette-results [role=option]")],
  move(step) {
    const items = Palette.items();
    if (!items.length) return;
    const current = items.findIndex((el) => el.getAttribute("aria-selected") === "true");
    const next = (current + step + items.length) % items.length;
    items.forEach((el, i) => el.setAttribute("aria-selected", i === next));
    items[next].scrollIntoView({ block: "nearest" });
  },
};

document.addEventListener("keydown", (event) => {
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(document.activeElement?.tagName) || document.activeElement?.isContentEditable;
  if ((event.key === "k" && (event.ctrlKey || event.metaKey)) || (event.key === "/" && !typing)) {
    event.preventDefault();
    Palette.open();
    return;
  }
  if (!Palette.el()?.open) return;
  if (event.key === "ArrowDown" || event.key === "ArrowUp") {
    event.preventDefault();
    Palette.move(event.key === "ArrowDown" ? 1 : -1);
  } else if (event.key === "Enter") {
    const active = Palette.items().find((el) => el.getAttribute("aria-selected") === "true") || Palette.items()[0];
    if (active) {
      event.preventDefault();
      active.click();
    }
  }
});

document.addEventListener("click", (event) => {
  if (event.target.closest("[data-palette-open]")) {
    event.preventDefault();
    Palette.open();
  } else if (event.target.closest("[data-palette-close]") || event.target === Palette.el()) {
    Palette.close();
  }
});

/* Application installable : service worker et bouton d'installation. */
if ("serviceWorker" in navigator && document.body.dataset.sw) {
  window.addEventListener("load", () => navigator.serviceWorker.register(document.body.dataset.sw, { scope: "/" }).catch(() => {}));
}

let installPrompt = null;
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
  document.querySelectorAll("[data-install]").forEach((el) => (el.hidden = false));
});
document.addEventListener("click", async (event) => {
  if (!event.target.closest("[data-install]") || !installPrompt) return;
  installPrompt.prompt();
  await installPrompt.userChoice;
  installPrompt = null;
  document.querySelectorAll("[data-install]").forEach((el) => (el.hidden = true));
});
