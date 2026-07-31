import { RolesTable } from './roles';
import { UsersTable } from './users';
import { RulesTable } from './rules';
import { LeadsTable } from './leads';
import { CoursesTable } from './courses';
import { ClassSessionsTable } from './class_sessions';
import { SessionAttendancesTable } from './session_attendances';
import { PaymentTicketsTable } from './payment_tickets';
import { LeadAppointmentsTable } from './lead_appointments';
import { PushSubscriptionsTable } from './push_subscriptions';
import { QuizzesTable, QuizAttemptsTable } from './quizzes';
import { UserNotificationsTable } from './user_notifications';

export interface TablesMap {
  roles: RolesTable;
  users: UsersTable;
  rules: RulesTable;
  leads: LeadsTable;
  courses: CoursesTable;
  class_sessions: ClassSessionsTable;
  session_attendances: SessionAttendancesTable;
  payment_tickets: PaymentTicketsTable;
  lead_appointments: LeadAppointmentsTable;
  push_subscriptions: PushSubscriptionsTable;
  quizzes: QuizzesTable;
  quiz_attempts: QuizAttemptsTable;
  user_notifications: UserNotificationsTable;
}
