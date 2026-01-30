import { NextRequest, NextResponse } from 'next/server';
import { fetchRoleById, updateRoleById, deleteRoleById } from '@/lib/services/role.service';
import { validateRoleId, validateUpdateRoleInput } from '@/lib/validators/role.validator';
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const roleId = validateRoleId(id);
    const role = await fetchRoleById(roleId);
    return NextResponse.json(role, { status: HttpStatusCode.OK });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('[GET /api/roles/:id] Unhandled error:', error);
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { code: RoleErrorCode.INTERNAL_SERVER_ERROR, message },
        { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
      );
    }
    return NextResponse.json(
      { code: RoleErrorCode.INTERNAL_SERVER_ERROR, message: RoleErrorCode.INTERNAL_SERVER_ERROR },
      { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const roleId = validateRoleId(id);
    const body = await request.json();
    const input = validateUpdateRoleInput(body);
    const role = await updateRoleById(roleId, input);
    return NextResponse.json(role, { status: HttpStatusCode.OK });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('[PUT /api/roles/:id] Unhandled error:', error);
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { code: RoleErrorCode.INTERNAL_SERVER_ERROR, message },
        { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
      );
    }
    return NextResponse.json(
      { code: RoleErrorCode.INTERNAL_SERVER_ERROR, message: RoleErrorCode.INTERNAL_SERVER_ERROR },
      { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const roleId = validateRoleId(id);
    await deleteRoleById(roleId);
    return NextResponse.json(null, { status: HttpStatusCode.OK });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }

    if (process.env.NODE_ENV === 'development') {
      console.error('[DELETE /api/roles/:id] Unhandled error:', error);
      const message = error instanceof Error ? error.message : String(error);
      return NextResponse.json(
        { code: RoleErrorCode.INTERNAL_SERVER_ERROR, message },
        { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
      );
    }
    return NextResponse.json(
      { code: RoleErrorCode.INTERNAL_SERVER_ERROR, message: RoleErrorCode.INTERNAL_SERVER_ERROR },
      { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }
}
