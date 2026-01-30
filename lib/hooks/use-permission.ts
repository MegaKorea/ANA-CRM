import { useMemo } from 'react';

export type RoleCode = string;

export function usePermission(currentRoleCodes: RoleCode[], requiredRoleCodes: RoleCode[]): boolean {
  return useMemo(
    () =>
      requiredRoleCodes.length === PermissionArrayLength.EMPTY ||
      requiredRoleCodes.some((requiredRoleCode) => currentRoleCodes.includes(requiredRoleCode)),
    [currentRoleCodes, requiredRoleCodes]
  );
}

export enum PermissionArrayLength {
  EMPTY = 0,
}

