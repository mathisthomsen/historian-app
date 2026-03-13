export type SourceReliability = "HIGH" | "MEDIUM" | "LOW" | "UNKNOWN";

export interface SourceSummary {
  id: string;
  title: string;
  type: string;
  author: string | null;
  reliability: SourceReliability;
  created_at: string;
}

export interface SourceDetail {
  id: string;
  title: string;
  type: string;
  author: string | null;
  date: string | null;
  repository: string | null;
  call_number: string | null;
  url: string | null;
  reliability: SourceReliability;
  notes: string | null;
  created_by_id: string | null;
  created_at: string;
  updated_at: string;
  _count: {
    relation_evidence: number;
    property_evidence: number;
  };
}

export interface CreateSourceInput {
  project_id: string;
  title: string;
  type: string;
  author?: string | null;
  date?: string | null;
  repository?: string | null;
  call_number?: string | null;
  url?: string | null;
  reliability?: SourceReliability;
  notes?: string | null;
}

export interface SourceFilterState {
  reliability: SourceReliability[];
  type: string;
}
