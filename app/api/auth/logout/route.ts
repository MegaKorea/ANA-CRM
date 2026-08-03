import { NextResponse } from 'next/server';
import { logout } from '@/lib/services/auth.service';
import { HttpStatusCode, AuthErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function POST(): Promise<NextResponse> {
  try {
    await logout();

    return NextResponse.json(
      {},
      {
        status: HttpStatusCode.OK,
      }
    );
  } catch (error) {
    return handleRouteError(error, AuthErrorCode.INTERNAL_SERVER_ERROR);
  }
}
