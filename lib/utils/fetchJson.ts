export class FetchJsonError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'FetchJsonError';
    this.status = status;
    this.data = data;
  }
}

export async function fetchJson<TResponse>(input: RequestInfo | URL, init?: RequestInit): Promise<TResponse> {
  let res: Response;
  try {
    res = await fetch(input, init);
  } catch (e: unknown) {
    if (e instanceof Error && (e.name === 'AbortError' || e.message.includes('aborted'))) {
      throw new Error('Hết thời gian chờ phản hồi từ máy chủ.');
    }
    throw e;
  }

  const contentType = res.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');

  const data = isJson ? await res.json().catch(() => undefined) : await res.text().catch(() => undefined);

  if (!res.ok) {
    const message =
      (data && typeof data === 'object' && ('message' in data || 'error' in data)
        ? (data as any).message ?? (data as any).error
        : undefined) ||
      res.statusText ||
      'Request failed';

    throw new FetchJsonError(String(message), res.status, data);
  }

  return data as TResponse;
}

