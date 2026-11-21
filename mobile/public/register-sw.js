if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    // Navigations fetch the current HTML. A new worker activates naturally after
    // existing windows close; never reload an active oven session for an update.
    navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      /* The online app remains usable when offline shell storage is unavailable. */
    });
  });
}
