# GitHub und Veröffentlichung – Deutsch

## Inhalt des öffentlichen Projekts

Quellcode von App, Pi-Gateway, Pi-Cloud-Agent, Relay und Installern; Tests, Dokumentation, Lizenz und freigegebene Bilddateien. Private Schlüssel und Konfigurationen gehören nicht dazu. Der ursprüngliche SPS-Projektstand und persönliche Fotos werden nicht verteilt.

## Eigenes Repository verwenden

1. Mit dem eigenen GitHub-Konto anmelden und ein öffentliches Repository erstellen, beispielsweise `drevos-app`.
2. Die Projektdateien hochladen oder einen lokalen Git-Checkout veröffentlichen. `.gitignore` beachten; `node_modules`, native Build-Ausgaben und private Dateien bleiben lokal.
3. **Actions → Drevos App** öffnen. Den Workflow manuell mit **Run workflow** starten. `build_ios` einschalten, wenn zusätzlich die unsignierte iPhone-Datei benötigt wird.
4. Erst bei grünen Prüfungen die erzeugten Dateien unter **Artifacts** herunterladen. Android-APK und unsignierte iPhone-IPA deutlich unterschiedlich kennzeichnen. Die Artefakte laufen nach 14 Tagen ab.
5. Für eine dauerhafte Veröffentlichung einen Vorschau-Release anlegen und die geprüften Dateien, Quellpaket, Lizenztexte und SHA-256-Prüfsummen anhängen. Tests und Einschränkungen aus `docs/VALIDATION.md` übernehmen. Einen Vorschau-Build nicht als geprüftes Serienprodukt bezeichnen.

Das GitHub-Repository allein stellt keinen Fernzugriffsdienst bereit. Dessen Betreiber richtet einmalig den [Relay-Dienst](../cloud/README.md) ein und trägt dessen tatsächliche öffentliche Adresse in `cloud/endpoint.json` ein. Diese Adresse ist kein Geheimnis; Geräte-Schlüssel und Kopplungscodes sind es.

## App-Signierung und Updates

Die mitgelieferten App-IDs lauten `at.eignerth.drevos`. Bei einer eigenen Veröffentlichung vor dem ersten Release eigene Bundle-/Paketkennungen und einen dauerhaft privat verwahrten Signierschlüssel einrichten. Android-Vorschau-Builds verwenden eine Testsignatur. Für iPhone-Geräte ist eine persönliche oder reguläre Apple-Signierung nötig; eine unsignierte IPA ist nicht direkt installierbar.

Store-Einträge, Entwicklerkonten, Verträge, Datenschutzauskünfte und Store-Prüfungen sind separate Schritte. Die App darf für Nutzer kostenlos angeboten werden; damit werden mögliche Betreiber- oder Store-Gebühren nicht automatisch ausgeschlossen. Keine kostenpflichtigen Konten oder Abos werden durch diese Dateien angelegt.

Für Updates die native App-Version, Buildnummern und den Prüfstand aktualisieren. Das Gateway-/Relay-Protokoll ist ausdrücklich versioniert. Änderungen an Registerprofil, Verschlüsselung oder Befehlsverarbeitung brauchen entsprechende Tests. Bestehende private Konfigurationen niemals durch Beispielwerte ersetzen.

## Lizenzen und Marke

Der eigene Quellcode steht unter MIT. Abhängigkeiten behalten ihre jeweiligen Bedingungen; verfügbare Texte liegen im App-Paket. Das bereitgestellte Drevos-Logo und Markenrechte sind aus der MIT-Lizenz ausgenommen. Herstellerzustimmung zu einer öffentlichen Markenverwendung oder Store-Verteilung wird nicht behauptet. Siehe `mobile/BRAND-NOTICE.md`.
