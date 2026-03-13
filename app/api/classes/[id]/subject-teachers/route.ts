import { NextRequest, NextResponse } from 'next/server';
import { fetchSubjectTeachersByClassId, addSubjectTeacher } from '@/lib/services/subject_teacher.service';
import { HttpStatusCode } from '@/constants/enums';
import { handleRouteError } from '@/lib/utils/route-handler';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const teachers = await fetchSubjectTeachersByClassId(id);
        return NextResponse.json(teachers, { status: HttpStatusCode.OK });
    } catch (error) {
        return handleRouteError(error, 'FETCH_SUBJECT_TEACHERS_FAILED');
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const body = await request.json();
        const teacher = await addSubjectTeacher({
            class_id: id,
            teacher_id: body.teacher_id,
            subject: body.subject,
        });
        return NextResponse.json(teacher, { status: HttpStatusCode.CREATED });
    } catch (error) {
        return handleRouteError(error, 'ADD_SUBJECT_TEACHER_FAILED');
    }
}
