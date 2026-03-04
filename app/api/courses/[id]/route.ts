import { NextResponse } from 'next/server';
import { updateCourse } from '@/lib/services/course.service';
import { validateUpdateCourseInput } from '@/lib/validators/course.validator';
import { AppError } from '@/errors';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        if (!id) {
            return NextResponse.json({ error: 'Missing course ID' }, { status: 400 });
        }

        const body = await request.json();
        const input = validateUpdateCourseInput(body);

        const course = await updateCourse(id, input);

        return NextResponse.json(course);
    } catch (error: any) {
        console.error('Update course error:', error);
        if (error instanceof AppError) {
            return NextResponse.json({ error: error.message }, { status: error.statusCode });
        }
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
