import { NextResponse } from 'next/server';
import { AppError, fail } from '@/errors';
import {
  ClassMemberRole,
  HttpStatusCode,
  LectureErrorCode,
  QuizErrorCode,
} from '@/constants/enums';
import { getCurrentUser, type CurrentUser } from '@/lib/services/auth.service';

export function sessionContentErrorResponse(
  error: unknown,
  fallbackCode: string,
): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(
      { error: error.message || error.code, code: error.code },
      { status: error.statusCode },
    );
  }
  return NextResponse.json(
    { error: fallbackCode, code: fallbackCode },
    { status: HttpStatusCode.INTERNAL_SERVER_ERROR },
  );
}

async function assertTeacherWriter(forbiddenCode: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user.roleCode !== ClassMemberRole.TEA) {
    fail(forbiddenCode, HttpStatusCode.FORBIDDEN);
  }
  return user;
}

export async function assertSessionTeacherWriter(): Promise<CurrentUser> {
  return assertTeacherWriter(LectureErrorCode.FORBIDDEN);
}

export async function assertQuizTeacherWriter(): Promise<CurrentUser> {
  return assertTeacherWriter(QuizErrorCode.FORBIDDEN);
}

export async function assertQuizStudentSubmitter(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (user.roleCode !== ClassMemberRole.STU) {
    fail(QuizErrorCode.FORBIDDEN_SUBMIT, HttpStatusCode.FORBIDDEN);
  }
  return user;
}

export function assertQuizBelongsToSession(
  quiz: { session_id: string | null },
  sessionId: string,
): void {
  if (quiz.session_id !== sessionId) {
    fail(QuizErrorCode.NOT_FOUND, HttpStatusCode.NOT_FOUND);
  }
}
