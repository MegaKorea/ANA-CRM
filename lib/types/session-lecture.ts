export type SessionLectureStatus = 'draft' | 'published';

export type SessionLectureLink = {
  label: string;
  url: string;
};

export type SessionLectureAttachment = {
  name: string;
  url: string;
  mime_type?: string | null;
  size?: number | null;
};

export type SessionLecture = {
  id: string;
  title: string;
  html: string;
  links: SessionLectureLink[];
  attachments: SessionLectureAttachment[];
  sort_order: number;
  updated_at: string;
  /** Missing/legacy → treated as published */
  status: SessionLectureStatus;
};

export type SessionBodyJson = {
  lectures?: SessionLecture[];
};

function parseLectureStatus(value: unknown): SessionLectureStatus {
  return value === 'draft' ? 'draft' : 'published';
}

export function isLecturePublished(lecture: Pick<SessionLecture, 'status'>): boolean {
  return lecture.status !== 'draft';
}

export function filterLecturesForViewer(
  lectures: SessionLecture[],
  includeDrafts: boolean,
): SessionLecture[] {
  if (includeDrafts) return lectures;
  return lectures.filter(isLecturePublished);
}

export function countPublishedLectures(lectures: SessionLecture[]): number {
  return lectures.filter(isLecturePublished).length;
}

export function parseSessionLectures(bodyJson: unknown): SessionLecture[] {
  if (!bodyJson || typeof bodyJson !== 'object' || Array.isArray(bodyJson)) {
    return [];
  }
  const lectures = (bodyJson as SessionBodyJson).lectures;
  if (!Array.isArray(lectures)) return [];

  return lectures
    .filter((item): item is SessionLecture => {
      return !!item && typeof item === 'object' && typeof (item as SessionLecture).id === 'string';
    })
    .map((item, index) => ({
      id: item.id,
      title: typeof item.title === 'string' ? item.title : '',
      html: typeof item.html === 'string' ? item.html : '',
      links: Array.isArray(item.links) ? item.links : [],
      attachments: Array.isArray(item.attachments) ? item.attachments : [],
      sort_order: typeof item.sort_order === 'number' ? item.sort_order : index,
      updated_at:
        typeof item.updated_at === 'string' ? item.updated_at : new Date(0).toISOString(),
      status: parseLectureStatus((item as { status?: unknown }).status),
    }))
    .toSorted((a, b) => a.sort_order - b.sort_order);
}

export function buildBodyJsonWithLectures(
  bodyJson: unknown,
  lectures: SessionLecture[],
): SessionBodyJson {
  const base =
    bodyJson && typeof bodyJson === 'object' && !Array.isArray(bodyJson)
      ? { ...(bodyJson as Record<string, unknown>) }
      : {};
  return {
    ...base,
    lectures,
  };
}
