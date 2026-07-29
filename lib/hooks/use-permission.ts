import { useMemo } from 'react';

export type RoleCode = string;

export function usePermission(currentRoleCodes: RoleCode[], requiredRoleCodes: RoleCode[]): boolean {
  // Use string representations to avoid useMemo recomputing on new array references each render
  const currentKey = currentRoleCodes.join(',');
  const requiredKey = requiredRoleCodes.join(',');
  return useMemo(
    () =>
      requiredRoleCodes.length === PermissionArrayLength.EMPTY ||
      requiredRoleCodes.some((requiredRoleCode) =>
        currentRoleCodes.some(
          (currentRoleCode) =>
            currentRoleCode.toUpperCase() === requiredRoleCode.toUpperCase()
        )
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [currentKey, requiredKey]
  );
}

export enum PermissionArrayLength {
  EMPTY = 0,
}

