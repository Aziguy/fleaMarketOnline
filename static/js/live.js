/* Espace commerçant : commandes et réservations en direct (Server-Sent Events). */
(() => {
  const root = document.querySelector("[data-live]");
  if (!root || !("EventSource" in window)) return;

  const dot = document.querySelector("[data-live-status]");
  const label = document.querySelector("[data-live-label]");
  const notifyButton = document.querySelector("[data-notify-enable]");

  const setStatus = (online) => {
    dot?.classList.toggle("bg-brand-500", online);
    dot?.classList.toggle("motion-safe:animate-pulse", online);
    dot?.classList.toggle("bg-stone-300", !online);
    if (label) label.textContent = online ? label.dataset.on : label.dataset.off;
  };

  const chime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      [880, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.15 + 0.3);
        osc.connect(gain).connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.32);
      });
    } catch {}
  };

  const bump = (type) => {
    const badge = document.querySelector(`[data-live-count="${type}"]`);
    if (!badge) return;
    badge.textContent = String((parseInt(badge.textContent, 10) || 0) + 1);
    badge.classList.remove("hidden");
    badge.classList.remove("animate-pop-in");
    void badge.offsetWidth;
    badge.classList.add("animate-pop-in");
  };

  const notify = (event) => {
    if ("Notification" in window && Notification.permission === "granted" && document.hidden) {
      const n = new Notification(event.title, { body: event.body, icon: "/static/img/icons/icon-192.png", tag: event.reference });
      n.onclick = () => {
        window.focus();
        location.href = event.url;
      };
    }
  };

  const handle = (message) => {
    const event = JSON.parse(message.data);
    bump(event.type);
    chime();
    notify(event);
    window.showToast?.(`${event.title} · ${event.body}`);
    document.body.dispatchEvent(new CustomEvent(`live:${event.type}`));
  };

  const source = new EventSource(root.dataset.live);
  source.addEventListener("open", () => setStatus(true));
  source.addEventListener("error", () => setStatus(false));
  source.addEventListener("order", handle);
  source.addEventListener("booking", handle);
  window.addEventListener("pagehide", () => source.close());

  if (notifyButton && "Notification" in window && Notification.permission === "default") {
    notifyButton.hidden = false;
    notifyButton.addEventListener("click", async () => {
      await Notification.requestPermission();
      notifyButton.hidden = true;
    });
  }
})();
