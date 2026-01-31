import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { logout } from '@/lib/services/auth.service';
import { HttpStatusCode, AuthErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { response } = await createRouteHandlerClient();
    await logout();

    return NextResponse.json(
      {},
      {
        status: HttpStatusCode.OK,
        headers: response.headers,
      }
    );
  } catch (error) {
    return handleRouteError(error, AuthErrorCode.INTERNAL_SERVER_ERROR);
  }
}
