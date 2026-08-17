import type { Dayjs } from 'dayjs';
import type { PaymentMethod } from '@/constants/enums';
import type { EnrollmentCategory } from '@/lib/validators/enrollment.validator';

export interface EnrollmentFormValues {
  category: EnrollmentCategory;
  course_id?: string;
  class_id?: string;
  item_name?: string;
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
