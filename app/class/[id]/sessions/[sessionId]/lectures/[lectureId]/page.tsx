'use client';

import { useParams } from 'next/navigation';
import { LectureDetailPage } from '../../../../components/LectureDetailPage';

export default function ViewLecturePage() {
  const params = useParams();
  const classId = params.id as string;
  const sessionId = params.sessionId as string;
  const lectureId = params.lectureId as string;

  return (
    <LectureDetailPage classId={classId} sessionId={sessionId} lectureId={lectureId} />
  );
}
