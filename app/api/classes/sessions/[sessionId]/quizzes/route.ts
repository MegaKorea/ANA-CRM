import { NextRequest, NextResponse } from 'next/server';
import { ClassMemberRole, HttpStatusCode, QuizErrorCode } from '@/constants/enums';
import {
  assertQuizTeacherWriter,
  sessionContentErrorResponse,
} from '@/lib/api/session-content-route';
import { getCurrentUser } from '@/lib/services/auth.service';
import { resolveClassViewer } from '@/lib/services/class_access.service';
import { getSessionById } from '@/lib/services/class_session.service';
import { createSessionQuiz, listSessionQuizzes } from '@/lib/services/quiz.service';
import { notifyStudentsQuizPublishedSafe } from '@/lib/services/user-notification.service';
import { validateCreateQuizInput } from '@/lib/validators/quiz.validator';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  try {
    const user = await getCurrentUser();
    const { sessionId } = await params;
    const session = await getSessionById(sessionId);
    await resolveClassViewer(session.class_id);
    const forStudent = user.roleCode === ClassMemberRole.STU;
    const quizzes = await listSessionQuizzes(sessionId, { forStudent });
    return NextResponse.json(quizzes, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, QuizErrorCode.INTERNAL);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> },
): Promise<NextResponse> {
  try {
    await assertQuizTeacherWriter();
    const { sessionId } = await params;
    const session = await getSessionById(sessionId);
    await resolveClassViewer(session.class_id);
    const body = await request.json();
    const input = validateCreateQuizInput(body);
    const quiz = await createSessionQuiz(session.class_id, sessionId, input);

    if (quiz.is_published) {
      await notifyStudentsQuizPublishedSafe({
        classId: session.class_id,
        sessionId: session.id,
        sessionDate: session.date,
        sessionNumber: session.session_number,
        quizId: quiz.id,
        quizTitle: quiz.title,
        questionCount: quiz.questions.length,
        durationMinutes: quiz.duration_minutes,
        passingScore: quiz.passing_score,
      });
    }

    return NextResponse.json(quiz, { status: HttpStatusCode.CREATED });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, QuizErrorCode.INTERNAL);
  }
}
