import { NextRequest, NextResponse } from 'next/server';
import { fetchAllRoles, createRole } from '@/lib/services/role.service';
import { validateCreateRoleInput } from '@/lib/validators/role.validator';
import { HttpStatusCode, RoleErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(): Promise<NextResponse> {
  try {
    const roles = await fetchAllRoles();
    return NextResponse.json(roles, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, RoleErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const input = validateCreateRoleInput(body);
    const role = await createRole(input);
    return NextResponse.json(role, { status: HttpStatusCode.CREATED });
  } catch (error) {
    return handleRouteError(error, RoleErrorCode.INTERNAL_SERVER_ERROR);
  }
}
