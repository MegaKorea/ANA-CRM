import { RolesTable } from './roles';
import { UsersTable } from './users';
import { RulesTable } from './rules';
import { LeadsTable } from './leads';
import { CoursesTable } from './courses';

export interface TablesMap {
  roles: RolesTable;
  users: UsersTable;
  rules: RulesTable;
  leads: LeadsTable;
  courses: CoursesTable;
}
