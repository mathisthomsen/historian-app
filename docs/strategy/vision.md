# Evidoxa — Vision

Dieses Dokument ist **zusammengetragen, nicht neu formuliert**. Jeder Abschnitt hat
eine benannte Quelle; die Quellenübersicht steht am Ende. Wo eine Quelle fehlt,
steht ein `TODO(content-pass)`-Marker statt eines erfundenen Satzes.

**Zeitform-Disziplin.** Präsens steht in diesem Dokument ausschließlich für
Verhalten, das gegen `prisma/schema.prisma` oder eine ausgelieferte Route unter
`src/app/[locale]/` geprüft wurde. Alles andere steht im Futur oder ist ausdrücklich
als _geplant_ markiert und auf das zugehörige Epic in
[`roadmap.md`](./roadmap.md) verlinkt. Das Vorgängerdokument
(`docs/communication/evidoxa-overview.md`, gelöscht) hielt diese Trennung nicht ein
— die Marketing-Seite übernahm die Aussagen, und die Issues #97 und #99 sind das
Ergebnis.

---

## 1. Problem und Positionierung

Die Positionierung stammt wörtlich aus der Einleitung des ursprünglichen Roadmap-Dokuments
(`docs/specs/roadmap.md`, gelöscht — zuletzt vorhanden in Commit `56c83e3`):

> Full clean-slate rebuild. No data migration required. Target: **university MVP
> validation → future SaaS commercialization**. Highly complex data, easy to handle
> with a great UI, because the UX Concept keeps the complexity awy [sic] from the user.

Daraus die drei Festlegungen, die dieses Dokument trägt:

1. **Universitärer MVP zuerst, SaaS danach.** Die erste Zielgruppe ist die
   universitäre Forschung; eine Kommerzialisierung als SaaS ist als Folgeschritt
   vorgesehen, nicht als Startpunkt.
2. **Die Komplexität liegt im Datenmodell, nicht in der Oberfläche.** Historische
   Daten sind unvollständig, widersprüchlich und unscharf datiert
   (`docs/design-system/01-ux/research.md` §3.4). Evidoxa bildet das im Modell ab —
   partielle Daten, kategoriale Gewissheitsgrade, ein universeller Beziehungsgraph —
   und hält diese Komplexität per UX-Konzept von der Benutzerin fern.
3. **Was das Produkt ist:** eine webbasierte Forschungsdatenbank für historische
   Projekte (Formulierung aus `docs/communication/evidoxa-overview.md`, gelöscht).

`TODO(content-pass)` — **Erfolgskriterien der MVP-Validierung fehlen.** Keine Quelle
nennt, woran die universitäre Validierung gemessen wird, mit welchem Partner sie
stattfindet oder in welchem Zeitraum.

`TODO(content-pass)` — **Umfang der SaaS-Kommerzialisierung fehlt.** Die Roadmap-Einleitung
nennt sie als Ziel, beschreibt aber weder Preismodell noch Zielmarkt noch Abgrenzung
zum universitären Angebot.

Die abgeleiteten Produktentscheidungen zu dieser Positionierung sind in
[`decisions.md`](./decisions.md) (18 gesperrte Entscheidungen) festgehalten, der
Umsetzungsplan in [`roadmap.md`](./roadmap.md).

---

## 2. Die These: KI als transparente Forschungsassistenz

Wörtlich aus der Präambel von `docs/specs/ai_aided_roadmap.md` (gelöscht — zuletzt
vorhanden in Commit `56c83e3`):

> Core principle: The AI is a **Transparent Research Assistant**, never an author.
> Every agent claim must be grounded in an existing Source record. Historians retain
> full data sovereignty at all times.

Deutsche Wiedergabe (Übersetzung des obigen Originals, keine inhaltliche Ergänzung):

> Grundprinzip: Die KI ist eine **transparente Forschungsassistenz**, niemals eine
> Autorin. Jede Aussage eines Agenten muss durch einen vorhandenen Quellen-Datensatz
> belegt sein. Die Datenhoheit bleibt jederzeit vollständig bei den Historikerinnen
> und Historikern.

Die technische Absicherung dieser These ist in [`decisions.md`](./decisions.md)
als Entscheidungen 13–18 gesperrt: Agenten sollen **keine** Schreibrechte haben (nur
`AgentSuggestion`-Datensätze), jeder Vorschlag soll mindestens eine vorhandene
`Source.id` referenzieren, jede Übernahme soll ein explizites ACCEPT durch
EDITOR oder OWNER erfordern, und die Herkunft (`created_via`, `agent_name`) soll an der Entität
gespeichert werden.

**Nichts davon ist gebaut.** Die agentische Schicht ist Phase 6 der
[Roadmap](./roadmap.md) (Epics 6.0–6.3). Heute existiert im Schema lediglich die
Vorbereitung: `EntityActivity` ist append-only und trägt bereits die Felder
`agent_name` und `source_id` für spätere agenten-initiierte Aktionen
(`prisma/schema.prisma`, Zeilen 554–576).

---

## 3. Was Evidoxa heute kann

Jede Aussage in diesem Abschnitt ist gegen Schema oder Route geprüft; die
Belegstellen stehen in der Klammer, damit die Prüfung wiederholbar ist.

### Forschungsdaten

- **Personen** mit partiellen Datumsangaben (Jahr, Jahr+Monat oder vollständig),
  Geburts- und Sterbeort als Freitext, Notizen und Namensvarianten mit
  Sprachkennzeichnung und Primärnamen-Markierung.
  (`prisma/schema.prisma:195–242` (Person), `246–258` (PersonName); `src/app/[locale]/(app)/persons/page.tsx`,
  `persons/new`, `persons/[id]`, `persons/[id]/edit`)
- **Gewissheitsgrade** _Sicher / Wahrscheinlich / Möglich / Unbekannt_ — nicht nur
  für Datumsangaben, sondern getrennt auch für Orte.
  (`enum Certainty`, `prisma/schema.prisma:49`; `birth_date_certainty` 208,
  `birth_place_certainty` 210, `death_date_certainty` 215, `death_place_certainty` 217;
  `src/components/research/CertaintySelector.tsx`)
- **Ereignisse** mit Titel, Beschreibung, projektspezifischen Ereignistypen inklusive
  Farbe, Zeitraum mit eigener Gewissheit für Anfang und Ende, Ortsangabe mit eigener
  Gewissheit und hierarchischen Unterereignissen.
  (`prisma/schema.prisma:260–275` (EventType), `277–326` (Event), Unterereignisse über `parent_id` 281/313;
  `src/app/[locale]/(app)/events/…`)
- **Primärquellen** mit Titel, Typ, Autor, Datum als Freitext, Archiv, Signatur, URL
  und Zuverlässigkeitsstufe.
  (`prisma/schema.prisma:328–356`, `repository` 339, `call_number` 340, `url` 341,
  `reliability` 342; `src/app/[locale]/(app)/sources/…`)

### Beziehungsmodell

- **Person, Ereignis und Quelle, in jeder Kombination.** `Relation` speichert Typ und
  ID beider Seiten polymorph, mit Gewissheitsgrad und historischer Gültigkeitsspanne
  (`valid_from_*` / `valid_to_*`, ebenfalls mit Gewissheit). `enum EntityType` enthält
  zusätzlich `LOCATION` und `LITERATURE`, aber die Oberfläche bietet nur die drei
  genannten Typen an (`ALL_TYPES`, `src/components/relations/EntitySelector.tsx:36`,
  mit dem Lade-Switch für nur diese drei Typen in Zeilen 131–135) — Ort und Literatur
  kommen mit Epic 3.2/3.3. Für Beziehungen selbst gibt es keinen `EntityType`-Wert;
  eine Beziehung kann also nicht Ziel einer weiteren Beziehung sein.
  (`prisma/schema.prisma:440–481`, `enum EntityType` 41–47;
  `src/app/[locale]/(app)/relations/page.tsx`)
- **Beziehungstypen sind pro Projekt frei definierbar** — Name, Gegenrichtungsname,
  erlaubte Quell- und Zieltypen.
  (`prisma/schema.prisma:409–432`, `inverse_name` 414, `valid_from_types` 421;
  `src/app/[locale]/(app)/settings/relation-types/page.tsx`)
- **Belege an der Beziehung.** Jede Beziehung kann mit Primärquellen belegt werden,
  je Beleg mit Seitenangabe, Zitat und eigener Gewissheit.
  (`prisma/schema.prisma:486–504`, `page_reference` 491, `quote` 492, `confidence` 493)
- **Belege am einzelnen Datenfeld — bei Person, Ereignis und Quelle.** Jedes einzelne
  Feld einer dieser drei Entitäten (z. B. das Geburtsjahr) kann direkt mit einer
  Primärquelle belegt werden — mit Seitenangabe, normalisiertem Zitat, diplomatischer
  Transkription und eigener Gewissheit. `PropertyEvidenceBadge` ist ausschließlich in
  `PersonDetailCard.tsx`, `EventDetailCard.tsx` und `SourceDetailCard.tsx` eingebunden;
  für Beziehungsfelder gibt es keine feldweise Beleghistorie und kann es nicht geben,
  solange `EntityType` keinen `RELATION`-Wert kennt.
  (`prisma/schema.prisma:517–539`, `quote` 526, `raw_transcription` 527,
  `confidence` 528; `src/components/relations/PropertyEvidencePanel.tsx`,
  eingebunden über `PropertyEvidenceBadge.tsx`)

### Nachvollziehbarkeit

- **Aktivitätsprotokoll pro Entität** — wer wann welches Feld geändert hat, append-only,
  ohne Löschendpunkt.
  (`prisma/schema.prisma:554–576`, `old_value`/`new_value` 563–564;
  `src/components/relations/ActivityLog.tsx`, eingebunden in `PersonDetailTabs.tsx`,
  `EventDetailTabs.tsx`, `SourceDetailTabs.tsx`. Alter und neuer Wert werden im Schema
  gespeichert und von der API zurückgegeben (`src/app/api/entities/[type]/[id]/activity/route.ts:84–85`),
  aber die Oberfläche zeigt sie heute nicht an — `ActivityLog.tsx:119–142` rendert nur
  Akteur, Aktion, Feldname und einen relativen Zeitstempel.)

### Arbeiten mit Listen

- **Suche und Seitenblätterung je Entitätstyp** (Personen, Ereignisse, Quellen,
  Beziehungen); die Beziehungsliste filtert zusätzlich nach Entitätstyp,
  Beziehungstyp und Gewissheit.
  (`src/app/api/persons/route.ts`, `events/route.ts`, `sources/route.ts`,
  `relations/route.ts`; `src/components/research/DataTableSearch.tsx`,
  `DataTablePagination.tsx`,
  `src/app/[locale]/(app)/relations/_components/RelationsDataTable.tsx`)
- **Massenlöschung** in den Listenansichten von Personen, Ereignissen und Quellen.
  (`src/app/api/{persons,events,sources}/bulk/route.ts`;
  `src/components/research/BulkDeleteDialog.tsx`, eingebunden in
  `PersonsListClient.tsx`, `EventsListClient.tsx`, `SourceTable.tsx`. Für
  Beziehungen existiert der Endpunkt `src/app/api/relations/bulk/route.ts`, aber
  keine Massenauswahl in der Oberfläche.)

### Zugang und Betrieb

- **Konto- und Anmeldeverwaltung**: Registrierung, E-Mail-Bestätigung, Anmeldung,
  Passwort-Zurücksetzung.
  (`src/app/[locale]/(auth)/auth/{register,verify,login,forgot-password,reset-password}/page.tsx`)
- **Deutsche und englische Oberfläche**, umschaltbar; Deutsch ist die Standardsprache.
  (`src/i18n/routing.ts:5`; `src/components/shell/locale-switcher.tsx`)
- **Helles und dunkles Farbschema.**
  (`src/components/shell/theme-toggle.tsx`)
- **Webanwendung, browserbasiert** — kein lokaler Client.
  (Next.js App Router, `src/app/`)

---

## 4. Was geplant ist

Alles Folgende ist **nicht gebaut**. Die Formulierungen stammen aus dem gelöschten
`evidoxa-overview.md`, das sie im Präsens behauptete; hier stehen sie mit dem Epic,
das sie tatsächlich liefern soll. Maßgeblich ist [`roadmap.md`](./roadmap.md).

| Vorhaben                                                                                     | Epic    | Heutiger Stand                                                                                                                                                         |
| -------------------------------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mehrprojekt-Arbeitsbereiche, Rollenmodell _Eigentümer/Editor/Betrachter_, Einladung per Mail | 3.1     | `UserProject` + `enum ProjectRole` im Schema (35, 177); Oberfläche fehlt, bis dahin läuft alles in einem automatisch angelegten Standardprojekt (`src/lib/project.ts`) |
| Normalisierte Ortsdatenbank, Geocodierung über Nominatim, historische Namensvarianten, Karte | 3.2     | `Location` im Schema (359) und FKs auf Person/Event vorbereitet; keine Route, keine Geocodierung, keine Karte                                                          |
| Literaturverwaltung, Zotero-Sync, RIS-Import, BibTeX/Chicago-Export                          | 3.3     | `Literature` im Schema (385); keine Route, keine Integration                                                                                                           |
| CSV-/XLSX-Import mit Vorschau, Validierung, Dublettenerkennung, Importhistorie               | 3.4     | nicht vorhanden                                                                                                                                                        |
| Entitätsübergreifende Volltextsuche                                                          | 4.1     | Suche existiert je Entitätstyp, nicht übergreifend                                                                                                                     |
| Zeitstrahl mit Personenlebenszeiten als Bänder                                               | 4.2     | nicht vorhanden                                                                                                                                                        |
| Netzwerkgraph, interaktiv und filterbar                                                      | 4.3     | nicht vorhanden                                                                                                                                                        |
| Analytik-Dashboard, Aktivitäts-Feed, Datenlücken-Übersicht                                   | 4.4     | nicht vorhanden (`/dashboard` existiert als Route, ohne diese Auswertungen)                                                                                            |
| Export: CSV, JSON, RIS, BibTeX, JSON-LD, GEXF, Projektpaket                                  | 5.1     | nicht vorhanden                                                                                                                                                        |
| Ungewissheits-Review-Queue, Vollständigkeitsbericht, Waisenbericht, Dublettenerkennung       | 5.2     | nicht vorhanden                                                                                                                                                        |
| KI-Assistenz: Vorschlagswesen, quellengebundener Forschungs-Chat, PDF-Viewer mit Pixel-Anker | 6.0–6.3 | nur die Schema-Vorbereitung in `EntityActivity` (554–576)                                                                                                              |

---

## 5. Für wen

Die Zielgruppen sind nicht für dieses Dokument erfunden worden. Sie stehen als
Persona-Matrix in
[`docs/design-system/01-ux/research.md`](../design-system/01-ux/research.md) §2.4 —
derselben Quelle, aus der `skills/platforms/evidoxa.md` sein Nutzertyp-Vokabular
bezieht.

Drei Nutzertypen, jeweils mit unterschiedlichem Verhältnis zur Komplexität:

- **Faculty Leader** — prüft die Arbeit anderer, kurze häufige Sitzungen, geringe
  Toleranz für Komplexität, braucht Klarheit auf einen Blick.
- **Student / Early-Career Researcher** — erzeugt den Großteil der Daten, lange
  Sitzungen, hohe Toleranz für Komplexität.
- **Archivist / Collection Manager** — katalogisiert Quellen und pflegt Normdaten,
  konservativer Umgang mit Gewissheit, hohe Toleranz für vertraute archivarische
  Paradigmen und geringe für unvertraute.

Die vollständige Extraktion inklusive Sitzungsmustern, Sprachpräferenzen und
Feature-Prioritäten steht in [`personas.md`](./personas.md).

Diese Verteilung deckt sich mit der Positionierung aus Abschnitt 1: dasselbe
Datenmodell muss einer Person genügen, die es an einem Nachmittag durchdringen will,
und einer, die es nur zur Kontrolle öffnet.

---

## Quellen

| Abschnitt                    | Quelle                                                                                                                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 Problem und Positionierung | `docs/specs/roadmap.md`, Einleitung (gelöscht; `git show 56c83e3:docs/specs/roadmap.md`) + Eröffnungssatz von `docs/communication/evidoxa-overview.md` (gelöscht; `git show a5e642b:docs/communication/evidoxa-overview.md`) |
| 2 Die These                  | `docs/specs/ai_aided_roadmap.md`, Präambel (gelöscht; `git show 56c83e3:docs/specs/ai_aided_roadmap.md`)                                                                                                                     |
| 3 Was Evidoxa heute kann     | `docs/communication/evidoxa-overview.md` (gelöscht; `git show a5e642b:docs/communication/evidoxa-overview.md`), gefiltert und einzeln gegen `prisma/schema.prisma` bzw. Routen unter `src/app/[locale]/` geprüft             |
| 4 Was geplant ist            | dieselben Behauptungen aus `evidoxa-overview.md`, zugeordnet zu den Epics in [`roadmap.md`](./roadmap.md)                                                                                                                    |
| 5 Für wen                    | `docs/design-system/01-ux/research.md` §2.4, Persona-Matrix                                                                                                                                                                  |
