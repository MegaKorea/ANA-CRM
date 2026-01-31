import { NextRequest, NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase/route-handler';
import { validateLoginInput } from '@/lib/validators/auth.validator';
import { loginWithEmailAndPassword } from '@/lib/services/auth.service';
import { HttpStatusCode, AuthErrorCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json();
    const input = validateLoginInput(body);
    const { response } = await createRouteHandlerClient();
    const result = await loginWithEmailAndPassword(input);

    return NextResponse.json(
      {
        user: result.user,
      },
      {
        status: HttpStatusCode.OK,
        headers: response.headers,
      }
    );
  } catch (error) {
    return handleRouteError(error, AuthErrorCode.INTERNAL_SERVER_ERROR);
  }
}
