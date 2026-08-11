import { NextRequest, NextResponse } from 'next/server';
import { ClassMemberRole, HttpStatusCode, QuizErrorCode } from '@/constants/enums';
import { fail } from '@/errors';
import {
  assertQuizBelongsToSession,
  assertQuizTeacherWriter,
  sessionContentErrorResponse,
} from '@/lib/api/session-content-route';
import { getCurrentUser } from '@/lib/services/auth.service';
import { assertClassAccess } from '@/lib/services/class_access.service';
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
    const [user, quiz] = await Promise.all([
      getCurrentUser(),
      getQuizById(quizId),
    ]);
    assertQuizBelongsToSession(quiz, sessionId);

    if (user.roleCode === ClassMemberRole.STU) {
      if (!quiz.is_published) {
        fail(QuizErrorCode.NOT_PUBLISHED, HttpStatusCode.FORBIDDEN);
      }
      const [, attempt] = await Promise.all([
        assertClassAccess(quiz.class_id, user),
        getMyQuizAttempt(quizId, user.id),
      ]);
      const payload = isQuizAttemptCompleted(attempt) ? quiz : stripQuizAnswers(quiz);
      return NextResponse.json(
        { quiz: payload, attempt: attempt ?? null },
        { status: HttpStatusCode.OK },
      );
    }

    await assertClassAccess(quiz.class_id, user);
    return NextResponse.json({ quiz, attempt: null }, { status: HttpStatusCode.OK });
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
    const [user, session, existing] = await Promise.all([
      assertQuizTeacherWriter(),
      getSessionMetaById(sessionId),
      getQuizById(quizId),
    ]);
    await assertClassAccess(session.class_id, user);
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
    const [user, session] = await Promise.all([
      assertQuizTeacherWriter(),
      getSessionMetaById(sessionId),
    ]);
    await assertClassAccess(session.class_id, user);
    await deleteSessionQuiz(quizId, sessionId);
    return NextResponse.json({ success: true }, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, QuizErrorCode.INTERNAL);
  }
}
