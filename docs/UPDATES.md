# App-Updates, Versionsnummer und Änderungsfenster / App updates

## 0.3.1 – Schriftzug und Lizenz / Wordmark and license

Eigener vorläufiger Drevos-Schriftzug statt Herstellerlogo. Nutzung privat und
im eigenen Betrieb bleibt kostenlos. Verkauf, kommerzielle Weitergabe und
Bündelung mit angebotenen Öfen oder anderen Produkten benötigen vorherige
schriftliche Freigabe von Thomas Eigner. Frühere MIT-Fassungen behalten ihre
Rechte. [Lizenzdetails](LICENSING.md).

Temporary community wordmark and revised terms: private and internal business
use are free; resale, commercial redistribution and commercial bundling require
prior written permission. Earlier MIT versions retain their rights.

Android 0.3.1 wird als Update mit demselben Paketnamen und derselben Testsignatur
bereitgestellt. Vorhandene App aktualisieren, nicht deinstallieren. Die Web-App
lädt den neuen Stand beim nächsten Öffnen; kein Downloadhinweis. Die bisherige
iPhone-IPA bleibt unverändert auf 0.2.0; aktueller iOS-Quellcode ist enthalten.
Die Pi-Dienste und die Kopplung benötigen keine Änderung.

## Deutsch

Ab Version **0.3.0** gibt es einen eigenen **Info-Tab** mit „Erstellt von Thomas Eigner“, Projekt- und Installationslinks sowie einem freiwilligen PayPal-Spendenbutton. Die Versionsnummer steht dort und in der Fußzeile neben **Web-App** beziehungsweise **Eigenständige App**. Die Spende schaltet keine Funktionen frei; die App kann weiterhin kostenlos verwendet werden.

### Android-APK

Die alte APK muss einmal auf diese Version aktualisiert werden, damit die neue Updateprüfung verfügbar ist. Im Info-Tab lässt sich **Automatisch nach Updates suchen** ein- und ausschalten. Die automatische Prüfung ist anfangs eingeschaltet und erfolgt beim Öffnen oder erneuten Aktivieren der App, normalerweise höchstens einmal pro 24 Stunden. **Jetzt prüfen** kann unabhängig davon verwendet werden.

Die App liest eine kleine öffentliche Versionsdatei aus diesem GitHub-Projekt. Sie sendet dabei keine Kopplungsschlüssel oder Ofenwerte. GitHub erhält übliche Verbindungsdaten wie die IP-Adresse. Ein neuerer Android-Versionscode erzeugt einen Hinweis und den Button **Update herunterladen**. Der Button öffnet die APK aus einer Veröffentlichung dieses Projekts im Browser. Das Laden oder Prüfen einer Version löst keinen Ofenbefehl aus.

Den Download öffnen und die Installation **am Android-Gerät bestätigen**. Diese App installiert keine APK unbemerkt und lädt keine JavaScript-Änderungen an der Android-Paketinstallation vorbei nach. Eine installierbare Aktualisierung benötigt denselben Paketnamen und eine passende Signatur. Die bestehende App aktualisieren, statt sie vorher zu deinstallieren, damit ihre gespeicherte Kopplung erhalten bleiben kann. [Android-Dokumentation zur Installationsbestätigung](https://developer.android.com/reference/android/content/pm/PackageInstaller.SessionParams#setRequireUserAction(int)).

### Web-App

Für die Web-App wird keine APK installiert. Neu veröffentlichte Dateien werden beim nächsten Öffnen automatisch geladen. Es gibt keinen Hinweis „Neue Version verfügbar“ und keinen Button zum Laden eines Updates. Eine bereits offene Sitzung wird nicht automatisch neu geladen; so wird kein Ofenbefehl unterbrochen. Die App bei Bedarf vollständig schließen und wieder öffnen. Die Website-Adresse und die dort gespeicherte Kopplung bleiben bei einem normalen Update gleich.

### Was ist neu?

Beim ersten Start einer noch nicht bestätigten App-Version öffnet sich das Fenster **Was ist neu?**. **Alles klar** merkt sich die Versionsnummer auf diesem Gerät. Später lässt sich die Übersicht im Info-Tab erneut öffnen. Der Hinweis wird während Kopplung, Bestätigungsdialogen und laufenden App-Befehlen zurückgestellt.

Android speichert Updateeinstellung und gelesene Version getrennt von der Ofenkopplung im geschützten Speicher. Die Web-App speichert ausschließlich die zuletzt bestätigte öffentliche Versionsnummer in `localStorage`; die Kopplung bleibt in ihrem getrennten verschlüsselten Browser-Speicher. Werden Website-Daten gelöscht, kann der Hinweis erneut erscheinen.

### Für Projektbetreiber eine weitere APK veröffentlichen

1. App-Version, Android-`versionCode` und die übersetzten Änderungen in `mobile/src/project.ts` aktualisieren. Ein Update braucht einen höheren Android-Versionscode.
2. Die Prüfungen und den Android-Build ausführen; Signatur und Paketkennung vor einer Verteilung kontrollieren.
3. Die fertige APK in einer GitHub-Veröffentlichung dieses Repositorys hochladen und den echten Download prüfen.
4. **Erst danach** `mobile/public/android-update.json` auf veröffentlichte Version, Versionscode, tatsächliche APK-Adresse und SHA-256 setzen. Die App liest genau diese Datei über die öffentliche GitHub-Rohdatei-Adresse; der Web-Export enthält ebenfalls eine Kopie.
5. Quellcode veröffentlichen und die Web-App neu bauen/veröffentlichen, wenn ihre Programmversion geändert wurde.

Die Updateprüfung akzeptiert ausschließlich HTTPS-APK-Links unter `github.com/eignerth2010-byte/drevos-app/releases/download/`. Die SHA-256 in der Datei dokumentiert die veröffentlichte APK; die App lädt sie im externen Browser und behauptet daher keine eigene kryptografische Prüfung des heruntergeladenen Pakets. Android prüft die Paketsignatur bei der Installation.

## English

Version **0.3.0** adds an **Info** tab with creator Thomas Eigner, project/setup links and an optional PayPal donation button. The version appears there and beside **Web app / Standalone app** in the footer. Donations do not unlock features.

**Android:** install this version once to receive the new update-check feature. **Check for updates automatically** defaults to enabled. It checks on launch/foreground return, normally at most daily; **Check now** works manually. Only public release metadata is fetched from this GitHub project. No oven values or pairing credentials are sent; GitHub still sees normal request metadata such as the IP address. A newer version code offers **Download update**, opening this project's GitHub APK in the browser. Confirm installation on Android. The app does not silently install packages or bypass APK installation with downloaded JavaScript. Update the existing app with a matching package/signature rather than uninstalling it first.

**Web app:** no APK installation is needed. New files load automatically on the next opening. There is no update-available banner or load-update button. An already open session is never forcibly reloaded, so oven commands are not interrupted. Fully close and reopen the app if needed. A normal update retains the same origin and pairing.

**What’s new?** appears on first opening an unacknowledged app version. **Got it** saves the version locally. Reopen the notes in Info at any time. Pairing, confirmation dialogs and app commands defer the modal. Android stores these preferences separately in protected storage; the browser stores only the acknowledged public version in `localStorage`, separately from encrypted pairing.

**Maintainers:** increase the version/code and translated notes, run checks/builds, verify signing, publish the APK and verify its real download. Only then update `mobile/public/android-update.json` with that version, code, actual GitHub APK URL and SHA-256. Publish the source and rebuild/deploy changed web code. The checker accepts only HTTPS APKs from this project's release path. The hash records the published artifact; browser-based downloading is not represented as in-app APK hash verification. Android verifies package signing during installation.
