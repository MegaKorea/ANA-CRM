'use client';

import { useParams } from 'next/navigation';
import { QuizEditorPage } from '../../../../../components/QuizEditorPage';

export default function EditQuizPage() {
  const params = useParams();
  const classId = params.id as string;
  const sessionId = params.sessionId as string;
  const quizId = params.quizId as string;

  return (
    <QuizEditorPage
      mode="edit"
      classId={classId}
      sessionId={sessionId}
      quizId={quizId}
    />
  );
}
