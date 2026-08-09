-- Reconciles audit finding D-H4: missing indexes on foreign-key columns.
--
-- Postgres automatically indexes the *referenced* side of a foreign key (via the
-- primary key) but never the *referencing* side. Every column below is a FK that
-- is either queried directly today or scanned on each delete of its parent row:
--
--   persons.birth_location_id     scanned on every Location delete (Epic 3.2)
--   persons.death_location_id     scanned on every Location delete (Epic 3.2)
--   events.event_type_id          per-type event counts
--   events.parent_id              `topLevelOnly` filter + sub-event delete guard
--   events.location_id            scanned on every Location delete (Epic 3.2)
--   relations.relation_type_id    per-type relation counts + onDelete: Restrict check
--   relation_evidence.source_id   scanned on every Source delete
--   property_evidence.source_id   scanned on every Source delete
--
-- relation_evidence.relation_id is already covered as the leading column of the
-- @@unique([relation_id, source_id]) index, so it is deliberately absent here.
--
-- Plain (non-CONCURRENT) CREATE INDEX: Prisma runs migrations inside a
-- transaction, which forbids CONCURRENTLY, and these tables are small.

-- CreateIndex
CREATE INDEX "persons_birth_location_id_idx" ON "persons"("birth_location_id");

-- CreateIndex
CREATE INDEX "persons_death_location_id_idx" ON "persons"("death_location_id");

-- CreateIndex
CREATE INDEX "events_event_type_id_idx" ON "events"("event_type_id");

-- CreateIndex
CREATE INDEX "events_parent_id_idx" ON "events"("parent_id");

-- CreateIndex
CREATE INDEX "events_location_id_idx" ON "events"("location_id");

-- CreateIndex
CREATE INDEX "relations_relation_type_id_idx" ON "relations"("relation_type_id");

-- CreateIndex
CREATE INDEX "relation_evidence_source_id_idx" ON "relation_evidence"("source_id");

-- CreateIndex
CREATE INDEX "property_evidence_source_id_idx" ON "property_evidence"("source_id");
