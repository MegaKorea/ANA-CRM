import { NextRequest, NextResponse } from 'next/server';
import { HttpStatusCode, QuizErrorCode } from '@/constants/enums';
import {
  assertQuizBelongsToSession,
  assertQuizTeacherWriter,
  sessionContentErrorResponse,
} from '@/lib/api/session-content-route';
import { resolveClassViewer } from '@/lib/services/class_access.service';
import { getSessionMetaById } from '@/lib/services/class_session.service';
import { gradeQuizAttemptEssay, getQuizById } from '@/lib/services/quiz.service';
import { validateGradeAttemptInput } from '@/lib/validators/quiz.validator';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string; quizId: string; attemptId: string }> },
): Promise<NextResponse> {
  try {
    const { sessionId, quizId, attemptId } = await params;
    const [user, session, quiz] = await Promise.all([
      assertQuizTeacherWriter(),
      getSessionMetaById(sessionId),
      getQuizById(quizId),
    ]);
    await resolveClassViewer(session.class_id);
    assertQuizBelongsToSession(quiz, sessionId);
    const body = await request.json();
    const { feedback } = validateGradeAttemptInput(body);
    const attempt = await gradeQuizAttemptEssay(attemptId, quizId, user.id, feedback);
    return NextResponse.json(attempt, { status: HttpStatusCode.OK });
  } catch (error: unknown) {
    return sessionContentErrorResponse(error, QuizErrorCode.INTERNAL);
  }
}
