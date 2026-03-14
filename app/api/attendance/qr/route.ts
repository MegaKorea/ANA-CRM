import { NextRequest, NextResponse } from 'next/server';
import { verifyQrCodeAndMarkAttendance } from '@/lib/services/class_session.service';
import { validateVerifyQrInput } from '@/lib/validators/class_session.validator';
import { HttpStatusCode } from '@/constants/enums';
import { createClient } from '@/lib/supabase/server';

// POST /api/attendance/qr — Student scans QR and marks attendance
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Get the currently authenticated student
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return NextResponse.json(
                { error: 'Bạn cần đăng nhập để điểm danh.' },
                { status: HttpStatusCode.UNAUTHORIZED }
            );
        }

        const body = await request.json();
        const input = validateVerifyQrInput(body);
        const attendance = await verifyQrCodeAndMarkAttendance(input.token, authUser.id);

        return NextResponse.json(attendance, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}
