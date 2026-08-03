import { NextRequest, NextResponse } from 'next/server';
import { fetchAllCourses, createCourse } from '@/lib/services/course.service';
import { validateCreateCourseInput } from '@/lib/validators/course.validator';
import { HttpStatusCode } from '@/constants/enums';
import { createClient } from '@/lib/supabase/server';

export async function GET(): Promise<NextResponse> {
    try {
        const supabase = await createClient();
        const {
            data: { user: authUser },
        } = await supabase.auth.getUser();

        let studentPhone: string | undefined;

        if (authUser) {
            const { data: userData } = await supabase
                .from('users')
                .select('phone, roles!inner(code)')
                .eq('id', authUser.id)
                .maybeSingle();

            if (
                userData &&
                ((userData as any).roles as any)?.code === 'STU' &&
                (userData as any).phone
            ) {
                studentPhone = (userData as any).phone;
            }
        }

        const courses = await fetchAllCourses(studentPhone);
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
