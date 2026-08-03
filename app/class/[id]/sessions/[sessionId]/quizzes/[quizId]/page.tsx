'use client';

import { useParams } from 'next/navigation';
import { QuizTakePage } from '../../../../components/QuizTakePage';

export default function ViewQuizPage() {
  const params = useParams();
  const classId = params.id as string;
  const sessionId = params.sessionId as string;
  const quizId = params.quizId as string;

  return <QuizTakePage classId={classId} sessionId={sessionId} quizId={quizId} />;
}
