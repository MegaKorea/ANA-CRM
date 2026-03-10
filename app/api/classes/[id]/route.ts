import { NextRequest, NextResponse } from 'next/server';
import { updateClass, deleteClass, getClass } from '@/lib/services/class.service';
import { validateUpdateClassInput } from '@/lib/validators/class.validator';
import { HttpStatusCode } from '@/constants/enums';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const classData = await getClass(id);
        return NextResponse.json(classData, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
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
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        await deleteClass(id);
        return new NextResponse(null, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}
