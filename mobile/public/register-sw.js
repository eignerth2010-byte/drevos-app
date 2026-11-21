if ("serviceWorker" in navigator && window.isSecureContext) {
  window.addEventListener("load", () => {
    const previouslyControlled = !!navigator.serviceWorker.controller;
    let reloading = false;
    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (previouslyControlled && !reloading) {
        reloading = true;
        location.reload();
      }
    });
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((registration) => {
        const ready = () =>
          window.dispatchEvent(new Event("drevos:update-ready"));
        if (registration.waiting) ready();
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (
              worker.state === "installed" &&
              navigator.serviceWorker.controller
            )
              ready();
          });
        });
      })
      .catch(() => {
        /* The online app remains usable when offline shell storage is unavailable. */
      });
  });
}
