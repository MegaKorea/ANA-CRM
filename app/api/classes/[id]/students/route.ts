import { NextRequest, NextResponse } from 'next/server';
import { getClassStudents, addClassStudent } from '@/lib/services/class_student.service';
import { resolveClassViewer } from '@/lib/services/class_access.service';
import { AppError } from '@/errors';
import { HttpStatusCode } from '@/constants/enums';
import { createAdminClient } from '@/lib/supabase/admin';

const MASKED_CONTACT = '********';

function maskPeerStudentContacts(
  students: Awaited<ReturnType<typeof getClassStudents>>,
  viewerEmail: string | null | undefined,
) {
  const maskLeads = (leads: NonNullable<(typeof students)[number]['leads']>) => ({
    ...leads,
    phone_number: leads.phone_number ? MASKED_CONTACT : leads.phone_number,
    email: leads.email ? MASKED_CONTACT : leads.email,
  });

  if (!viewerEmail) {
    return students.map((s) => ({
      ...s,
      login_email: s.login_email ? MASKED_CONTACT : s.login_email,
      leads: s.leads ? maskLeads(s.leads) : s.leads,
    }));
  }

  const email = viewerEmail.toLowerCase();
  return students.map((s) => {
    const isSelf =
      s.login_email?.toLowerCase() === email || s.leads?.email?.toLowerCase() === email;
    if (isSelf) return s;
    return {
      ...s,
      login_email: s.login_email ? MASKED_CONTACT : s.login_email,
      leads: s.leads ? maskLeads(s.leads) : s.leads,
    };
  });
}

function errorResponse(error: unknown) {
    if (error instanceof AppError) {
        return NextResponse.json(
            { error: error.message || error.code, code: error.code },
            { status: error.statusCode },
        );
    }
    const message = error instanceof Error ? error.message : 'Internal error';
    return NextResponse.json({ error: message }, { status: HttpStatusCode.INTERNAL_SERVER_ERROR });
}

export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
    try {
        const { id } = await params;
        const viewer = await resolveClassViewer(id);
        const students = await getClassStudents(id);

        if (viewer.kind === 'student') {
            const admin = createAdminClient();
            const { data: userData } = await admin
                .from('users')
                .select('email')
                .eq('id', viewer.userId)
                .maybeSingle();
            const masked = maskPeerStudentContacts(
                students,
                (userData as { email?: string } | null)?.email,
            );
            return NextResponse.json(masked, { status: HttpStatusCode.OK });
        }

        return NextResponse.json(students, { status: HttpStatusCode.OK });
    } catch (error: unknown) {
        return errorResponse(error);
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
