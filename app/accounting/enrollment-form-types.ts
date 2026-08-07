import type { Dayjs } from 'dayjs';
import type { EnrollmentStatus, PaymentType } from '@/constants/enums';

export interface EnrollmentFormValues {
  course_id: string;
  class_id?: string;
  enrollment_date: Dayjs;
  source?: string;
  expected_study_month?: Dayjs;
  tuition_fee?: number;
  deposit_amount?: number;
  deposit_payment_type?: PaymentType;
  deposit_recipient_account?: string;
  status: EnrollmentStatus;
  note?: string;
  debt_note?: string;
  created_by?: string;
}
