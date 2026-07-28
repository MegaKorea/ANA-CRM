import { type AppMenuItem, type MenuItem } from '@/constants/menu';

export function filterMenuByRole(
  items: AppMenuItem[],
  userRole: string | null | undefined
): MenuItem[] {
  return items
    .filter((item) => {
      if (item.roles && item.roles.length > 0) {
        if (!userRole || !item.roles.includes(userRole)) {
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
      return rest as MenuItem;
    })
    .filter((item): item is MenuItem => item !== null);
}
