import { type AppMenuItem, type MenuItem } from '@/constants/menu';

/**
 * So khớp mã quyền không phân biệt hoa/thường: `menuItems` khai báo role dạng
 * chữ hoa ('ADMIN'), còn `roleCode` lấy nguyên văn từ cột `roles.code` trong DB
 * nên có thể khác kiểu chữ. So khớp chính xác từng ký tự sẽ làm menu trống.
 */
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
      return rest as MenuItem;
    })
    .filter((item): item is MenuItem => item !== null);
}
