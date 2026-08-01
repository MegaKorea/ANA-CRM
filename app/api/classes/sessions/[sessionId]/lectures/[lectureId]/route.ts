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
  listSessionLectures,
  updateSessionLecture,
} from '@/lib/services/class_session.service';
import { notifyStudentsLectureCreatedSafe } from '@/lib/services/user-notification.service';
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

    const before = (await listSessionLectures(sessionId, { includeDrafts: true })).find(
      (item) => item.id === lectureId,
    );

    const body = await request.json();
    const input = validateUpdateSessionLectureInput(body);
    const lecture = await updateSessionLecture(sessionId, lectureId, input);

    const wasDraft = !before || before.status === 'draft';
    if (wasDraft && lecture.status === 'published') {
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
    }

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
