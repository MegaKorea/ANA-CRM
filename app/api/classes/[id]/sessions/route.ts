import { NextRequest, NextResponse } from 'next/server';
import { getClassSessions, generateSessionsForClass } from '@/lib/services/class_session.service';
import { resolveClassViewer } from '@/lib/services/class_access.service';
import { getCurrentUser } from '@/lib/services/auth.service';
import { validateGenerateSessionsInput } from '@/lib/validators/class_session.validator';
import { ClassMemberRole, HttpStatusCode } from '@/constants/enums';
import { AppError } from '@/errors';
import { filterLecturesForViewer } from '@/lib/types/session-lecture';

function errorResponse(error: unknown) {
    if (error instanceof AppError) {
        return NextResponse.json(
            { error: error.message || error.code, code: error.code },
            { status: error.statusCode },
        );
    }
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
}

// GET /api/classes/[id]/sessions — List all sessions for a class
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const viewer = await resolveClassViewer(id);
        const user = await getCurrentUser();
        const includeDrafts = user.roleCode === ClassMemberRole.TEA;

        const sessions = await getClassSessions(id, {
            viewerUserId: viewer.kind === 'student' ? viewer.userId : null,
            // Students must not receive live QR tokens (scan-only attendance).
            redactQr: viewer.kind === 'student',
            viewerRole: user.roleCode,
        });

        const sanitized = sessions.map((session) => ({
            ...session,
            lectures: filterLecturesForViewer(session.lectures, includeDrafts),
        }));

        return NextResponse.json(sanitized, { status: HttpStatusCode.OK });
    } catch (error: unknown) {
        return errorResponse(error);
    }
}

// POST /api/classes/[id]/sessions — Auto-generate sessions for a class
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const body = await request.json();
        const input = validateGenerateSessionsInput(body);
        const sessions = await generateSessionsForClass(
            id,
            input.start_date,
            input.end_date,
            input.schedule,
        );
        return NextResponse.json(sessions, { status: HttpStatusCode.CREATED });
    } catch (error: unknown) {
        return errorResponse(error);
    }
}
