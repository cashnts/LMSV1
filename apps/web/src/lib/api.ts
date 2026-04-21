const base = () => process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

export class ApiError extends Error {
  status: number;
  details: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${base()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
      ...init?.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    const text = await res.text();
    try {
      const parsed = JSON.parse(text) as {
        message?: string | string[];
        error?: string;
        statusCode?: number;
      };
      const message = Array.isArray(parsed.message)
        ? parsed.message.join(', ')
        : parsed.message ?? parsed.error ?? res.statusText;
      throw new ApiError(message, res.status, parsed);
    } catch {
      throw new ApiError(text || res.statusText, res.status, text);
    }
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}
