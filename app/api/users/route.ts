import { NextRequest, NextResponse } from 'next/server';
import { fetchAllUsers, createUser } from '@/lib/services/user.service';
import { validateCreateUserInput } from '@/lib/validators/user.validator';
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

export async function GET(): Promise<NextResponse> {
  try {
    const users = await fetchAllUsers();
    return NextResponse.json(users, { status: HttpStatusCode.OK });
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

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const input = validateCreateUserInput(body);
    const user = await createUser(input);
    return NextResponse.json(user, { status: HttpStatusCode.CREATED });
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

