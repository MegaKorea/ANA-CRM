export interface RolesTable {
  Row: {
    id: number;
    name: string;
    code: string;
    description: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: number;
    name: string;
    code: string;
    description?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: number;
    name?: string;
    code?: string;
    description?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
}
