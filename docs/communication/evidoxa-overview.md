# Evidoxa — Funktionsübersicht

Evidoxa ist eine webbasierte Forschungsdatenbank für historische Projekte. Mehrere Benutzer arbeiten gemeinsam in Projekten; alle Daten sind projektisoliert.

---

## Kernentitäten

- **Personen** — Vollständige Profile mit partiellen Datumsangaben (nur Jahr, Jahr+Monat oder vollständig), Geburts- und Sterbeort, Namensvarianten (mit Sprachkennzeichnung), Notizen. Alle Datumsangaben haben einen Unsicherheitsgrad: _Sicher / Wahrscheinlich / Möglich / Unbekannt_.
- **Ereignisse** — Titel, Beschreibung, benutzerdefinierte Ereignistypen (mit Farbe), Zeitraum mit Unsicherheit, Ort, hierarchische Unterereignisse.
- **Primärquellen** — Archivalien, Briefe, Fotografien, Zeitungsartikel u. a.; mit Archiv, Signatur, URL und Zuverlässigkeitsstufe.
- **Orte** — Normalisierte Ortsdatenbank mit Geocodierung (Nominatim), historischen Namensvarianten (z. B. Konstantinopel → Istanbul), interaktiver Karte.
- **Literatur** — Sekundärliteratur mit vollständigen bibliographischen Feldern; Zotero-Sync und RIS-Import; Export als BibTeX/Chicago.

---

## Beziehungsmodell

Beliebige Entitäten (Person, Ereignis, Quelle, Ort) können miteinander verknüpft werden. Beziehungstypen sind pro Projekt frei definierbar (Name, Gegenrichtungsname, Farbe, Icon, erlaubte Entitätstypen). Jede Beziehung hat einen Unsicherheitsgrad und kann mit Primärquellen als Belege versehen werden.

Zusätzlich kann jeder einzelne Datenpunkt einer Entität (z. B. Geburtsjahr) direkt mit einer Primärquelle belegt werden (_PropertyEvidence_), inklusive Zitat und Transkription.

---

## Datenqualität & Verwaltung

- Suchfunktion über alle Entitäten gleichzeitig (Volltext)
- Massenlöschung und Massenoperationen in Listenansichten
- CSV- und XLSX-Import mit Vorschau, Validierung, Dublettenerkennung und Importhistorie
- Dublettenerkennung auch für manuell erfasste Daten (Review-Queue)
- Ungewissheits-Review-Queue: alle Felder mit _Möglich_ oder _Unbekannt_ auf einen Blick
- Vollständigkeitsbericht pro Projekt und Entitätstyp
- Waisenbericht: Entitäten und Quellen ohne Verknüpfungen

---

## Visualisierung & Entdeckung

- **Zeitstrahl** — Ereignisse auf einer Zeitachse, mit Personenlebenszeiten als Bänder; Filter nach Typ, Person, Ort, Zeitraum
- **Netzwerkgraph** — Interaktiver Kraft-gerichteter Graph aller Entitäten und Beziehungen; Filter nach Entitätstyp, Beziehungstyp, Mindestgewissheit; Knoten aufklappbar bis N Hops
- **Analytik-Dashboard** — Aktivitätsverlauf, Datenlücken (Personen ohne Geburtsdatum, verwaiste Quellen), Entitätsverteilung

---

## Export

- Personen/Ereignisse: CSV, JSON
- Quellen/Literatur: RIS, BibTeX
- Beziehungen: JSON-LD, CSV-Adjazenzliste
- Netzwerkgraph: GEXF (Gephi-kompatibel)
- Projektpaket: ZIP mit allem

---

## Zusammenarbeit & Zugriff

- Multi-Projekt-Workspaces mit Rollenmodell: _Eigentümer / Editor / Betrachter_
- Einladung per E-Mail; Betrachter können keine Datensätze anlegen oder ändern
- Aktivitätsprotokoll pro Entität (wer hat wann was geändert)

---

## KI-Assistent (geplante Erweiterung)

Ein optionaler KI-Assistent arbeitet ausschließlich auf den im System hinterlegten Primärquellen. Er kann keine Daten direkt schreiben, sondern nur _Vorschläge_ einreichen (z. B. fehlendes Geburtsjahr, mögliche Duplikate, neue Beziehungen). Jeder Vorschlag muss mit einer vorhandenen Quelle belegt sein und wird vom Historiker explizit angenommen oder abgelehnt. Geplant sind außerdem ein quellengebundener Forschungs-Chat und ein PDF-Viewer mit Regions-Annotation, der Belegstellen direkt auf den Scan-Pixel zurückführt.

---

## Technischer Betrieb

- Webapplikation, browserbasiert, kein lokaler Client nötig
- Deutsche und englische Oberfläche (umschaltbar)
- Helles und dunkles Farbschema
