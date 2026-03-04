import { useCurrentUser } from '@/lib/hooks/use-current-user';
import { usePermission, type RoleCode } from '@/lib/hooks/use-permission';

export function useAuthPermission(requiredRoles: RoleCode[]) {
    const { user, isLoading } = useCurrentUser();
    const userRoles = user?.roleCode ? [user.roleCode] : [];
    const hasPermission = usePermission(userRoles, requiredRoles);
    return { hasPermission, isLoading, user };
}
