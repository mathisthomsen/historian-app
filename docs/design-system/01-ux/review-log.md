# UX Review Log -- Evidoxa Design System

## Review Round 1 -- 2026-04-02

**Reviewer:** Distinguished UX Critic
**Scope:** `01-ux/research.md` and `01-ux/architecture.md`
**Upstream reference:** `00-discovery/codebase-analysis.md`

---

### Blocking Issues (must fix before proceeding)

**B1 [BLOCKING] -- No error recovery or offline/degraded-network strategy for archive-based workflows**

The research document identifies that Lukas works in archives where connectivity may be unreliable (Research 2.2: "occasionally uses archive reading room PCs"; Obsidian competitive analysis 5.5 explicitly notes "Local-first/offline capability should be on the roadmap, especially for archive-based workflows"). The architecture document specifies optimistic UI updates and server-side pagination but contains zero guidance on what happens when the network is unavailable or intermittent during a data entry session. The Sonner undo pattern (Section 3.7) assumes the compensating server action can execute within the toast window -- what if it cannot?

This is a blocking issue because the architecture will be implemented by engineers who need to know whether to queue failed writes, show persistent retry UI, or simply fail. Without this, the primary persona's primary workflow (post-archive data entry) has undefined behavior under realistic conditions.

Suggested fix: Add a subsection to architecture.md Section 3 or Section 5 titled "Network Resilience Strategy." Define three network states (online, degraded, offline) and the UI behavior for each. At minimum: (1) queued writes with a "pending sync" indicator for create/update operations, (2) a persistent banner when the application detects degraded connectivity, (3) explicit decision on whether to support offline mode now (even read-only cache) or defer with a documented rationale. If deferred to Phase 3+, say so explicitly and ensure the architecture does not preclude it.

---

**B2 [BLOCKING] -- Mobile and tablet experience is under-specified for a real use case**

Research persona Lukas uses a smartphone and "archive reading room PCs" (Research 2.2). Prof. Engel uses an iPad at conferences and archives (Research 2.1). The architecture responsive strategy (Section 4.2) defines breakpoints and reflow rules but provides no journey map or workflow optimization for mobile/tablet. The "card-stack" table layout on mobile is mentioned in one sentence with no detail on how entity creation, evidence annotation, or relation linking works on a touch device.

The research document identifies tablet/mobile as a real usage context, not an edge case. The architecture must account for it or explicitly scope it out with a rationale.

Suggested fix: Either (a) add a compact mobile journey map for the top 3 tasks (entity creation, entity search, evidence review) at the tablet breakpoint, covering touch targets, form layout, and dialog sizing -- or (b) explicitly state that mobile/tablet is out of scope for the design system MVP and will be addressed in a follow-up round, with a list of architectural decisions that must not preclude mobile support (e.g., no hover-only interactions for critical paths).

---

### Improvements (should fix)

**M1 [MAJOR] -- Certainty color system is referenced but never defined, even as a constraint**

Research Section 6.1 says "Define four semantic colors for Certain, Probable, Possible, and Unknown" and Architecture Principle 1 says certainty must be "visually encoded." But no concrete color direction, hue family, or constraint set is provided. The brand strategy phase is expected to finalize colors, but the UX architecture should at minimum define: (1) the visual channels to use (color + icon + text label, not color alone), (2) the ordering logic (e.g., green-to-red spectrum is problematic for red-green color blindness -- is this excluded?), (3) whether the Unknown state should be visually neutral or visually flagged. Without these constraints, the brand strategist and UI designer could produce something that fails the research principles.

Suggested fix: Add a "Certainty Visual Encoding Constraints" subsection to architecture.md Section 3.5 or a new Section 3.8. Specify that certainty encoding must use at minimum two visual channels (e.g., color + icon). Specify that the encoding must be distinguishable under protanopia and deuteranopia simulation. Specify whether Unknown is a "neutral default" or an "attention-seeking gap." The research document (Principle 3.1) says absence of evidence should "feel like a gap" -- extend this to certainty.

---

**M2 [MAJOR] -- "Claim without evidence" warning pattern is described in three places with no single canonical definition**

Research Principle 3.1 describes the concept. Research Journey 4.2 Phase 3 identifies it as a friction point. Architecture Principle 1 provides a concrete example (PropertyEvidenceBadge in warning style). Research Section 6.1 calls it an "evidence status color." But there is no single canonical pattern definition that a UI designer or engineer could implement. Is the warning on the badge? On the field label? On the entire row? Is it a color change, an icon, a tooltip, or all three? What certainty threshold triggers it (only "Certain" with 0 evidence, or also "Probable" with 0 evidence)?

Suggested fix: Consolidate into one canonical pattern definition in architecture.md, ideally in Section 3.5 (Evidence Annotation Interactions) or as a new pattern in Section 3. Define: trigger condition (which certainty states + evidence count = 0 produce the warning), visual treatment (badge style change + field-level indicator), and screen reader announcement.

---

**M3 [MAJOR] -- No explicit handling of the "source-first" workflow identified in research**

Lukas's mental model (Research 2.2) is "source-first data extraction" -- he reads a source and creates entities from it. Dr. Mertens's Journey 4.3 identifies the same friction: evidence must always be created from the entity side, never from the source side. The architecture provides entity-centric workflows exclusively. There is no "cited-by" view on source detail pages, no "link this source to multiple entities" batch flow, and the Research Journey 4.3 design opportunities (steps 7 and 9) are acknowledged but not incorporated into the architecture's workflow optimizations (Section 5).

This is the second-most-important workflow for two of three personas and it has no architectural support.

Suggested fix: Add a "Source-Centric Evidence Linking" workflow to architecture.md Section 5. Define a "Cited By" tab or panel on the Source detail page that allows creating PropertyEvidence entries with the source pre-filled, requiring only the target entity and field selection. Include it in the top-5 task list (Section 5.1) or explain why it is deferred.

---

**M4 [MAJOR] -- Inline editing (Section 5.3) lacks sufficient guardrails for scholarly data**

The architecture proposes double-click inline editing for Notes, Certainty, Event Type, and Source Reliability. For a scholarly tool where every change should ideally be traceable and evidenced, inline editing of Certainty is risky. Changing certainty from "Certain" to "Possible" is a significant scholarly claim -- doing it with a single click and a 5-second undo window, with no prompt to update the evidence record, could undermine the "Evidence First" principle (Principle 1).

Suggested fix: For Certainty inline edits specifically, add a nudge: after the change is saved, if evidence exists for the field, show a toast or inline prompt: "Certainty changed. Review the evidence for this field?" with a link to the evidence panel. For Notes, Event Type, and Reliability, inline editing is appropriate as-is.

---

**M5 [MAJOR] -- RTL content handling is dismissed too quickly**

Research Principle 3.6 states "Right-to-left content is not currently required but should not be architecturally precluded." However, historians working with Ottoman, Arabic, or Hebrew primary sources are common in German academia (particularly early modern studies involving the Ottoman-Habsburg frontier). The architecture should not just "not preclude" RTL -- it should specify that content fields (notes, transcriptions, quotes) accept `dir="auto"` so that mixed-direction content renders correctly. This is a real use case for the target audience, not a theoretical concern.

Suggested fix: Add `dir="auto"` as a requirement for all user-content text fields (notes, raw_transcription, quote) in the form interaction patterns (Section 3.3) and detail card markup. This is a one-line attribute per field and prevents layout breakage when RTL text is entered.

---

**M6 [MAJOR] -- Content density toggle (Section 4.2) introduces significant testing surface with no priority justification**

The architecture defines three density levels (compact, comfortable, spacious) with different row heights, font sizes, spacing, and page padding. This triples the visual testing matrix. The research personas do not explicitly request density customization -- Prof. Engel needs larger text (addressed by the Spacious level), but this could be solved more simply with a text-size preference or browser zoom guidance.

Suggested fix: Either (a) reduce to two density levels (comfortable as default, spacious as an accessibility option) and defer compact to a future iteration, or (b) keep all three but add a note that only "comfortable" must be pixel-perfect at launch, with compact and spacious tested for layout integrity but not visual polish. The testing burden must be acknowledged.

---

**M7 [MAJOR] -- No error taxonomy or error message style guide**

The architecture defines error states per component (Sections 3.1-3.5) but there is no unified error taxonomy. What distinguishes a "toast error" from an "inline error" from a "full-width error card"? The decision appears to be made per-component without a governing principle. For example, evidence save failure uses "Inline error below the form within the popover" (Section 3.5), but relation save failure uses "toast error" with retry (Section 3.4). Why the difference?

Suggested fix: Add a brief error taxonomy to architecture.md (new subsection in Section 3 or Section 6). Categories: (1) Field-level validation -- inline below field, (2) Form-level validation -- summary at top of form, (3) Transient operation failure (network, timeout) -- toast with retry, (4) Persistent operation failure -- inline error with preserved state, (5) Page-level data load failure -- error card with retry. Map each existing error state to a category.

---

### Minor Notes

**N1 [MINOR] -- `role="main"` on `<main>` element is redundant.** The `<main>` element has an implicit `main` role in all modern browsers. Architecture Section 6.2 includes `role="main"` explicitly. This is harmless but technically unnecessary and could be removed for cleaner markup.

**N2 [MINOR] -- Keyboard shortcut `Cmd+Z` for undo (Section 5.2) conflicts with browser/OS undo in text fields.** The architecture specifies that shortcuts without modifiers only activate outside text inputs, but `Cmd+Z` is a modifier shortcut that will fire inside text inputs too. The note should clarify that `Cmd+Z` for "toast undo" only activates when a toast with an undo action is currently visible, and it should not intercept the browser's native undo in text fields.

**N3 [MINOR] -- The `<aside>` element with `role="navigation"` (Section 6.2) is semantically odd.** An `<aside>` has an implicit `complementary` role. If the sidebar is primarily navigation, it should be a `<nav>` element. If it contains non-navigation content (branding, user info), then `<aside>` is acceptable but the `role="navigation"` override should be documented with a rationale.

**N4 [MINOR] -- Evidence panel (Section 4.3) specifies "focus trapped within panel while open" but the panel is described as overlaying tab content, not the entire page.** If focus is trapped, the user cannot interact with the AttributesCard above the panel without closing it. Clarify whether this is a modal panel (focus trapped, backdrop) or a non-modal panel (focus managed but not trapped, user can click outside to interact with other page content).

**N5 [MINOR] -- The competitive analysis (Research Section 5) mentions seven tools but the synthesis matrix (Section 5.8) lists eight columns.** This is because Evidoxa itself is the eighth column. The text should clarify this to avoid confusion.

**N6 [MINOR] -- Breadcrumb entity name truncation at 30 characters (Architecture Section 2.6) may be too aggressive for German names.** "Johann Philipp Franz von Schoenborn" is 36 characters and a perfectly normal early modern German name. Consider 40 characters or dynamic truncation based on available space.

**N7 [MINOR] -- No mention of print styles.** Historians frequently print entity detail pages for annotation or archival reference. A `@media print` strategy (hide sidebar, expand content to full width, ensure evidence badges render as text) would be a valuable addition, even if minimal.

**N8 [MINOR] -- The `prefers-reduced-motion` blanket rule (Section 6.6) using `0.01ms` duration is a known hack but may cause issues with Radix UI components** that check `transitionend` events. Consider using `0s` or testing against shadcn/ui's Dialog and Popover components specifically.

**N9 [MINOR] -- Research document lists Lukas's accessibility as "No specific needs currently; occasionally works in dim-light conditions" but does not note that this will change.** A 27-year-old spending 2-4 hours on a screen in archive reading rooms with variable lighting absolutely has ergonomic needs. The architecture correctly addresses this (warm backgrounds, contrast ratios) but the research persona framing could acknowledge situational accessibility needs more explicitly.

---

### Strengths Worth Acknowledging

The following aspects are notably well-executed and should be preserved through implementation:

1. **Personas are domain-authentic.** The three personas are not generic user types but genuine composites of real academic research workflows. The mental models section for each persona is particularly strong -- source-first vs. network-first vs. hierarchy-first thinking is a real divergence in the field.

2. **Competitive analysis is actionable, not decorative.** Each tool analysis ends with concrete "Lessons for Evidoxa" that map to specific design decisions. The synthesis matrix is a useful reference artifact.

3. **Architecture principles are testable.** Each principle includes a concrete test criterion. Principle 4's "overlay at 50% opacity" test for layout consistency is creative and rigorous.

4. **Accessibility is genuinely integrated, not bolted on.** The landmark structure, live region strategy, ARIA pattern catalog, and reduced motion catalog demonstrate that accessibility was considered during authoring, not appended afterward. The focus management strategy (Section 6.1) is thorough.

5. **The undo/redo strategy (Section 3.7) is well-scoped.** The decision to use toast-based single-step undo rather than a full undo stack is pragmatic and appropriate for the application's complexity level.

6. **Keyboard shortcut vocabulary is coherent.** The distinction between unmodified shortcuts (outside text inputs) and modified shortcuts (global) is clearly articulated.

7. **Research-to-architecture traceability is strong.** Architecture decisions consistently cite specific research sections, persona behaviors, and journey friction points. This is how it should be done.

---

### Verdict: REVISE

Two blocking issues (B1, B2) must be addressed before this phase can be considered complete. The architecture cannot proceed to UI design and implementation without a network resilience strategy and a minimal mobile/tablet specification (or an explicit, justified exclusion).

The seven major improvements (M1-M7) should also be addressed, though they are individually non-blocking. Taken together, they represent enough ambiguity that downstream designers and engineers will make inconsistent decisions without the clarifications.

**Minimum required for PASS:**

1. Resolve B1 -- Add network resilience subsection (online/degraded/offline behavior).
2. Resolve B2 -- Add mobile/tablet workflow coverage or explicit scoping rationale.
3. Resolve at least M1, M2, and M3 -- These affect the core differentiated workflows (certainty encoding, evidence warnings, source-first linking).

**Recommended for PASS:** 4. Resolve M4-M7 as well, to reduce ambiguity for implementers.

---

## Review Round 2 -- 2026-04-02

**Reviewer:** Distinguished UX Critic
**Scope:** `01-ux/architecture.md` (revised), verifying resolution of Round 1 B1, B2, M1, M2, M3; fresh pass on new content
**Upstream reference:** `01-ux/research.md`, `01-ux/review-log.md` (Round 1)

---

### Resolution Verification

**B1 [BLOCKING] -- Network resilience / offline strategy: RESOLVED**

Section 3.10 "Network Resilience Strategy" is thorough and well-structured. The three network states (online, degraded, offline) are clearly defined with detection methods and user-visible signals. The behavior-by-action-type table (page navigation, form submit, inline edit, relation create, bulk delete, evidence add) covers every interaction pattern defined earlier in the document. The scope decision to defer full offline mode to Phase 4+ is explicit, with a clear rationale ("all write operations use discrete server actions, making them compatible with a future offline queue"). The data loss prevention subsection -- `beforeunload` listeners, localStorage draft persistence, evidence popover confirmation -- is a genuine addition that goes beyond what was requested and addresses a real risk for Lukas's 2-4 hour sessions.

The retry pattern is sensible: manual retry only, no automatic retry, 8-second timeout, 15-second error toast persistence. The decision to disable (rather than queue) write controls when offline is pragmatic for the current phase and does not preclude future queuing.

One minor note carried forward: the `useNetworkStatus` hook specification could mention that `navigator.onLine` is unreliable on some platforms (it only detects whether the device has a network interface, not whether it has internet access). The three-consecutive-failures fallback covers this in practice, but a comment in the implementation guidance would help engineers avoid over-reliance on the browser API.

**B2 [BLOCKING] -- Mobile/tablet experience: RESOLVED**

Section 4.4 "Mobile and Tablet Experience" is substantial. The bottom tab bar for tablet navigation is a good pattern choice that avoids the drawer-for-every-action problem. The touch target requirements table is comprehensive and correctly references WCAG 2.5.5. The tablet-specific two-column detail layout for landscape orientation directly addresses Prof. Engel's iPad use case. The card-stack DataTable for mobile is now fully specified with visual structure and interaction model (including swipe-to-delete as a convenience gesture, not sole path).

The form input adaptations for touch (numeric keyboard for dates, taller textareas, 44px combobox items) demonstrate that the author thought through the actual input experience, not just layout reflow. The fixed-position form footer on tablet is a practical decision that ensures submit is always reachable.

**M1 [MAJOR] -- Certainty color system: RESOLVED**

Section 3.8 "Certainty Visual Encoding Constraints" is precisely what was needed. Five certainty levels with semantic token names, dual-channel minimum (color + distinct icon shape), explicit exclusion of green-to-red spectrum, contrast requirements (3:1 minimum against all background surfaces), and mandatory color-blindness simulation testing. The icon progression (filled circle to dashed ring) is clever -- it works in grayscale, which is the ultimate accessibility test. The distinction between Unknown ("attention-seeking gap") and Unevidenced ("strong attention, cautionary tone") directly implements Research Principle 3.1. The compact rendering rules (icon-only at 16x16px minimum with tooltip) handle the DataTable density concern.

**M2 [MAJOR] -- "Claim without evidence" warning: RESOLVED**

Section 3.9 "Claim Without Evidence Warning Pattern" is a model canonical pattern definition. Trigger conditions are precise (certainty is Certain/Probable/Possible AND evidence count is zero AND view mode). The exclusion of Unknown with zero evidence is correct -- that is the default state, not a warning state. Visual treatment is specific enough to implement (badge style tokens, icon reference to Section 3.8, no banner/toast on page load). The screen reader announcement is well-crafted and avoids the simultaneous-announcement problem for pages with multiple unevidenced fields. The interaction with inline editing (Section 3.9 bottom) addresses the M4 concern from Round 1: certainty changes that create a new warning state trigger a nudge toast with an "Add evidence?" action. This is the exact fix that was suggested.

**M3 [MAJOR] -- Source-first workflow: RESOLVED**

Section 5.5 "Source-First Creation Path" is comprehensive. The "Cited Entities" tab on Source detail pages, the inline entity creation dialog with evidence pre-fill, the "Add Another" pattern for sequential extraction from a single source, and the command palette integration all support Lukas's source-first mental model. The evidence pre-population table is clear and the field-reference dropdown for choosing which entity field the evidence applies to is a thoughtful detail. The post-creation navigation options (stay, view, add another) map directly to real workflow branching points.

The atomic create-entity-plus-evidence server action pair (step 4) is noted as requiring rollback on partial failure. This is a good architectural flag for engineers.

---

### Status of Unresolved Round 1 Items (M4-M7, N1-N9)

**M4 (inline editing guardrails):** Partially resolved. Section 3.9's interaction with inline editing now provides a nudge toast when a certainty change creates a warning state. However, the nudge only fires when evidence count is zero. The original concern also covered the case where evidence _exists_ but the certainty change may be inconsistent with it (e.g., upgrading from Possible to Certain without adding new evidence). This is an edge case and not blocking. Acceptable for Phase 2.

**M5 (RTL content handling):** Resolved. Section 3.3 now explicitly requires `dir="auto"` on all user-content text fields (notes, raw_transcription, quote, description). The text mentions "mixed-direction content (e.g., Ottoman Turkish, Arabic, or Hebrew primary source excerpts common in early modern German history)" which is exactly the use case.

**M6 (content density toggle):** Not addressed in this revision. The three-density system remains as-is with no testing priority guidance. This is not blocking but remains a risk for implementation timeline.

**M7 (error taxonomy):** Not explicitly addressed as a standalone section. However, the network resilience section (3.10) introduces a de facto error taxonomy through its behavior-by-action-type table: form failures preserve state with inline retry, transient failures use toast with retry, page-level failures show error cards. The per-component error states from Sections 3.1-3.5 are now more consistent with this implicit taxonomy. A formal error taxonomy section would still improve clarity, but the risk of inconsistent implementation is reduced.

**N1-N9 (minor notes):** N1 (`role="main"` redundancy) and N3 (`<aside>` with `role="navigation"`) remain in the landmark structure (Section 6.2), unchanged. N2 (`Cmd+Z` clarification) is now addressed in Section 5.2 -- the shortcut table entry includes "focus outside text input" as a condition. N8 (`prefers-reduced-motion` 0.01ms hack) remains unchanged in Section 6.6. These are all minor and non-blocking.

---

### New Issues Introduced by Revisions

**I1 [IMPROVEMENT] -- Source-first creation dialog (Section 5.5) defaults evidence certainty to "Probable" without rationale for override**

The evidence pre-fill table sets certainty to "Probable" by default. This is described as "a reasonable default for source-extracted data." However, the archivist persona (Dr. Mertens) has a more conservative approach -- she views certainty as procedural ("the source either contains the datum or it does not") and would likely default to "Certain" when a source explicitly states a date, or "Unknown" when it does not. The "Probable" default is appropriate for Lukas's inferential workflow but may feel wrong to Dr. Mertens.

Suggested fix: Add a brief note that the default certainty in the source-first dialog could be a user preference in future iterations, and that the current "Probable" default is chosen as the safest middle ground (it does not overclaim certainty and does not understate it). No immediate change required.

**I2 [IMPROVEMENT] -- Bottom tab bar (Section 4.4) introduces a platform-specific pattern that may conflict with native browser chrome**

On iOS Safari, the bottom navigation bar competes with the browser's own bottom toolbar (address bar, tab switcher). When the Safari bottom bar is visible, a 64px app bottom tab bar creates a stacked-bar problem that reduces usable viewport height by approximately 128px on a device where vertical space is already constrained. Android Chrome has a similar issue with its bottom address bar.

Suggested fix: Add a note that the bottom tab bar should use `env(safe-area-inset-bottom)` padding and should consider whether the bar needs to auto-hide on scroll (showing only when the user scrolls up or taps the screen, matching native app conventions). Alternatively, if the app is expected to be used primarily in desktop/laptop contexts even when on a tablet, the bottom tab bar could be deferred to a PWA iteration.

**I3 [IMPROVEMENT] -- Swipe-to-delete on mobile cards (Section 4.4) has no undo affordance specified**

The mobile card-stack DataTable describes "swipe-left on a card reveals a Delete action (red background)." For a scholarly tool where accidental deletion is a serious concern, swipe-to-delete on a touch device is a high-risk gesture. The existing bulk delete flow uses a confirmation dialog, but the swipe gesture implies a lighter-weight interaction. There is no mention of whether the swipe-delete triggers the same confirmation dialog, the same soft-delete with undo toast, or something else.

Suggested fix: Specify that swipe-to-delete reveals a "Delete" button (not auto-executes on swipe completion) and that tapping the revealed button follows the same confirmation flow as single-entity delete on desktop (confirmation dialog for soft-delete, with undo toast after confirmation). This aligns with the Recoverability principle (Principle 7).

**I4 [IMPROVEMENT] -- The "Cited Entities" tab position (Section 5.5) conflicts with the canonical tab order (Section 2.3)**

Section 2.3 defines the Source detail page tab order as: Attributes, Persons, Events, Relations, Evidence, Activity. Section 5.5 inserts "Cited Entities" at position 4. But "Cited Entities" overlaps conceptually with the existing "Persons" and "Events" tabs (which already show linked entities via relations). The distinction between "entities linked via Relation records" (Persons/Events tabs) and "entities linked via PropertyEvidence records" (Cited Entities tab) is meaningful but may confuse users who do not understand the Relation vs. PropertyEvidence data model distinction.

Suggested fix: Either (a) rename the tab to "Evidence Links" or "Sourced From" to distinguish it from the relation-based tabs, and add a brief description in the tab's empty state explaining what it shows -- or (b) merge the Cited Entities view into the existing Persons/Events tabs as a secondary grouping (e.g., within the Persons tab, show "Related via relations" and "Cited in evidence" as separate sections). Option (a) is simpler for Phase 2.

---

### Blocking Issues (must fix before proceeding)

None. All Round 1 blocking issues have been resolved.

---

### Improvements (should fix)

- **I2 [Bottom tab bar vs. browser chrome]:** Add `env(safe-area-inset-bottom)` requirement and note the iOS Safari/Android Chrome stacked-bar risk. This is a one-line CSS addition and a documentation note.
- **I3 [Swipe-to-delete undo path]:** Specify that swipe reveals a button, and the button triggers the standard delete confirmation flow. Without this, an engineer will guess.
- **I4 [Cited Entities tab naming/positioning]:** Rename or clarify the distinction from relation-based entity tabs. The current name creates a conceptual overlap that will confuse the archivist persona.
- **M6 [Carried from Round 1] -- Content density testing priority:** Add a note that only "comfortable" density must be fully tested at launch. Compact and spacious should be tested for layout integrity but not pixel-perfection.

---

### Minor Notes

- **I1 (Probable default certainty):** Acceptable as-is with a brief rationale note. Not blocking.
- **N1, N3, N8 from Round 1** remain open but are harmless and can be addressed during implementation.
- The `useNetworkStatus` hook should document that `navigator.onLine` is unreliable as a sole signal. The three-consecutive-failures fallback is correct but the documentation should warn against removing it.
- The breadcrumb in the source-first navigation flow ("Sources > {Source Title} > {Entity Name}") is described as "non-standard." This should be flagged as a pattern that needs explicit handling in the breadcrumb generation logic (Section 2.6), since it does not follow the route-segment-to-breadcrumb mapping.

---

### Strengths of the Revision

1. **Section 3.10 (Network Resilience)** is exemplary. The behavior-by-action-type table gives engineers an unambiguous reference for every interaction pattern. The data loss prevention subsection (draft persistence, evidence popover confirmation) goes beyond the original request and addresses a real pain point.

2. **Section 5.5 (Source-First Creation)** is the most valuable addition to the architecture. It transforms an entity-centric tool into one that supports both mental models (entity-first and source-first). The "Add Another" loop pattern for sequential extraction is exactly right for the post-archive session.

3. **Section 3.8 (Certainty Visual Encoding)** is a model constraint specification -- it tells the brand strategist what they must achieve without telling them how to achieve it. The dual-channel requirement and the explicit green-to-red exclusion will prevent the most common accessibility failure in status color systems.

4. **Section 4.4 (Mobile/Tablet)** is thorough for what was previously a one-sentence mention. The touch target table, form input adaptations, and landscape two-column layout demonstrate genuine engagement with the tablet use case.

---

### Verdict: PASS

All five mandatory resolution items (B1, B2, M1, M2, M3) have been addressed thoroughly. No new blocking issues were introduced. The four improvement items (I2, I3, I4, M6-carried) are genuine concerns but none prevents downstream work from proceeding. They should be addressed early in Phase 2 design work, ideally before component specification begins.

The UX architecture is ready for the UI design, brand strategy, and component specification phases.
