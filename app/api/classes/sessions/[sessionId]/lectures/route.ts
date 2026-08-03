import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LectureErrorCode } from '@/constants/enums';
import {
  assertSessionTeacherWriter,
  sessionContentErrorResponse,
} from '@/lib/api/session-content-route';
import { resolveClassViewer } from '@/lib/services/class_access.service';
import {
  createSessionLecture,
  getSessionById,
  listSessionLectures,
} from '@/lib/services/class_session.service';
import { notifyStudentsLectureCreatedSafe } from '@/lib/services/user-notification.service';
import { validateCreateSessionLectureInput } from '@/lib/validators/session-lecture.validator';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  try {
    const { sessionId } = await params;
    const session = await getSessionById(sessionId);
    await resolveClassViewer(session.class_id);
    const lectures = await listSessionLectures(sessionId);
    return NextResponse.json(lectures, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, LectureErrorCode.INTERNAL);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  try {
    await assertSessionTeacherWriter();
    const { sessionId } = await params;
    const session = await getSessionById(sessionId);
    await resolveClassViewer(session.class_id);
    const body = await request.json();
    const input = validateCreateSessionLectureInput(body);
    const lecture = await createSessionLecture(sessionId, input);

    await notifyStudentsLectureCreatedSafe({
      classId: session.class_id,
      sessionId: session.id,
      sessionDate: session.date,
      sessionNumber: session.session_number,
      lectureId: lecture.id,
      lectureTitle: lecture.title,
      html: lecture.html,
      links: lecture.links,
      attachments: lecture.attachments,
    });

    return NextResponse.json(lecture, { status: HttpStatusCode.CREATED });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, LectureErrorCode.INTERNAL);
  }
}
