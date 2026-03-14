import { RolesTable } from './roles';
import { UsersTable } from './users';
import { RulesTable } from './rules';
import { LeadsTable } from './leads';
import { CoursesTable } from './courses';
import { ClassSessionsTable } from './class_sessions';
import { SessionAttendancesTable } from './session_attendances';

export interface TablesMap {
  roles: RolesTable;
  users: UsersTable;
  rules: RulesTable;
  leads: LeadsTable;
  courses: CoursesTable;
  class_sessions: ClassSessionsTable;
  session_attendances: SessionAttendancesTable;
}
