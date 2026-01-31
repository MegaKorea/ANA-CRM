import { NextRequest, NextResponse } from 'next/server';
import { fetchUserById, updateUserById, deleteUserById } from '@/lib/services/user.service';
import { validateUpdateUserInput, validateUserId } from '@/lib/validators/user.validator';
import { HttpStatusCode, UserErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const userId = validateUserId(id);
    const user = await fetchUserById(userId);
    return NextResponse.json(user, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, UserErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const userId = validateUserId(id);
    const body = await request.json();
    const input = validateUpdateUserInput(body);
    const user = await updateUserById(userId, input);
    return NextResponse.json(user, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, UserErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const { id } = await params;
    const userId = validateUserId(id);
    await deleteUserById(userId);
    return NextResponse.json(null, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, UserErrorCode.INTERNAL_SERVER_ERROR);
  }
}

