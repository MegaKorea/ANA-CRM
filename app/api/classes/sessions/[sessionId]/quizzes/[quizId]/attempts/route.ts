import { NextRequest, NextResponse } from 'next/server';
import { ClassMemberRole, HttpStatusCode, QuizErrorCode } from '@/constants/enums';
import {
  assertQuizBelongsToSession,
  assertQuizStudentSubmitter,
  sessionContentErrorResponse,
} from '@/lib/api/session-content-route';
import { getCurrentUser } from '@/lib/services/auth.service';
import { resolveClassViewer } from '@/lib/services/class_access.service';
import { getSessionMetaById } from '@/lib/services/class_session.service';
import {
  getMyQuizAttempt,
  getQuizById,
  listQuizAttemptsForTeacher,
  saveQuizAttemptDraft,
  startQuizAttempt,
  submitQuizAttempt,
} from '@/lib/services/quiz.service';
import {
  isStartAttemptRequest,
  validateDraftAttemptInput,
  validateSubmitAttemptInput,
} from '@/lib/validators/quiz.validator';

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
    await resolveClassViewer(session.class_id);
    assertQuizBelongsToSession(quiz, sessionId);

    if (user.roleCode === ClassMemberRole.TEA) {
      const items = await listQuizAttemptsForTeacher(quizId);
      return NextResponse.json({ items }, { status: HttpStatusCode.OK });
    }

    const attempt = await getMyQuizAttempt(quizId, user.id);
    return NextResponse.json(attempt, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, QuizErrorCode.INTERNAL);
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; quizId: string }> },
): Promise<NextResponse> {
  try {
    const { sessionId, quizId } = await params;
    const [user, session, quiz] = await Promise.all([
      assertQuizStudentSubmitter(),
      getSessionMetaById(sessionId),
      getQuizById(quizId),
    ]);
    await resolveClassViewer(session.class_id);
    assertQuizBelongsToSession(quiz, sessionId);
    const body = await request.json();

    if (isStartAttemptRequest(body)) {
      const attempt = await startQuizAttempt(quizId, user.id, quiz);
      return NextResponse.json(attempt, { status: HttpStatusCode.CREATED });
    }

    const answers = validateSubmitAttemptInput(body);
    const attempt = await submitQuizAttempt(quizId, user.id, answers, quiz);
    return NextResponse.json(attempt, { status: HttpStatusCode.CREATED });
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
    const [user, session, quiz] = await Promise.all([
      assertQuizStudentSubmitter(),
      getSessionMetaById(sessionId),
      getQuizById(quizId),
    ]);
    await resolveClassViewer(session.class_id);
    assertQuizBelongsToSession(quiz, sessionId);
    const body = await request.json();
    const answers = validateDraftAttemptInput(body);
    const attempt = await saveQuizAttemptDraft(quizId, user.id, answers);
    return NextResponse.json(attempt, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, QuizErrorCode.INTERNAL);
  }
}
