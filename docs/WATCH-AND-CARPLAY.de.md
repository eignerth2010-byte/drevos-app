# Drevos auf Uhr und CarPlay

Die Erweiterung 0.6.0 ergänzt Uhren-Apps. Die normale Handy-APK und eine Wear-OS-APK sind unterschiedliche Pakete für verschiedene Geräte. Vorhandene Pi-Installation und Ofenkopplung werden weiterverwendet.

## Welche Uhren?

| Plattform | Zielbasis | Hinweise |
|---|---|---|
| Apple Watch | watchOS 8 oder neuer | Eine Uhr mit passendem Betriebssystem und passender vom Xcode-Build enthaltener Prozessorarchitektur ist erforderlich. Einzelne alte Modelle sind damit noch nicht als getestet zugesichert. |
| Samsung Galaxy Watch | Galaxy Watch4 und neuer mit Wear OS 3+ | Google Play-Dienste sowie eine normale Bluetooth-Kopplung mit dem Android-Handy erforderlich. |
| Andere Android-Uhren | Wear OS 3+ | Beispielsweise kompatible Pixel-Watch-, TicWatch- und Fossil-Modelle. Nicht jede Uhr, die mit Android-Handys funktioniert, verwendet Wear OS. |
| Samsung Tizen, Garmin, Fitbit und andere eigene Uhrensysteme | Nicht Teil dieser Erweiterung | Sie können eine Wear-OS-APK nicht installieren. |

Samsung hat die Verteilung neuer und aktualisierter Tizen-Uhren-Apps eingestellt: [Herstellerhinweis](https://developer.samsung.com/galaxy-watch-tizen/notice.html). Die watchOS-Zielversion liegt im von [Xcode unterstützten Bereich](https://developer.apple.com/xcode/system-requirements/); das ersetzt keinen Test auf jeder Uhr.

## Einmal koppeln

1. Die neue Drevos-Handy-App über die bestehende App installieren. Die vorhandene Fernzugriffskopplung behalten. Eine ausschließlich lokale HTTP-Kopplung kann nicht zur Uhr übertragen werden.
2. Die passende Uhren-App installieren und öffnen. Bei Apple wird sie mit der iPhone-App eingebettet; über Xcode müssen iPhone-, Watch- und Statusanzeigen-Target mit deinem Team signiert werden. Die bisherige Ablaufzeit kostenloser Apple-Signaturen bleibt bestehen.
3. Am Handy **Info → Uhr & Autoanzeige → Uhren suchen** öffnen.
4. Die gewünschte gekoppelte Uhr auswählen. Bei Apple muss die Uhren-App für die Übertragung erreichbar sein. Google verlangt für Data Layer auf Handy und Uhr identischen Paketnamen und identische Signatur.
5. Auf der Uhr die Verbindung und die echten Temperaturen prüfen. Eine installierte Vorschau ist noch kein Nachweis einer getesteten Ofenbedienung.

Die Uhr erhält ausdrücklich eine geschützte Kopie der Fernzugriffskopplung. Apple speichert sie im gerätegebundenen Schlüsselbund; Wear OS verschlüsselt sie mit dem Android-Keystore und legt sie außerhalb von Backups ab. Es werden keine Schlüssel oder Kopplungsdaten in Rezeptkataloge, Protokollmeldungen oder CarPlay-Anzeigen übernommen. Die Übertragung nutzt Watch Connectivity bzw. den authentifizierten und verschlüsselten Wear Data Layer; [Google beschreibt dessen Transport und Anforderungen](https://developer.android.com/training/wearables/data/overview).

Anschließend verwendet die geöffnete Uhren-App selbst die bestehende verschlüsselte Cloud-Verbindung. Dafür benötigt die Uhr einen verfügbaren Internetzugang, gegebenenfalls über ihre Systemverbindung zum Handy. Die Drevos-Handy-App muss beim Bedienen der Uhr nicht im Vordergrund sein.

## Bedienen

Kammer- und Kerntemperatur, Rauchwert und Timer werden angezeigt. Sollwerte können geändert, Heizung, Rauch/Zündung, Konvektion, Lüfter und Timer einzeln bedient werden. Jeder Befehl verlangt eine Bestätigung. Vor einem Schreibbefehl werden Identität, Zustand und Freigaben erneut vom Ofen gelesen. Die bestehenden Grenzen bleiben erhalten: Kammer 0–120 °C, Kern 0–115 °C, Rauch 0–100 %, Timer 1–9999 Minuten. Automatik und Fahrenheit sperren Schreibzugriffe.

Nach mehr als 15 Sekunden ohne bestätigte Messung erscheinen die Werte nicht mehr als aktuell; die Bedienung ist gesperrt. Die Apps senden einen nicht bestätigten Schreibbefehl nicht automatisch erneut. Nach einem Fehler zunächst den wirklichen Ofenzustand aktualisieren und prüfen.

Keine Rezeptphase, Zündung oder Heizung startet beim Öffnen, Koppeln oder Wiederverbinden automatisch. Die Uhren-App ist kein ständig laufender Hintergrundalarm und kein Ersatz für die Aufsicht über den Ofen.

**Kopplung löschen** auf der Uhr löscht die lokale Kopie. Bei Verlust eines bereits gekoppelten Geräts muss die gemeinsame Fernzugriffskopplung am Pi erneuert werden; ein ausgeschaltetes oder nicht erreichbares Gerät kann nicht aus der Ferne zuverlässig gelöscht werden.

## iPhone-Statusanzeige und CarPlay

Am iPhone unter **Info → Uhr & Autoanzeige → Statusanzeige starten** eine Live-Aktivität öffnen. Die eigene Status-Erweiterung setzt iOS 18 voraus; die kleine CarPlay-Darstellung wird ab iOS 26 unterstützt. Live-Aktivitäten müssen in den Systemeinstellungen erlaubt sein. Sie zeigt Temperaturen, Restzeit und Messzeitpunkt. Im Auto gibt es keine Schaltbefehle.

Die Werte werden von der aktiven Handy-App aktualisiert. Hält iOS die App im Hintergrund an, wird die Live-Aktivität nach 20 Sekunden als veraltet gekennzeichnet. Es ist keine unbegrenzt aktuelle Hintergrundüberwachung zugesichert. Dafür wäre zusätzlich eine separat eingerichtete Apple-Push-Infrastruktur erforderlich; diese Erweiterung richtet sie nicht ein. Die Uhr kann ihre Werte dagegen selbst abrufen, solange die Uhren-App aktiv ist.

Apple erlaubt [Live-Aktivitäten in CarPlay](https://developer.apple.com/carplay/). Eine eigenständige CarPlay-Ofensteuerung mit eigenem Launcher wird nicht als genehmigt oder enthalten ausgegeben. Weitere Entitlements werden nicht zweckfremd verwendet.

## Selbst bauen

Im Ordner `mobile` Abhängigkeiten installieren und die normalen Prüfungen ausführen. `DREVOS_WEAR_OS=1` beim Android-Prebuild erzeugt das Uhrenmanifest; ohne diese Variable entsteht die Handy-App. Der GitHub-Build bietet getrennte Wear-OS- und Emulator-Optionen.

Am Mac führt `macOS-vorbereiten.command` nach dem Expo-Prebuild `ruby scripts/integrate-apple.rb` aus. Das ergänzt die nativen Watch- und Live-Activity-Targets reproduzierbar; generierte Xcode-Projekte gehören nicht in Git. Native Protokoll- und Schutzprüfungen: `swift test --package-path apple`. Ein unsigniertes IPA ist nicht direkt auf iPhone oder Watch installierbar.

## Android Auto

Android Auto wird in die Handy-APK integriert; es gibt dafür keine separate Auto-APK. In der Handy-App **Info → Uhr & Autoanzeige → Android Auto freischalten** wählen. Die vorhandene Fernzugriffskopplung wird dafür zusätzlich im gerätegebundenen Android-Keystore geschützt gespeichert. **Android Auto trennen** und Abmelden löschen diese lokale Freigabe.

Die native Autoanzeige liest Kammer- und Kerntemperatur, Rauchwert und Restzeit selbst über den verschlüsselten Relay-Zugang, während ihre Oberfläche aktiv ist. Die Handy-Oberfläche braucht dafür nicht geöffnet zu bleiben. Nach 15 Sekunden ohne bestätigte Messung werden die Werte als nicht verfügbar angezeigt. Es gibt einen manuellen Aktualisieren-Knopf, keine Ofenschaltbefehle und keinen ständig laufenden Hintergrunddienst.

Die Umsetzung verwendet Googles [IoT-Kategorie und Car-App-Vorlagen](https://developer.android.com/training/cars/apps/iot) sowie eine Prüfung bekannter Android-Auto-Hosts. Eine Freigabe durch Google Play oder ein bestandener Test an jedem Fahrzeug wird nicht behauptet. Installation einer APK allein garantiert nicht, dass jeder Android-Auto-Host sie im Launcher anzeigt. Die [offiziellen Auto-Prüfungen](https://developer.android.com/docs/quality-guidelines/car-app-quality) und ein Test mit der Desktop Head Unit bzw. echtem Fahrzeug gehören zur Freigabe.
