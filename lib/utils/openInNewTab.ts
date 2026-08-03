/**
 * Open a URL in a new tab in a safe way.
 */
export function openInNewTab(url: string | null | undefined): boolean {
  if (!isSafeHttpUrl(url)) {
    return false;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
  return true;
}

/**
 * Check if a string is a valid http/https URL.
 */
export function isSafeHttpUrl(url: string | null | undefined): url is string {
  const trimmed = url?.trim();
  if (!trimmed) {
    return false;
  }
  try {
    const { protocol } = new URL(trimmed);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}
