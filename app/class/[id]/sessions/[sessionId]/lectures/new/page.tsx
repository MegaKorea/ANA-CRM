'use client';

import { useParams } from 'next/navigation';
import { LectureEditorPage } from '../../../../components/LectureEditorPage';

export default function NewLecturePage() {
  const params = useParams();
  const classId = params.id as string;
  const sessionId = params.sessionId as string;

  return <LectureEditorPage mode="create" classId={classId} sessionId={sessionId} />;
}
