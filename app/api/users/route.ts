import { NextRequest, NextResponse } from 'next/server';
import { fetchAllUsers, createUser } from '@/lib/services/user.service';
import { validateCreateUserInput } from '@/lib/validators/user.validator';
import { HttpStatusCode, UserErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') ?? undefined;
    const roleCode = searchParams.get('roleCode') ?? undefined;

    const users = await fetchAllUsers({
      search: search || undefined,
      roleCode: roleCode || undefined,
    });
    return NextResponse.json(users, { status: HttpStatusCode.OK });
  } catch (error) {
    return handleRouteError(error, UserErrorCode.INTERNAL_SERVER_ERROR);
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const input = validateCreateUserInput(body);
    const user = await createUser(input);
    return NextResponse.json(user, { status: HttpStatusCode.CREATED });
  } catch (error) {
    return handleRouteError(error, UserErrorCode.INTERNAL_SERVER_ERROR);
  }
}

