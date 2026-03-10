import { NextRequest, NextResponse } from 'next/server';
import { removeClassStudent } from '@/lib/services/class_student.service';
import { HttpStatusCode } from '@/constants/enums';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ student_id: string }> }
): Promise<NextResponse> {
    try {
        const { student_id } = await params;
        await removeClassStudent(student_id);
        return new NextResponse(null, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}
