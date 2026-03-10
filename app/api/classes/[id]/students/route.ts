import { NextRequest, NextResponse } from 'next/server';
import { getClassStudents, addClassStudent } from '@/lib/services/class_student.service';
import { AppError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const students = await getClassStudents(id);
        return NextResponse.json(students, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const body = await request.json();

        if (!body.student_id || typeof body.student_id !== 'number') {
            throw new AppError('STUDENT_ID_REQUIRED', HttpStatusCode.BAD_REQUEST);
        }

        const newStudent = await addClassStudent(id, body.student_id);
        return NextResponse.json(newStudent, { status: HttpStatusCode.CREATED });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: error.status || HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}
