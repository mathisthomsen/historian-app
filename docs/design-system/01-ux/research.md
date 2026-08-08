# UX Research Foundation -- Evidoxa

**Date:** 2026-04-02
**Author:** UX Research Lead
**Status:** Complete -- ready for UX architecture, UI design, and brand strategy phases
**Method:** Desk research, domain analysis, competitive audit, persona modeling, journey mapping
**Upstream dependency:** `00-discovery/codebase-analysis.md`

---

## Table of Contents

1. [Research Objectives](#1-research-objectives)
2. [Target Audience Analysis and Personas](#2-target-audience-analysis-and-personas)
3. [Domain-Specific UX Principles](#3-domain-specific-ux-principles)
4. [User Journey Maps](#4-user-journey-maps)
5. [Competitive and Analogous Analysis](#5-competitive-and-analogous-analysis)
6. [Key Implications for Design System](#6-key-implications-for-design-system)

---

## 1. Research Objectives

This document establishes the UX research foundation for Evidoxa, a historical research management platform. It serves three downstream purposes:

1. **Inform design token decisions** -- color, typography, spacing, and motion choices must reflect the cognitive and ergonomic needs of scholarly users working in sustained research sessions.
2. **Guide interaction patterns** -- the certainty system, relationship engine, evidence annotation, and entity linking workflows are domain-specific. Generic SaaS patterns will not suffice.
3. **Anchor evaluation criteria** -- every design decision in subsequent phases should be testable against the personas, principles, and journeys defined here.

The research scope covers the application as defined through Epic 2.4 (Person, Event, Source, Relation CRUD with evidence annotation) while anticipating Phase 3 (projects, locations, import) and Phase 4 (search, timeline, network graph) features.

---

## 2. Target Audience Analysis and Personas

### Methodology

Personas are constructed from domain expertise in academic research workflows, archival science practice, and graduate-level historical methodology. Each persona synthesizes established patterns from the digital humanities and historical sciences community. Demographics are representative composites, not individual profiles.

---

### 2.1 Persona: Prof. Dr. Margarethe Engel -- The Faculty Leader

#### Demographic Snapshot

| Attribute           | Detail                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Age                 | 54                                                                                                               |
| Role                | Chair of Early Modern History, University of Heidelberg                                                          |
| Career stage        | Senior faculty, 22 years post-doctorate                                                                          |
| Team                | Leads a research group of 3 doctoral candidates, 2 postdocs, 1 student assistant                                 |
| Languages           | German (native), English (fluent), Latin (reading), French (reading)                                             |
| Devices             | MacBook Pro (office/home), iPad (conferences/archives), institutional Windows desktop                            |
| Accessibility       | Progressive lenses; prefers larger text; occasional RSI from decades of keyboard use                             |
| Digital proficiency | Moderate. Comfortable with Word, institutional systems, Zotero. Skeptical of tools that require extensive setup. |

#### Goals

1. **Oversight without micromanagement.** Needs to see the state of the research project at a glance -- who has entered what, which entities lack evidence, which connections are still hypothetical.
2. **Cross-institutional collaboration.** Works with archives in Karlsruhe, Strasbourg, and Basel. Needs to share specific subsets of data with colleagues at partner institutions without exposing the entire project.
3. **Scholarly rigor at scale.** The project involves 400+ historical persons across a 200-year period. Every claim must be traceable to a primary source. The tool must not allow sloppy scholarship to go unnoticed.
4. **Publication-ready export.** Ultimately needs to extract data for monographs, conference papers, and dataset publications. Structured data must be exportable with full provenance chains.

#### Motivations

- Professional reputation depends on methodological rigor.
- Wants the team to work in a single shared system rather than scattered spreadsheets and personal databases.
- Values tools that respect academic conventions (proper citation, uncertainty marking, multilingual handling of names and places).

#### Frustrations

- "Every new tool my postdoc recommends requires three workshops before we can use it. I do not have time for that."
- Existing tools (Access databases, Excel sheets shared via email) have no audit trail -- she has discovered data entry errors months after the fact.
- Zotero works for bibliography but cannot model relationships between people, events, and sources.
- Collaborative tools like Google Sheets lack the structured fields she needs (certainty, partial dates, typed relations).

#### Mental Models

Prof. Engel thinks in terms of **prosopographic networks** -- webs of people connected by kinship, patronage, professional ties, and shared participation in events. Her fundamental unit of analysis is the _relationship_, not the individual entity. She expects to navigate the tool by following links: from a person to their relations, from a relation to the source that documents it, from that source to other entities it mentions.

She expects the system to function like a well-organized card catalog: every entry has a standardized structure, cross-references are explicit and bidirectional, and nothing exists without a traceable provenance.

#### Core Workflows in Evidoxa

1. **Review project status** -- Dashboard visit (planned for Epic 4.4): scan for incomplete records, unlinked entities, recent team activity.
2. **Spot-check student entries** -- Navigate to a person record, examine the evidence tab, verify that claims about birth/death dates have source citations with page references.
3. **Build relationship networks** -- Create typed relations between persons and events she has identified in her own archival reading. Attach evidence with diplomatic transcriptions.
4. **Settings and taxonomy management** -- Define and refine the project's RelationTypes and EventTypes to match the research framework.

#### Pain Points with Existing Tools

| Current tool        | Pain point                                                               |
| ------------------- | ------------------------------------------------------------------------ |
| FileMaker/Access    | Single-user, no real-time collaboration, no web access from archives     |
| Excel/Google Sheets | No data validation, no relationship modeling, no certainty fields        |
| Zotero              | Bibliography only -- cannot model person/event entities or relationships |
| Email attachments   | No version control, no audit trail, data loss risk                       |
| Word documents      | Narrative format cannot be queried or structured                         |

#### Representative Quote

> "I need to trust the data my team enters. If a student marks a birth date as 'certain' but the source only says 'um 1648', I need to see that discrepancy immediately -- not six months later when I am writing the chapter."

---

### 2.2 Persona: Lukas Brandt -- The Student / Early-Career Researcher

#### Demographic Snapshot

| Attribute           | Detail                                                                                                                                                           |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Age                 | 27                                                                                                                                                               |
| Role                | Doctoral candidate, 2nd year, Early Modern History                                                                                                               |
| Advisor             | Prof. Dr. Engel                                                                                                                                                  |
| Languages           | German (native), English (fluent), French (intermediate)                                                                                                         |
| Devices             | 14" laptop (personal), smartphone, occasionally uses archive reading room PCs                                                                                    |
| Accessibility       | No specific needs currently; occasionally works in dim-light conditions                                                                                          |
| Digital proficiency | High. Uses Obsidian for personal notes, VS Code for data cleanup scripts, comfortable with command-line tools. Reads technical documentation without difficulty. |

#### Goals

1. **Efficient source processing.** Spends 2-3 days per week in archives. Needs to move from photographed source to structured data entry quickly.
2. **Building his dissertation's prosopographic database.** His thesis tracks 120 individuals through a specific institutional network over 80 years. Every data point must be sourced.
3. **Impressing his advisor.** Wants his work to be visibly rigorous. Uses certainty levels and evidence annotations proactively to demonstrate methodological awareness.
4. **Writing support.** Needs to extract structured data into narrative form for dissertation chapters.

#### Motivations

- Career advancement -- the dissertation must be excellent.
- Genuine intellectual curiosity about the historical material.
- Efficiency -- every hour saved on data management is an hour gained for analysis and writing.
- Wants to contribute to the research group's shared project while maintaining his own focused workspace.

#### Frustrations

- "I spend half my archive day re-typing things I already photographed. I wish I could just annotate the image directly."
- Context switching between archive notes (paper/tablet), Zotero (bibliography), and the research database breaks his concentration.
- The current shared Access database (Prof. Engel's legacy system) crashes on his Mac; he has to use a Windows VM.
- Partial dates are painful in every tool he has tried -- Excel does not understand "sometime in 1648."

#### Mental Models

Lukas thinks in terms of **source-first data extraction**. He reads a document, identifies factual claims within it, and then creates or updates entity records based on what the source says. His workflow is fundamentally bottom-up: source leads to data, not the other way around.

He expects the tool to let him work from a source outward: "This letter mentions person A, person B, and event C. Let me link all three from within this source record."

He is comfortable with the concept of epistemic certainty from his methodological training. He naturally thinks in terms of "the source says X" versus "we can infer Y" and wants the tool to capture that distinction.

#### Core Workflows in Evidoxa

1. **Post-archive data entry sessions** (2-4 hours) -- Create source records for documents examined that day, then create/update person and event records based on the sources, attaching evidence with page references and transcriptions.
2. **Entity linking** -- After entering data from a new source, link newly created persons to existing events and other persons via typed relations.
3. **Search and verification** -- Before creating a new person record, search to check if the person already exists (name variant matching is critical here -- "Johann" vs "Johannes" vs "Joannes").
4. **Evidence review** -- Periodically review his own entries to ensure all claims have evidence, certainty levels are appropriate, and no records are orphaned.

#### Pain Points with Existing Tools

| Current tool     | Pain point                                                                    |
| ---------------- | ----------------------------------------------------------------------------- |
| Obsidian         | Great for notes but no structured data, no shared access, no query capability |
| Zotero           | Cannot store extracted data points from sources, only bibliographic metadata  |
| Tropy            | Good for photo management but cannot model relationships or share data        |
| Shared Access DB | Mac incompatible, no web access, no concurrent editing, no certainty fields   |

#### Representative Quote

> "I just spent three hours in the archive reading letters. Now I need to get all of that into the database while it is still fresh. The tool needs to stay out of my way -- I want to type, link, and move on."

---

### 2.3 Persona: Dr. Anneliese Mertens -- The Archivist / Collection Manager

#### Demographic Snapshot

| Attribute           | Detail                                                                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Age                 | 41                                                                                                                                                       |
| Role                | Head of Collections, Landesarchiv Baden-Wuerttemberg (Karlsruhe branch)                                                                                  |
| Career stage        | 12 years in archival profession, 4 years in current leadership role                                                                                      |
| Languages           | German (native), English (professional working proficiency), some Italian                                                                                |
| Devices             | Institutional Windows 11 desktop (primary), personal MacBook (home), no mobile work                                                                      |
| Accessibility       | Uses screen at standard distance; high sensitivity to visual clutter due to detail-oriented work                                                         |
| Digital proficiency | Expert in archival information systems (AtoM, MIDOSA, Arcinsys). Moderate with general web tools. Proficient in metadata standards but not a programmer. |

#### Goals

1. **Accurate cataloging and metadata.** Her professional training and institutional mandate require adherence to international archival description standards (ISAD(G), EAD, Dublin Core). She expects structured metadata fields that map to these standards.
2. **Controlled vocabulary management.** Archival description depends on consistent terminology. She needs the ability to define and enforce taxonomies for entity types, relation types, and source classifications.
3. **Access control and data governance.** Different researchers should have different levels of access. Some collection data is restricted (privacy, donor agreements). She needs to control who sees what.
4. **Preservation and interoperability.** Data entered into Evidoxa must be exportable in standard formats. Lock-in to a proprietary system is unacceptable.

#### Motivations

- Professional standards compliance is non-negotiable.
- Wants to support researchers using her collections by providing structured finding aids and entity data that can be imported into their research tools.
- Values precision over speed -- she would rather enter data slowly and correctly than quickly and sloppily.
- Sees Evidoxa as a potential bridge between archival description (her world) and research databases (the historians' world).

#### Frustrations

- "Researchers come to my archive and create their own person lists from our holdings. They never share the data back. If they used a system I could access, we could build on each other's work."
- Most research tools have no concept of archival provenance (fond/series/file/item hierarchy).
- Source reliability is rarely captured in research tools -- historians treat all sources as equally authoritative unless they explicitly note otherwise in their text.
- She has encountered research databases where names are entered inconsistently ("von Dalberg" vs "Dalberg, von" vs "v. Dalberg"), making cross-referencing impossible.

#### Mental Models

Dr. Mertens thinks in terms of **archival hierarchy and provenance**. The organizing principle is not the individual document but the _fond_ (collection) it belongs to, which reflects the institutional context of its creation. She expects the system to capture where a source comes from (archive, fond, series, item number) as structured metadata, not a free-text field.

She is accustomed to authority files (Gemeinsame Normdatei / GND for persons, GeoNames for places) and expects the system to eventually support linking to external authority records.

Her approach to certainty is procedural rather than interpretive: a source either contains a specific datum or it does not. She is less comfortable with the inferential "probable/possible" spectrum than the historians, but recognizes its value for research contexts.

#### Core Workflows in Evidoxa

1. **Source cataloging** -- Enter detailed source records with full archival references (archive name, fond, series, item, folio). Assign reliability tiers based on source type and condition.
2. **Entity authority maintenance** -- Review and standardize person and event records. Merge duplicate entries. Ensure name variants are complete and correctly tagged by language.
3. **Taxonomy governance** -- Define and maintain RelationTypes, EventTypes, and source type classifications that align with archival standards.
4. **Access review** -- (Future, Phase 3) Monitor who is accessing collection-linked records and ensure restricted materials are appropriately gated.

#### Pain Points with Existing Tools

| Current tool                 | Pain point                                                                                       |
| ---------------------------- | ------------------------------------------------------------------------------------------------ |
| AtoM/Arcinsys                | Excellent for archival description but cannot model person-event networks                        |
| Excel finding aids           | No relational capability, no shared access, version control problems                             |
| Researcher-created databases | Inconsistent quality, no metadata standards, data silos                                          |
| Email-based collaboration    | Researcher requests arrive as unstructured email; no systematic way to share collection metadata |

#### Representative Quote

> "If the source reference field is a single text box, I know the tool was not built for archivists. I need separate fields for archive, fond, series, and item -- and ideally a link to our catalog."

---

### 2.4 Persona Overlap and Divergence Matrix

| Dimension                | Faculty Leader                                    | Student Researcher                                    | Archivist                                                   |
| ------------------------ | ------------------------------------------------- | ----------------------------------------------------- | ----------------------------------------------------------- |
| Primary concern          | Oversight and rigor                               | Efficiency and depth                                  | Standards and precision                                     |
| Session pattern          | Short, frequent check-ins (15-30 min)             | Long, deep sessions (2-4 hours)                       | Moderate, methodical sessions (1-2 hours)                   |
| Data entry volume        | Low (reviews others' work)                        | High (primary data creator)                           | Moderate (source records, authority maintenance)            |
| Certainty usage          | Evaluative (is the student's assessment correct?) | Generative (assigning certainty during data entry)    | Conservative (prefers documented fact over inference)       |
| Collaboration mode       | Supervisory, asynchronous review                  | Peer-to-peer, mentor feedback                         | Cross-institutional data sharing                            |
| Language needs           | Multilingual sources; German UI preferred         | Multilingual sources; comfort with either DE or EN UI | German UI strongly preferred; metadata in original language |
| Feature priority         | Dashboard, activity feeds, export                 | Entity creation, evidence linking, search             | Source cataloging, vocabulary management, data quality      |
| Tolerance for complexity | Low -- wants clarity at a glance                  | High -- willing to learn complex workflows            | High for familiar paradigms, low for unfamiliar ones        |

---

## 3. Domain-Specific UX Principles

The following principles extend standard UX heuristics (Nielsen, Shneiderman) with domain-specific requirements drawn from scholarly research workflows, archival science, and the cognitive demands of historical analysis. Each principle is actionable for the design system.

### 3.1 Trust and Data Integrity

**Principle:** The interface must communicate trustworthiness through transparency. Every datum must visibly declare its epistemic status and its provenance chain.

**Rationale:** Historical research is fundamentally about evidence-based argumentation. A tool that obscures the basis of a claim -- or makes it easy to create unsubstantiated records -- undermines its own value proposition. Trust is not a feeling; it is a verifiable property of the data.

**Design implications:**

- **Certainty must be visually encoded at every level.** The four-state certainty system (Certain / Probable / Possible / Unknown) needs a consistent visual language -- color, iconography, or both -- that is immediately legible without hover or click interaction. This visual encoding must be accessible (not color-alone) and must work in both light and dark mode.
- **Evidence count indicators belong on every entity field.** The PropertyEvidenceBadge pattern (click-to-expand evidence count on each field) is correct in concept but must be visually prominent enough that un-evidenced fields are immediately noticeable. An empty evidence state should feel like a gap, not a neutral default.
- **Activity logs must be accessible, not hidden.** The EntityActivity feed (currently the last tab on detail pages) provides the audit trail that Prof. Engel needs. It should be easy to scan and filter. Consider promoting recent activity to a more visible position on detail views.
- **Destructive operations need proportional friction.** Bulk delete already uses a confirmation dialog. Single-entity soft-delete should similarly require explicit confirmation, and the "deleted" state should be recoverable with clear UI.

### 3.2 Source Provenance and Citation Accuracy

**Principle:** The system must treat source references as structured, verifiable data -- not free text. The path from claim to source to archive shelf must be navigable in the UI.

**Rationale:** A citation that cannot be verified is worthless in scholarship. Archivists require standardized references (archive, fond, series, item, folio). Historians need page-level and transcription-level granularity. The UI must make it harder to create sloppy citations than good ones.

**Design implications:**

- **Source reference fields must be structured.** The current Source model has a single `reference` field. The UI should guide users toward structured entry (archive name, collection identifier, item reference, folio/page) even if the backend stores it as a single string initially.
- **Evidence annotation must support both normalized and diplomatic text.** The `quote` (normalized) and `raw_transcription` (diplomatic) distinction in PropertyEvidence is a genuinely scholarly feature. The UI must make the distinction clear: one field for what the source says in its original form, another for the researcher's normalized reading.
- **Linking from entity fields to source evidence must be effortless.** The PropertyEvidenceBadge popover pattern requires at most two clicks to see the evidence for any field. This is acceptable. Three or more clicks is not.

### 3.3 Long-Session Ergonomics

**Principle:** The interface must support sustained cognitive work over 2-4 hour sessions without visual fatigue, attention degradation, or interaction friction.

**Rationale:** Data entry from archival sources is the primary productive workflow. Lukas (Student persona) will spend entire afternoons entering data from that day's archive visit. Prof. Engel may spend an hour reviewing student work. These are not quick transactional interactions; they are sustained knowledge work sessions more akin to IDE usage than typical SaaS.

**Design implications:**

- **Color temperature must be warm-neutral.** Pure white (#FFFFFF) backgrounds cause eye strain in long sessions. The current light mode background is `hsl(0 0% 100%)` -- pure white. This should shift toward a warm off-white (2-5% warmth) to reduce fatigue. Dark mode should similarly avoid pure black -- the current `hsl(240 10% 3.9%)` is already reasonable.
- **Typography must prioritize extended reading.** Body text at `text-sm` (14px) is acceptable for form labels but may be too small for reading transcription excerpts or notes. The type scale should include a comfortable reading size (16px minimum) for content areas where users read substantial text.
- **Contrast ratios must exceed WCAG AA by margin.** For sustained reading, aim for 7:1 (AAA) contrast on body text, not just the 4.5:1 minimum. Prof. Engel's progressive lenses make this a real accessibility need.
- **Focus management must be keyboard-optimized.** During rapid data entry, tabbing between fields must follow a logical order. Form fields within a single data entry flow (source creation, person creation) should support Tab-through-and-submit without mouse interaction.
- **Visual density should be high but organized.** Researchers want to see data, not whitespace. But density must be achieved through structured grids and clear visual hierarchy, not through cramming. The `<dl>` grid pattern in detail cards (two-column, `gap-4`) is a reasonable starting point.
- **Persistent navigation must not consume excessive space.** The current sidebar at 224px (open) is reasonable. The collapsed state at 48px is tight. The toggle should be sticky and easily accessible via keyboard shortcut.

### 3.4 Cognitive Load Management for Complex Source Material

**Principle:** The interface must reduce extraneous cognitive load (interface complexity) to preserve capacity for intrinsic cognitive load (the historical material itself).

**Rationale:** The material historians work with is inherently complex -- partial dates, uncertain attributions, multilingual sources, contradictory evidence. The interface must not add complexity on top of this. Sweller's Cognitive Load Theory (1988) distinguishes intrinsic load (complexity of the material), extraneous load (complexity of the presentation), and germane load (effort spent on learning and schema building). The design system must minimize extraneous load.

**Design implications:**

- **Progressive disclosure for secondary fields.** The RelationFormDialog already uses collapsible sections for temporal validity and evidence. This pattern should be generalized: show the most-used fields by default, allow expansion for specialist fields.
- **Consistent interaction patterns across entity types.** The person, event, and source forms should follow an identical layout grammar. The user should not have to relearn the interface when switching entity types. The current codebase achieves this at the route level (`/persons/new`, `/events/new`, `/sources/new`) but the forms themselves have layout inconsistencies (see codebase analysis Finding 6 and 7).
- **Visual grouping of related fields.** The `rounded-md border p-4` pattern used for date field groups in PersonForm is effective. It should be formalized as a `FieldGroup` pattern and applied consistently wherever logically related fields appear together.
- **Batch operations for repetitive tasks.** During a post-archive data entry session, a researcher may need to create 5-10 source records in sequence, each linked to the same archive and fond. The UI should support carry-forward of common fields or template-based entry.
- **Clear empty states that guide action.** The codebase analysis notes that empty states exist but are minimal. An empty evidence list on a person's birth_year should not just say "No evidence" -- it should actively prompt: "Add a source citation for this date."

### 3.5 Academic Collaboration Patterns

**Principle:** Collaboration in academic research is asynchronous, hierarchical, and cross-institutional. The interface must support review workflows, not real-time co-editing.

**Rationale:** Unlike Figma or Google Docs users, historians do not need to see each other's cursors. They need to review work after the fact, provide feedback through structured channels, and maintain clear attribution. The power dynamic between professor and doctoral candidate shapes every interaction -- feedback must be constructive and traceable, not intrusive.

**Design implications:**

- **Activity feeds are the primary collaboration surface.** The EntityActivity log is how Prof. Engel monitors her team's work. It must be filterable by user, entity type, date range, and action type. It should be scannable in under 30 seconds for a project with moderate activity.
- **Attribution must be automatic and persistent.** Every record should show who created it and when. Edit history should be preserved. The `created_by_id` field exists in the schema -- the UI must surface it prominently.
- **Review states are not yet in the data model but should be anticipated in the UI.** A future "reviewed/unreviewed" status for records would be invaluable for the faculty leader. The design system should anticipate a status indicator in the detail card pattern.
- **Cross-timezone awareness.** German-French research collaborations span at most one timezone, but German-American collaborations (increasingly common) span 6-9 hours. All timestamps should be displayed in relative terms ("2 hours ago") with hover to show absolute time in the user's local timezone.

### 3.6 Bilingual and Multilingual Content Handling

**Principle:** The interface language (DE/EN) is separate from the content language (which may be German, Latin, French, Italian, or any historical language). The design must handle both dimensions without confusion.

**Rationale:** A researcher using the German UI may be entering person names in Latin, transcribing sources in Early Modern French, and adding notes in modern German. The name variant system (PersonName with `language` field) already models this at the data level. The UI must make it clear which language context applies to which field.

**Design implications:**

- **UI chrome language follows the locale setting (DE or EN).** This is already implemented via next-intl.
- **Content fields must accept any language without validation.** No spell-check enforcement, no language detection on data entry fields.
- **Name variant language tags must be visually distinct.** The current implementation uses `bg-muted text-muted-foreground` for language tags -- these need to be legible and non-intrusive. Consider using `<abbr>` or small-caps for language codes (DE, EN, LA, FR).
- **Text expansion for German UI labels.** German strings are 20-30% longer than English equivalents (noted in codebase analysis). All interactive elements (buttons, tabs, sidebar items) must be sized for the German baseline. The `truncate` utility on sidebar nav items is a symptom of this problem and should be replaced with proper sizing or intelligent abbreviation.
- **Right-to-left content is not currently required** but should not be architecturally precluded. The font stack and layout system should not make assumptions about text direction in content fields.

### 3.7 Data Density vs. Clarity

**Principle:** Scholarly tools must display more information per screen than typical consumer applications, but every data point must have a clear visual hierarchy and scan path.

**Rationale:** Researchers prefer density because it reduces navigation. A detail page that requires scrolling through five tabs to see all of a person's data is less useful than one that shows key attributes, recent relations, and evidence status in a single view. However, density without hierarchy creates visual noise that is worse than sparse layouts.

**Design implications:**

- **Entity detail pages are the most data-dense screens.** The current tab-based layout (8 tabs on PersonDetailTabs: attributes, names, events, persons, sources, relations, evidence, activity) is usable but forces linear scanning. Consider a two-column layout for wide screens where the primary attributes card sits alongside a tabbed panel for relations/evidence.
- **Count badges on tabs are essential.** The current CountBadge pattern (`rounded-full bg-muted px-1.5 py-0.5 text-xs`) is correct -- it provides scan-level information about whether a tab has content. This should be formalized as a pattern.
- **List views need column-level information density.** The DataTable must support column visibility toggles (noted in Epic 2.5 requirements) so users can customize the density to their needs.
- **Summary statistics on list headers reduce drill-down frequency.** The total count ("47 Personen") on the persons list is useful. Extend this to show filtered vs. total counts, and add quick-filter summary chips.

---

## 4. User Journey Maps

Each journey map follows a structured format: Phase, User Action, System Response, Emotional State, Friction Points, and Design Opportunities. Emotional states use a 5-point scale: frustrated, stressed, neutral, satisfied, delighted.

### 4.1 Journey: Creating and Linking a Historical Person Record

**Persona:** Lukas Brandt (Student Researcher)
**Context:** Has returned from the archive with photographs of a baptismal register. Needs to create a person record for a newly discovered individual and link them to an existing event.

| Phase                     | User Action                                                                                              | System Response                                                                    | Emotional State        | Friction Points                                                                                                  | Design Opportunities                                                                                                |
| ------------------------- | -------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **1. Entry**              | Navigates to `/persons` from sidebar                                                                     | Persons list loads with search and pagination                                      | Neutral                | None -- familiar path                                                                                            | --                                                                                                                  |
| **2. Duplicate check**    | Searches for the person's name to avoid duplicate creation                                               | Search results show matching persons with birth/death years visible in table rows  | Neutral to Satisfied   | Name variants may not surface in search results (search only on primary name?)                                   | Search should match across all PersonName variants, not just first_name/last_name. Show which variant matched.      |
| **3. Create**             | Clicks "Neue Person" / "New Person" button                                                               | Navigates to `/persons/new` with empty PersonForm                                  | Neutral                | --                                                                                                               | Pre-fill project_id automatically (current project context)                                                         |
| **4. Basic data**         | Enters first name, last name, notes                                                                      | Form fields accept input; real-time Zod validation on blur                         | Neutral                | Tab order between name fields should be natural (first -> last -> notes)                                         | Auto-suggest from existing person names if typing a known surname                                                   |
| **5. Partial date entry** | Enters birth year (1648) but leaves month and day blank; sets certainty to "Probable"                    | PartialDateInput accepts year-only; CertaintySelector toggles to Probable          | Satisfied              | The certainty selector buttons are small and undifferentiated (Finding 10 in codebase analysis)                  | Color-coded certainty with icon reinforcement. "Probable" should feel visually distinct from "Certain"              |
| **6. Name variants**      | Adds a Latin name variant ("Joannes") tagged as language "la"                                            | PersonNameList allows adding a row; language input accepts free text               | Neutral                | No autocomplete for ISO 639 language codes; user must know "la" for Latin                                        | Provide a compact language code picker with common historical languages pre-loaded (de, en, la, fr, it, nl, pl, cs) |
| **7. Save**               | Clicks "Erstellen" / "Create"                                                                            | Form submits; redirects to person detail page; toast confirms success              | Satisfied              | --                                                                                                               | Show the new person detail immediately so user can continue linking                                                 |
| **8. Add evidence**       | On the detail page, clicks the PropertyEvidenceBadge next to birth_year                                  | Popover opens with empty evidence list and add form                                | Neutral                | The popover may be too small for entering a transcription quote                                                  | Consider a slide-out panel or modal for evidence entry when the evidence includes transcription text                |
| **9. Link source**        | In the evidence form, searches for the source (baptismal register)                                       | EntitySelector popover shows matching sources                                      | Neutral to Stressed    | If the source does not exist yet, user must navigate away to create it, losing context on the person detail page | Inline source creation from the EntitySelector: "Source not found? Create one."                                     |
| **10. Enter evidence**    | Fills page reference ("fol. 12r"), quote, raw transcription, certainty                                   | Form fields accept input                                                           | Satisfied              | Two transcription fields (quote vs. raw) may be confusing without explanation                                    | Inline help text or tooltip explaining the distinction: "Normalized reading" vs "Verbatim transcription"            |
| **11. Save evidence**     | Submits evidence form                                                                                    | Evidence badge count updates from 0 to 1; popover stays open showing the new entry | Satisfied to Delighted | --                                                                                                               | Celebratory micro-interaction when first evidence is added to a field (subtle, not distracting)                     |
| **12. Create relation**   | Navigates to Relations tab; clicks "Neue Beziehung" / "New Relation"                                     | RelationFormDialog opens with current person pre-filled as "from" entity           | Neutral                | --                                                                                                               | Pre-populate the "from" entity and entity type; user only needs to select "to" entity and relation type             |
| **13. Link to event**     | Selects entity type "Event", searches for the existing baptism event, selects RelationType "participant" | EntitySelector and RelationTypeSelector filter appropriately                       | Neutral                | If the event does not exist, same context-loss problem as step 9                                                 | Same solution: inline creation option                                                                               |
| **14. Complete**          | Saves the relation; returns to person detail page                                                        | Relation appears in Relations tab; count badges update                             | Satisfied              | --                                                                                                               | Show a visual summary: "Lukas has linked Person X to Event Y as participant (Probable)" in the activity feed        |

**Accessibility checkpoints:**

- All form fields must have visible labels (not placeholder-only).
- CertaintySelector must be operable via keyboard (arrow keys within the group).
- PropertyEvidenceBadge popover must be dismissable via Escape and not trap focus.
- Error messages on form validation must be announced to screen readers via aria-live regions.

---

### 4.2 Journey: Building a Relationship Network Between People and Events

**Persona:** Prof. Dr. Margarethe Engel (Faculty Leader)
**Context:** Reviewing the relationship network around a key figure in the project. Wants to verify that the connections documented by her doctoral candidates are properly evidenced and to add a newly discovered patronage relation from her own archival reading.

| Phase                       | User Action                                                                                                                     | System Response                                                                                | Emotional State          | Friction Points                                                                                                       | Design Opportunities                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------ | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| **1. Entry**                | Navigates to the person detail page for "Friedrich von Dalberg" via persons list or direct bookmark                             | Person detail loads with all tabs; count badges show 12 relations, 8 events, 23 evidence items | Neutral                  | --                                                                                                                    | The count badges provide exactly the at-a-glance overview she needs                                                             |
| **2. Scan relations**       | Opens the Relations tab; scans the outgoing and incoming relation lists                                                         | Relations displayed as expandable rows grouped by direction (outgoing/incoming)                | Neutral to Satisfied     | If there are 12 relations, scrolling through all of them takes time                                                   | Add filtering within the Relations tab: by relation type, by certainty level, by evidence count                                 |
| **3. Identify concern**     | Notices a "sibling" relation to another person marked as "Certain" but with 0 evidence items                                    | The relation row shows certainty badge and evidence count                                      | Stressed                 | The visual encoding of "Certain with no evidence" should feel alarming, but currently both badges are neutral-looking | Introduce a "claim without evidence" visual warning -- a distinct style for high-certainty claims that lack any source citation |
| **4. Investigate**          | Clicks on the relation to expand it; sees no evidence entries                                                                   | Relation detail expands inline with empty evidence list                                        | Stressed to Frustrated   | No way to quickly identify who created this relation or when                                                          | Show creator and creation date on the relation row itself, not only in the activity log                                         |
| **5. Add evidence**         | Despite her frustration, she has a source that could document this relation. Clicks "Add Evidence" within the expanded relation | Evidence form appears inline within the relation row                                           | Neutral                  | If the form is too cramped within an inline expansion, it may feel tedious                                            | Form should adapt to context: inline for quick additions, expandable to a larger surface for detailed transcriptions            |
| **6. Create own relation**  | Clicks "Neue Beziehung" to add a patronage relation she discovered in her own archival visit                                    | RelationFormDialog opens                                                                       | Neutral                  | Must remember the exact RelationType name; the dropdown may have 20+ types                                            | Show recently used RelationTypes at the top of the selector; support search/filter within the dropdown                          |
| **7. Select target entity** | Searches for the patron ("Karl Theodor") via EntitySelector                                                                     | EntitySelector shows matching persons; disambiguation via birth/death years                    | Neutral                  | Two persons named "Karl Theodor" exist in the project                                                                 | EntitySelector should show enough disambiguating information (dates, a snippet of notes) to distinguish homonyms                |
| **8. Attach evidence**      | Fills evidence fields within the dialog's evidence section                                                                      | Collapsible evidence section expands; source search, page reference, transcription fields      | Satisfied                | The RelationFormDialog is already complex; adding evidence within it creates deep nesting                             | Consider a two-step flow: create relation first, then immediately prompt for evidence on a separate surface                     |
| **9. Review network**       | (Future, Phase 4) Opens network visualization to see Friedrich's full connection web                                            | Graph view renders person-event-person network                                                 | -- (not yet implemented) | --                                                                                                                    | Design system should anticipate graph visualization color needs: entity type colors, certainty-based edge styles                |
| **10. Exit**                | Returns to dashboard or moves to next person                                                                                    | Navigation via sidebar or browser back                                                         | Neutral                  | --                                                                                                                    | --                                                                                                                              |

---

### 4.3 Journey: Annotating Sources with Evidence

**Persona:** Dr. Anneliese Mertens (Archivist)
**Context:** Has cataloged a collection of 18th-century correspondence in the archive's system. Wants to create source records in Evidoxa and attach evidence linking the letters to persons and events mentioned in the correspondence.

| Phase                         | User Action                                                                                          | System Response                                                                | Emotional State       | Friction Points                                                                                            | Design Opportunities                                                                                                                                              |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | --------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Entry**                  | Navigates to `/sources` from sidebar                                                                 | Source list loads with reliability filter and search                           | Neutral               | --                                                                                                         | --                                                                                                                                                                |
| **2. Create source**          | Clicks "Neue Quelle" / "New Source"                                                                  | Navigates to `/sources/new` with SourceForm                                    | Neutral               | --                                                                                                         | --                                                                                                                                                                |
| **3. Structured reference**   | Enters source title, type (letter), archive reference                                                | SourceForm provides fields for title, type, reference, repository, reliability | Neutral to Frustrated | The reference field is a single free-text field; she wants separate fields for archive, fond, series, item | Add structured reference sub-fields, or at minimum provide a template/hint: "Landesarchiv BW, GLA 77/1234, Nr. 15"                                                |
| **4. Reliability assessment** | Sets reliability to "HIGH" (original letter in good condition, authenticated hand)                   | ReliabilityBadge-style selector (currently a dropdown)                         | Satisfied             | --                                                                                                         | Make reliability visually coded the same way everywhere: list view, detail view, evidence popover                                                                 |
| **5. Save source**            | Submits the form                                                                                     | Redirected to source detail page; toast confirms                               | Satisfied             | --                                                                                                         | --                                                                                                                                                                |
| **6. Navigate to evidence**   | Opens the source detail page's "Persons" or "Events" tab to see which entities reference this source | Tab shows linked entities (via PropertyEvidence or Relation evidence)          | Neutral               | If no entities are linked yet, the tab is empty and offers no guidance                                     | Empty state should say: "No entities reference this source yet. Link it to a person, event, or relation by adding evidence on those records." with action buttons |
| **7. Link to person**         | Navigates to a person detail page; opens the evidence panel for a specific field                     | PropertyEvidenceBadge popover opens                                            | Neutral               | The navigation from source to person requires leaving the source context                                   | Consider a "cited by" view on the source detail page that lets her create PropertyEvidence entries _from the source side_ rather than always from the entity side |
| **8. Enter evidence**         | Selects the source, enters page reference, quote, and transcription                                  | Evidence form accepts input                                                    | Satisfied             | Must search for the source she just created (context was lost by navigating away)                          | If navigating from a source detail page, pre-fill the source in the evidence form                                                                                 |
| **9. Repeat**                 | Creates evidence entries for multiple fields on multiple entities linked to this source              | Repeated popover interactions                                                  | Neutral to Stressed   | Each evidence entry requires re-opening the popover, re-searching the source; no batch mode                | Provide a "Link this source to multiple entities" batch workflow accessible from the source detail page                                                           |
| **10. Quality review**        | Returns to source detail to verify all intended links were created                                   | Source detail tabs show updated counts                                         | Satisfied             | --                                                                                                         | Summary view on source detail: "This source is cited as evidence for 3 persons, 2 events, across 7 field annotations"                                             |

---

### 4.4 Journey: Collaborating with Colleagues on Shared Research

**Persona:** Prof. Dr. Margarethe Engel and Lukas Brandt (Faculty Leader + Student)
**Context:** Lukas has completed a week of data entry. Prof. Engel reviews his work asynchronously. This journey is partially aspirational (collaboration features are in Phase 3) but the UX patterns should be established now.

| Phase                                | User Action                                                                                                                  | System Response                                                                  | Emotional State                                           | Friction Points                                                                   | Design Opportunities                                                                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Lukas: data entry**             | Lukas spends 4 hours entering 8 new person records with evidence from 3 new source records                                   | Standard creation workflows; all records stamped with his user ID and timestamps | Satisfied (productive session)                            | --                                                                                | --                                                                                                                                          |
| **2. Prof. Engel: dashboard review** | Next morning, Prof. Engel opens the dashboard                                                                                | (Future) Dashboard shows: "8 new persons added by Lukas Brandt yesterday"        | Neutral                                                   | Currently the dashboard is a placeholder (Finding 11 in codebase analysis)        | Design the dashboard activity feed now as a component pattern, even if the data aggregation is implemented later                            |
| **3. Drill down**                    | Clicks on the activity summary to see the list of new persons                                                                | Filtered person list or activity feed detail                                     | Neutral                                                   | No way to filter persons by creator or creation date currently                    | Add "Created by" and "Created on" columns to DataTable; support filtering by user                                                           |
| **4. Review a record**               | Opens one of Lukas's new person records                                                                                      | Person detail page with all tabs                                                 | Neutral                                                   | No visual indicator that this record has not been reviewed by a senior researcher | Introduce a subtle "unreviewed" status indicator (icon or badge) on records that have not been opened/edited by a user with a reviewer role |
| **5. Check evidence**                | Scans the detail card; checks that birth and death dates have evidence badges with count > 0                                 | PropertyEvidenceBadges show counts                                               | Satisfied or Stressed (depending on Lukas's work quality) | Must click each badge individually to see the evidence quality                    | Consider a summary view: "Evidence coverage: 4/6 fields annotated" at the top of the detail card                                            |
| **6. Provide feedback**              | (Future) Adds a comment or annotation on the record noting that the death date certainty should be "Possible" not "Probable" | Comment stored as a review annotation linked to the entity                       | Neutral                                                   | No commenting system exists yet                                                   | Design a lightweight inline comment pattern: a note attached to a specific field, visible to the record creator                             |
| **7. Lukas: receive feedback**       | Lukas opens Evidoxa and sees a notification                                                                                  | (Future) Notification badge on dashboard or global header                        | Neutral to Stressed                                       | No notification system exists                                                     | Design notification surface in TopBar (bell icon with badge count); notification list as a dropdown                                         |
| **8. Lukas: resolve feedback**       | Opens the person record, reads the comment, updates the certainty level                                                      | CertaintySelector change; comment marked as resolved                             | Satisfied                                                 | --                                                                                | Show resolution state on comments: "Resolved by Lukas Brandt"                                                                               |
| **9. Completion**                    | Prof. Engel sees the updated record on her next review                                                                       | Activity log shows the change and Lukas's edit timestamp                         | Satisfied                                                 | --                                                                                | Activity feed entry: "Lukas Brandt changed death_date_certainty from Probable to Possible (responding to review by M. Engel)"               |

---

## 5. Competitive and Analogous Analysis

This analysis evaluates seven tools across two categories: domain-specific research/archival tools and modern knowledge-work SaaS. For each, the evaluation focuses on specific UX patterns relevant to Evidoxa.

### 5.1 Zotero (Reference Management)

**What it does well:**

- **Frictionless capture.** The browser connector allows one-click bibliography capture. The mental cost of adding a new reference is near zero.
- **Hierarchical organization.** Collections and sub-collections provide flexible grouping without enforcing a rigid taxonomy.
- **Group libraries for collaboration.** Shared Zotero groups allow multiple researchers to contribute to a common bibliography with per-item attribution.
- **Citation integration.** The Word/LibreOffice plugin closes the loop between data management and scholarly output.

**What it does poorly:**

- **No entity modeling.** Zotero knows about publications, not about historical persons, events, or relationships. It is a flat bibliography, not a relational database.
- **Visual design is dated.** The desktop client looks like a 2008-era application. The web library is better but still utilitarian.
- **Collaboration is coarse-grained.** You share an entire group library or nothing. No per-record access control, no review workflows.
- **No certainty/epistemic metadata.** There is no way to annotate a source with "reliability" or to mark a datum extracted from it as uncertain.

**Lessons for Evidoxa:**

- Emulate the low friction of Zotero's capture flow in Evidoxa's source creation workflow. Creating a source record should feel almost as easy as saving a Zotero reference.
- Adopt the collection/group library model for project-level collaboration.
- Do NOT emulate the visual design. Evidoxa should feel like a modern tool, not a legacy desktop application.

### 5.2 Tropy (Research Photo Management)

**What it does well:**

- **Image-centric workflow.** Designed specifically for researchers who photograph archival documents. The source image is the primary object, and metadata is attached to it.
- **Metadata templates.** Users can define custom metadata schemas (Dublin Core, Encoded Archival Description) and apply them to photographs.
- **Linked data awareness.** Tropy supports JSON-LD export, demonstrating awareness of the linked data ecosystem that digital humanities values.

**What it does poorly:**

- **Desktop-only, single-user.** No web version, no collaboration. Each researcher has their own isolated Tropy database.
- **No relationship modeling.** Like Zotero, Tropy is a flat collection tool. It cannot express "Person A appears in Photograph B alongside Person C."
- **Steep learning curve for metadata configuration.** Custom templates require understanding RDF namespaces and linked data vocabulary -- beyond most historians' comfort zone.
- **No search across projects.** Each Tropy project is a siloed database file.

**Lessons for Evidoxa:**

- Image/document viewing integration (Phase 3+) should follow Tropy's model: the source document is a first-class visual object, not just metadata.
- Metadata templates for source records could reduce the repetitive data entry Dr. Mertens faces.
- Avoid Tropy's isolation problem: Evidoxa's web-based architecture is already a major advantage. Lean into it.

### 5.3 Omeka / Omeka-S (Digital Collections Platform)

**What it does well:**

- **Standards-based metadata.** Built on Dublin Core with support for additional vocabularies. Archivists feel at home.
- **Linked data native (Omeka-S).** Entity relationships and authority file links are part of the core data model.
- **Public-facing and backend separation.** Omeka distinguishes between the curation/cataloging interface and the public exhibition view. This is relevant for Evidoxa's future public data sharing.
- **Module ecosystem.** Extensible through community modules for mapping, timeline visualization, and import.

**What it does poorly:**

- **Complex administration.** Setting up Omeka-S requires significant technical knowledge (server setup, vocabulary configuration, site building).
- **UX is admin-panel quality.** The backend interface is functional but not pleasurable. Dense forms with minimal visual hierarchy.
- **No uncertainty modeling.** Like most collection management systems, Omeka treats metadata as factual. There is no native certainty/confidence mechanism.
- **Collaboration is role-based but rigid.** Admin, Editor, Reviewer roles exist but the workflow between them is not structured (no review queue, no notification system).

**Lessons for Evidoxa:**

- Standards compatibility (Dublin Core, EAD) should be a design goal for source metadata fields, even if initially stored as custom fields. Dr. Mertens needs to know her data is exportable in standard formats.
- Omeka-S's linked data model validates Evidoxa's entity-relationship approach. The difference is that Evidoxa adds epistemic metadata (certainty, evidence) on top.
- Avoid the "admin panel" feel. Evidoxa's research interface should be a tool you want to spend hours in, not endure.

### 5.4 Notion (Knowledge Management)

**What it does well:**

- **Flexible data modeling.** Databases with custom properties, relations between databases, rollups, and formulas give users enormous flexibility.
- **Visual polish.** Clean typography, generous whitespace, smooth animations. Notion feels crafted.
- **Collaboration is seamless.** Real-time co-editing, commenting, @-mentions, and page-level permissions.
- **Template system.** Database templates reduce repetitive data entry.
- **Progressive disclosure.** Complex properties and configurations are hidden until needed.

**What it does poorly:**

- **No domain awareness.** Notion has no concept of certainty, evidence, or citation. Building a research database in Notion requires extensive manual scaffolding.
- **Performance degrades at scale.** Databases with 500+ entries become slow. Historical research projects routinely exceed this.
- **Export is lossy.** Notion's export (Markdown, CSV) loses relational structure. Data portability is poor.
- **No structured date handling.** Notion dates are calendar dates -- no partial dates, no date uncertainty.
- **Offline access is limited.** Archive visits may have no internet access.

**Lessons for Evidoxa:**

- Notion's visual quality sets the bar. Researchers who use Notion will compare Evidoxa against it. The design system must deliver comparable typographic and spatial quality.
- Template/preset patterns for entity creation are worth adopting. Let users save a "default source template" with pre-filled archive and fond fields.
- Notion's commenting and @-mention patterns are the gold standard for inline feedback.

### 5.5 Obsidian (Personal Knowledge Management)

**What it does well:**

- **Local-first, performant.** Instant load, no server dependency. Works offline in archives.
- **Graph view.** The backlink graph provides a visual representation of knowledge connections that researchers find intellectually satisfying.
- **Extensible via plugins.** Dataview, Templater, and community plugins extend Obsidian far beyond its core.
- **Markdown-native.** Data is stored in plain text files. No lock-in.

**What it does poorly:**

- **No structured data.** Obsidian stores knowledge as text with links, not as structured entities with typed fields. Building a prosopographic database requires fighting the tool.
- **Collaboration is bolted on.** Obsidian Sync/Publish are add-ons, not core features. Real-time collaboration does not exist.
- **No access control.** A vault is all-or-nothing.
- **Visual customization requires CSS expertise.** Theming is powerful but inaccessible to non-technical users.

**Lessons for Evidoxa:**

- The graph view is aspirational (planned for Epic 4.3). Obsidian demonstrates that researchers value spatial/visual representations of their knowledge structures. Evidoxa's network graph should feel similarly native and responsive.
- Obsidian's keyboard-centric workflow (Cmd+O to open, Cmd+P for command palette) reduces friction for power users. Evidoxa should implement a command palette (cmdk is already installed).
- Local-first/offline capability should be on the roadmap, especially for archive-based workflows.

### 5.6 Figma (Collaborative Design)

**What it does well:**

- **Real-time collaboration with presence.** Cursors, avatars, and "follow" mode create a shared workspace awareness.
- **Component system.** Variants, auto-layout, and design tokens enable systematic design at scale.
- **Commenting on specific elements.** Pin a comment to a precise location, not just a page.
- **Version history with named checkpoints.** Meaningful version snapshots rather than continuous autosave blur.

**What it does poorly:**

- **Irrelevant domain model.** Figma's design canvas metaphor has no parallel in research data management.
- **Complex learning curve.** The power of the tool comes with significant onboarding cost.

**Lessons for Evidoxa:**

- Contextual commenting (pinned to a specific field or data point) is directly applicable to the review workflow between Prof. Engel and Lukas.
- Named version snapshots could be valuable: "State of database at project milestone 3" as a restorable checkpoint.
- Figma's developer handoff model (inspect mode) suggests that Evidoxa's future export functionality should let users inspect the evidence chain for any claim without editing it.

### 5.7 Linear (Project Management)

**What it does well:**

- **Keyboard-first design.** Nearly every action is accessible via keyboard shortcut. Power users rarely touch the mouse.
- **Information density.** Issue lists show substantial data per row (status, priority, assignee, labels, cycle) without feeling cluttered.
- **Instant transitions.** Page transitions are sub-100ms with optimistic UI updates. The app feels faster than it objectively is.
- **Dark mode as a first-class citizen.** Linear's dark mode is not an afterthought -- it is the default, and it is beautiful.
- **Command palette.** `Cmd+K` provides universal access to any action.

**What it does poorly:**

- **Opinionated workflow.** Linear assumes a specific issue lifecycle (Backlog -> Todo -> In Progress -> Done) that may not map to research workflows.
- **Limited customization.** The rigid data model (issues, projects, cycles) cannot be extended by users.

**Lessons for Evidoxa:**

- Linear's keyboard-first philosophy should be adopted aggressively. Cmd+K command palette for entity search/navigation, keyboard shortcuts for common actions (N for new, E for edit, D for delete with confirmation).
- Optimistic UI updates for relation creation and evidence addition would make the tool feel responsive during intensive data entry sessions.
- Linear's approach to information density in list views -- compact rows with meaningful data -- is the model for Evidoxa's DataTable.
- Dark mode quality must match Linear's standard. The current dark mode tokens (codebase analysis) are functional but generic.

---

### 5.8 Synthesis: Competitive Positioning Matrix

| Capability                   | Zotero          | Tropy           | Omeka            | Notion            | Obsidian            | Figma            | Linear            | **Evidoxa (target)**                              |
| ---------------------------- | --------------- | --------------- | ---------------- | ----------------- | ------------------- | ---------------- | ----------------- | ------------------------------------------------- |
| Structured entity modeling   | None            | Metadata only   | Dublin Core      | Generic databases | None (text-based)   | N/A              | Issues only       | **Domain-specific entities with typed relations** |
| Epistemic certainty          | None            | None            | None             | Manual property   | None                | N/A              | Priority (analog) | **Native four-state certainty on every field**    |
| Evidence/provenance tracking | Citation only   | Photo link      | Resource link    | None              | Backlinks (untyped) | N/A              | None              | **Per-field source citations with transcription** |
| Partial/uncertain dates      | None            | Standard dates  | Standard dates   | Standard dates    | None                | N/A              | Dates             | **Year/month/day partial dates with certainty**   |
| Collaboration                | Group libraries | None            | Role-based       | Real-time editing | Sync (add-on)       | Real-time cursor | Team workflows    | **Async review with attribution**                 |
| Visual quality               | Dated           | Functional      | Admin-panel      | Polished          | Customizable        | Best-in-class    | Excellent         | **Modern, dense, warm**                           |
| Keyboard efficiency          | Fair            | Poor            | Poor             | Good              | Excellent           | Good             | Excellent         | **Keyboard-first with command palette**           |
| Multilingual support         | Metadata fields | Metadata fields | Vocabulary-based | None              | None                | N/A              | None              | **Native bilingual UI + multilingual content**    |

---

## 6. Key Implications for Design System

The following implications are derived directly from the personas, principles, journeys, and competitive analysis above. Each maps to a specific design system decision.

### 6.1 Color and Tone

- **Background warmth.** Shift from pure white to warm off-white for long-session comfort (Principle 3.3). Target: `hsl(40, 10-20%, 98-99%)` for light mode base.
- **Certainty color scale.** Define four semantic colors for Certain, Probable, Possible, and Unknown that work across light/dark mode and are distinguishable without relying solely on hue (Principle 3.1). Pair each with an icon.
- **Evidence status colors.** Introduce a "claim without evidence" warning state -- visually distinct from standard states -- to surface un-evidenced high-certainty claims (Journey 4.2, Phase 3).
- **Semantic status tokens.** Add `--color-success`, `--color-warning`, `--color-info` to the token system (codebase analysis Finding 1).
- **Brand identity.** The primary color must move away from near-black toward a meaningful brand color. Given the domain: a deep, scholarly blue or a warm archival tone. Both must convey authority without coldness. This decision belongs to the brand strategy phase but must be informed by the ergonomic requirement for warmth.

### 6.2 Typography

- **Reading size for content.** 16px minimum for notes, transcriptions, and any field where users read multi-sentence text (Principle 3.3).
- **Hierarchical heading scale.** Formalize the heading hierarchy beyond `text-2xl font-bold` everywhere. Page title, section title, field group label, and field label need distinct sizes (codebase analysis Finding on typography).
- **Monospace for transcriptions.** The `raw_transcription` field (diplomatic transcription) should use `--font-mono` to signal "this is verbatim text." Normalized quotes use the standard sans-serif.
- **German text baseline.** All component sizing (buttons, tabs, sidebar) must use German string lengths as the sizing baseline (Principle 3.6).

### 6.3 Layout and Density

- **Entity detail page: consider two-column layout.** Primary attributes card + tabbed secondary panel on wide screens (Principle 3.7).
- **Formalize the `p-6 space-y-6` page container** as a `PageContainer` pattern (codebase analysis Finding 8).
- **DataTable column visibility toggles** are mandated by Epic 2.5 and validated by persona needs (Principle 3.7).
- **Sidebar width tokens.** The sidebar width values (224px open, 48px collapsed) must be defined as CSS custom properties to eliminate the inline-style fragility (codebase analysis Finding 10).

### 6.4 Interaction Patterns

- **Command palette.** `cmdk` is already installed. Activate it with `Cmd+K` / `Ctrl+K` for entity search, navigation, and common actions (Obsidian and Linear lessons).
- **Inline creation from selectors.** EntitySelector and source search should support creating a new entity without navigating away (Journey 4.1, steps 9 and 13).
- **Keyboard shortcuts.** Define a shortcut vocabulary: `N` for new, `E` for edit, `/` for search focus, `Esc` for close/back (Linear lesson).
- **Optimistic UI.** Relation creation and evidence addition should update the UI immediately, with background server confirmation (Linear lesson).

### 6.5 Accessibility

- **WCAG AAA contrast target** for body text in long-reading contexts (Principle 3.3).
- **Semantic HTML enforcement.** Unify detail card markup to `<dl>/<dt>/<dd>` across all entity types (codebase analysis Finding 8).
- **Focus management in modals and popovers.** The PropertyEvidenceBadge popover and RelationFormDialog must follow WAI-ARIA dialog patterns for focus trapping and restoration.
- **Reduced motion support.** All animations (page transitions, theme transitions, sidebar collapse) must respect `prefers-reduced-motion`.
- **Screen reader announcement of certainty states.** CertaintySelector values must be communicated via `aria-label` or `aria-pressed`, not color alone.

### 6.6 Collaboration Patterns (Design Now, Implement Later)

- **Activity feed component pattern.** Design a standardized activity item (avatar, action verb, entity link, timestamp) that can be used on dashboards, entity detail pages, and future notification panels.
- **Attribution display.** "Created by [User] on [Date]" should be a standard element on all entity detail cards.
- **Review state indicator.** Reserve visual space on entity detail cards for a future "reviewed/unreviewed" badge.
- **Notification surface.** Reserve space in TopBar for a notification bell icon with count badge.

---

_This document provides the research foundation for all subsequent design system decisions. Persona needs, domain principles, and journey friction points identified here should be referenced explicitly in UX architecture, UI design, and brand strategy documents. Every design choice must be traceable to a research finding._
