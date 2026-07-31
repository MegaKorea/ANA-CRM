export interface UserNotificationsTable {
  Row: {
    id: string;
    user_id: string;
    type: string;
    title: string;
    body: string;
    payload: unknown;
    read_at: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: string;
    user_id: string;
    type: string;
    title: string;
    body?: string;
    payload?: unknown;
    read_at?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    type?: string;
    title?: string;
    body?: string;
    payload?: unknown;
    read_at?: string | null;
    updated_at?: string;
  };
}
