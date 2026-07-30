import { NextRequest, NextResponse } from 'next/server';
import { updateClass, deleteClass, getClass } from '@/lib/services/class.service';
import { resolveClassViewer } from '@/lib/services/class_access.service';
import { validateUpdateClassInput } from '@/lib/validators/class.validator';
import { HttpStatusCode } from '@/constants/enums';
import { AppError } from '@/errors';

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

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        await resolveClassViewer(id);
        const classData = await getClass(id);
        return NextResponse.json(classData, { status: HttpStatusCode.OK });
    } catch (error: unknown) {
        return errorResponse(error);
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const body = await request.json();
        const input = validateUpdateClassInput(body);
        const updatedClass = await updateClass(id, input);
        return NextResponse.json(updatedClass, { status: HttpStatusCode.OK });
    } catch (error: unknown) {
        return errorResponse(error);
    }
}

export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        await deleteClass(id);
        return new NextResponse(null, { status: HttpStatusCode.OK });
    } catch (error: unknown) {
        return errorResponse(error);
    }
}
