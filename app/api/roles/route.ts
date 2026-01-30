import { NextRequest, NextResponse } from 'next/server';
import { fetchAllRoles, createRole } from '@/lib/services/role.service';
import { validateCreateRoleInput } from '@/lib/validators/role.validator';
import { AppError } from '@/errors';
import { HttpStatusCode, RoleErrorCode } from '@/constants/enums';

function isAppError(error: unknown): error is AppError {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'statusCode' in error &&
    typeof (error as { code?: unknown }).code === 'string' &&
    typeof (error as { statusCode?: unknown }).statusCode === 'number'
  );
}

export async function GET(): Promise<NextResponse> {
  try {
    const roles = await fetchAllRoles();
    return NextResponse.json(roles, { status: HttpStatusCode.OK });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { code: RoleErrorCode.INTERNAL_SERVER_ERROR, message: RoleErrorCode.INTERNAL_SERVER_ERROR },
      { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const input = validateCreateRoleInput(body);
    const role = await createRole(input);
    return NextResponse.json(role, { status: HttpStatusCode.CREATED });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }
    return NextResponse.json(
      { code: RoleErrorCode.INTERNAL_SERVER_ERROR, message: RoleErrorCode.INTERNAL_SERVER_ERROR },
      { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }
}
