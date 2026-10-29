/* Clés d'accès (WebAuthn) : boutons [data-passkey] avec data-options et data-verify. */
(() => {
  const b64 = {
    toBuffer(value) {
      const base = value.replace(/-/g, "+").replace(/_/g, "/");
      const raw = atob(base + "=".repeat((4 - (base.length % 4)) % 4));
      return Uint8Array.from(raw, (c) => c.charCodeAt(0)).buffer;
    },
    fromBuffer(buffer) {
      const bytes = String.fromCharCode(...new Uint8Array(buffer));
      return btoa(bytes).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    },
  };
  const csrf = () => document.querySelector('meta[name="csrf-token"]')?.content || "";
  const post = (url, body) =>
    fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-CSRFToken": csrf() },
      body: JSON.stringify(body || {}),
      credentials: "same-origin",
    });

  function creationOptions(options) {
    return {
      ...options,
      challenge: b64.toBuffer(options.challenge),
      user: { ...options.user, id: b64.toBuffer(options.user.id) },
      excludeCredentials: (options.excludeCredentials || []).map((c) => ({ ...c, id: b64.toBuffer(c.id) })),
    };
  }

  function requestOptions(options) {
    return {
      ...options,
      challenge: b64.toBuffer(options.challenge),
      allowCredentials: (options.allowCredentials || []).map((c) => ({ ...c, id: b64.toBuffer(c.id) })),
    };
  }

  function serialize(credential) {
    const r = credential.response;
    const response = { clientDataJSON: b64.fromBuffer(r.clientDataJSON) };
    if (r.attestationObject) {
      response.attestationObject = b64.fromBuffer(r.attestationObject);
      response.transports = r.getTransports ? r.getTransports() : [];
    } else {
      response.authenticatorData = b64.fromBuffer(r.authenticatorData);
      response.signature = b64.fromBuffer(r.signature);
      response.userHandle = r.userHandle ? b64.fromBuffer(r.userHandle) : null;
    }
    return {
      id: credential.id,
      rawId: b64.fromBuffer(credential.rawId),
      type: credential.type,
      response,
      clientExtensionResults: credential.getClientExtensionResults(),
      authenticatorAttachment: credential.authenticatorAttachment,
    };
  }

  async function run(button) {
    const status = document.querySelector(button.dataset.status || "[data-passkey-status]");
    const say = (text) => status && (status.textContent = text);
    button.disabled = true;
    say("");
    try {
      const optionsResponse = await post(button.dataset.options);
      if (!optionsResponse.ok) throw new Error(button.dataset.error);
      const options = await optionsResponse.json();
      const register = button.dataset.mode === "register";
      const credential = register
        ? await navigator.credentials.create({ publicKey: creationOptions(options) })
        : await navigator.credentials.get({ publicKey: requestOptions(options) });
      const extra = {};
      const form = button.closest("form");
      if (form) new FormData(form).forEach((value, key) => (extra[key] = value));
      const result = await post(button.dataset.verify, { credential: serialize(credential), ...extra });
      const data = await result.json();
      if (!result.ok) throw new Error(data.error || button.dataset.error);
      location.href = data.redirect;
    } catch (error) {
      say(error.name === "NotAllowedError" ? button.dataset.cancelled : error.message || button.dataset.error);
      button.disabled = false;
    }
  }

  const supported = !!window.PublicKeyCredential;
  document.querySelectorAll("[data-passkey]").forEach((button) => {
    if (!supported) {
      button.hidden = true;
      document.querySelectorAll("[data-passkey-unsupported]").forEach((el) => (el.hidden = false));
      return;
    }
    button.addEventListener("click", (event) => {
      event.preventDefault();
      run(button);
    });
  });
})();
