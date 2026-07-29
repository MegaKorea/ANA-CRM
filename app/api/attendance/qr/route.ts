import { NextRequest, NextResponse } from 'next/server';
import { verifyQrCodeAndMarkAttendance } from '@/lib/services/class_session.service';
import { validateVerifyQrInput } from '@/lib/validators/class_session.validator';
import { HttpStatusCode } from '@/constants/enums';
import { createClient } from '@/lib/supabase/server';
import { handleRouteError } from '@/lib/utils/route-handler';
import { checkRateLimit } from '@/lib/utils/rate-limit';

/** Một học viên quét hợp lệ chỉ cần vài lần; số này chặn script dò mã. */
const QR_ATTEMPT_LIMIT = 10;
const QR_ATTEMPT_WINDOW_MS = 60 * 1000;

/**
 * Lấy IP của client để LƯU VẾT đối chiếu. Không dùng để chặn: cả lớp ngồi chung
 * WiFi sẽ ra cùng một IP công cộng.
 */
function getClientIp(request: NextRequest): string | null {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
        return forwarded.split(',')[0].trim() || null;
    }
    return request.headers.get('x-real-ip');
}

// POST /api/attendance/qr — Student scans QR and marks attendance
export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        // Get the currently authenticated student
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        if (!authUser) {
            return NextResponse.json(
                { code: 'UNAUTHENTICATED', message: 'Bạn cần đăng nhập bằng tài khoản học viên để điểm danh.' },
                { status: HttpStatusCode.UNAUTHORIZED }
            );
        }

        const rateLimit = checkRateLimit(`qr:${authUser.id}`, QR_ATTEMPT_LIMIT, QR_ATTEMPT_WINDOW_MS);
        if (!rateLimit.allowed) {
            return NextResponse.json(
                {
                    code: 'TOO_MANY_ATTEMPTS',
                    message: `Bạn thao tác quá nhanh. Vui lòng thử lại sau ${rateLimit.retryAfterSeconds} giây.`,
                },
                {
                    status: HttpStatusCode.TOO_MANY_REQUESTS,
                    headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) },
                }
            );
        }

        const body = await request.json();
        const input = validateVerifyQrInput(body);
        const result = await verifyQrCodeAndMarkAttendance(input.token, authUser.id, {
            ip: getClientIp(request),
            userAgent: request.headers.get('user-agent'),
        });

        return NextResponse.json(result, { status: HttpStatusCode.OK });
    } catch (error) {
        // AppError giữ nguyên mã + status của nó (mã hết hạn, không thuộc lớp, ...);
        // chỉ lỗi ngoài dự kiến mới rơi về 500.
        return handleRouteError(error, 'ATTENDANCE_QR_FAILED');
    }
}
