# Epic 2.4 — Universal Relationship Engine

## Specification

**Phase:** 2 — Core Research Loop
**Deliverable:** The architectural centerpiece. Create typed, evidenced relations between any two entities. User-defined relation type taxonomies per project. Property-level evidence annotation on any entity field. Append-only entity activity log (AX foundation).
**Verifiable:** Link Person A to Event B as "participant" (PROBABLE certainty), attach a Source as evidence. Link Person A to Person B as "colleague". View Person A's profile and see both relations in the Relations tab. Annotate Person A's birth_year with a source citation. View the activity log endpoint and see all CRUD actions.

---

## 1. Technology Stack

No new packages introduced. All dependencies already in the project.

| Tool            | Version  | Purpose                                                                                   |
| --------------- | -------- | ----------------------------------------------------------------------------------------- |
| Prisma          | ^6.19.2  | Schema migration, new fields on PropertyEvidence, new EntityActivity model                |
| react-hook-form | existing | Relation and evidence forms                                                               |
| Zod             | existing | API validation                                                                            |
| next-intl       | existing | New `relations.*`, `relationTypes.*`, `propertyEvidence.*`, `entityActivity.*` namespaces |
| shadcn/ui       | existing | Sheet, Popover, Badge, Command (for entity selector)                                      |

---

## 2. Data Model / Schema

### 2.1 Migration: PropertyEvidence additions

Add two new nullable fields to `PropertyEvidence`. These have no default values — existing rows remain valid.

```prisma
model PropertyEvidence {
  id             String     @id @default(cuid())
  project_id     String
  entity_type    EntityType
  entity_id      String          // no DB FK — polymorphic; app-layer integrity
  property       String          // field name: "birth_year", "title", etc.
  source_id      String
  notes          String?
  page_reference String?         // e.g. "S. 47", "fol. 12r"
  quote          String?         // normalized/interpreted text excerpt     ← NEW in 2.4
  raw_transcription String?      // diplomatic transcription (verbatim)     ← NEW in 2.4
  confidence     Certainty @default(UNKNOWN)                               // ← NEW in 2.4 (AX)
  created_at     DateTime   @default(now())

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  source  Source  @relation("PropertyEvidenceSource", fields: [source_id], references: [id], onDelete: Cascade)

  @@index([project_id])
  @@index([entity_type, entity_id])
  @@map("property_evidence")
}
```

**`quote` vs `raw_transcription`:**

- `quote` — the normalized/interpreted excerpt (modernized spelling, abbreviations expanded, e.g., `"geboren anno domini 1848"`)
- `raw_transcription` — verbatim diplomatic transcription as it appears in the source (e.g., `"geb. ao. dni. MDCCCXLVIII"`)

### 2.2 Migration: EntityActivity model (AX pre-pull-forward)

New append-only model. **No DELETE endpoint will ever be created for this table** (CONSTRAINT 7 from AX roadmap).

```prisma
enum ActivityAction {
  CREATE
  UPDATE
  DELETE
  MERGE        // reserved for future duplicate merge workflow
  SUGGEST      // reserved for Epic 6.0 agent suggestions
  ACCEPT       // reserved for Epic 6.0 suggestion accept
  REJECT       // reserved for Epic 6.0 suggestion reject
}

model EntityActivity {
  id          String         @id @default(cuid())
  project_id  String
  entity_type EntityType
  entity_id   String
  user_id     String?        // null when action is from agent (future)
  agent_name  String?        // null when action is from human
  action      ActivityAction
  field_path  String?        // e.g. "birth_year"; null for CREATE/DELETE
  old_value   Json?          // previous value snapshot; null for CREATE
  new_value   Json?          // new value snapshot; null for DELETE
  reason      String?        // optional human-entered note on why
  source_id   String?        // grounding reference (reserved for agents)
  created_at  DateTime       @default(now())

  project Project @relation(fields: [project_id], references: [id], onDelete: Cascade)
  user    User?   @relation("EntityActivityUser", fields: [user_id], references: [id], onDelete: SetNull)

  @@index([project_id])
  @@index([entity_type, entity_id])
  @@index([created_at])
  @@map("entity_activity")
}
```

Add relation to `User` and `Project` models accordingly.

### 2.3 Soft-delete extension update

In `src/lib/db.ts`, extend the Prisma client extension (introduced in Epic 2.1, extended in 2.2) to cover the `relation` model:

```typescript
// Models covered by the soft-delete extension after this epic:
// person, event, source, relation
// PropertyEvidence: hard-delete only (cascade from Source/Project)
```

### 2.4 Schema summary — no other changes

`Relation`, `RelationType`, `RelationEvidence` are already complete in the schema from Epic 1.2. No structural changes needed. Composite indexes `(from_type, from_id)` and `(to_type, to_id)` already exist.

---

## 3. API Contract

### Auth requirement (all routes)

All routes require a valid session. Use `requireUser()` from `src/lib/auth-guard.ts`. Project membership verified via `UserProject` lookup.

### 3.1 RelationType routes

```
GET    /api/relation-types?projectId={id}
POST   /api/relation-types
PUT    /api/relation-types/[id]
DELETE /api/relation-types/[id]
```

**GET** response:

```typescript
interface RelationTypeListResponse {
  data: RelationType[];
}

interface RelationType {
  id: string;
  project_id: string;
  name: string;
  inverse_name: string | null;
  description: string | null;
  color: string | null; // hex e.g. "#4f46e5"
  icon: string | null; // Lucide icon name
  valid_from_types: EntityType[];
  valid_to_types: EntityType[];
  created_at: string;
  updated_at: string;
  _count: { relations: number };
}
```

**POST/PUT body:**

```typescript
interface RelationTypeInput {
  name: string; // required, max 100
  inverse_name?: string; // max 100
  description?: string; // max 500
  color?: string; // hex regex validated
  icon?: string; // max 50
  valid_from_types: EntityType[]; // min 1 item
  valid_to_types: EntityType[]; // min 1 item
}
```

**DELETE** → 409 if any `Relation` uses this type (`onDelete: Restrict`). Returns `{ error: "IN_USE", count: number }`.

---

### 3.2 Relation routes

```
GET    /api/relations?projectId=&fromType=&fromId=&toType=&toId=&relationTypeId=&certainty=&page=&pageSize=
POST   /api/relations
GET    /api/relations/[id]
PUT    /api/relations/[id]
DELETE /api/relations/[id]   (soft-delete: sets deleted_at)
POST   /api/relations/bulk   { action: "delete", ids: string[] }
```

**GET list query params:**

| Param            | Type       | Description                                            |
| ---------------- | ---------- | ------------------------------------------------------ |
| `projectId`      | string     | Required                                               |
| `fromType`       | EntityType | Filter by from_type                                    |
| `fromId`         | string     | Filter by from_id (requires fromType)                  |
| `toType`         | EntityType | Filter by to_type                                      |
| `toId`           | string     | Filter by to_id (requires toType)                      |
| `entityType`     | EntityType | Match on either from_type OR to_type                   |
| `entityId`       | string     | Match on either from_id OR to_id (requires entityType) |
| `relationTypeId` | string     | Filter by relation type                                |
| `certainty`      | Certainty  | Filter by certainty                                    |
| `page`           | number     | Default 1                                              |
| `pageSize`       | number     | Default 20, max 100                                    |

**GET list response:**

```typescript
interface RelationListResponse {
  data: RelationWithDetails[];
  total: number;
  page: number;
  pageSize: number;
}

interface RelationWithDetails {
  id: string;
  project_id: string;
  from_type: EntityType;
  from_id: string;
  from_label: string; // resolved display label (name/title)
  to_type: EntityType;
  to_id: string;
  to_label: string; // resolved display label
  relation_type: {
    id: string;
    name: string;
    inverse_name: string | null;
    color: string | null;
    icon: string | null;
  };
  certainty: Certainty;
  notes: string | null;
  valid_from_year: number | null;
  valid_from_month: number | null;
  valid_from_cert: Certainty;
  valid_to_year: number | null;
  valid_to_month: number | null;
  valid_to_cert: Certainty;
  evidence_count: number;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**POST/PUT body:**

```typescript
interface RelationInput {
  project_id: string;
  from_type: EntityType;
  from_id: string;
  to_type: EntityType;
  to_id: string;
  relation_type_id: string;
  certainty?: Certainty; // default UNKNOWN
  notes?: string; // max 2000
  // Temporal validity (all optional):
  valid_from_year?: number;
  valid_from_month?: number; // 1–12
  valid_from_cert?: Certainty;
  valid_to_year?: number;
  valid_to_month?: number; // 1–12
  valid_to_cert?: Certainty;
}
```

**Validation (enforced at API layer):**

- `from_id` entity must exist in the correct table for `from_type` (app-layer FK check)
- `to_id` entity must exist in the correct table for `to_type` (app-layer FK check)
- `relation_type_id` must belong to the same `project_id`
- `from_type` must be in `relation_type.valid_from_types`
- `to_type` must be in `relation_type.valid_to_types`
- POST triggers `logActivity(CREATE)` on the relation; DELETE triggers `logActivity(DELETE)`

---

### 3.3 Relation evidence routes

```
GET    /api/relations/[id]/evidence
POST   /api/relations/[id]/evidence
DELETE /api/relations/[id]/evidence/[evidenceId]
```

**POST body:**

```typescript
interface RelationEvidenceInput {
  source_id: string;
  notes?: string; // max 1000
  page_reference?: string; // max 200
  quote?: string; // max 2000
  confidence?: Certainty; // default UNKNOWN
}
```

Constraint: `@@unique([relation_id, source_id])` — 409 if duplicate.

---

### 3.4 PropertyEvidence routes

```
GET    /api/property-evidence?projectId=&entityType=&entityId=&property=
POST   /api/property-evidence
DELETE /api/property-evidence/[id]
```

**GET query params:**

| Param        | Type       | Description                                         |
| ------------ | ---------- | --------------------------------------------------- |
| `projectId`  | string     | Required                                            |
| `entityType` | EntityType | Required                                            |
| `entityId`   | string     | Required                                            |
| `property`   | string     | Optional — omit to get all evidence for this entity |

**POST body:**

```typescript
interface PropertyEvidenceInput {
  project_id: string;
  entity_type: EntityType;
  entity_id: string;
  property: string; // validated against known field names per entity type
  source_id: string;
  notes?: string;
  page_reference?: string;
  quote?: string; // normalized/interpreted excerpt
  raw_transcription?: string; // diplomatic verbatim transcription
  confidence?: Certainty; // default UNKNOWN
}
```

**Allowed `property` values per entity type** (validated at API layer):

| EntityType | Allowed properties                                                                                                                                   |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| PERSON     | `first_name`, `last_name`, `birth_year`, `birth_month`, `birth_day`, `birth_place`, `death_year`, `death_month`, `death_day`, `death_place`, `notes` |
| EVENT      | `title`, `description`, `start_year`, `start_month`, `start_day`, `end_year`, `end_month`, `end_day`, `location`, `notes`                            |
| SOURCE     | `title`, `author`, `date`, `repository`, `call_number`, `url`, `notes`                                                                               |

Unknown property → 422 `{ error: "INVALID_PROPERTY", allowed: string[] }`.

Validation: `entity_id` must exist in the correct table (app-layer check). POST triggers `logActivity(CREATE)` for the evidence addition.

---

### 3.5 EntityActivity route

```
GET /api/entities/[type]/[id]/activity?projectId=&page=&pageSize=
```

**No POST, PUT, or DELETE endpoint exists. This is enforced by the route file containing only `GET`.**

**[type]** must be a valid `EntityType` (case-insensitive, mapped to enum). Returns 404 if entity not found.

**Response:**

```typescript
interface EntityActivityResponse {
  data: ActivityEntry[];
  total: number;
  page: number;
  pageSize: number;
}

interface ActivityEntry {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  user_id: string | null;
  user_name: string | null; // joined from User
  agent_name: string | null;
  action: ActivityAction;
  field_path: string | null;
  old_value: unknown | null;
  new_value: unknown | null;
  reason: string | null;
  source_id: string | null;
  created_at: string;
}
```

---

### 3.6 Entity-label resolution helper

When returning `from_label` / `to_label` in relation responses, resolve from:

- PERSON → `${first_name} ${last_name}` (fallback to primary PersonName)
- EVENT → `title`
- SOURCE → `title`
- LOCATION → `name`
- LITERATURE → `title`

This is a pure in-memory join after DB fetch — no additional DB roundtrip needed if the entity is included in the query.

---

## 4. `logActivity()` Helper

Internal server-side function. Never exposed as an API endpoint.

```typescript
// src/lib/activity.ts

import { db } from "@/lib/db";
import { ActivityAction, EntityType } from "@prisma/client";

interface LogActivityInput {
  project_id: string;
  entity_type: EntityType;
  entity_id: string;
  user_id?: string;
  agent_name?: string;
  action: ActivityAction;
  field_path?: string;
  old_value?: unknown;
  new_value?: unknown;
  reason?: string;
  source_id?: string;
}

export async function logActivity(input: LogActivityInput): Promise<void> {
  await db.entityActivity.create({
    data: {
      project_id: input.project_id,
      entity_type: input.entity_type,
      entity_id: input.entity_id,
      user_id: input.user_id ?? null,
      agent_name: input.agent_name ?? null,
      action: input.action,
      field_path: input.field_path ?? null,
      old_value: input.old_value !== undefined ? (input.old_value as object) : undefined,
      new_value: input.new_value !== undefined ? (input.new_value as object) : undefined,
      reason: input.reason ?? null,
      source_id: input.source_id ?? null,
    },
  });
  // logActivity must never throw — wrap callers in try/catch if audit failure
  // must not block the main operation
}
```

**Where `logActivity` is called in this epic:**

| Trigger                            | action | field_path       | old_value                   | new_value                                                  |
| ---------------------------------- | ------ | ---------------- | --------------------------- | ---------------------------------------------------------- |
| POST /api/relations                | CREATE | null             | null                        | `{ from_type, from_id, to_type, to_id, relation_type_id }` |
| PUT /api/relations/[id]            | UPDATE | null             | previous snapshot           | updated snapshot                                           |
| DELETE /api/relations/[id]         | DELETE | null             | previous snapshot           | null                                                       |
| POST /api/property-evidence        | CREATE | `property` value | null                        | `{ source_id, confidence, quote }`                         |
| DELETE /api/property-evidence/[id] | DELETE | `property` value | `{ source_id, confidence }` | null                                                       |

---

## 5. Component Architecture

```
src/
  app/[locale]/(app)/[projectId]/
    relations/
      page.tsx                          # Server — global relations list
      _components/
        RelationsDataTable.tsx          # Client — sortable/filterable table
        RelationFormDialog.tsx          # Client — create/edit modal
        RelationDeleteButton.tsx        # Client — confirm inline delete
    settings/
      relation-types/
        page.tsx                        # Server — relation type management
        _components/
          RelationTypesTable.tsx        # Client — list with edit/delete
          RelationTypeFormDialog.tsx    # Client — create/edit modal
  components/relations/
    RelationRow.tsx                     # Server-renderable relation row (used in entity tabs)
    EntitySelector.tsx                  # Client — type dropdown + debounced search combobox
    RelationTypeSelector.tsx            # Client — filtered dropdown from pre-fetched list
    CertaintySelector.tsx               # Client — reused from Epic 2.1 (already exists)
    EvidenceList.tsx                    # Client — list of RelationEvidence items
    EvidenceForm.tsx                    # Client — add evidence form (inline or modal)
    PropertyEvidenceBadge.tsx           # Client — "N sources" badge + popover
    PropertyEvidencePanel.tsx           # Client — full evidence management for one property
    ActivityLog.tsx                     # Client — scrollable EntityActivity log
```

### Server vs. Client boundary

| Component               | Type   | Reason                                |
| ----------------------- | ------ | ------------------------------------- |
| `relations/page.tsx`    | Server | SSR, SEO, initial data fetch          |
| `RelationsDataTable`    | Client | Sorting, filtering, row selection     |
| `RelationFormDialog`    | Client | Form state, dialog open/close         |
| `EntitySelector`        | Client | Debounced search, keyboard navigation |
| `PropertyEvidenceBadge` | Client | Popover interaction                   |
| `ActivityLog`           | Client | Pagination, polling (future)          |

### Props interfaces

```typescript
// EntitySelector
interface EntitySelectorProps {
  value: { type: EntityType; id: string } | null;
  onChange: (value: { type: EntityType; id: string; label: string } | null) => void;
  projectId: string;
  allowedTypes?: EntityType[]; // if set, hides the type dropdown and fixes to these types
  placeholder?: string;
  disabled?: boolean;
}

// RelationFormDialog
interface RelationFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  prefillFrom?: { type: EntityType; id: string; label: string }; // from entity detail page
  prefillTo?: { type: EntityType; id: string; label: string };
  editRelation?: RelationWithDetails; // if set, form is in edit mode
  onSuccess: () => void;
}

// PropertyEvidenceBadge
interface PropertyEvidenceBadgeProps {
  projectId: string;
  entityType: EntityType;
  entityId: string;
  property: string;
  fieldLabel: string; // shown in popover header
}

// ActivityLog
interface ActivityLogProps {
  projectId: string;
  entityType: EntityType;
  entityId: string;
}
```

---

## 6. UI/UX Specification

### 6.1 Global Relations List (`/[locale]/app/[projectId]/relations`)

```
┌─────────────────────────────────────────────────────────────────────┐
│ Relations                                    [+ Add Relation]        │
├─────────────────────────────────────────────────────────────────────┤
│ Filter: [Entity Type ▾] [Relation Type ▾] [Certainty ▾] [Search___] │
├──────┬──────────────┬──────────┬─────────────────┬──────────┬──────┤
│ From │ Relation     │ To       │ Certainty        │ Evidence │      │
├──────┼──────────────┼──────────┼─────────────────┼──────────┼──────┤
│ Karl │ Kollege von  │ Johann   │ ● PROBABLE       │ 2 Quellen│ ···  │
│ Müll │              │ Schmidt  │                  │          │      │
├──────┼──────────────┼──────────┼─────────────────┼──────────┼──────┤
│ Karl │ Teilnehmer   │ Revolution│ ● CERTAIN       │ 1 Quelle │ ···  │
│ Müll │ an           │ Wien 1848│                  │          │      │
└──────┴──────────────┴──────────┴─────────────────┴──────────┴──────┘
│ Showing 2 of 24                              [< 1 2 3 >]            │
```

- `···` menu → Edit (opens RelationFormDialog) | Delete (inline confirm)
- Clicking a row → opens relation sheet (right-side drawer) with full details + evidence
- Empty state: "Noch keine Relationen. Verknüpfen Sie Personen, Ereignisse und Quellen."

### 6.2 Relation Form Dialog

```
┌─────────────────────────────────────────────────────┐
│ Relation erstellen                             [×]   │
├─────────────────────────────────────────────────────┤
│ Von                                                  │
│ [Person ▾] [Suche: Karl___________________] [×Karl] │
│                                                      │
│ Relationstyp                                         │
│ [Kollege von                              ▾]         │
│ (gefiltert auf Person → Person)                      │
│                                                      │
│ Zu                                                   │
│ [Person ▾] [Suche: Johann_________________] [×Jo.]  │
│                                                      │
│ Gewissheit                                           │
│ [● Wahrscheinlich                         ▾]         │
│                                                      │
│ Notizen                                              │
│ [_________________________________________________]  │
│                                                      │
│ ▶ Zeitliche Gültigkeit (optional)                    │
│   Von: [Jahr____] [Monat__] [Gewissheit▾]            │
│   Bis: [Jahr____] [Monat__] [Gewissheit▾]            │
│                                                      │
│ Belege hinzufügen (optional)                         │
│ [+ Quelle hinzufügen]                                │
│                                                      │
│            [Abbrechen]  [Relation erstellen]         │
└─────────────────────────────────────────────────────┘
```

**EntitySelector behavior:**

- Type dropdown first (default: PERSON)
- Search field: debounced 300ms, min 1 char, calls `GET /api/persons?q=&projectId=&pageSize=10`
- Results shown in Command component (shadcn)
- Selected entity shown as dismissible chip
- RelationType dropdown appears only after both sides have a type selected (or pre-selected)

**RelationType selector:**

- Fetches all project RelationTypes once on dialog mount
- Filters to types where `valid_from_types` includes `from_type` AND `valid_to_types` includes `to_type`
- If no types match the combination: shows "Kein Relationstyp für diese Kombination gefunden. [Typen verwalten →]"

**Temporal validity:**

- Collapsed by default; `▶` expands to 2 rows
- Month is a 1–12 number input; validated server-side

**Evidence attachment in creation flow:**

- "+ Quelle hinzufügen" adds an inline row with Source selector + optional page_reference + confidence selector
- Evidence is saved after the Relation is created (POST /api/relations/[id]/evidence)

### 6.3 Entity Relations Tab (Person / Event / Source detail pages)

Replaces the placeholder from Epics 2.1–2.3.

```
┌──────────────────────────────────────────────────────┐
│ [Profil] [Relationen ★3] [Nachweise] [Verlauf]        │
├──────────────────────────────────────────────────────┤
│ [+ Relation hinzufügen]   [Filter: Alle Typen ▾]     │
├──────────────────────────────────────────────────────┤
│ AUSGEHEND (2)                                         │
│ ──────────────────────────────────────────────────── │
│ → Johann Schmidt   [Kollege von] [● Wahrscheinlich]  │
│   2 Belege · [Bearbeiten] [Löschen]                  │
│ → Revolution Wien  [Teilnehmer] [● Sicher]           │
│   1 Beleg  · [Bearbeiten] [Löschen]                  │
│                                                      │
│ EINGEHEND (1)                                        │
│ ──────────────────────────────────────────────────── │
│ ← Anna Müller      [Mutter von] [● Wahrscheinlich]   │
│   0 Belege · [Bearbeiten] [Löschen]                  │
└──────────────────────────────────────────────────────┘
```

- "AUSGEHEND" = relations where `from_id = this entity`
- "EINGEHEND" = relations where `to_id = this entity` (shown with inverse_name)
- Badge on tab label shows total count
- "+ Relation hinzufügen" → opens RelationFormDialog with `prefillFrom` set to this entity
- Filter dropdown filters by relation type (client-side, from fetched list)

### 6.4 PropertyEvidence inline badge

On entity detail pages, each field that supports evidence shows a small badge:

```
Geburtsjahr:  1848   [SICHER]   [2 Quellen ▾]
```

Clicking the badge opens a Popover:

```
┌──────────────────────────────────────────────┐
│ Belege für "Geburtsjahr"           [×]       │
├──────────────────────────────────────────────┤
│ Staatsarchiv Wien, fol. 12r · SICHER         │
│ "geboren anno domini 1848"                   │
│ Diplomatisch: "geb. ao. dni. MDCCCXLVIII"   │
│ [Löschen]                                    │
├──────────────────────────────────────────────┤
│ Kirchenbuch Graz 1848 · WAHRSCHEINLICH       │
│ S. 47, Zeile 3                               │
│ [Löschen]                                    │
├──────────────────────────────────────────────┤
│ [+ Beleg hinzufügen]                         │
└──────────────────────────────────────────────┘
```

"+ Beleg hinzufügen" → inline mini-form within the popover:

```
Quelle: [Suche Quelle____________]
Seite:  [fol.______]
Zitat (normalisiert): [__________]
Diplomatisch:         [__________]
Gewissheit: [● Unbekannt ▾]
[Hinzufügen]
```

### 6.5 Entity "Nachweise" (Evidence) Tab

Full-page evidence management for a single entity — all properties with evidence:

```
┌──────────────────────────────────────────────────────┐
│ [Profil] [Relationen] [Nachweise ★5] [Verlauf]        │
├──────────────────────────────────────────────────────┤
│ Geburtsjahr (2 Belege)                               │
│   Staatsarchiv Wien, fol. 12r · SICHER               │
│   Kirchenbuch Graz 1848 · WAHRSCHEINLICH [Löschen]   │
│   [+ Beleg hinzufügen]                               │
│                                                      │
│ Geburtsort (1 Beleg)                                 │
│   Familienarchiv Müller · MÖGLICH [Löschen]          │
│   [+ Beleg hinzufügen]                               │
└──────────────────────────────────────────────────────┘
```

### 6.6 Entity "Verlauf" (Activity) Tab

Read-only chronological log:

```
┌──────────────────────────────────────────────────────┐
│ [Profil] [Relationen] [Nachweise] [Verlauf ★7]        │
├──────────────────────────────────────────────────────┤
│ 👤 Anna Meier · vor 2 Min                            │
│    Relation zu "Revolution Wien 1848" hinzugefügt    │
│                                                      │
│ 👤 Anna Meier · vor 1 Std                            │
│    Geburtsjahrnachweis hinzugefügt (Staatsarchiv)    │
│                                                      │
│ 👤 Admin · 12. März 2026                             │
│    Person erstellt                                   │
└──────────────────────────────────────────────────────┘
```

### 6.7 RelationType Settings Page (`/settings/relation-types`)

```
┌──────────────────────────────────────────────────────┐
│ Relationstypen                  [+ Neuer Typ]        │
├──────┬────────────┬──────────────┬──────────┬────────┤
│ Name │ Umkehrung  │ Gültig von   │ Gültig zu│        │
├──────┼────────────┼──────────────┼──────────┼────────┤
│ Koll.│ Kollege v. │ Person       │ Person   │ ···    │
│ Teiln│ Hat Teiln. │ Person       │ Ereignis │ ···    │
└──────┴────────────┴──────────────┴──────────┴────────┘
```

Delete blocked if type is in use → toast: "Dieser Typ wird von N Relationen verwendet."

---

## 7. State & Data Flow

```
Entity Detail Page (Server Component)
  └─ Fetches: person data, relation count, evidence count, activity count
  └─ Passes to Client tabs:

Relations Tab (Client)
  └─ Fetches: GET /api/relations?entityType=PERSON&entityId=...
  └─ User clicks "+ Relation hinzufügen"
       └─ RelationFormDialog opens (prefillFrom = this person)
       └─ EntitySelector fetches /api/[entityType]s?q=&projectId=
       └─ RelationTypeSelector: pre-fetched list, filtered in memory
       └─ POST /api/relations → success
       └─ logActivity(CREATE, RELATION)
       └─ Relations list refetched (invalidate cache or router.refresh())

PropertyEvidence Badge (Client)
  └─ Fetches: GET /api/property-evidence?entityType=&entityId=&property=
  └─ User clicks "+ Beleg hinzufügen"
       └─ Mini-form submits POST /api/property-evidence
       └─ logActivity(CREATE, PropertyEvidence)
       └─ Badge count updated optimistically

Activity Tab (Client)
  └─ Fetches: GET /api/entities/PERSON/[id]/activity
  └─ Paginated; no real-time updates in this epic
```

**Cache invalidation:**

- Redis cache for `/api/relations` is invalidated on POST/PUT/DELETE (same pattern as persons/events/sources)
- PropertyEvidence has no Redis cache (low volume per entity; always fresh fetch)

---

## 8. i18n

New translation keys in `messages/de.json` and `messages/en.json`:

```json
{
  "relations": {
    "title": "Relationen",
    "add": "Relation hinzufügen",
    "edit": "Relation bearbeiten",
    "delete": "Relation löschen",
    "deleteConfirm": "Diese Relation wirklich löschen?",
    "outgoing": "Ausgehend",
    "incoming": "Eingehend",
    "noRelations": "Noch keine Relationen.",
    "evidenceCount_one": "{{count}} Beleg",
    "evidenceCount_other": "{{count}} Belege",
    "fields": {
      "fromEntity": "Von",
      "toEntity": "Zu",
      "relationType": "Relationstyp",
      "certainty": "Gewissheit",
      "notes": "Notizen",
      "temporalValidity": "Zeitliche Gültigkeit",
      "validFrom": "Gültig von",
      "validTo": "Gültig bis"
    },
    "noTypeForCombination": "Kein Relationstyp für diese Kombination gefunden.",
    "manageTypes": "Typen verwalten"
  },
  "relationTypes": {
    "title": "Relationstypen",
    "add": "Neuer Typ",
    "edit": "Typ bearbeiten",
    "delete": "Typ löschen",
    "deleteBlocked": "Dieser Typ wird von {{count}} Relationen verwendet und kann nicht gelöscht werden.",
    "fields": {
      "name": "Name",
      "inverseName": "Umkehrung",
      "description": "Beschreibung",
      "color": "Farbe",
      "icon": "Icon",
      "validFromTypes": "Gültig von (Entitätstyp)",
      "validToTypes": "Gültig zu (Entitätstyp)"
    }
  },
  "propertyEvidence": {
    "title": "Nachweise",
    "add": "Beleg hinzufügen",
    "delete": "Beleg löschen",
    "badgeLabel_one": "{{count}} Quelle",
    "badgeLabel_other": "{{count}} Quellen",
    "fields": {
      "source": "Quelle",
      "pageReference": "Seite / Folio",
      "quote": "Zitat (normalisiert)",
      "rawTranscription": "Diplomatische Transkription",
      "confidence": "Gewissheit",
      "notes": "Notizen"
    },
    "noEvidence": "Keine Belege für dieses Feld."
  },
  "entityActivity": {
    "title": "Verlauf",
    "actions": {
      "CREATE": "erstellt",
      "UPDATE": "aktualisiert",
      "DELETE": "gelöscht"
    },
    "noActivity": "Kein Verlauf vorhanden."
  }
}
```

English equivalents follow the same structure with EN values.

**Relation type names and inverse_names are stored in the DB, not in i18n files.** Historians enter them in their working language.

---

## 9. Testing Plan

### Unit tests

| Subject                            | What to test                                                        |
| ---------------------------------- | ------------------------------------------------------------------- |
| `logActivity()`                    | Called correctly; does not throw when DB is unavailable (fail-open) |
| `RelationInput` Zod schema         | Invalid entity types, missing fields, temporal month range          |
| `PropertyEvidenceInput` Zod schema | Invalid property names per entity type; all fields validated        |
| RelationType filter logic          | `filterRelationTypes(allTypes, fromType, toType)` — pure function   |
| Entity label resolver              | Each EntityType returns correct display label                       |

### Integration tests (API route handlers)

| Route                                    | Cases                                                                                                                                     |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `POST /api/relations`                    | Valid relation created; from_id not found → 404; relation_type_id from different project → 403; invalid from_type for relation type → 422 |
| `DELETE /api/relations/[id]`             | Soft-deleted (deleted_at set); evidence records survive (no cascade)                                                                      |
| `POST /api/relations/[id]/evidence`      | Duplicate source → 409; source from different project → 403                                                                               |
| `POST /api/property-evidence`            | Invalid property name → 422 with allowed list; entity_id not found → 404                                                                  |
| `DELETE /api/relation-types/[id]`        | In use → 409; unused → 200                                                                                                                |
| `GET /api/entities/PERSON/[id]/activity` | Returns paginated log; unknown entity type → 400                                                                                          |

### E2E tests (Playwright)

| Flow                                     | Steps                                                                                                                                                                  |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| TC-2.4-01: Create relation with evidence | Login → Person detail → Relations tab → Add relation → select Person B → set type "Kollege" → PROBABLE → Add source evidence → submit → verify relation appears in tab |
| TC-2.4-02: PropertyEvidence annotation   | Person detail → birth_year field → badge click → Add source → fill page_reference + quote → submit → badge count increments                                            |
| TC-2.4-03: RelationType CRUD             | Settings → Relation Types → create new type → assign valid_from/to types → save → create relation using new type                                                       |
| TC-2.4-04: Activity log                  | Create relation → delete property evidence → view Verlauf tab → verify both entries appear                                                                             |
| TC-2.4-05: Inverse relation display      | Link A→B as "Elternteil von" → check B's Relations tab → shows A as "Kind von" (inverse_name)                                                                          |

---

## 10. File Structure

```
src/
  app/[locale]/(app)/[projectId]/
    relations/
      page.tsx
      _components/
        RelationsDataTable.tsx
        RelationFormDialog.tsx
        RelationSheet.tsx           # right-side drawer: full relation details
        RelationDeleteButton.tsx
    settings/
      relation-types/
        page.tsx
        _components/
          RelationTypesTable.tsx
          RelationTypeFormDialog.tsx
  app/api/
    relations/
      route.ts                      # GET, POST
      [id]/
        route.ts                    # GET, PUT, DELETE
        evidence/
          route.ts                  # GET, POST
          [evidenceId]/
            route.ts                # DELETE
    relation-types/
      route.ts                      # GET, POST
      [id]/
        route.ts                    # PUT, DELETE
    property-evidence/
      route.ts                      # GET, POST
      [id]/
        route.ts                    # DELETE
    entities/
      [type]/
        [id]/
          activity/
            route.ts                # GET only
  components/relations/
    RelationRow.tsx
    EntitySelector.tsx
    RelationTypeSelector.tsx
    EvidenceList.tsx
    EvidenceForm.tsx
    PropertyEvidenceBadge.tsx
    PropertyEvidencePanel.tsx
    ActivityLog.tsx
  lib/
    activity.ts                     # logActivity() helper
  hooks/
    useRelationTypes.ts             # fetches and caches all project relation types
prisma/
  migrations/
    [timestamp]_epic_2_4_property_evidence_additions/
      migration.sql                 # adds quote, raw_transcription, confidence to property_evidence
    [timestamp]_epic_2_4_entity_activity/
      migration.sql                 # creates entity_activity table + ActivityAction enum
  seed.ts                           # adds seeded RelationType defaults to demo project
messages/
  de.json                           # relations.*, relationTypes.*, propertyEvidence.*, entityActivity.*
  en.json
```

---

## 11. Implementation Notes

### 11.1 Polymorphic entity existence check

Every `POST /api/relations` and `POST /api/property-evidence` must verify that `from_id`/`entity_id` exist in the correct table. Use a `validateEntityExists(type: EntityType, id: string, projectId: string)` helper:

```typescript
// src/lib/entity-validation.ts
export async function validateEntityExists(
  type: EntityType,
  id: string,
  projectId: string,
): Promise<boolean> {
  switch (type) {
    case "PERSON":
      return !!(await db.person.findFirst({
        where: { id, project_id: projectId, deleted_at: null },
      }));
    case "EVENT":
      return !!(await db.event.findFirst({
        where: { id, project_id: projectId, deleted_at: null },
      }));
    case "SOURCE":
      return !!(await db.source.findFirst({
        where: { id, project_id: projectId, deleted_at: null },
      }));
    case "LOCATION":
      return !!(await db.location.findFirst({ where: { id, project_id: projectId } }));
    case "LITERATURE":
      return !!(await db.literature.findFirst({ where: { id, project_id: projectId } }));
  }
}
```

### 11.2 Entity label resolution

Build a `resolveEntityLabel(type: EntityType, id: string)` helper that's called after relation data is fetched. Include the entity data in a single query using Prisma raw or a union pattern — avoid N+1 by batching label lookups:

```typescript
// Batch strategy: group relation endpoint's from_id/to_id by type,
// then do one query per entity type, merge results into a Map<id, label>
```

### 11.3 `activityAction` enum in Prisma

`ActivityAction` is a new Prisma enum. PostgreSQL CREATE TYPE happens in the migration. Order matters: run the EntityActivity migration before seeding.

### 11.4 Seeded RelationTypes scope

Seeded defaults go into the demo project only (identified by a fixed seed project ID in `prisma/seed.ts`). If the demo project was already seeded in prior epics, use `upsert` or check existence before insert.

### 11.5 logActivity fail-open

`logActivity()` should be called with `await` but wrapped so a DB failure there does not fail the main operation:

```typescript
// In API route:
await createRelation(data)                    // must succeed
await logActivity({ ... }).catch(console.error) // must not block
```

### 11.6 RelationType deletion order

Prisma `onDelete: Restrict` on `Relation.relation_type_id` means the DB will reject the delete if relations exist. Catch `PrismaClientKnownRequestError` with code `P2003` and return 409 with the relation count.

### 11.7 Relation entity-tab query

For the entity detail Relations tab, use `entityType` + `entityId` params which translate to:

```sql
WHERE (from_type = :type AND from_id = :id) OR (to_type = :type AND to_id = :id)
```

Both composite indexes cover these queries.

### 11.8 Implementation order

1. Database migrations (property_evidence additions + entity_activity)
2. `logActivity()` helper + `validateEntityExists()` helper
3. RelationType CRUD API + settings page
4. Relation CRUD API (GET/POST/PUT/DELETE)
5. Relation evidence API
6. PropertyEvidence API
7. EntityActivity read API
8. EntitySelector component
9. RelationFormDialog (creation flow)
10. Global Relations list page
11. Entity Relations tab (wire into Person/Event/Source detail)
12. PropertyEvidenceBadge + PropertyEvidencePanel
13. ActivityLog component + wire into entity detail Verlauf tab
14. Update seed.ts with RelationType defaults

---

## 12. Acceptance Criteria

1. **AC-01** — POST `/api/relations` with a valid payload creates a Relation and returns 201. Fetching `/api/relations?projectId=&entityType=PERSON&entityId=X` returns the new relation.
2. **AC-02** — POST `/api/relations` where `from_id` does not exist returns 404 with `{ error: "ENTITY_NOT_FOUND" }`.
3. **AC-03** — POST `/api/relations` where `from_type` is not in `relation_type.valid_from_types` returns 422 with `{ error: "INVALID_ENTITY_TYPE_FOR_RELATION_TYPE" }`.
4. **AC-04** — DELETE `/api/relation-types/[id]` where the type is used by ≥1 Relation returns 409 with `{ error: "IN_USE", count: N }`.
5. **AC-05** — POST `/api/property-evidence` with an unrecognized `property` value returns 422 with `{ error: "INVALID_PROPERTY", allowed: [...] }`.
6. **AC-06** — After creating a Relation via API, `GET /api/entities/PERSON/[id]/activity` returns an entry with `action: "CREATE"`.
7. **AC-07** — `GET /api/entities/PERSON/[id]/activity` responds with 200. There is no POST, PUT, or DELETE handler on this route — these methods return 405.
8. **AC-08** — POST `/api/property-evidence` with `confidence: "CERTAIN"`, `quote: "geboren 1848"`, `raw_transcription: "geb. 1848"` saves all three fields. GET returns them.
9. **AC-09** — Person detail page Relations tab shows all outgoing and incoming relations grouped by direction, with inverse_name displayed for incoming relations.
10. **AC-10** — PropertyEvidence badge on birth_year field shows "0 Quellen" when no evidence exists. After adding one via popover, badge shows "1 Quelle".
11. **AC-11** — RelationType settings page (`/settings/relation-types`) lists all project relation types and allows create, edit, and delete. Seeded demo project has ≥5 default types.
12. **AC-12** — Global `/relations` page renders a paginated table of all project relations with filters for entity type, relation type, and certainty.
13. **AC-13** — Creating a relation between Person A and Person B using the RelationFormDialog (opened from Person A's detail page) pre-fills Person A as the "from" entity.
14. **AC-14** — Soft-deleting a Relation via DELETE does not delete its RelationEvidence records. The evidence records remain in the DB.
15. **AC-15** — PropertyEvidence table has columns `quote`, `raw_transcription`, `confidence` after running `prisma migrate deploy`.

---

## 13. Out of Scope

| Item                                                                    | Belongs to                                     |
| ----------------------------------------------------------------------- | ---------------------------------------------- |
| `source_scan_region` on PropertyEvidence (pixel-anchoring JSON)         | Epic 6.3 (PDF viewer)                          |
| `agent_version` / `system_prompt_hash` on EntityActivity                | Epic 6.0 (AgentSuggestion)                     |
| Structured reasoning JSON schema for evidence types                     | Epic 6.1 (`<EvidenceStrip>` design)            |
| `AgentSuggestion` model and agent write API                             | Epic 6.0                                       |
| `<EvidenceStrip>`, `<ReasoningBox>`, `<AgentSuggestionCard>` components | Epic 6.1                                       |
| Conflict detection between PropertyEvidence records                     | Epic 5.2 / 6.1                                 |
| LiteratureEvidence (attaching Literature, not Source, as evidence)      | Epic 3.3                                       |
| Full-text search across relations                                       | Epic 4.1                                       |
| Graph visualization of relations                                        | Epic 4.3                                       |
| Real-time activity updates (WebSocket)                                  | Deferred to v2                                 |
| Project-level RelationType management panel (in project settings)       | Epic 3.1 (integrated into full settings panel) |
| GEXF / JSON-LD export including relations                               | Epic 5.1                                       |
