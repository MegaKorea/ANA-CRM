import { NextRequest, NextResponse } from 'next/server';
import { fetchAllClasses, createClass } from '@/lib/services/class.service';
import { validateCreateClassInput } from '@/lib/validators/class.validator';
import { HttpStatusCode } from '@/constants/enums';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const classes = await fetchAllClasses();
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
