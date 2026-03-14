import { NextRequest, NextResponse } from 'next/server';
import { getClassSessions, generateSessionsForClass } from '@/lib/services/class_session.service';
import { validateGenerateSessionsInput } from '@/lib/validators/class_session.validator';
import { HttpStatusCode } from '@/constants/enums';

// GET /api/classes/[id]/sessions — List all sessions for a class
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const sessions = await getClassSessions(id);
        return NextResponse.json(sessions, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}

// POST /api/classes/[id]/sessions — Auto-generate sessions for a class
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const body = await request.json();
        const input = validateGenerateSessionsInput(body);
        const sessions = await generateSessionsForClass(
            id,
            input.start_date,
            input.end_date,
            input.schedule
        );
        return NextResponse.json(sessions, { status: HttpStatusCode.CREATED });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}
