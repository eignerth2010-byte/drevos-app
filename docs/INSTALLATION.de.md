# Einfach starten – Pi und Drevos-App installieren

**Home Assistant funktioniert bereits? [Den vorhandenen Pi für die App weiterverwenden](HA-UND-APP.de.md#a-home-assistant-funktioniert-schon-die-app-soll-dazukommen).** Für gemeinsamen Betrieb: [HA und App – was brauche ich zusätzlich?](HA-UND-APP.de.md)

[English](INSTALLATION.en.md) · [Materialliste mit Pi-Modellen und Kabel](HARDWARE.md) · [Zur Projektstartseite](../README.md)

Diese Anleitung führt von einem neuen Raspberry Pi bis zu den echten Ofentemperaturen auf dem Handy. Web-App und native Handy-App verwenden **dieselbe Pi-Installation**.

**Dein Pi und die Drevos-App funktionieren bereits? Dann nichts neu installieren und keine Speicherkarte überschreiben.** Für ein weiteres Handy bei [Schritt 7](#7-drevos-auf-dem-handy-installieren) beginnen; zum erneuten Öffnen des QR-Codes zu [Schritt 8](#8-handy-und-ofen-koppeln) springen.

**Was bedeutet „DEIN-DIENST.DEIN-KONTO“?** Das war ein Beispiel für Entwickler mit einem eigenen Server. Für die normale Installation musst du dort **nichts einsetzen**. Der gemeinsame Dienst ist im Projekt bereits eingetragen. Du brauchst kein Cloudflare-Konto, kein Home Assistant und kein VPN.

## 1 Was du brauchst

| Teil | Was genau? |
|---|---|
| Ofen | Drevos mit dem geprüften Steuerungsprofil `drevos_fx3u_v1`. Gleicher Markenname bedeutet nicht automatisch gleiche Steuerung. |
| Raspberry Pi | **Pi 3 B+ ist der geprüfte Referenzaufbau.** Pi 3 B, Pi 4 B und Zero 2 W sind softwareseitig vorgesehen; ihre Unterschiede stehen in der [Materialliste](HARDWARE.md). |
| Netzteil | Zum Pi passend: beim 3 B/3 B+ Micro-USB, beim 4 B USB-C. Leistungsangaben stehen in der Materialliste. |
| Speicher | microSD-Karte; für diese Anleitung 16 GB oder größer, dazu ein Kartenleser am PC. |
| Datenkabel zum Ofen | Im Referenzaufbau: **DTECH USB auf RS232 DB9, FTDI, 1,2 m** – [genauer Produktlink](https://www.amazon.de/dp/B08L4ZR5ZX). Der 9-polige Anschluss und die elektrische Schnittstelle müssen zu deinem Ofen passen. |
| Zusätzlich beim Zero 2 W | Micro-USB-OTG-Adapter auf USB-A-Buchse am Datenanschluss. Das Netzteil kommt an den getrennten Stromanschluss. |
| Netzwerk | Internet am Pi über WLAN oder Netzwerkkabel und am Handy über WLAN/mobile Daten. Zum Koppeln zunächst dasselbe Heimnetz verwenden. |
| Zur Einrichtung | Windows-PC oder Mac; Handy mit Kamera und aktuellem Browser. |

Der Projektbetreiber hat das verlinkte DTECH-Kabel als verwendetes Kabel angegeben; der laufende Pi erkennt einen FTDI-Adapter. Das bestätigt den Referenzaufbau, keine beliebige andere Ofensteuerung. Bei unklarer Buchse oder Steuerung vor dem Anschluss fachkundig prüfen lassen. Details: [Welcher Pi und welches Kabel?](HARDWARE.md).

## 2 Nur bei einem neuen Pi die Speicherkarte vorbereiten

**Am PC oder Mac:**

1. [Raspberry Pi Imager](https://www.raspberrypi.com/software/) installieren und öffnen.
2. Dein Pi-Modell, **Raspberry Pi OS Lite (64-bit)** und die richtige microSD-Karte wählen.
3. Die Anpassungen vor dem Schreiben ausfüllen:

| Einstellung | Für diese Anleitung eintragen |
|---|---|
| Gerätename / Hostname | `drevos-pi` |
| Benutzername | `ofenadmin` |
| Passwort | Ein eigenes Passwort festlegen und privat aufbewahren. |
| WLAN | Eigenes Heimnetz und WLAN-Passwort; alternativ Netzwerkkabel. |
| Fernzugriff / SSH | Einschalten; Anmeldung mit dem eben festgelegten Passwort wählen. |

4. Auf die **richtige Speicherkarte** schreiben. Dabei wird deren bisheriger Inhalt gelöscht.
5. Karte in den Pi stecken, Netzwerk verbinden und das passende Netzteil anschließen. Den ersten Start einige Minuten abwarten.

Die Namen der Imager-Menüs können sich unterscheiden. [Offizielle bebilderte Anleitung](https://www.raspberrypi.com/documentation/computers/getting-started.html).

## 3 Vom PC am Pi anmelden

**Windows-PC:** Im Startmenü **Terminal** oder **PowerShell** öffnen. **Mac:** **Terminal** über die Suche öffnen. Dort eingeben:

```sh
ssh ofenadmin@drevos-pi.local
```

`ofenadmin` gilt für den neuen Pi aus Schritt 2. Bei einem bestehenden Pi den bereits eingerichteten Benutzernamen verwenden. Bei der ersten Verbindung den angezeigten Rechner prüfen und die Vertrauensabfrage nur für deinen Pi bestätigen. Danach das eigene Pi-Passwort eingeben. Dass dabei keine Zeichen erscheinen, ist normal.

**Erfolg erkennen:** Die Eingabezeile enthält jetzt den Namen deines Pi. Alle folgenden Befehle bis Schritt 6 werden in diesem angemeldeten Fenster ausgeführt, also **auf dem Pi**. Jeden Befehl einzeln kopieren und mit Enter starten. Bei einer Fehlermeldung zuerst diese klären, bevor du fortfährst.

## 4 Pi-Software herunterladen

**Auf dem Pi:**

```sh
sudo apt-get update
```

```sh
sudo apt-get install -y git python3 python3-venv python3-pip ca-certificates nano
```

```sh
cd ~
```

```sh
git clone https://github.com/eignerth2010-byte/drevos-app.git
```

```sh
cd ~/drevos-app
```

Falls der Ordner schon existiert: nicht löschen. Bei einer bereits funktionierenden Installation zu Schritt 7 springen; Hinweise für spätere Updates stehen weiter unten.

## 5 Verbindung zum Ofen einrichten

Den Pi über das passende Datenkabel mit dem vorgesehenen Anschluss der Ofensteuerung verbinden. Pi und Steuerung müssen eingeschaltet sein. Heizung und Rauch werden für die Einrichtung nicht eingeschaltet. Ein anderer Dienst darf die serielle Schnittstelle nicht gleichzeitig benutzen; eine vorhandene Drevos-Installation gemeinsam weiterverwenden, statt einen zweiten Gateway zu starten.

**Auf dem Pi:**

```sh
sudo sh scripts/install-gateway.sh
```

Das installiert die lokale Verbindung. Sie wird zunächst noch nicht gestartet und die Bedienung bleibt gesperrt.

Den erkannten Adapter anzeigen:

```sh
ls -l /dev/serial/by-id/
```

Es sollte ein Eintrag zum USB-Seriell-Adapter erscheinen. Bei keinem Eintrag Kabel/USB-Anschluss prüfen. Bei mehreren Adaptern muss der zum Ofen gehörende Eintrag eindeutig bestimmt werden.

Die Einstellungen lokal öffnen:

```sh
sudo nano /etc/drevos/gateway.json
```

Nur diese Punkte prüfen; **die übrigen Zeilen mit `id` und `token` unverändert lassen**:

- `serial_port`: Bei genau einem erkannten Adapter ist der Pfad bereits eingetragen. Ein Eintrag mit `CHOOSE_YOUR_VERIFIED_ADAPTER` muss durch den vollständigen Pfad des passenden Adapters ersetzt werden.
- `profile`: Für den geprüften Aufbau `drevos_fx3u_v1`. Diesen Namen einzutragen ersetzt keine Prüfung der tatsächlichen Steuerung.
- `bind`: Für eine neue reine App-Installation `127.0.0.1` beibehalten. Bei vorhandener HA-Verbindung ihre funktionierende LAN-Adresse erhalten und die [gemeinsame Anleitung](HA-UND-APP.de.md) verwenden.
- `allow_control`: Zunächst `false` lassen. Damit werden nur Werte gelesen.

In nano mit **Strg+O**, **Enter**, dann **Strg+X** speichern und schließen. Die Datei enthält einen privaten Schlüssel; ihren Inhalt nicht in Chats oder GitHub kopieren.

```sh
sudo systemctl enable --now drevos-gateway.service drevos-native-poweroff.path
```

## 6 Verbindung für die Handy-App installieren

**Auf dem Pi, weiterhin im Ordner `~/drevos-app`:** Genau diesen Befehl kopieren; keine Internetadresse ergänzen:

```sh
sudo sh scripts/install-cloud.sh
```

Er verwendet den bereits hinterlegten gemeinsamen Dienst `https://drevos-relay.eigner-th2010.workers.dev`. „Cloud“ bezeichnet hier nur die Verbindung, über die das Handy deinen Pi auch unterwegs erreicht. Die privaten Kopplungsschlüssel werden auf deinem Pi erzeugt.

Danach prüfen:

```sh
systemctl is-active drevos-gateway.service drevos-cloud.service
```

**Erwartet:** zweimal `active`. Beide Programme starten künftig automatisch mit dem Pi. Bei `failed`, `inactive` oder einer Fehlermeldung erst die Ursache klären.

## 7 Drevos auf dem Handy installieren

### Web-App auf dem iPhone oder iPad

1. [Drevos Web-App](https://drevos-smoker-control.thankfulchick1.chatgpt.site) in **Safari** öffnen.
2. **Teilen → Zum Home-Bildschirm** wählen und hinzufügen. Falls angeboten, **Als Web-App öffnen** aktivieren.
3. Das neue **Drevos-Symbol** öffnen und erst dort koppeln.

Die Web-App benötigt keine wöchentliche Apple-Signierung. Sie funktioniert mit derselben Pi-Installation wie die native App.

### Web-App auf Android

1. [Drevos Web-App](https://drevos-smoker-control.thankfulchick1.chatgpt.site) in Chrome öffnen.
2. Im Browsermenü **App installieren** oder **Zum Startbildschirm hinzufügen** wählen.
3. Drevos über das neue Symbol öffnen.

### Native Android-App als Alternative

Die [Android-Installationsdatei herunterladen](https://github.com/eignerth2010-byte/drevos-app/releases/download/v0.2.0-preview.1/Drevos-Android-0.2.0-Vorschau.apk), am Android-Gerät öffnen und die Installation dieses Vorschaupakets selbst bestätigen. Falls Android nach einer Erlaubnis für die Installationsquelle fragt, diese nur für den verwendeten Browser/Dateimanager und diese Installation freigeben. Danach Drevos öffnen. Die Pi-Schritte 4–6 gelten auch dafür; Node.js oder Android Studio brauchst du zum Installieren der fertigen APK nicht.

### Native iPhone-App als Alternative

Die veröffentlichte IPA ist **unsigniert** und lässt sich nicht einfach antippen und installieren. Dafür ist ein eigener signierter Build erforderlich. Die [Xcode-Anleitung](../mobile/README.md#local-native-projects) beschreibt die Vorbereitung. Im erzeugten Xcode-Workspace das App-Projekt wählen, unter **Signing & Capabilities** das eigene Team und die automatische Signierung wählen, das angeschlossene iPhone als Ziel auswählen und **Run** starten. Erforderliche Entwicklerfreigaben am eigenen Gerät bestätigen. Kostenlose Personal-Team-Builds müssen gewöhnlich nach sieben Tagen erneuert werden. Für die einfache Installation ohne Mac die Web-App oben verwenden.

## 8 Handy und Ofen koppeln

**PC und Handy zunächst im Heimnetz. Auf dem Pi angemeldet bleiben.** Dieser Befehl öffnet den privaten QR-Code für fünf Minuten; das Fenster dabei geöffnet lassen:

```sh
sudo /opt/drevos-cloud/.venv/bin/drevos-cloud --pair --pair-bind drevos-pi.local
```

Der Gerätename entspricht Schritt 2. Du musst keine IP-Adresse und keine Serveradresse einsetzen.

**Im Browser am PC** [Pi-Kopplungsseite öffnen](http://drevos-pi.local:8765).

**Am Handy:**

1. In Drevos **Ofen koppeln** wählen; in der Web-App anschließend **Kamera starten**.
2. Den Kamerazugriff erlauben und den QR-Code vom PC scannen.
3. **Ofen verbinden** drücken.
4. Kammer- und Kerntemperatur mit dem Ofendisplay vergleichen.
5. Auf der Pi-Seite **Fertig** drücken und den Browser-Tab mit dem privaten Code schließen.

Auf demselben Handy kann stattdessen **Code kopieren** auf der Pi-Seite und **Code einfügen** in Drevos verwendet werden. Den Code privat halten. Läuft die Frist ab, den Pi-Befehl erneut ausführen. Für ein weiteres eigenes Handy dieselben Kopplungsschritte wiederholen; den Pi nicht neu installieren.

## 9 Erst Werte prüfen dann Bedienung freigeben

Eine neue Installation kann zunächst nur lesen. Die echten Temperaturen müssen plausibel sein und zum Display passen. Vor der Freigabe muss feststehen, dass die SPS tatsächlich dem geprüften Registerprofil entspricht; passende Temperaturen allein bestätigen die Schreibadressen nicht.

**Nur nach dieser Prüfung** auf dem Pi dieselbe Datei wieder mit `sudo nano /etc/drevos/gateway.json` öffnen. Ausschließlich `"allow_control": false` in `"allow_control": true` ändern, speichern und den Dienst neu starten:

```sh
sudo systemctl restart drevos-gateway.service
```

Danach in Drevos aktualisieren. Die App prüft weitere Voraussetzungen wie Automatikbetrieb, Verbindung und Heiz-/Rauchzustand. Die Freigabe selbst schaltet weder Heizung noch Zündung ein.

## 10 Zugriff unterwegs prüfen

Am Handy WLAN ausschalten, mobile Daten einschalten, Drevos vollständig schließen und über sein Symbol wieder öffnen. Unter **Verbindung → Aktualisieren** frische Werte abrufen. Die Kopplung sollte erhalten bleiben. Der Pi zuhause braucht weiterhin Strom und Internet. Für den normalen Zugriff keine Router-Portfreigabe einrichten.

## Wenn etwas nicht funktioniert

| Was passiert? | Was tun? |
|---|---|
| `drevos-pi.local` wird nicht gefunden | Prüfen, ob PC, Handy und Pi im gleichen Heimnetz sind. Im Router nach dem Pi und seinem tatsächlichen Gerätenamen suchen. Ein vorhandener Pi kann anders heißen. |
| Pi hat einen anderen Namen | Im SSH-Befehl, im `--pair-bind`-Argument und in der Browseradresse den tatsächlichen Namen verwenden; beim Kopplungsbefehl zusätzlich `--pair-hostname` mit genau diesem Namen angeben. |
| `scripts/install-cloud.sh` wurde nicht gefunden | Zuerst auf dem Pi `cd ~/drevos-app` ausführen. Der Befehl gehört nicht in ein noch lokal angemeldetes Windows-Fenster. |
| Ordner `drevos-app` existiert bereits | Nicht löschen und keine Speicherkarte überschreiben. Bei laufendem System direkt koppeln; für Updates den Abschnitt unten lesen. |
| QR-Seite ist geschlossen | Kopplungsbefehl auf dem Pi erneut ausführen. Die Seite läuft nur fünf Minuten. |
| Temperaturen nicht verfügbar | Ofensteuerung, Datenkabel und Adapterpfad prüfen; außerdem die beiden Dienste aus Schritt 6. |
| Schalter sind gesperrt | Schritt 9 sowie Automatikbetrieb und Verbindung prüfen. Nicht durch unbestätigte Registeränderungen umgehen. |
| Kopplung nach Browserwechsel weg | Die installierte Web-App öffnen und dort koppeln. Safari und die Web-App können getrennte Daten verwenden. |

## Später aktualisieren

Bei einem bereits eingerichteten Pi **die vorhandene Speicherkarte und die privaten Konfigurationen behalten**. Vor einem Software-Update Ofenbetrieb beenden und die privaten Pi-Konfigurationen lokal sichern. Auf dem Pi im bestehenden Projektordner `git pull --ff-only` ausführen. Anschließend die beiden Installationsbefehle aus Schritt 5 und 6 erneut ausführen. Mit `sudo systemctl restart drevos-gateway.service drevos-cloud.service` beide Dienste neu starten und ihren Status wie in Schritt 6 prüfen. Bestehende Kopplungsschlüssel bleiben bei einem normalen Update erhalten. Bei lokalen Änderungen oder einer Fehlermeldung nicht mit Löschen oder erzwungenem Überschreiben fortfahren.

Wer einen eigenen Vermittlungsdienst betreiben möchte, findet dessen getrennte Entwickleranleitung unter [cloud/README](../cloud/README.md). Für die normale Installation ist dieser zusätzliche Schritt nicht nötig.
