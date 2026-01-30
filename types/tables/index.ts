import { RolesTable } from './roles';
import { UsersTable } from './users';
import { RulesTable } from './rules';

export interface TablesMap {
  roles: RolesTable;
  users: UsersTable;
  rules: RulesTable;
}
