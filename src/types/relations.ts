import type { Certainty, EntityType } from "@prisma/client";

export interface RelationTypeItem {
  id: string;
  project_id: string;
  name: string;
  inverse_name: string | null;
  description: string | null;
  color: string | null;
  icon: string | null;
  valid_from_types: EntityType[];
  valid_to_types: EntityType[];
  created_at: string;
  updated_at: string;
  _count: { relations: number };
}

export interface RelationWithDetails {
  id: string;
  project_id: string;
  from_type: EntityType;
  from_id: string;
  from_label: string;
  to_type: EntityType;
  to_id: string;
  to_label: string;
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

export interface PropertyEvidenceItem {
  id: string;
  project_id: string;
  entity_type: EntityType;
  entity_id: string;
  property: string;
  source_id: string;
  source_title?: string;
  notes: string | null;
  page_reference: string | null;
  quote: string | null;
  raw_transcription: string | null;
  confidence: Certainty;
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  entity_type: EntityType;
  entity_id: string;
  user_id: string | null;
  user_name: string | null;
  agent_name: string | null;
  action: string;
  field_path: string | null;
  old_value: unknown;
  new_value: unknown;
  reason: string | null;
  source_id: string | null;
  created_at: string;
}
