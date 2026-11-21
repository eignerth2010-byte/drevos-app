# Drevos Web-App / PWA

**[Komplette einfache Einrichtung mit Pi – Deutsch](INSTALLATION.de.md)** · **[Complete easy Pi and app setup – English](INSTALLATION.en.md)** · [Pi und Kabel / Hardware](HARDWARE.md)

**[Web-App öffnen / Open Web App](https://drevos-smoker-control.thankfulchick1.chatgpt.site)**

## Deutsch

Die Web-App verwendet dieselben Ofenfunktionen und dieselbe verschlüsselte Fernverbindung wie die eigenständige Android-/iOS-App. Eine Apple-Entwicklermitgliedschaft oder wöchentliche Signierung ist dafür nicht nötig. Der vorhandene Pi-Gateway und Cloud-Agent können weiterlaufen.

### Auf dem iPhone oder iPad

1. Die öffentliche Web-App in **Safari** öffnen.
2. **Teilen → Zum Home-Bildschirm** wählen. Falls angeboten, **Als Web-App öffnen** aktivieren und hinzufügen.
3. Drevos über das neue Symbol öffnen und **erst dort koppeln**. Safari und die installierte Web-App können getrennte Website-Daten verwenden.
4. **Ofen koppeln** wählen und den privaten QR-Code von der vorübergehenden Pi-Seite scannen. Alternativ ein QR-Bild lokal auswählen oder den privaten Code mit **Code einfügen** übernehmen.
5. **Ofen verbinden** drücken. Echte Temperaturen prüfen und die Pi-Kopplungsseite wieder schließen.

### Auf Android oder am Computer

Die Website in einem aktuellen Browser öffnen und **Drevos installieren**, **App installieren** oder **Zum Startbildschirm hinzufügen** wählen. Die Bezeichnung hängt vom Browser ab. Auch die Verwendung direkt im Browser funktioniert. Anschließend wie oben mit dem privaten Ofencode koppeln.

Der bestehende Kopplungscode kann für weitere eigene Geräte verwendet werden. Er darf weder veröffentlicht noch in GitHub-Issues oder Chatnachrichten eingefügt werden. Ein QR-Bild wird nur lokal im Browser verarbeitet.

### Verbindung, Offline-Betrieb und Updates

Für aktuelle Ofenwerte und Bedienung brauchen Browser und Pi eine Internetverbindung. Bei Unterbrechungen wird die Bedienung gesperrt; der Ofen führt sein eigenes SPS-Programm weiter aus. Befehle werden nicht für spätere Ausführung gespeichert und nicht automatisch wiederholt.

Die öffentliche App-Oberfläche kann offline starten. Messwerte, Befehle und Kopplungsschlüssel landen nicht im Offline-Cache. Eine neue App-Version wird nach erneutem Öffnen bzw. über **Neue Version laden** übernommen. Das Laden eines Updates ist während eines laufenden App-Befehls gesperrt.

Die Kopplung wird verschlüsselt in der lokalen IndexedDB des jeweiligen Website-Ursprungs gespeichert. Der dazugehörige Web-Crypto-Schlüssel ist nicht exportierbar. Das ersetzt keinen Betriebssystem-Schlüsselspeicher und schützt nicht vor schädlichem Code derselben Website oder einem kompromittierten Gerät. Browserprofil privat halten und vor dessen Weitergabe **Kopplung entfernen** verwenden. Das Löschen der Website-Daten oder ein anderer Website-Ursprung erfordern erneutes Koppeln. Die Kopplung anderer Geräte bleibt dabei bestehen.

Aktuellen Safari/Chrome/Edge/Firefox verwenden; der private Browsermodus kann dauerhafte Speicherung verhindern. Bei abgelehntem Kamerazugriff funktionieren QR-Bild und Code-Eingabe weiterhin.

### Selbst bauen und hosten

Node.js 24 LTS und HTTPS-Hosting bereitstellen. Im Ordner `mobile` ausführen:

```sh
npm ci
npm run typecheck
npm test
npm run build:web
```

Nur den Inhalt von `mobile/dist-web` als öffentliche Website veröffentlichen. Kein Repository-Wurzelverzeichnis und keine privaten Konfigurationsdateien hochladen. `manifest.webmanifest` mit Manifest-MIME-Typ und `sw.js` als JavaScript ausliefern. `_headers` enthält die vorgesehenen Sicherheits- und Cache-Header; Hosts ohne Unterstützung müssen sie entsprechend konfigurieren. Eine zusätzliche CSP und Referrer-Vorgabe im HTML schützen auch bei Hosts ohne `_headers`-Unterstützung; Frame- und Berechtigungs-Header müssen bei eigenem Hosting separat gesetzt werden. Der Service Worker benötigt denselben HTTPS-Ursprung und den Root-Scope. Eine bestehende öffentliche Relay-Installation benötigt für diese Web-App keine Protokolländerung.

## English

The installable web app uses the same standalone UI, verified PLC control rules and encrypted relay connection as the native app. It does not require an Apple Developer subscription or weekly signing. The existing Pi gateway and cloud agent can remain in use.

On iPhone/iPad open in Safari, choose **Share → Add to Home Screen**, then open the new icon and **pair inside the installed web app**. Browser and installed-app storage may be separate. On Android/desktop use the browser's **Install app / Add to home screen** option, or use the website directly.

Choose **Pair oven**, scan the private Pi QR code, select a QR image locally, or paste the private code. Press **Connect oven**, verify live readings, then close the temporary Pi setup page. QR images are processed locally and never uploaded to the host. Do not publish pairing codes.

Live readings and commands require internet access at both ends. An offline shell does not mean the oven is connected. Controls are disabled when disconnected; the PLC continues independently. No offline command queue or automatic command replay exists. Only public app assets are cached. Update prompts require explicit activation and are disabled during an app command.

Pairing is encrypted in origin-local IndexedDB with a non-exportable Web Crypto key. This does not protect against malicious same-origin scripts, a compromised device or another person using the same unlocked browser profile. Use **Remove pairing** before sharing the profile. Clearing website data or moving to a different origin requires pairing again; other phones remain paired.

To build: install Node.js 24 LTS, then run the commands above in `mobile`. Host **only `dist-web`** over HTTPS. Preserve manifest/JavaScript MIME types and the security/cache headers in `_headers`. `sw.js` must have root scope on the same origin. Existing deployed relays already support the browser transport; no Pi or relay protocol upgrade is required.
