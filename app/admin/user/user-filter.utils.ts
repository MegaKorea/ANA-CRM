import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { User } from '@/lib/services/user.service';

export type UserFilters = {
  searchKeyword: string;
  statusFilter: string | undefined;
  roleFilter: number | undefined;
  createdAtRange: [Dayjs, Dayjs] | null;
};

export function filterUsers(users: User[] | undefined, filters: UserFilters): User[] {
  if (!users) {
    return [];
  }

  const { searchKeyword, statusFilter, roleFilter, createdAtRange } = filters;

  return users.filter((user) => {
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      const fullNameMatch = user.full_name.toLowerCase().includes(keyword);
      const emailMatch = (user.email || '').toLowerCase().includes(keyword);
      const phoneMatch = (user.phone || '').toLowerCase().includes(keyword);

      if (!fullNameMatch && !emailMatch && !phoneMatch) {
        return false;
      }
    }

    if (statusFilter && user.status !== statusFilter) {
      return false;
    }

    if (roleFilter && user.role_id !== roleFilter) {
      return false;
    }

    if (createdAtRange && user.created_at) {
      const createdAt = dayjs(user.created_at);
      const [start, end] = createdAtRange;
      if (createdAt.isBefore(start, 'day') || createdAt.isAfter(end, 'day')) {
        return false;
      }
    }

    return true;
  });
}
