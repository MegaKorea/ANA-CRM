import type { SessionLectureAttachment } from '@/lib/types/session-lecture';

const IMG_SRC_RE = /<img[^>]+src=["']([^"']+)["']/gi;

export function extractImageUrlsFromHtml(html: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const re = new RegExp(IMG_SRC_RE.source, 'gi');
  let match: RegExpExecArray | null;
  while ((match = re.exec(html)) !== null) {
    const url = match[1]?.trim();
    if (!url || seen.has(url)) continue;
    seen.add(url);
    urls.push(url);
  }
  return urls;
}

export function collectImageAttachmentsFromHtml(
  html: string,
  existing: SessionLectureAttachment[] = [],
): SessionLectureAttachment[] {
  const byUrl = new Map(existing.map((item) => [item.url, item]));
  return extractImageUrlsFromHtml(html).map((url) => {
    const prev = byUrl.get(url);
    if (prev) return prev;
    const name = url.split('/').pop() || 'image';
    return { name, url, mime_type: null, size: null };
  });
}
