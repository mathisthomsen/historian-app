export interface EventSummary {
  id: string;
  title: string;
  event_type: { id: string; name: string; color: string | null } | null;
  start_year: number | null;
  start_month: number | null;
  start_day: number | null;
  start_date_certainty: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  end_year: number | null;
  end_month: number | null;
  end_day: number | null;
  end_date_certainty: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  location: string | null;
  parent: { id: string; title: string } | null;
  _count: { sub_events: number };
  created_at: string;
}

export interface EventDetail extends EventSummary {
  description: string | null;
  notes: string | null;
  created_by_id: string | null;
  updated_at: string;
  sub_events: EventSummary[];
  _count: {
    sub_events: number;
    relations_from: number;
    relations_to: number;
  };
}

export interface CreateEventInput {
  project_id: string;
  title: string;
  description?: string;
  event_type_id?: string | null;
  start_year?: number | null;
  start_month?: number | null;
  start_day?: number | null;
  start_date_certainty?: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  end_year?: number | null;
  end_month?: number | null;
  end_day?: number | null;
  end_date_certainty?: "CERTAIN" | "PROBABLE" | "POSSIBLE" | "UNKNOWN";
  location?: string | null;
  parent_id?: string | null;
  notes?: string | null;
}

export interface EventFilterState {
  typeIds: string[];
  fromYear: number | null;
  toYear: number | null;
  topLevelOnly: boolean;
}
