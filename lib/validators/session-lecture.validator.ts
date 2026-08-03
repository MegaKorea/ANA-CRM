import DOMPurify from 'isomorphic-dompurify';
import { AppError } from '@/errors';
import { HttpStatusCode, LectureErrorCode } from '@/constants/enums';
import type {
  SessionLectureAttachment,
  SessionLectureLink,
  SessionLectureStatus,
} from '@/lib/types/session-lecture';
import { assertAllowedHttpUrl } from '@/lib/utils/assert-http-url';
const LECTURE_HTML_SANITIZE_CONFIG = {
  ALLOWED_TAGS: [
    'p', 'br', 'strong', 'em', 's', 'u', 'a', 'img',
    'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'hr',
  ],
  ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'style', 'class'],
  ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
};

function sanitizeLectureHtml(html: string): string {
  return DOMPurify.sanitize(html, LECTURE_HTML_SANITIZE_CONFIG);
}

export type SessionLectureInputValidated = {
  title: string;
  html?: string;
  links?: SessionLectureLink[];
  attachments?: SessionLectureAttachment[];
  sort_order?: number;
  status?: SessionLectureStatus;
};

function parseStatus(value: unknown): SessionLectureStatus | undefined {
  if (value === undefined) return undefined;
  if (value === 'draft' || value === 'published') return value;
  throw new AppError(LectureErrorCode.INVALID_INPUT, HttpStatusCode.BAD_REQUEST, 'Trạng thái không hợp lệ.');
}

function parseLinks(value: unknown): SessionLectureLink[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new AppError(LectureErrorCode.INVALID_LINKS, HttpStatusCode.BAD_REQUEST);
  }
  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(LectureErrorCode.INVALID_LINKS, HttpStatusCode.BAD_REQUEST);
    }
    const row = item as Record<string, unknown>;
    const url = typeof row.url === 'string' ? row.url.trim() : '';
    if (!url) {
      throw new AppError(LectureErrorCode.INVALID_LINK_URL, HttpStatusCode.BAD_REQUEST);
    }
    assertAllowedHttpUrl(url);
    return {
      label: typeof row.label === 'string' && row.label.trim() ? row.label.trim() : url,
      url,
    };
  });
}

function parseAttachments(value: unknown): SessionLectureAttachment[] {
  if (value === undefined) return [];
  if (!Array.isArray(value)) {
    throw new AppError(LectureErrorCode.INVALID_ATTACHMENTS, HttpStatusCode.BAD_REQUEST);
  }
  return value.map((item) => {
    if (!item || typeof item !== 'object') {
      throw new AppError(LectureErrorCode.INVALID_ATTACHMENTS, HttpStatusCode.BAD_REQUEST);
    }
    const row = item as Record<string, unknown>;
    const url = typeof row.url === 'string' ? row.url.trim() : '';
    const name = typeof row.name === 'string' ? row.name.trim() : '';
    if (!url || !name) {
      throw new AppError(LectureErrorCode.INVALID_ATTACHMENTS, HttpStatusCode.BAD_REQUEST);
    }
    return {
      name,
      url,
      mime_type: typeof row.mime_type === 'string' ? row.mime_type : null,
      size: typeof row.size === 'number' ? row.size : null,
    };
  });
}

export function validateCreateSessionLectureInput(input: unknown): SessionLectureInputValidated {
  if (!input || typeof input !== 'object') {
    throw new AppError(LectureErrorCode.INVALID_INPUT, HttpStatusCode.BAD_REQUEST);
  }
  const data = input as Record<string, unknown>;
  if (typeof data.title !== 'string' || !data.title.trim()) {
    throw new AppError(LectureErrorCode.TITLE_REQUIRED, HttpStatusCode.BAD_REQUEST);
  }
  const result: SessionLectureInputValidated = {
    title: data.title.trim(),
    html: typeof data.html === 'string' ? sanitizeLectureHtml(data.html) : '',
    links: parseLinks(data.links),
    attachments: parseAttachments(data.attachments),
  };
  if (typeof data.sort_order === 'number') {
    result.sort_order = data.sort_order;
  }
  const status = parseStatus(data.status);
  if (status) result.status = status;
  return result;
}

export function validateUpdateSessionLectureInput(
  input: unknown,
): Partial<SessionLectureInputValidated> {
  if (!input || typeof input !== 'object') {
    throw new AppError(LectureErrorCode.INVALID_INPUT, HttpStatusCode.BAD_REQUEST);
  }
  const data = input as Record<string, unknown>;
  const result: Partial<SessionLectureInputValidated> = {};

  if (data.title !== undefined) {
    if (typeof data.title !== 'string' || !data.title.trim()) {
      throw new AppError(LectureErrorCode.TITLE_REQUIRED, HttpStatusCode.BAD_REQUEST);
    }
    result.title = data.title.trim();
  }
  if (data.html !== undefined) {
    result.html = typeof data.html === 'string' ? sanitizeLectureHtml(data.html) : '';
  }
  if (data.links !== undefined) {
    result.links = parseLinks(data.links);
  }
  if (data.attachments !== undefined) {
    result.attachments = parseAttachments(data.attachments);
  }
  if (typeof data.sort_order === 'number') {
    result.sort_order = data.sort_order;
  }
  const status = parseStatus(data.status);
  if (status) result.status = status;
  return result;
}
