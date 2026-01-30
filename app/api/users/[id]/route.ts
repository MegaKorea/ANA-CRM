import { NextRequest, NextResponse } from 'next/server';
import { fetchUserById, updateUserById, deleteUserById } from '@/lib/services/user.service';
import { validateUpdateUserInput, validateUserId } from '@/lib/validators/user.validator';
import { AppError } from '@/errors';
import { HttpStatusCode, UserErrorCode } from '@/constants/enums';

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
    const userId = validateUserId(id);
    const user = await fetchUserById(userId);
    return NextResponse.json(user, { status: HttpStatusCode.OK });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { code: UserErrorCode.INTERNAL_SERVER_ERROR, message: UserErrorCode.INTERNAL_SERVER_ERROR },
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
    const userId = validateUserId(id);
    const body = await request.json();
    const input = validateUpdateUserInput(body);
    const user = await updateUserById(userId, input);
    return NextResponse.json(user, { status: HttpStatusCode.OK });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { code: UserErrorCode.INTERNAL_SERVER_ERROR, message: UserErrorCode.INTERNAL_SERVER_ERROR },
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
    const userId = validateUserId(id);
    await deleteUserById(userId);
    return NextResponse.json(null, { status: HttpStatusCode.OK });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json(
        { code: error.code, message: error.message },
        { status: error.statusCode }
      );
    }

    return NextResponse.json(
      { code: UserErrorCode.INTERNAL_SERVER_ERROR, message: UserErrorCode.INTERNAL_SERVER_ERROR },
      { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
  }
}

