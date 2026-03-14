import { NextRequest, NextResponse } from 'next/server';
import { getSessionById, updateSession, generateQrCodeToken } from '@/lib/services/class_session.service';
import { validateUpdateSessionInput } from '@/lib/validators/class_session.validator';
import { HttpStatusCode } from '@/constants/enums';

// GET /api/classes/sessions/[sessionId] — Get single session
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
    try {
        const { sessionId } = await params;
        const session = await getSessionById(sessionId);
        return NextResponse.json(session, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}

// PATCH /api/classes/sessions/[sessionId] — Update session (teacher, content, date)
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
    try {
        const { sessionId } = await params;
        const body = await request.json();
        const input = validateUpdateSessionInput(body);
        const updated = await updateSession(sessionId, input);
        return NextResponse.json(updated, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}

// POST /api/classes/sessions/[sessionId] — Generate QR code token
export async function POST(
    _request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
    try {
        const { sessionId } = await params;
        const result = await generateQrCodeToken(sessionId);
        return NextResponse.json(result, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}
