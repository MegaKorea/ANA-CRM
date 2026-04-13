import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { HttpStatusCode } from '@/constants/enums';

export async function GET(request: NextRequest): Promise<NextResponse> {
    try {
        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        if (!startDate || !endDate) {
            return NextResponse.json({ error: 'Missing date parameters' }, { status: HttpStatusCode.BAD_REQUEST });
        }

        const endOfDay = endDate.includes('T') ? endDate : `${endDate}T23:59:59.999Z`;
        const supabase = await createClient();
        const { data: leads, error } = await supabase
            .from('leads')
            .select('id, created_at, appointment_date, status, attendance_status')
            .or(`and(created_at.gte.${startDate},created_at.lte.${endOfDay}),and(appointment_date.gte.${startDate},appointment_date.lte.${endOfDay})`);

        if (error) {
            throw error;
        }
        const start = new Date(startDate);
        const end = new Date(endDate);
        const dateMap = new Map<string, any>();

        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            const dateStr = d.toISOString().split('T')[0];
            dateMap.set(dateStr, {
                date: dateStr,
                totalLeads: 0,
                registeredLeads: 0,
                totalAppointments: 0,
                arrivedAppointments: 0,
            });
        }
        (leads || []).forEach((lead: any) => {

            if (lead.created_at) {
                const createdDate = new Date(lead.created_at).toISOString().split('T')[0];
                if (dateMap.has(createdDate)) {
                    const stats = dateMap.get(createdDate);
                    stats.totalLeads += 1;
                    if (lead.status === 'converted') {
                        stats.registeredLeads += 1;
                    }
                }
            }

            // For appointment_date stats
            if (lead.appointment_date) {
                const apptDate = new Date(lead.appointment_date).toISOString().split('T')[0];
                if (dateMap.has(apptDate)) {
                    const stats = dateMap.get(apptDate);
                    stats.totalAppointments += 1;
                    if (lead.attendance_status === 'arrived') {
                        stats.arrivedAppointments += 1;
                    }
                }
            }
        });

        const chartData = Array.from(dateMap.values());

        // Overall Summary
        const summary = {};

        return NextResponse.json({ summary, chartData }, { status: HttpStatusCode.OK });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
    }
}
