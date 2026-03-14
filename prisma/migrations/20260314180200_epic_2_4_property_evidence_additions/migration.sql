-- Migration: epic_2_4_property_evidence_additions
-- Add quote, raw_transcription, and confidence fields to property_evidence.
-- Existing rows remain valid: quote and raw_transcription are nullable,
-- confidence defaults to UNKNOWN matching the existing Certainty enum pattern.

ALTER TABLE "property_evidence"
  ADD COLUMN IF NOT EXISTS "quote" TEXT,
  ADD COLUMN IF NOT EXISTS "raw_transcription" TEXT,
  ADD COLUMN IF NOT EXISTS "confidence" "Certainty" NOT NULL DEFAULT 'UNKNOWN';
