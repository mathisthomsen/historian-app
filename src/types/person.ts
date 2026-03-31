export type Certainty = "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";

export interface PersonName {
  name: string;
  language: string | null;
  is_primary: boolean;
}

export interface PersonSummary {
  id: string;
  first_name: string | null;
  last_name: string | null;
  birth_year: number | null;
  birth_month: number | null;
  birth_day: number | null;
  birth_date_certainty: Certainty;
  death_year: number | null;
  death_month: number | null;
  death_day: number | null;
  death_date_certainty: Certainty;
  created_at: string;
  names: PersonName[];
}

export interface PersonDetail extends PersonSummary {
  birth_place: string | null;
  death_place: string | null;
  notes: string | null;
  created_by_id: string | null;
  updated_at: string;
  _count: {
    relations_from: number;
    relations_to: number;
  };
}

export interface CreatePersonInput {
  project_id: string;
  first_name?: string;
  last_name?: string;
  birth_year?: number;
  birth_month?: number;
  birth_day?: number;
  birth_date_certainty?: Certainty;
  birth_place?: string;
  death_year?: number;
  death_month?: number;
  death_day?: number;
  death_date_certainty?: Certainty;
  death_place?: string;
  notes?: string;
  names?: { name: string; language?: string; is_primary?: boolean }[];
}
