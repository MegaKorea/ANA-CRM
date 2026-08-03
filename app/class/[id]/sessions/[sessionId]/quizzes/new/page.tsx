'use client';

import { useParams } from 'next/navigation';
import { QuizEditorPage } from '../../../../components/QuizEditorPage';

export default function NewQuizPage() {
  const params = useParams();
  const classId = params.id as string;
  const sessionId = params.sessionId as string;

  return <QuizEditorPage mode="create" classId={classId} sessionId={sessionId} />;
}
