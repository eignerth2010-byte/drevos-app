import React, { useEffect, useState } from "react";
type InstallEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: string }>;
};
export function WebAppTools({
  language,
}: {
  language: "de" | "en";
  busy: boolean;
}) {
  const german = language === "de",
    [install, setInstall] = useState<InstallEvent | null>(null),
    [installed, setInstalled] = useState(false);
  useEffect(() => {
    const media = matchMedia("(display-mode: standalone)");
    const sync = () =>
      setInstalled(
        media.matches ||
          !!(navigator as Navigator & { standalone?: boolean }).standalone,
      );
    sync();
    media.addEventListener("change", sync);
    const offer = (event: Event) => {
      event.preventDefault();
      setInstall(event as InstallEvent);
    };
    const done = () => {
      setInstalled(true);
      setInstall(null);
    };
    window.addEventListener("beforeinstallprompt", offer);
    window.addEventListener("appinstalled", done);
    return () => {
      media.removeEventListener("change", sync);
      window.removeEventListener("beforeinstallprompt", offer);
      window.removeEventListener("appinstalled", done);
    };
  }, []);
  const ios =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const button: React.CSSProperties = {
    padding: "12px 16px",
    fontSize: 16,
    border: 0,
    borderRadius: 10,
    background: "#ffad62",
    color: "#172026",
    fontWeight: 600,
    cursor: "pointer",
  };
  if (installed) return null;
  return (
    <aside
      aria-label={german ? "Web-App installieren" : "Install web app"}
      style={{
        border: "1px solid #343f45",
        background: "#1c2226",
        borderRadius: 16,
        padding: 18,
        color: "#f5f1ea",
        marginBottom: 18,
        display: "flex",
        flexDirection: "column",
        gap: 12,
      }}
    >
      {!installed && (
        <>
          <strong style={{ fontSize: 18 }}>
            {german
              ? "Drevos zum Home-Bildschirm hinzufügen"
              : "Add Drevos to your home screen"}
          </strong>
          <p
            style={{
              fontSize: 16,
              lineHeight: 1.5,
              margin: 0,
              color: "#a9b4b9",
            }}
          >
            {german
              ? ios
                ? "In Safari „Teilen“ und „Zum Home-Bildschirm“ wählen. Danach Drevos über das neue Symbol öffnen und den Ofen dort koppeln."
                : "Im Browsermenü „App installieren“ oder „Zum Startbildschirm hinzufügen“ wählen. Du kannst Drevos auch direkt im Browser verwenden."
              : ios
                ? "In Safari choose Share, then Add to Home Screen. Open Drevos using its new icon and pair your oven there."
                : "Choose Install app or Add to Home screen in your browser menu. You can also use Drevos directly in the browser."}
          </p>
          {!!install && (
            <button
              style={button}
              onClick={() => {
                void install
                  .prompt()
                  .then(() => install.userChoice)
                  .then(() => setInstall(null));
              }}
            >
              {german ? "Drevos installieren" : "Install Drevos"}
            </button>
          )}
        </>
      )}
    </aside>
  );
}
