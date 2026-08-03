import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/services/auth.service';
import { HttpStatusCode, AuthErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(): Promise<NextResponse> {
  try {
    const currentUser = await getCurrentUser();

    return NextResponse.json(
      {
        user: currentUser,
      },
      {
        status: HttpStatusCode.OK,
      }
    );
  } catch (error) {
    return handleRouteError(error, AuthErrorCode.UNAUTHORIZED);
  }
}
