# Welcher Pi und welches Kabel? / Pi and cable requirements

[Einfache Installation auf Deutsch](INSTALLATION.de.md) · [English installation](INSTALLATION.en.md)

## Deutsch

Der geprüfte Referenzaufbau verwendet einen **Raspberry Pi 3 B+**, Raspberry Pi OS (64-bit) und ein **DTECH USB-auf-RS232-DB9-Kabel mit FTDI-Chipsatz**. Die Software spricht über USB mit der Steuerung; für die folgenden Pi-Modelle wird dasselbe Programm verwendet. Physisch geprüft wurde hier der 3 B+, nicht jedes aufgeführte Modell.

| Pi | Netzteil für diesen Aufbau | Netzwerk | Kabelanschluss |
|---|---|---|---|
| **3 B+ – geprüfter Aufbau** | Geeignetes 5-V-/2,5-A-Netzteil, Micro-USB | LAN oder WLAN | Datenkabel direkt in USB-A |
| 3 B | Geeignetes 5-V-/2,5-A-Netzteil, Micro-USB | LAN oder 2,4-GHz-WLAN | Datenkabel direkt in USB-A |
| 4 B | Geeignetes 5-V-/3-A-Netzteil, USB-C | LAN oder WLAN | Datenkabel direkt in USB-A |
| Zero 2 W | Geeignetes 5-V-/2,5-A-Netzteil, Micro-USB, mit Reserve für USB-Adapter | 2,4-GHz-WLAN | Zusätzlich Micro-USB-OTG auf USB-A-Buchse; an den Anschluss **USB**, Strom an **PWR IN** |

Dies sind Netzteilempfehlungen einschließlich angeschlossener USB-Peripherie, keine Angaben zum dauernden Stromverbrauch. Ein Pi 4 benötigt für dieses Programm keine bestimmte große RAM-Ausstattung; eine eigenständige Pi-Installation mit Raspberry Pi OS Lite vermeidet einen unnötigen Desktop.

Zusätzlich werden eine microSD-Karte (für die Anleitung 16 GB oder größer), Kartenleser zur Einrichtung, passendes Gehäuse, ein PC/Mac und ein Smartphone benötigt. Pi und Handy brauchen für den Fernzugriff Internet. Pi und Netzteil außerhalb von Hitze und Feuchtigkeit des Ofens aufstellen.

### Das konkret verwendete Datenkabel

- **DTECH USB auf RS232 DB9, FTDI-Chipsatz, 1,2 m, 9-poliger Stecker**.
- [Amazon-Produktseite, ASIN B08L4ZR5ZX](https://www.amazon.de/dp/B08L4ZR5ZX) · [vom Projektbetreiber genannter Kurzlink](https://amzn.eu/d/09AhpHpc).
- Vom Betreiber als verwendetes Kabel genannt; auf dem laufenden Pi wurde dazu ein FTDI-Adapter mit USB-Kennung `0403:6001` erkannt.
- Pi-Seite: USB-A. Ofenseite: passender RS232-DB9-Anschluss der bestätigten Steuerung. Beim Zero 2 W kommt der oben genannte OTG-Adapter dazwischen.

**Vor dem Kauf den Anschluss und die Schnittstelle deines Ofens prüfen.** Ein 9-poliger Stecker allein bestätigt weder Pinbelegung noch Steuerungskompatibilität. RS232, RS422/RS485 und TTL sind verschiedene elektrische Schnittstellen. Einen beliebigen USB-TTL-Adapter oder GPIO-Pins nicht anstelle des bestätigten RS232-Aufbaus anschließen. Für eine andere Steuerung kann ein anderer Adapter erforderlich sein; hier wird keine ungeprüfte Pinbelegung vorgegeben.

Auch die Software muss zur Steuerung passen: unterstützt ist das geprüfte Profil **`drevos_fx3u_v1`**. Das Logo oder die Bezeichnung Drevos allein reichen als Kompatibilitätsnachweis nicht aus.

## English

The verified reference installation uses a **Raspberry Pi 3 B+**, 64-bit Raspberry Pi OS and the **DTECH USB-to-RS232 DB9 cable with an FTDI chipset** linked above. Pi 3 B, 3 B+, 4 B and Zero 2 W use the same software. Only the 3 B+ has been physically tested here.

| Pi | Recommended supply for this setup | Network | Data connection |
|---|---|---|---|
| **3 B+ – verified** | Suitable 5 V / 2.5 A Micro-USB supply | Ethernet or Wi-Fi | USB-A directly |
| 3 B | Suitable 5 V / 2.5 A Micro-USB supply | Ethernet or 2.4 GHz Wi-Fi | USB-A directly |
| 4 B | Suitable 5 V / 3 A USB-C supply | Ethernet or Wi-Fi | USB-A directly |
| Zero 2 W | Suitable 5 V / 2.5 A Micro-USB supply with USB-peripheral headroom | 2.4 GHz Wi-Fi | Micro-USB OTG to USB-A female in **USB**; separate power in **PWR IN** |

Provide a microSD card (16 GB or larger for this guide), card reader, enclosure, setup computer and smartphone. Use Raspberry Pi OS Lite and keep the electronics away from oven heat/moisture. Both Pi and phone require internet for remote use. Supply ratings include peripheral headroom and are not continuous power consumption figures.

The owner identified **DTECH USB to RS232 DB9, FTDI, 1.2 m, 9-pin male, ASIN B08L4ZR5ZX** as the installed cable. The live Pi enumerates an FTDI adapter (`0403:6001`). This identifies the reference setup, not universal compatibility. Check the oven's connector, electrical interface and pinout before buying. RS232 is electrically different from RS422/RS485 and TTL; do not substitute a random TTL adapter or direct GPIO wiring. A different controller may require different hardware.

The controller must also match the supported **`drevos_fx3u_v1`** profile. A Drevos badge alone does not establish compatibility.

## Quellen / Sources

- [Raspberry Pi hardware and recommended supplies](https://www.raspberrypi.com/documentation/computers/raspberry-pi.html#power-supply)
- [Raspberry Pi setup and network options](https://www.raspberrypi.com/documentation/computers/getting-started.html)
- [Owner-specified DTECH product listing](https://www.amazon.de/dp/B08L4ZR5ZX)
