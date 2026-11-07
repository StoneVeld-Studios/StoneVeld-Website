"use strict";
(() => {
  const button = document.getElementById("sv-contact-copy");
  const address = document.getElementById("sv-contact-address");
  const status = document.getElementById("sv-contact-copy-feedback");
  if (!button || !address || !status) return;
  button.hidden = false;
  button.addEventListener("click", async () => {
    const text = address.textContent.trim();
    if (!navigator.clipboard || typeof navigator.clipboard.writeText !== "function") {
      status.textContent = "Copy is unavailable in this browser. Select the address shown and copy it manually.";
      return;
    }
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Email address copied. Paste it into your email website.";
    } catch {
      status.textContent = "Could not copy automatically. Select the address shown and copy it manually.";
    }
  });
})();
