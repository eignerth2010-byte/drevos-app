import React, { useEffect, useRef, useState } from "react";
import jsQR from "jsqr";
import { Language } from "./gateway";
import { parseCloudPairing } from "./cloud";

type Props = { language: Language; onResult: (text: string) => void };
export function PairingScanner({ language, onResult }: Props) {
  const german = language === "de";
  const [error, setError] = useState(""),
    [running, setRunning] = useState(false);
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null);
  const frame = useRef(0),
    closed = useRef(false),
    done = useRef(false);
  function stop() {
    cancelAnimationFrame(frame.current);
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
  }
  useEffect(() => {
    closed.current = false;
    return () => {
      closed.current = true;
      stop();
    };
  }, []);
  function accept(text: string) {
    try {
      parseCloudPairing(text);
    } catch {
      setError(
        german
          ? "Das ist kein Drevos-Kopplungscode. Bitte den Code von der Pi-Einrichtungsseite verwenden."
          : "This is not a Drevos pairing code. Use the code from the Pi setup page.",
      );
      return false;
    }
    if (done.current) return true;
    done.current = true;
    stop();
    onResult(text);
    return true;
  }
  async function start() {
    if (stream.current) return;
    setError("");
    done.current = false;
    try {
      const next = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" } },
        audio: false,
      });
      if (closed.current) {
        next.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = next;
      if (!video.current) {
        stop();
        return;
      }
      video.current.srcObject = next;
      await video.current.play();
      setRunning(true);
      const canvas = document.createElement("canvas"),
        context = canvas.getContext("2d", { willReadFrequently: true });
      let last = 0;
      const scan = (time: number) => {
        if (closed.current || done.current || !stream.current) return;
        const view = video.current;
        if (view && context && view.readyState >= 2 && time - last > 300) {
          last = time;
          const ratio = Math.min(
            1,
            960 / Math.max(view.videoWidth, view.videoHeight),
          );
          canvas.width = Math.round(view.videoWidth * ratio);
          canvas.height = Math.round(view.videoHeight * ratio);
          context.drawImage(view, 0, 0, canvas.width, canvas.height);
          const pixels = context.getImageData(
            0,
            0,
            canvas.width,
            canvas.height,
          );
          const result = jsQR(pixels.data, pixels.width, pixels.height);
          if (result && accept(result.data)) return;
        }
        frame.current = requestAnimationFrame(scan);
      };
      frame.current = requestAnimationFrame(scan);
    } catch {
      stop();
      setRunning(false);
      setError(
        german
          ? "Die Kamera ist nicht verfügbar. Erlaube den Kamerazugriff oder wähle ein QR-Bild aus."
          : "Camera unavailable. Allow camera access or choose a QR image.",
      );
    }
  }
  async function image(file: File | undefined) {
    if (!file) return;
    setError("");
    if (file.size > 20 * 1024 * 1024) {
      setError(
        german
          ? "Das Bild ist zu groß. Bitte ein kleineres QR-Bild wählen."
          : "Image too large. Choose a smaller QR image.",
      );
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = new window.Image();
      img.src = url;
      await img.decode();
      if (closed.current) return;
      const ratio = Math.min(1, 1800 / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const context = canvas.getContext("2d", { willReadFrequently: true });
      if (!context) throw Error();
      context.drawImage(img, 0, 0, canvas.width, canvas.height);
      const pixels = context.getImageData(0, 0, canvas.width, canvas.height),
        result = jsQR(pixels.data, pixels.width, pixels.height);
      if (!result) throw Error();
      accept(result.data);
    } catch {
      setError(
        german
          ? "Im Bild wurde kein lesbarer QR-Code gefunden. Du kannst den Kopplungscode auch einfügen."
          : "No readable QR code found. You can also paste the pairing code.",
      );
    } finally {
      URL.revokeObjectURL(url);
    }
  }
  const button: React.CSSProperties = {
    background: "#ffad62",
    color: "#172026",
    border: 0,
    borderRadius: 12,
    padding: "14px 18px",
    fontSize: 17,
    cursor: "pointer",
    fontWeight: 600,
  };
  return (
    <div
      style={{
        padding: 20,
        display: "flex",
        flex: 1,
        flexDirection: "column",
        gap: 16,
        color: "#f5f1ea",
        maxWidth: 680,
        width: "100%",
        boxSizing: "border-box",
        margin: "0 auto",
      }}
    >
      <p style={{ fontSize: 17, margin: 0 }}>
        {german
          ? "Scanne den privaten QR-Code vom Pi oder wähle ein gespeichertes QR-Bild."
          : "Scan the private QR code from the Pi or choose a saved QR image."}
      </p>
      <video
        ref={video}
        muted
        playsInline
        aria-label={german ? "Kameravorschau" : "Camera preview"}
        style={{
          display: running ? "block" : "none",
          width: "100%",
          maxHeight: "45vh",
          borderRadius: 16,
          objectFit: "cover",
        }}
      />
      {!running && (
        <button type="button" onClick={() => void start()} style={button}>
          {german ? "Kamera starten" : "Start camera"}
        </button>
      )}
      <label
        style={{
          ...button,
          background: "#26343c",
          color: "#f5f1ea",
          textAlign: "center",
        }}
      >
        {german ? "QR-Bild auswählen" : "Choose QR image"}
        <input
          aria-label={german ? "QR-Bild auswählen" : "Choose QR image"}
          type="file"
          accept="image/*"
          onChange={(e) => void image(e.target.files?.[0])}
          style={{
            display: "block",
            maxWidth: "100%",
            marginTop: 10,
            fontSize: 16,
          }}
        />
      </label>
      {!!error && (
        <p role="alert" style={{ fontSize: 17, color: "#ffb0a4" }}>
          {error}
        </p>
      )}
    </div>
  );
}
