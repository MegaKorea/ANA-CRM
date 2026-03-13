import { NextRequest, NextResponse } from 'next/server';
import { fetchAllClasses, createClass } from '@/lib/services/class.service';
import { validateCreateClassInput } from '@/lib/validators/class.validator';
import { HttpStatusCode } from '@/constants/enums';

import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();

        let studentPhone: string | undefined = undefined;

        if (authUser) {
            const { data: userData } = await supabase
                .from('users')
                .select('phone, roles!inner(code)')
                .eq('id', authUser.id)
                .maybeSingle();

            // Ignore typing here by checking the 'roles' object shape
            if (userData && ((userData as any).roles as any)?.code === 'STU' && (userData as any).phone) {
                studentPhone = (userData as any).phone;
            }
        }

        const classes = await fetchAllClasses(studentPhone);
        return NextResponse.json(classes, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
    try {
        const body = await request.json();
        const input = validateCreateClassInput(body);
        const newClass = await createClass(input);
        return NextResponse.json(newClass, { status: HttpStatusCode.CREATED });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}
