export const SOURCE_TYPE_SUGGESTIONS = [
  "archival_document",
  "letter",
  "newspaper",
  "official_record",
  "photograph",
  "other",
] as const;

export type SourceTypeSuggestion = (typeof SOURCE_TYPE_SUGGESTIONS)[number];
