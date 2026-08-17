import { NextRequest, NextResponse } from 'next/server';
import { getSessionAttendances, bulkUpsertAttendances } from '@/lib/services/class_session.service';
import { validateBulkAttendanceInput } from '@/lib/validators/class_session.validator';
import { HttpStatusCode } from '@/constants/enums';

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
    try {
        const { sessionId } = await params;
        const attendances = await getSessionAttendances(sessionId);
        return NextResponse.json(attendances, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ sessionId: string }> }
): Promise<NextResponse> {
    try {
        const { sessionId } = await params;
        const body = await request.json();
        const input = validateBulkAttendanceInput(body);
        const result = await bulkUpsertAttendances(
            sessionId,
            input.records
        );
        return NextResponse.json(result, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}
