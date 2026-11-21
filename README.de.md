# Drevos-App â€“ deutsche Anleitung

**Neu in 0.3.1:** Eigener vorläufiger Schriftzug und neue Bedingungen für Verkauf und kommerzielle Weitergabe. Nutzung bleibt kostenlos; frühere MIT-Rechte bleiben bestehen. [Lizenzdetails](docs/LICENSING.md).

**Lizenz ab 21.11.2026:** Private und betriebsinterne Nutzung kostenlos; Verkauf und kommerzielle Weitergabe nur mit vorheriger schriftlicher Freigabe von **Thomas Eigner**. [Bedingungen, frÃ¼here MIT-Fassungen und Kontakt](docs/LICENSING.md).

**Drevos lÃ¤uft bereits in Home Assistant? [Nur die App ergÃ¤nzen](docs/HA-UND-APP.de.md#a-home-assistant-funktioniert-schon-die-app-soll-dazukommen).** Umgekehrt: [Home Assistant zur bestehenden App hinzufÃ¼gen](docs/HA-UND-APP.de.md#b-die-app-funktioniert-schon-home-assistant-soll-dazukommen).

**Neu hier? [Einfach starten â€“ Pi und App installieren](docs/INSTALLATION.de.md).** Mit Materialliste, Befehlen zum Kopieren und Einrichtung von Web-App oder Handy-App.

**[Welcher Pi und welches Kabel?](docs/HARDWARE.md)** FÃ¼r die normale Installation ist die Dienstadresse bereits hinterlegt; du musst keinen eigenen Dienstnamen einsetzen.

Die Drevos-App ist eine **eigenstÃ¤ndige App fÃ¼r Android, iPhone/iPad und den Browser**. Sie benÃ¶tigt weder Home Assistant noch ein VPN. Der Pi verbindet sich von innen mit dem gemeinsamen Vermittlungsdienst. Eine Portfreigabe am Router ist nicht erforderlich.

Die App und ihre Funktionen kÃ¶nnen fÃ¼r die Nutzer kostenlos angeboten werden. Den gemeinsamen Dienst richtet **einmalig der Betreiber des Projekts** ein. Die Nutzer brauchen kein Cloudflare-Konto, keinen eigenen Server und kein Abo. Kostenlose Hosting-Tarife haben Nutzungsgrenzen; ein beliebig groÃŸer, dauerhaft kostenloser Betrieb wird nicht zugesichert.

Version **0.3.1 ist eine Vorschau** mit Info-/Spenden-Tab, einstellbarer Android-UpdateprÃ¼fung, Ã„nderungsfenster und sichtbarer Versionsnummer. Der gemeinsame Dienst unter `https://drevos-relay.eigner-th2010.workers.dev` ist im Pi-Paket enthalten. Bei der frÃ¼heren Version 0.2.0 wurden auf Android, iPhone und in der iPhone-Web-App echte Temperaturen, gespeicherte Kopplung und der Zugriff Ã¼ber mobile Daten bestÃ¤tigt. Die BrowserprÃ¼fungen und der Android-Build fÃ¼r 0.3.1 stehen getrennt in [VALIDATION](docs/VALIDATION.md). Es handelt sich um ein unabhÃ¤ngiges Community-Projekt; unterstÃ¼tzt wird das geprÃ¼fte SPS-Profil `drevos_fx3u_v1`.

## Web-App installieren

**[Drevos Web-App Ã¶ffnen](https://drevos-smoker-control.thankfulchick1.chatgpt.site)**. Auf dem iPhone in Safari Ã¶ffnen, **Teilen â†’ Zum Home-Bildschirm** wÃ¤hlen und anschlieÃŸend Ã¼ber das neue Symbol koppeln. Auf Android im Browser **App installieren** wÃ¤hlen. Kein Apple-Entwicklerabo und keine wÃ¶chentliche Signierung nÃ¶tig. [VollstÃ¤ndige PWA-Anleitung](docs/WEB-APP.md).

## Native App herunterladen

Die [Android-APK 0.3.1 und der Quellcode](https://github.com/eignerth2010-byte/drevos-app/releases/tag/v0.3.1-preview.1) stehen zum Download bereit. `Drevos-Android-0.3.1-Vorschau.apk` Ã¼ber die vorhandene App installieren und das Update am Android-GerÃ¤t bestÃ¤tigen. Vorher nicht deinstallieren. Der Android-Build verwendet weiterhin die bisherige Testsignatur. Das frÃ¼here [unsignierte iPhone-Paket 0.2.0](https://github.com/eignerth2010-byte/drevos-app/releases/tag/v0.2.0-preview.1) bleibt verfÃ¼gbar und muss separat von Apple signiert werden; fÃ¼r diese VerÃ¶ffentlichung wurde kein neues iPhone-Paket gebaut. [Update-Anleitung und Ã„nderungsfenster](docs/UPDATES.md).

## Was benÃ¶tigt wird

- Ein Drevos-Ofen mit dem **geprÃ¼ften Steuerungsprofil `drevos_fx3u_v1`**. Der Markenname allein bestÃ¤tigt keine RegisterkompatibilitÃ¤t. Bei anderen Steuerungen dÃ¼rfen Schreibbefehle erst nach PrÃ¼fung ihres Registerplans freigeschaltet werden.
- Raspberry Pi 3 B, 3 B+, 4 B oder Zero 2 W mit Raspberry Pi OS, Python 3.11+, Stromversorgung, microSD und Internetzugang. Alle verwenden dasselbe Programm. 64-Bit-OS wird empfohlen. Der Zero 2 W benÃ¶tigt fÃ¼r das Programmierkabel zusÃ¤tzlich einen USB-OTG-Adapter. Physisch geprÃ¼ft ist bislang der 3 B+.
- Ein zur SPS elektrisch passendes USB-Programmierkabel. Der Name des USB-Chips allein bestÃ¤tigt die Eignung nicht. Keine GPIO-Leitung direkt mit einer RS-232-Schnittstelle verbinden.
- Ein aktueller Browser mit HTTPS, IndexedDB und Web Crypto fÃ¼r die Web-App. Alternativ die native App: Android 7+ oder iOS/iPadOS 16.4+. Der Android-Testbuild enthÃ¤lt ARM64 und ARMv7.
- Der vom Betreiber bereitgestellte Ã¶ffentliche Relay-Endpunkt. Die Nutzer erhalten ihn automatisch mit dem Pi-Paket und dem Kopplungscode.

## So lÃ¤uft die Einrichtung fÃ¼r den Nutzer ab

1. Das geprÃ¼fte Pi-Programm installieren und den Pi mit Ofen und Heimnetz verbinden.
2. Die vorÃ¼bergehende Pi-Einrichtungsseite Ã¶ffnen, Ã¼blicherweise `http://drevos-pi.local:8765`.
3. In der App **Ofen koppeln** wÃ¤hlen und den QR-Code auf dieser Seite scannen.
4. Auf demselben Handy stattdessen **Code kopieren** auf der Pi-Seite und **Code einfÃ¼gen** in der App verwenden.
5. **Ofen verbinden** drÃ¼cken und die angezeigten Messwerte mit dem Display vergleichen. Danach die Einrichtungsseite mit **Fertig** schlieÃŸen.

Der Code wird automatisch auf dem Pi erzeugt. Er enthÃ¤lt die private Kopplung dieses Ofens und darf nicht verÃ¶ffentlicht werden. Die Seite ist nur im Heimnetz und nur fÃ¼r fÃ¼nf Minuten geÃ¶ffnet. Nach der einmaligen Einrichtung verwendet die App die gespeicherte Kopplung auch unterwegs. Der Pi und das Handy benÃ¶tigen dazu Internetzugang; Home Assistant ist an diesem Weg nicht beteiligt.

## Pi-Installation aus dem Quellcode

Diese Schritte setzen das geprÃ¼fte SPS-Profil voraus. FÃ¼r eine Erstinstallation Raspberry Pi OS aktualisieren und Python 3.11 oder neuer bereitstellen. Dieses Repository auf den Pi laden und dort Ã¶ffnen.

```sh
sudo sh scripts/install-gateway.sh
```

Der Installer legt `/etc/drevos/gateway.json` privat an und startet die serielle Verbindung zunÃ¤chst nicht. Ein einzelnes GerÃ¤t unter `/dev/serial/by-id/` wird als Adapter vorgeschlagen. Den tatsÃ¤chlichen Adapter, das Profil und die Bind-Adresse lokal prÃ¼fen. Schreibbefehle sind bei einer neuen Konfiguration standardmÃ¤ÃŸig aus. Den ZugangsschlÃ¼ssel nicht in den Chat oder in GitHub kopieren.

Andere Programme dÃ¼rfen die serielle Schnittstelle nicht gleichzeitig verwenden. Danach:

```sh
sudo systemctl enable --now drevos-gateway.service drevos-native-poweroff.path
```

Temperaturen und Registerprofil am Display verifizieren. Nur beim bestÃ¤tigten Profil `allow_control` in der privaten Konfiguration bewusst freigeben und den Gateway-Dienst neu starten. Die App funktioniert auch zum Ablesen, wÃ¤hrend die Bedienung gesperrt bleibt.

**Normale Installation:** Die gemeinsame Dienstadresse ist bereits in `cloud/endpoint.json` eingetragen. FÃ¼hre auf dem Pi im Projektordner genau diesen Befehl aus; keine Adresse ergÃ¤nzen und keinen Dienstnamen ersetzen:

```sh
sudo sh scripts/install-cloud.sh
```

Der verwendete gemeinsame Dienst lautet `https://drevos-relay.eigner-th2010.workers.dev`. Ein eigener Cloudflare-Zugang ist fÃ¼r Nutzer nicht erforderlich. Wer bewusst einen eigenen Dienst betreiben mÃ¶chte, findet diesen getrennten Entwicklerweg in [cloud/README](cloud/README.md).

Der Installer installiert den getrennten Hintergrunddienst `drevos-cloud.service`. Seine privaten SchlÃ¼ssel liegen unter `/etc/drevos-cloud/`. Ein Ã¤lteres lokales Gateway wird auf die Version mit sofortiger Ablehnung beschÃ¤ftigter Schreibzugriffe aktualisiert. Die vorhandene Gateway-Konfiguration und die SPS-Werte bleiben erhalten; beim Aktualisieren wird die API kurz neu gestartet.

Die Kopplungsseite anschlieÃŸend fÃ¼r fÃ¼nf Minuten Ã¶ffnen. Mit dem in der einfachen Anleitung festgelegten GerÃ¤tenamen ist der Befehl direkt kopierbar:

```sh
sudo /opt/drevos-cloud/.venv/bin/drevos-cloud --pair --pair-bind drevos-pi.local
```

Im Heimnetz `http://drevos-pi.local:8765` Ã¶ffnen und wie oben koppeln. Bei geÃ¤ndertem Hostnamen diesen im `--pair-bind`-Argument und in der Browseradresse einsetzen sowie mit `--pair-hostname` angeben. Keine Portfreigabe fÃ¼r diese Seite oder den Gateway-Port einrichten.

PrÃ¼fen:

```sh
systemctl is-active drevos-gateway.service drevos-cloud.service
```

Updates benutzen dieselben Installationsskripte. Bestehende KopplungsschlÃ¼ssel werden nicht neu erzeugt. Vor einer SchlÃ¼sselrotation die privaten Dateien sichern und bewusst neue SchlÃ¼ssel/Kopplungen einrichten; eine gewÃ¶hnliche App-Abmeldung entfernt nur die Kopplung auf diesem Handy.

## Funktionen der App

**Ofen:** Kammer- und Kerntemperatur sowie RauchstÃ¤rke ablesen. Sollwerte eingeben und ausdrÃ¼cklich **Ãœbernehmen** drÃ¼cken. Bereiche: Kammer 0â€“120 Â°C, Kernziel 0â€“115 Â°C, Rauch 0â€“100 %. Ein positiver Sollwert startet keine Funktion. Heizelement und Rauchbetrieb werden separat eingeschaltet und verlangen eine BestÃ¤tigung. Der Rauchbetrieb startet auch die automatische ZÃ¼ndung der SPS. Null deaktiviert die entsprechende Freigabe; Kernziel null deaktiviert das Kernkriterium.

**Timer:** Dauer 1â€“9999 Minuten einstellen, starten, pausieren und zurÃ¼cksetzen. Lauf- und Restzeit kommen direkt von der SPS. Heizung und Rauch sind vom Timerstart getrennt. Pause/Reset und Pi-Abschaltung verlangen Heizung und Rauch aus; Reset und Abschaltung auÃŸerdem einen pausierten Timer.

**Verbindung:** Sprache Ã¤ndern, Zustand aktualisieren, Kopplung auf diesem Handy entfernen oder Pi herunterfahren. Die App kann den ausgeschalteten Pi nicht wieder einschalten. Herunterfahren schaltet den Pi aus und ist kein Abschalten der Ofen-Stromversorgung.

Bei Verbindungsproblemen stehen Werte auf nicht verfÃ¼gbar und die Bedienung wird gesperrt. Die App wiederholt keine unbestÃ¤tigten Befehle. Nach einer Fehlermeldung den tatsÃ¤chlichen Zustand prÃ¼fen. Das SPS-Programm lÃ¤uft selbststÃ¤ndig weiter; die App ist kein Not-Aus. Automatikbetrieb und nicht unterstÃ¼tzte Temperatureinheiten sperren die manuelle Bedienung.

**Demo** verwendet ausschlieÃŸlich Beispieldaten und verbindet sich mit keinem Ofen. Auch die Web-App unterstÃ¼tzt echte Kopplung und Fernzugriff. Sie speichert die Kopplung verschlÃ¼sselt im jeweiligen Browserprofil; native Apps verwenden den geschÃ¼tzten Betriebssystemspeicher. Die Details stehen in der [Web-App-Anleitung](docs/WEB-APP.md).

## Android und iPhone installieren

Die Build-Anleitung steht in [mobile/README](mobile/README.md). Ein Android-Vorschau-APK kann als Datei installiert werden. FÃ¼r dauerhaft verteilte Updates einen eigenen gleichbleibenden SignierschlÃ¼ssel verwenden.

Eine unsignierte iPhone-IPA lÃ¤sst sich nicht direkt installieren. FÃ¼r einen privaten Test ist eine persÃ¶nliche Signierung erforderlich; ein mÃ¶glicher Weg Ã¼ber Windows ist [Sideloadly](https://sideloadly.io/), dessen kostenlose Signierungen laut Anbieter nach sieben Tagen erneuert werden mÃ¼ssen. Apple-Zugangsdaten ausschlieÃŸlich selbst im Anbieterfenster eingeben. FÃ¼r eine bequeme Ã¶ffentliche App-Store-Verteilung werden die erforderliche Entwicklerregistrierung, Signierung und Store-PrÃ¼fung separat eingerichtet. Die App kann fÃ¼r ihre Nutzer dabei kostenlos bleiben.

macOS 13 Ventura kann das fÃ¼r diesen Expo-SDK-58-Build benÃ¶tigte Xcode 26.4+ nicht ausfÃ¼hren. Die GitHub-Builds verwenden einen gehosteten aktuellen Mac. Der Nutzer benÃ¶tigt fÃ¼r die Bedienung der App keinen Mac.

## Betreiber des kostenlosen Vermittlungsdienstes

Nur der Projektbetreiber richtet den Dienst einmalig ein: [cloud/README](cloud/README.md). Das kostenlose Cloudflare-Kontingent wird nicht automatisch in ein kostenpflichtiges Abo umgewandelt; beim Erreichen der Gratisgrenzen kann die Verbindung ausfallen. Ein Ã¶ffentlicher Dienst fÃ¼r viele Nutzer erfordert KapazitÃ¤tsplanung und Wartung. [Offizielle Tarifgrenzen](https://developers.cloudflare.com/durable-objects/platform/pricing/).

[Datenschutz und SchlÃ¼ssel](docs/PRIVACY.md) Â· [PrÃ¼fstand](docs/VALIDATION.md) Â· [GitHub-Anleitung](docs/GITHUB.de.md) Â· [English](README.en.md)

## Vorschau

![Drevos â€“ Beispielansicht](docs/assets/drevos-app-demo.jpg)

Drevos-App 0.3.1 â€“ Web-App im Demomodus mit Beispielwerten.

## Mitwirkende

Erstellt von **Thomas Eigner**, mit KI-UnterstÃ¼tzung durch **ChatGPT (OpenAI)** bei Entwicklung, Tests und Dokumentation. [Alle Mitwirkenden](CONTRIBUTORS.md).

## Projekt unterstÃ¼tzen

Wenn dir dieses Projekt hilft, kannst du die Weiterentwicklung mit einer freiwilligen Spende Ã¼ber PayPal unterstÃ¼tzen. Vielen Dank!

[![Ãœber PayPal spenden](https://img.shields.io/badge/Donate-PayPal-0070BA?logo=paypal&logoColor=white)](https://www.paypal.com/donate/?hosted_button_id=GSMP9644VUY8C)

Alternativ kannst du den QR-Code scannen:

[![PayPal-Spenden-QR-Code](docs/assets/paypal-donate-qr.png)](https://www.paypal.com/donate/?hosted_button_id=GSMP9644VUY8C)
