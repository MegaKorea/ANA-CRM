import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { getCurrentUser } from '@/lib/services/auth.service';
import { HttpStatusCode, AuthErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { response } = await createRouteHandlerClient();
    const currentUser = await getCurrentUser();

    return NextResponse.json(
      {
        user: currentUser,
      },
      {
        status: HttpStatusCode.OK,
        headers: response.headers,
      }
    );
  } catch (error) {
    return handleRouteError(error, AuthErrorCode.UNAUTHORIZED);
  }
}
