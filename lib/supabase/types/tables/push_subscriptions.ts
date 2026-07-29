export interface PushSubscriptionsTable {
  Row: {
    id: number;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent: string | null;
    created_at: string;
  };
  Insert: {
    id?: number;
    user_id: string;
    endpoint: string;
    p256dh: string;
    auth: string;
    user_agent?: string | null;
    created_at?: string;
  };
  Update: {
    id?: number;
    user_id?: string;
    endpoint?: string;
    p256dh?: string;
    auth?: string;
    user_agent?: string | null;
    created_at?: string;
  };
  Relationships: [];
}
