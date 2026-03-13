import { NextRequest, NextResponse } from 'next/server';
import { removeSubjectTeacher } from '@/lib/services/subject_teacher.service';
import { HttpStatusCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ teacherId: string }> }
): Promise<NextResponse> {
    try {
        const { teacherId } = await params;
        await removeSubjectTeacher(teacherId);
        return new NextResponse(null, { status: HttpStatusCode.OK });
    } catch (error) {
        return handleRouteError(error, 'REMOVE_SUBJECT_TEACHER_FAILED');
    }
}
