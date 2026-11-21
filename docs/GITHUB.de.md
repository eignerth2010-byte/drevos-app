# GitHub und VerÃ¶ffentlichung â€“ Deutsch

## Inhalt des Ã¶ffentlichen Projekts

Quellcode von App, Pi-Gateway, Pi-Cloud-Agent, Relay und Installern; Tests, Dokumentation, Lizenz und freigegebene Bilddateien. Private SchlÃ¼ssel und Konfigurationen gehÃ¶ren nicht dazu. Der ursprÃ¼ngliche SPS-Projektstand und persÃ¶nliche Fotos werden nicht verteilt.

## Eigenes Repository verwenden

1. Mit dem eigenen GitHub-Konto anmelden und ein Ã¶ffentliches Repository erstellen, beispielsweise `drevos-app`.
2. Die Projektdateien hochladen oder einen lokalen Git-Checkout verÃ¶ffentlichen. `.gitignore` beachten; `node_modules`, native Build-Ausgaben und private Dateien bleiben lokal.
3. **Actions â†’ Drevos App** Ã¶ffnen. Den Workflow manuell mit **Run workflow** starten. `build_ios` einschalten, wenn zusÃ¤tzlich die unsignierte iPhone-Datei benÃ¶tigt wird.
4. Erst bei grÃ¼nen PrÃ¼fungen die erzeugten Dateien unter **Artifacts** herunterladen. Android-APK und unsignierte iPhone-IPA deutlich unterschiedlich kennzeichnen. Die Artefakte laufen nach 14 Tagen ab.
5. FÃ¼r eine dauerhafte VerÃ¶ffentlichung einen Vorschau-Release anlegen und die geprÃ¼ften Dateien, Quellpaket, Lizenztexte und SHA-256-PrÃ¼fsummen anhÃ¤ngen. Tests und EinschrÃ¤nkungen aus `docs/VALIDATION.md` Ã¼bernehmen. Einen Vorschau-Build nicht als geprÃ¼ftes Serienprodukt bezeichnen.

Das GitHub-Repository allein stellt keinen Fernzugriffsdienst bereit. Dessen Betreiber richtet einmalig den [Relay-Dienst](../cloud/README.md) ein und trÃ¤gt dessen tatsÃ¤chliche Ã¶ffentliche Adresse in `cloud/endpoint.json` ein. Diese Adresse ist kein Geheimnis; GerÃ¤te-SchlÃ¼ssel und Kopplungscodes sind es.

## App-Signierung und Updates

Die mitgelieferten App-IDs lauten `at.eignerth.drevos`. Bei einer eigenen VerÃ¶ffentlichung vor dem ersten Release eigene Bundle-/Paketkennungen und einen dauerhaft privat verwahrten SignierschlÃ¼ssel einrichten. Android-Vorschau-Builds verwenden eine Testsignatur. FÃ¼r iPhone-GerÃ¤te ist eine persÃ¶nliche oder regulÃ¤re Apple-Signierung nÃ¶tig; eine unsignierte IPA ist nicht direkt installierbar.

Store-EintrÃ¤ge, Entwicklerkonten, VertrÃ¤ge, DatenschutzauskÃ¼nfte und Store-PrÃ¼fungen sind separate Schritte. Die App darf fÃ¼r Nutzer kostenlos angeboten werden; damit werden mÃ¶gliche Betreiber- oder Store-GebÃ¼hren nicht automatisch ausgeschlossen. Keine kostenpflichtigen Konten oder Abos werden durch diese Dateien angelegt.

FÃ¼r Updates die native App-Version, Buildnummern und den PrÃ¼fstand aktualisieren. Das Gateway-/Relay-Protokoll ist ausdrÃ¼cklich versioniert. Ã„nderungen an Registerprofil, VerschlÃ¼sselung oder Befehlsverarbeitung brauchen entsprechende Tests. Bestehende private Konfigurationen niemals durch Beispielwerte ersetzen.

## Lizenzen und Marke

Der eigene Quellcode steht seit dem Lizenzwechsel unter der [Free-Use-Lizenz](../LICENSE): private und betriebsinterne Nutzung kostenlos; Verkauf und kommerzielle Weitergabe nur mit vorheriger schriftlicher Freigabe von Thomas Eigner. [FrÃ¼here MIT-Fassungen und Einzelheiten](LICENSING.md). AbhÃ¤ngigkeiten behalten ihre jeweiligen Bedingungen; verfÃ¼gbare Texte liegen im App-Paket. Der neue Projekt-Schriftzug steht unter der Projektlizenz; Hersteller-Markenrechte sind davon ausgenommen. Herstellerzustimmung zu einer Ã¶ffentlichen Markenverwendung oder Store-Verteilung wird nicht behauptet. Siehe `mobile/BRAND-NOTICE.md`.
