# Evidoxa — AI-Aided Roadmap (AX Transformation)

> Duplicate of `roadmap.md` augmented with three Agentic Experience (AX) layers.
> Core principle: The AI is a **Transparent Research Assistant**, never an author.
> Every agent claim must be grounded in an existing Source record. Historians retain
> full data sovereignty at all times.

---

## Strategic Decisions (locked — unchanged from manual roadmap)

[Identisch mit roadmap.md — alle 12 locked decisions bleiben bestehen]

### AX-Ergänzungen zu den Strategic Decisions

| Decision                  | Choice                                                                                  |
| ------------------------- | --------------------------------------------------------------------------------------- |
| Agent write authority     | NONE — agents submit AgentSuggestion records only; never direct entity writes           |
| Grounding policy          | MANDATORY — every AgentSuggestion must reference ≥1 existing Source.id                  |
| Confidence representation | Dual-track: categorical enum for historians (UI); Float 0–1 for agents (internal API)   |
| Approval gate             | All agent suggestions require explicit ACCEPT by a project EDITOR or OWNER              |
| Agent attribution         | Separate `created_via` enum (MANUAL \| IMPORT \| AGENT) + `agent_name` on all entities  |
| Hallucination suppression | Technical: grounding check, confidence cap (≤0.95), reasoning non-null, immutable audit |

---

## Phase 1 — Foundation & Auth

> Unchanged. See roadmap.md Epics 1.1–1.4.

---

## Phase 2 — Core Research Loop

### Epic 2.1–2.3

> Unchanged. See roadmap.md.

### [AX-AUGMENTATION] Epic 2.4 — Universal Relationship Engine

> Base scope unchanged. Add the following AX-ready requirements:

**AX Addition — PropertyEvidence Schema Upgrade:**

- `PropertyEvidence` erhält `confidence Certainty @default(UNKNOWN)` — ✅ in Epic 2.4 umgesetzt
- `PropertyEvidence` erhält `quote String?` (normalisiertes Zitat) — ✅ in Epic 2.4 umgesetzt
- `PropertyEvidence` erhält `raw_transcription String?` (diplomatische Transkription, verbatim) — ✅ in Epic 2.4 umgesetzt
- `PropertyEvidence` erhält `source_scan_region String?` (JSON: `{page, x, y, w, h}`)
  — Grundlage für das Source-First-Pixel-Anchoring-Prinzip
  — ⏳ **auf Epic 6.3 verschoben** (hat keine Konsumenten bis der PDF-Viewer gebaut wird)

**AX Addition — EntityActivity Log (vorgezogen aus Epic 4.4):**

- Neues Modell `EntityActivity` (append-only) wird in Epic 2.4 eingeführt:

  ```prisma
  model EntityActivity {
    id           String     @id @default(cuid())
    project_id   String
    entity_type  EntityType
    entity_id    String
    user_id      String?    // null wenn Agent
    agent_name   String?    // null wenn Mensch
    action       String     // CREATE | UPDATE | DELETE | MERGE | SUGGEST | ACCEPT | REJECT
    field_path   String?    // z.B. "birth_year"
    old_value    Json?
    new_value    Json?
    reason       String?
    source_id    String?    // Grounding-Referenz
    created_at   DateTime   @default(now())

    project      Project    @relation(fields: [project_id], references: [id])
    user         User?      @relation(fields: [user_id], references: [id])
  }
  ```

- API: `GET /api/entities/[type]/[id]/activity` (read-only; no DELETE endpoint)

### Epic 2.5 — UI Polish & Brand Tokens

> Unchanged.

### Epic 2.6 — Marketing & Pre-Auth Pages

> Unchanged.

---

## Phase 3 — Research Context

### Epic 3.1 — Project & Collaboration Workspace

> Unchanged.

### [AX-AUGMENTATION] Epic 3.2 — Location System & Mapping

> Base scope unchanged. AX Addition:

- Location-Geocoding via Nominatim wird als erste "agentic action" modelliert:
  - Geocoding result wird als `AgentSuggestion` (type: GEO_RESOLVE) gespeichert
  - Historiker bestätigt oder korrigiert lat/lng vor dem DB-Write
  - Precedent für das Suggestion-Pattern aller späteren Agenten

### Epic 3.3 — Literature & Bibliography

> Unchanged.

### [AX-AUGMENTATION] Epic 3.4 — Import System

> Base scope unchanged. AX Additions:

- Import-provenance erweitern: `created_via: IMPORT`, `import_batch_id` (bestehend) +
  `agent_name: "ImportAgent v{version}"` → vollständige Traceability
- Duplicate detection in Import nutzt `AgentSuggestion` (type: POTENTIAL_DUPLICATE)
  statt direktem Merge — Historiker entscheidet im Review-Queue

---

## Phase 4 — Discovery & Intelligence

### Epic 4.1 — Cross-Entity Search & Full-Text Discovery

> Unchanged.

### Epic 4.2 — Timeline Visualization

> Unchanged. Note: Uncertainty display (fuzzy range) ist bereits AX-kompatibel.

### Epic 4.3 — Network Graph Visualization

> Unchanged. Note: Graph-Daten (`/api/graph`) werden AX-Layer-3-Chat als
> Kontext-Endpoint dienen.

### [AX-AUGMENTATION] Epic 4.4 — Analytics Dashboard & Activity Feed

> AX-Upgrade: Der "Real Activity Log" ist in Epic 2.4 als `EntityActivity` vorgezogen.
> Epic 4.4 nutzt diesen Log für das Dashboard.
> Zusätzlich: Dashboard-Karten für AX-Metriken:

- "Offene Agent-Vorschläge" (AgentSuggestion.status = PENDING)
- "Abgelehnte Vorschläge diese Woche" (Feedback-Signal für Agent-Tuning)
- "Daten-Konflikte offen" (DataConflict.is_resolved = false)

---

## Phase 5 — Export, Quality & Production

### Epic 5.1 — Export System

> Unchanged. Note: GEXF-Export enthält `created_via` und `agent_name` als
> Knoten-Attribute für nachgelagerte Analyse.

### [AX-AUGMENTATION] Epic 5.2 — Data Quality & Uncertainty Management

> AX-Upgrade: Uncertainty Review Queue integriert AgentSuggestion-Workflow:

- "Ungewisse Felder" (UNKNOWN/POSSIBLE certainty) erhalten automatisch einen
  AgentSuggestion-Trigger (passiv, nicht automatisch ausgeführt)
- Duplicate Detection läuft als AgentSuggestion (POTENTIAL_DUPLICATE), nie als
  direktes Merge
- Orphan Report: "Quellen ohne Evidence-Verknüpfung" → Trigger für Source-First-Hinweis

### Epic 5.3 — Internationalization & UI Polish

> Unchanged.

### Epic 5.4 — Testing, Security & Production Hardening

> Unchanged. Note: Agent-API erhält eigenen Security-Review-Checkpoint.

---

## Phase 6 — Agentic Experience (AX)

> Goal: Den manuellen Forschungsworkflow um einen transparenten KI-Assistenten
> erweitern, der Historiker unterstützt ohne Datenhoheit zu übernehmen.
> Nutzerbasis: KI-skeptische Historiker. Jede KI-Ausgabe ist ein Vorschlag,
> kein Fakt. Jeder Vorschlag muss mit einer Primärquelle belegt sein.

---

### Epic 6.0 — AX Infrastructure (Schema & API Foundation)

**Deliverable:** DB-Schema und API-Schicht, die Agenten-Aktionen von manuellen
Aktionen sauber trennt. Keine UI-Änderungen in diesem Epic.

#### Schema-Erweiterungen (neue Migration)

```prisma
// 1. created_via auf allen Forschungs-Entitäten
enum CreatedVia { MANUAL IMPORT AGENT }

// Felder hinzufügen zu: Person, Event, Source, Relation
created_via      CreatedVia @default(MANUAL)
agent_name       String?    // z.B. "DeduplicatorAgent v1.2"
agent_confidence Float?     // 0.0–1.0; null wenn MANUAL

// 2. AgentSuggestion — Kernmodell des AX-Systems
enum SuggestionType {
  FILL_MISSING        // fehlende Felder ergänzen
  POTENTIAL_DUPLICATE // mögliche Duplikate
  DATE_INCONSISTENCY  // Datumsinkonsistenz
  RELATION_INFERENCE  // neue Relation vorschlagen
  GEO_RESOLVE         // Ortsname → Koordinaten
  SOURCE_LINK         // Vorhandene Quelle verknüpfen
}

enum SuggestionStatus { PENDING ACCEPTED REJECTED SUPERSEDED }

model AgentSuggestion {
  id                 String           @id @default(cuid())
  project_id         String
  entity_type        EntityType
  entity_id          String
  agent_name         String           // z.B. "GapFillerAgent v1.0"
  agent_version      String?          // z.B. "1.2.3" — für wissenschaftliche Reproduzierbarkeit
  system_prompt_hash String?          // SHA-256 des verwendeten System-Prompts — Reproduzierbarkeit
  suggestion_type    SuggestionType
  field_path         String?          // betroffenes Feld, z.B. "birth_year"
  suggested_value    Json?            // vorgeschlagener Wert
  confidence         Float            // 0.0–0.95 (API-seitig gecappt)
  reasoning          String           // NICHT NULL, mind. 50 Zeichen
  source_ids         String[]         // PFLICHT: ≥1 Source.id — Grounding-Zwang
  status             SuggestionStatus @default(PENDING)
  reviewed_by_id     String?
  reviewed_at        DateTime?
  review_note        String?
  created_at         DateTime         @default(now())

  project            Project          @relation(fields: [project_id], references: [id])
  reviewer           User?            @relation(fields: [reviewed_by_id], references: [id])
}

// Hinweis: agent_version und system_prompt_hash wurden in Epic 2.4-Brainstorming
// identifiziert und gehören auf AgentSuggestion (nicht EntityActivity), da sie
// nur bei Agenten-Aktionen sinnvoll sind. EntityActivity-Einträge aus Epic 2.4
// sind ausschließlich menschliche Aktionen (user_id gesetzt, agent_name null).

// 3. DataConflict — automatisch erkannte Widersprüche zwischen Quellen
model DataConflict {
  id              String     @id @default(cuid())
  project_id      String
  entity_type     EntityType
  entity_id       String
  property        String     // betroffenes Feld
  source_ids      String[]   // widersprechende Quellen
  is_resolved     Boolean    @default(false)
  resolved_by_id  String?
  resolution_note String?
  created_at      DateTime   @default(now())
  resolved_at     DateTime?

  project         Project    @relation(fields: [project_id], references: [id])
  resolver        User?      @relation(fields: [resolved_by_id], references: [id])
}
```

#### Neue API-Endpunkte

| Endpoint                              | Methode | Beschreibung                                          |
| ------------------------------------- | ------- | ----------------------------------------------------- |
| `/api/agents/suggestions`             | GET     | Liste aller Vorschläge (filter: status, entity, type) |
| `/api/agents/suggestions`             | POST    | Agent reicht Vorschlag ein (Grounding-Check)          |
| `/api/agents/suggestions/[id]`        | PUT     | Historiker akzeptiert/lehnt ab                        |
| `/api/entities/[type]/[id]/activity`  | GET     | Provenance-Trail einer Entität                        |
| `/api/entities/[type]/[id]/conflicts` | GET     | Offene Datenkonflikte                                 |
| `/api/grounding/verify`               | POST    | Prüft: Unterstützt Source X Claim Y?                  |

#### Agentic Guardrails (API-Enforcement)

```
CONSTRAINT 1 — Kein direkter Write:
  Agent-API hat NUR POST /api/agents/suggestions.
  Kein PUT /api/persons/[id] für Agent-Auth-Token.

CONSTRAINT 2 — Grounding-Zwang:
  POST /api/agents/suggestions → 422 wenn source_ids.length === 0.

CONSTRAINT 3 — Confidence-Cap:
  suggested_value.confidence wird serverseitig auf Math.min(value, 0.95) gecappt.

CONSTRAINT 4 — Reasoning-Pflicht:
  AgentSuggestion.reasoning: NOT NULL, minLength: 50.

CONSTRAINT 5 — Source-Existenz-Check:
  Jede source_id in source_ids muss in Source-Tabelle existieren (App-layer FK-Check).

CONSTRAINT 6 — Rate Limiting per Agent:
  Max. 100 AgentSuggestions/Stunde/Projekt pro agent_name (Redis sliding window).

CONSTRAINT 7 — EntityActivity Immutabilität:
  Kein DELETE-Endpoint für /api/entities/[type]/[id]/activity.
  Prisma: Kein deleteMany auf EntityActivity.

CONSTRAINT 8 — Approval Gate:
  PENDING-Vorschläge werden in der UI als "Vorschlag" (nicht Fakt) gerendert.
  Nur ACCEPTED-Vorschläge fließen in Berechnungen ein.

CONSTRAINT 9 — User Override:
  Manuelle Bearbeitung durch Historiker überschreibt ACCEPTED-Vorschläge automatisch
  und loggt in EntityActivity: action = "USER_OVERRIDE".

CONSTRAINT 10 — Domain Scope Lock:
  suggested_value.field_path muss einem bekannten Prisma-Feld entsprechen.
  Freiformtext des Agenten geht nur in reasoning, nie in Entitätsfelder.
```

**Verifiable:** `POST /api/agents/suggestions` ohne `source_ids` → 422. Mit leerem
`reasoning` → 422. Mit confidence 0.99 → gespeichert als 0.95. Mit gültiger source_id
→ 201 Created, status = PENDING.

---

### Epic 6.1 — Layer 2: Collaborative UI (The Lego-Bricks)

**Deliverable:** Modulare UI-Komponenten, die Agent-Antworten visuell belegbar machen.
Kein neues Feature-Set — Ergänzung der bestehenden Detail- und Formular-Seiten.

#### Neue Komponenten (`src/components/ax/`)

**1. `<EvidenceStrip>`**

- Angehängt an jedes `<dt>/<dd>`-Paar in PersonDetailCard, EventDetailCard
- Zeigt: `[Quelltitel] S.42 · PROBABLE` (kompakt, aufklappbar)
- Aufgeklappt: Zitat-Text aus `PropertyEvidence.quote`, diplomatische Transkription aus
  `PropertyEvidence.raw_transcription` (falls vorhanden), Link zur Source-Detailseite
- Datenbasis: PropertyEvidence mit `.confidence`, `.quote`, `.raw_transcription` (alle in Epic 2.4 eingeführt)
- **Beweistyp-Kategorisierung (aus Epic 2.4-Brainstorming):** In diesem Epic wird ein strukturiertes
  JSON-Schema für die Kategorisierung von Beweistypen (Lexikalisch / Kontextuell / Statistisch)
  entworfen und in der `<EvidenceStrip>`-Darstellung umgesetzt. Das Schema wird als
  `PropertyEvidence.evidence_category Json?` in einer eigenen Migration hinzugefügt.
  Beispiel: `{ "type": "LEXICAL", "subtype": "DIRECT_MENTION" }` vs.
  `{ "type": "CONTEXTUAL", "subtype": "INFERENCE" }`.
  Dies wurde in Epic 2.4 zurückgestellt, da die UI-Anforderungen erst hier bekannt sind.
- i18n: de + en Labels

**2. `<ReasoningBox>`**

- Kollabierbare Box, deutlich als "KI-Vorschlag" markiert (Rahmen + Icon: Sparkles)
- Zeigt: agent_name, suggestion_type, reasoning (Volltext), confidence-Badge (% mit Farbe)
- Niemals direkt editierbar — nur ACCEPT / REJECT / "Zur Quelle" Buttons
- Erscheint in: PersonDetailTabs ("KI-Vorschläge"-Tab), EventDetailTabs

**3. `<AgentSuggestionCard>`**

- Karten-Komponente für jede AgentSuggestion im PENDING-Status
- Props: suggestion, onAccept, onReject
- Zeigt: suggested_value (formatiert), confidence als Farbbalken, reasoning (gekürzt → "mehr"),
  source_ids als CitationLink-Badges
- Accept → PUT /api/agents/suggestions/[id] {status: ACCEPTED, review_note?}
- Reject → PUT /api/agents/suggestions/[id] {status: REJECTED, review_note}

**4. `<ProvenanceBadge>`**

- Winziges Badge neben Form-Feld-Labels (in PersonForm, EventForm)
- Zeigt: Anzahl der PropertyEvidence für dieses Feld (z.B. "3 Quellen")
- Click → Popover mit EvidenceStrip-Inhalt
- Dient als Motivator für Source-First-Verhalten

**5. `<CitationLink>`**

- Inline-klickbarer Verweis, öffnet Source-Detail-Popover
- Props: sourceId, label, pageRef?
- Nutzung in: ReasoningBox, EvidenceStrip, AgentSuggestionCard

**6. `<ConflictWarning>`**

- Alert-Banner oberhalb betroffener Felder in Detail-Ansichten
- Erscheint wenn: DataConflict für diese Entität + property vorhanden
- Zeigt: "2 Quellen widersprechen sich bezüglich Geburtsjahr" + Auflösungs-Button

**7. `<ActivityTimeline>`**

- Chronologisches Log aller EntityActivity-Einträge für eine Entität
- Unterscheidet visuell: Mensch (User-Icon) vs. Agent (Sparkles-Icon) vs. Import (Upload-Icon)
- Neuer "Verlauf"-Tab in PersonDetailTabs, EventDetailTabs

#### Wo die Komponenten eingesetzt werden

| Komponente          | Detail-Seite              | Formular            | Liste |
| ------------------- | ------------------------- | ------------------- | ----- |
| EvidenceStrip       | dd/dt-Paare in DetailCard | —                   | —     |
| ReasoningBox        | "KI-Vorschläge"-Tab       | —                   | —     |
| AgentSuggestionCard | "KI-Vorschläge"-Tab       | —                   | —     |
| ProvenanceBadge     | —                         | Neben Labels        | —     |
| CitationLink        | Notes, Relations          | —                   | —     |
| ConflictWarning     | Oberhalb des Feldes       | Oberhalb des Feldes | —     |
| ActivityTimeline    | "Verlauf"-Tab             | —                   | —     |

#### DataTable-Erweiterungen

- Neue optionale Spalte: "Vollständigkeit" (% der Pflichtfelder + Evidence-Coverage)
- Row-level AX-Badge: Kreis-Icon wenn AgentSuggestion PENDING für diese Entität

**Verifiable:** Person mit PropertyEvidence → EvidenceStrip zeigt Quelle mit Seitenangabe.
AgentSuggestion PENDING → AgentSuggestionCard erscheint im KI-Vorschläge-Tab.
ACCEPT drücken → Status wechselt, EntityActivity-Eintrag sichtbar im Verlauf-Tab.

---

### Epic 6.2 — Layer 3: Scholarly Dialogue (The MVP Chat Interface)

**Deliverable:** Ein eingebetteter Forschungs-Chat, der Fragen über die Projektdaten
beantwortet, ausschließlich auf Basis belegter Quellen. Der Chat kann Vorschläge
einreichen (→ AgentSuggestion), aber niemals direkt schreiben.

#### Architektur

```
Historian → ChatPanel UI
             ↓ POST /api/chat/message {context, question, projectId}
           ChatRouter (Server)
             ↓ RAG: Suche Source + PropertyEvidence + EntityActivity
           Claude API (claude-sonnet-4-6)
             ↓ Structured response schema (Zod-validated):
           {
             answer: string,           // Antwort in Historiker-Sprache
             confidence: 0.0–0.95,     // Gesamtkonfidenz
             citations: [{             // PFLICHT
               sourceId: string,
               pageRef?: string,
               quote?: string
             }],
             suggestions: [{           // Optional: AgentSuggestion-Drafts
               entityType, entityId, fieldPath, suggestedValue,
               reasoning, confidence, sourceIds
             }]
           }
```

#### Chat-Kontext-Modi

| Modus        | Kontext                                | Trigger                              |
| ------------ | -------------------------------------- | ------------------------------------ |
| Entity-Chat  | Aktuelle Person/Event + ihre Evidence  | "KI-Chat"-Button auf Detailseite     |
| Project-Chat | Alle Entitäten + Sources des Projekts  | Sidebar-Icon / globaler Chat         |
| Source-Chat  | Spezifische Quelle + verlinktes Wissen | Source-Detailseite "Quelle befragen" |

#### RAG-Pipeline (Retrieval-Augmented Generation)

1. Frage → Embedding (text-embedding-3-small oder pgvector in PostgreSQL)
2. Vektor-Suche über Source.notes + PropertyEvidence.quote + EntityActivity.reason
3. Top-K-Treffer als Kontext-Fenster an Claude übergeben
4. Claude generiert Antwort **ausschließlich** aus dem Kontext (System-Prompt: Grounding-First)
5. Zod-Validierung des Response-Schemas — bei Validierungsfehler: Retry (max. 2×)

#### System-Prompt Template (nicht änderbar durch User)

```
Du bist ein historischer Forschungsassistent für die App Evidoxa.
REGELN:
1. Antworte NUR auf Basis der bereitgestellten Quellen.
2. Beginne JEDE Aussage mit einem Quellenverweis.
3. Wenn keine Quelle eine Aussage belegt, antworte: "Dazu liegen keine belegten Daten vor."
4. Formuliere Unsicherheit explizit: "Die Quelle deutet darauf hin, dass..."
5. Schlage keine Änderungen vor, die du nicht mit einer Source.id belegen kannst.
6. Halluziniere keine historischen Fakten.
```

#### Chat-UI-Komponenten

- `<ChatPanel>` — Collapsible right-side panel (400px), persistiert Status in localStorage
- `<ChatMessage>` — Einzelne Nachricht mit: Text, CitationLinks, confidence-Badge, "Vorschlag einreichen"-Button
- `<ChatContext>` — Zeigt aktiven Kontext-Modus (Entity-Name oder "Gesamtes Projekt")
- `<SuggestionDraft>` — Expandierbare Karte für vorgeschlagene AgentSuggestions aus dem Chat
  → Klick "Einreichen" → POST /api/agents/suggestions → erscheint in KI-Vorschläge-Tab

#### Neue API-Endpunkte

| Endpoint                       | Methode | Beschreibung                               |
| ------------------------------ | ------- | ------------------------------------------ |
| `/api/chat/message`            | POST    | Sendet Frage, erhält strukturierte Antwort |
| `/api/chat/history/[entityId]` | GET     | Gesprächshistorie pro Entität              |
| `/api/embeddings/reindex`      | POST    | Admin: pgvector-Index neu aufbauen         |

**Verifiable:** Frage "Wann wurde Person X geboren?" → Antwort mit Quelle und Seitenangabe.
Frage ohne belegte Antwort → "Dazu liegen keine belegten Daten vor." Vorschlag aus
Chat einreichen → erscheint in KI-Vorschläge-Tab als PENDING AgentSuggestion.

---

## Requirement-Check: Source-First-Prinzip

Das Source-First-Prinzip fordert: Jeder Datenpunkt muss direkt zu einem Pixel im
Quellen-Scan rückführbar sein.

### Fehlende Anforderungen (noch nicht in Roadmap)

| Lücke                                                   | Status             | Vorgeschlagener Epic  |
| ------------------------------------------------------- | ------------------ | --------------------- |
| `Source.file_url` (Blob-URL für Scan-Upload)            | ❌ Fehlt im Schema | Epic 6.0 Schema       |
| `Source.file_hash` (SHA-256, Tampering-Schutz)          | ❌ Fehlt im Schema | Epic 6.0 Schema       |
| `PropertyEvidence.source_scan_region` (Pixel-Anchoring) | ❌ Fehlt im Schema | Epic 2.4 Augmentation |
| PDF/Scan-Viewer mit Annotations-Support                 | ❌ Kein Plan       | Epic 6.3 (neu)        |
| Blob-Storage-Integration (Vercel Blob / S3)             | ❌ Kein Plan       | Epic 6.3 (neu)        |
| URL-Archivierung (Wayback Machine API)                  | ❌ Kein Plan       | Epic 6.3 (neu)        |

### Neuer Epic 6.3 — Source Scan & Pixel Anchoring (Source-First MVP)

**Deliverable:** Scan-Upload für Primärquellen mit Regions-Annotation und
Direktverlinkung zu PropertyEvidence.

- File upload zu Vercel Blob: PDF, JPG, PNG — max. 50MB pro Datei
- PDF-Viewer (react-pdf oder pdf.js): inline Rendering
- Annotations-Tool: Benutzer markiert Textstelle → Region wird als JSON gespeichert
  `{page: 3, x: 120, y: 450, w: 800, h: 60}`
- `PropertyEvidence.source_scan_region` verknüpft Annotation mit Datenpunkt
- EvidenceStrip-Erweiterung: Klick auf Quelle → öffnet PDF-Viewer an der Seite +
  scrollt zu markierter Region
- `Source.file_hash` (SHA-256) wird bei Upload berechnet, dient als Integritätsnachweis

**Verifiable:** Scan hochladen, Zeile "geboren 1848" markieren, als Evidence für
Person.birth_year verknüpfen. EvidenceStrip auf Personendetailseite → klicken →
PDF öffnet sich auf S.12 mit hervorgehobener Region.

---

## AX-Roadmap-Zusammenfassung

| Phase | Thema                  | Epics       | AX-Relevanz                                                                     |
| ----- | ---------------------- | ----------- | ------------------------------------------------------------------------------- |
| 1     | Foundation & Auth      | 1.1–1.4     | ✅ Bestehend, unverändert                                                       |
| 2     | Core Research Loop     | 2.1–2.6     | ⚡ Augmentiert: EntityActivity, PropertyEvidence.confidence, source_scan_region |
| 3     | Research Context       | 3.1–3.4     | ⚡ Augmentiert: Geocoding als AgentSuggestion, Import-Provenance                |
| 4     | Discovery              | 4.1–4.4     | ⚡ Augmentiert: AX-Dashboard-Karten                                             |
| 5     | Export & Production    | 5.1–5.4     | ⚡ Augmentiert: created_via in Exports, AX-Security-Review                      |
| **6** | **Agentic Experience** | **6.0–6.3** | 🆕 AX-Infrastructure, Collaborative UI, Scholarly Chat, Source-First            |

**MVP für Universitätsvalidierung** = Phase 1 + Phase 2 (unverändert)
**AX-Alpha** = Epic 6.0 + 6.1 (Provenance-Infrastruktur + Lego-Bricks-UI)
**AX-Beta** = Epic 6.2 (Scholarly Chat) nach Historian-Feedback aus AX-Alpha
**Source-First-Vollständigkeit** = Epic 6.3 (Scan-Upload + Pixel-Anchoring)
