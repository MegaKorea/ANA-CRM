export interface EnrollmentsTable {
  Row: {
    id: number;
    lead_id: number;
    course_id: string;
    class_id: string | null;
    enrollment_date: string;
    sales_month: string;
    source: string | null;
    expected_study_month: string | null;
    tuition_fee: number;
    deposit_amount: number;
    paid_amount: number;
    debt_amount: number;
    debt_note: string | null;
    note: string | null;
    created_by: string | null;
    created_at: string;
    updated_at: string;
  };
  Insert: {
    id?: number;
    lead_id: number;
    course_id: string;
    class_id?: string | null;
    enrollment_date?: string;
    sales_month: string;
    source?: string | null;
    expected_study_month?: string | null;
    tuition_fee?: number;
    deposit_amount?: number;
    debt_note?: string | null;
    note?: string | null;
    created_by?: string | null;
    created_at?: string;
    updated_at?: string;
  };
  Update: {
    id?: number;
    lead_id?: number;
    course_id?: string;
    class_id?: string | null;
    enrollment_date?: string;
    sales_month?: string;
    source?: string | null;
    expected_study_month?: string | null;
    tuition_fee?: number;
    deposit_amount?: number;
    debt_note?: string | null;
    note?: string | null;
    created_by?: string | null;
    updated_at?: string;
  };
  Relationships: [];
}
