import { NextRequest, NextResponse } from 'next/server';
import { fetchInsights } from '@/lib/services/facebook.service';
import { HttpStatusCode } from '@/constants/enums';

export async function GET(request: NextRequest): Promise<NextResponse> {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    if (!startDate || !endDate) {
        return NextResponse.json(
            { error: 'Vui lòng cung cấp startDate và endDate trong query parameters' },
            { status: HttpStatusCode.BAD_REQUEST }
        );
    }

    try {
        const { data, error } = await fetchInsights({ startDate, endDate });

        if (error) {
            return NextResponse.json(
                { error },
                { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
            );
        }

        return NextResponse.json(data, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || 'Unknown error occurred' },
            { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
        );
    }
}
