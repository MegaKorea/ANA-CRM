import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, LectureErrorCode } from '@/constants/enums';
import {
  assertSessionTeacherWriter,
  sessionContentErrorResponse,
} from '@/lib/api/session-content-route';
import { resolveClassViewer } from '@/lib/services/class_access.service';
import {
  deleteSessionLecture,
  getSessionById,
  updateSessionLecture,
} from '@/lib/services/class_session.service';
import { validateUpdateSessionLectureInput } from '@/lib/validators/session-lecture.validator';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; lectureId: string }> },
): Promise<NextResponse> {
  try {
    await assertSessionTeacherWriter();
    const { sessionId, lectureId } = await params;
    const session = await getSessionById(sessionId);
    await resolveClassViewer(session.class_id);
    const body = await request.json();
    const input = validateUpdateSessionLectureInput(body);
    const lecture = await updateSessionLecture(sessionId, lectureId, input);
    return NextResponse.json(lecture, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, LectureErrorCode.INTERNAL);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; lectureId: string }> },
): Promise<NextResponse> {
  try {
    await assertSessionTeacherWriter();
    const { sessionId, lectureId } = await params;
    const session = await getSessionById(sessionId);
    await resolveClassViewer(session.class_id);
    await deleteSessionLecture(sessionId, lectureId);
    return NextResponse.json({ success: true }, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, LectureErrorCode.INTERNAL);
  }
}
