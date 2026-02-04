import { LocationValue } from '@/components/common';
import { LeadStatus } from '@/constants/enums';

export interface LeadsTable {
  Row: {
    id: number;
    email: string | null;
    phone_number: string | null;
    full_name: string;
    date_of_birth: string | null;
    place_of_birth: LocationValue | null;
    place_of_origin: LocationValue | null;
    current_address: string | null;
    citizen_id: string | null;
    nationality: string | null;
    ethnicity: string | null;
    meta_data: Record<string, unknown> | null;
    source: string | null;
    telesales_id: string | null;
    status: LeadStatus;
    note: string | null;
    created_at: string | null;
    updated_at: string | null;
  };
  Insert: {
    id?: number;
    email?: string | null;
    phone_number?: string | null;
    full_name: string;
    date_of_birth?: string | null;
    place_of_birth?: LocationValue | null;
    place_of_origin?: LocationValue | null;
    current_address?: string | null;
    citizen_id?: string | null;
    nationality?: string | null;
    ethnicity?: string | null;
    meta_data?: Record<string, unknown> | null;
    source?: string | null;
    telesales_id?: string | null;
    status?: LeadStatus;
    note?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Update: {
    id?: number;
    email?: string | null;
    phone_number?: string | null;
    full_name?: string;
    date_of_birth?: string | null;
    place_of_birth?: LocationValue | null;
    place_of_origin?: LocationValue | null;
    current_address?: string | null;
    citizen_id?: string | null;
    nationality?: string | null;
    ethnicity?: string | null;
    meta_data?: Record<string, unknown> | null;
    source?: string | null;
    telesales_id?: string | null;
    status?: LeadStatus;
    note?: string | null;
    created_at?: string | null;
    updated_at?: string | null;
  };
  Relationships: [];
}
