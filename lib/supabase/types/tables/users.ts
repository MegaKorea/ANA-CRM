export interface UsersTable {
  Row: {
    id: string; 
    full_name: string;
    email: string | null;
    phone: string | null;
    avatar: string | null;
    status: string;
    sex: string | null;
    age: number | null;
    address: string | null;
    birth_day: string | null;
    role_id: number;
    last_login: string | null;
    updated_at: string | null;
    created_at: string | null;
  };
  Insert: {
    id?: string;
    full_name: string;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
    status?: string;
    sex?: string | null;
    age?: number | null;
    address?: string | null;
    birth_day?: string | null;
    role_id: number;
    last_login?: string | null;
    updated_at?: string | null;
    created_at?: string | null;
  };
  Update: {
    id?: string;
    full_name?: string;
    email?: string | null;
    phone?: string | null;
    avatar?: string | null;
    status?: string;
    sex?: string | null;
    age?: number | null;
    address?: string | null;
    birth_day?: string | null;
    role_id?: number;
    last_login?: string | null;
    updated_at?: string | null;
    created_at?: string | null;
  };
  Relationships: [];
}
