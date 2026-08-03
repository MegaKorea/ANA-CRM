import { NextRequest, NextResponse } from 'next/server';
import { verifyQrCodeAndMarkAttendance } from '@/lib/services/class_session.service';
import { validateVerifyQrInput } from '@/lib/validators/class_session.validator';
import { HttpStatusCode } from '@/constants/enums';
import { createClient } from '@/lib/supabase/server';
import { AppError } from '@/errors';

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const supabase = await createClient();
        const {
            data: { user: authUser },
        } = await supabase.auth.getUser();

        if (!authUser) {
            throw new AppError(
                'UNAUTHORIZED',
                HttpStatusCode.UNAUTHORIZED,
                'Bạn cần đăng nhập để điểm danh.',
            );
        }

        const body = await request.json();
        const input = validateVerifyQrInput(body);
        const result = await verifyQrCodeAndMarkAttendance(input.token, authUser.id);

        return NextResponse.json(result, { status: HttpStatusCode.OK });
    } catch (error: unknown) {
        if (error instanceof AppError) {
            return NextResponse.json(
                { error: error.message || error.code, code: error.code },
                { status: error.statusCode },
            );
        }

        const message = error instanceof Error ? error.message : 'Điểm danh thất bại.';
        console.error('[POST /api/attendance/qr]', message, error);
        return NextResponse.json(
            { error: message },
            { status: HttpStatusCode.INTERNAL_SERVER_ERROR },
        );
    }
}
