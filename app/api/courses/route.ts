import { NextRequest, NextResponse } from 'next/server';
import { fetchAllCourses, createCourse } from '@/lib/services/course.service';
import { validateCreateCourseInput } from '@/lib/validators/course.validator';
import { HttpStatusCode } from '@/constants/enums';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const courses = await fetchAllCourses();
        return NextResponse.json(courses, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const input = validateCreateCourseInput(body);
        const course = await createCourse(input);
        return NextResponse.json(course, { status: HttpStatusCode.CREATED });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}
