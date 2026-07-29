export function asRecord(value: unknown): Record<string, unknown> | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }
  return value as Record<string, unknown>;
}

export function asString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

export function stripFbPrefix(id: string): string {
  return id.startsWith('fb') ? id.slice(2) : id;
}

export function withFbPrefix(id: string): string {
  return id.startsWith('fb') ? id : `fb${id}`;
}

export function idsMatch(a: string, b: string): boolean {
  return stripFbPrefix(a) === stripFbPrefix(b);
}
