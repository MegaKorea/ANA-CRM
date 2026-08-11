import type { Dayjs } from 'dayjs';
import type { PaymentMethod } from '@/constants/enums';

export interface EnrollmentFormValues {
  course_id: string;
  class_id?: string;
  enrollment_date: Dayjs;
  source?: string;
  expected_study_month?: Dayjs;
  tuition_fee?: number;
  deposit_amount?: number;
  deposit_payment_method?: PaymentMethod;
  deposit_recipient_account?: string;
  note?: string;
  debt_note?: string;
  created_by?: string;
}
