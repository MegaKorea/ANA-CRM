export interface LeadClassificationRulesTable {
  Row: {
    id: number;
    name: string;
    is_system: boolean;
    is_active: boolean;
    recent_interaction_hours: number;
    rac_kqt_statuses: string[];
    created_by: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: number;
    name: string;
    is_system?: boolean;
    is_active?: boolean;
    recent_interaction_hours?: number;
    rac_kqt_statuses?: string[];
    created_by?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: number;
    name?: string;
    is_system?: boolean;
    is_active?: boolean;
    recent_interaction_hours?: number;
    rac_kqt_statuses?: string[];
    created_by?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
}
