import { type AppMenuItem, type MenuItem } from '@/constants/menu';
  
function hasRole(itemRoles: string[], userRole: string): boolean {
  const normalizedUserRole = userRole.trim().toUpperCase();
  return itemRoles.some((role) => role.trim().toUpperCase() === normalizedUserRole);
}

export function filterMenuByRole(
  items: AppMenuItem[],
  userRole: string | null | undefined
): MenuItem[] {
  return items
    .filter((item) => {
      if (item.roles && item.roles.length > 0) {
        if (!userRole || !hasRole(item.roles, userRole)) {
          return false;
        }
      }
      return true;
    })
    .map((item) => {
      if (item.children) {
        const filteredChildren = filterMenuByRole(item.children, userRole);
        if (filteredChildren.length === 0) {
          return null;
        }
        return {
          ...item,
          children: filteredChildren,
        } as MenuItem;
      }
      const { roles, ...rest } = item;
      void roles;
      return rest as MenuItem;
    })
    .filter((item): item is MenuItem => item !== null);
}
