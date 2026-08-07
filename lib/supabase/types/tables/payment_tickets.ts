export type PaymentType = 'cash' | 'bank_transfer' | 'momo' | 'other';
export type TicketStatus = 'pending' | 'approved' | 'rejected';

export interface PaymentTicketsTable {
  Row: {
    id: number;
    lead_id: number;
    enrollment_id: number | null;
    course_id: string | null;
    amount: number;
    payment_type: PaymentType;
    payment_date: string;
    recipient_account: string | null;
    images: string[] | null;
    note: string | null;
    status: TicketStatus;
    created_by: string | null;
    reviewed_by: string | null;
    reviewed_at: string | null;
    reject_reason: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: number;
    lead_id: number;
    enrollment_id?: number | null;
    course_id?: string | null;
    amount: number;
    payment_type?: PaymentType;
    payment_date?: string;
    recipient_account?: string | null;
    images?: string[] | null;
    note?: string | null;
    status?: TicketStatus;
    created_by?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    reject_reason?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: number;
    lead_id?: number;
    enrollment_id?: number | null;
    course_id?: string | null;
    amount?: number;
    payment_type?: PaymentType;
    payment_date?: string;
    recipient_account?: string | null;
    images?: string[] | null;
    note?: string | null;
    status?: TicketStatus;
    created_by?: string | null;
    reviewed_by?: string | null;
    reviewed_at?: string | null;
    reject_reason?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
}
