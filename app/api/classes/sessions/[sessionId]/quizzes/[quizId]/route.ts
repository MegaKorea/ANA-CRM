import { NextRequest, NextResponse } from 'next/server';
import { ClassMemberRole, HttpStatusCode, QuizErrorCode } from '@/constants/enums';
import { fail } from '@/errors';
import {
  assertQuizBelongsToSession,
  assertQuizTeacherWriter,
  sessionContentErrorResponse,
} from '@/lib/api/session-content-route';
import { getCurrentUser } from '@/lib/services/auth.service';
import { resolveClassViewer } from '@/lib/services/class_access.service';
import { getSessionMetaById } from '@/lib/services/class_session.service';
import {
  deleteSessionQuiz,
  getMyQuizAttempt,
  getQuizById,
  updateSessionQuiz,
} from '@/lib/services/quiz.service';
import { isQuizAttemptCompleted, stripQuizAnswers } from '@/lib/types/quiz';
import { notifyStudentsQuizPublishedSafe } from '@/lib/services/user-notification.service';
import { validateUpdateQuizInput } from '@/lib/validators/quiz.validator';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; quizId: string }> },
): Promise<NextResponse> {
  try {
    const { sessionId, quizId } = await params;
    const [user, session, quiz] = await Promise.all([
      getCurrentUser(),
      getSessionMetaById(sessionId),
      getQuizById(quizId),
    ]);
    assertQuizBelongsToSession(quiz, sessionId);

    if (user.roleCode === ClassMemberRole.STU) {
      if (!quiz.is_published) {
        fail(QuizErrorCode.NOT_PUBLISHED, HttpStatusCode.FORBIDDEN);
      }
      const [, attempt] = await Promise.all([
        resolveClassViewer(session.class_id),
        getMyQuizAttempt(quizId, user.id),
      ]);
      if (isQuizAttemptCompleted(attempt)) {
        return NextResponse.json(quiz, { status: HttpStatusCode.OK });
      }
      return NextResponse.json(stripQuizAnswers(quiz), { status: HttpStatusCode.OK });
    }

    await resolveClassViewer(session.class_id);
    return NextResponse.json(quiz, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, QuizErrorCode.INTERNAL);
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; quizId: string }> },
): Promise<NextResponse> {
  try {
    const { sessionId, quizId } = await params;
    const [, session, existing] = await Promise.all([
      assertQuizTeacherWriter(),
      getSessionMetaById(sessionId),
      getQuizById(quizId),
    ]);
    await resolveClassViewer(session.class_id);
    assertQuizBelongsToSession(existing, sessionId);
    const body = await request.json();
    const input = validateUpdateQuizInput(body);
    const quiz = await updateSessionQuiz(quizId, sessionId, input);
    const firstPublish = !existing.is_published && quiz.is_published;

    if (firstPublish) {
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

    return NextResponse.json(quiz, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, QuizErrorCode.INTERNAL);
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; quizId: string }> },
): Promise<NextResponse> {
  try {
    const { sessionId, quizId } = await params;
    const [, session] = await Promise.all([
      assertQuizTeacherWriter(),
      getSessionMetaById(sessionId),
    ]);
    await resolveClassViewer(session.class_id);
    await deleteSessionQuiz(quizId, sessionId);
    return NextResponse.json({ success: true }, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, QuizErrorCode.INTERNAL);
  }
}
