'use client';

import { useParams } from 'next/navigation';
import { LectureEditorPage } from '../../../../../components/LectureEditorPage';

export default function EditLecturePage() {
  const params = useParams();
  const classId = params.id as string;
  const sessionId = params.sessionId as string;
  const lectureId = params.lectureId as string;

  return (
    <LectureEditorPage
      mode="edit"
      classId={classId}
      sessionId={sessionId}
      lectureId={lectureId}
    />
  );
}
