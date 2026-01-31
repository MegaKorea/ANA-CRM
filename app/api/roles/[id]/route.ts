import { NextRequest, NextResponse } from 'next/server';
import { fetchRoleById, updateRoleById, deleteRoleById } from '@/lib/services/role.service';
import { validateRoleId, validateUpdateRoleInput } from '@/lib/validators/role.validator';
import { HttpStatusCode, RoleErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

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
    return handleRouteError(error, RoleErrorCode.INTERNAL_SERVER_ERROR);
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
    return handleRouteError(error, RoleErrorCode.INTERNAL_SERVER_ERROR);
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
    return handleRouteError(error, RoleErrorCode.INTERNAL_SERVER_ERROR);
  }
}
