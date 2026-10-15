/**
 * Tiny typed fetch wrapper used by client components.
 * Every API route answers with { ok, data } or { ok, error }.
 */

export type ApiResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; status: number };

async function request<T>(
  url: string,
  init?: RequestInit,
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      credentials: "same-origin",
      cache: "no-store",
      ...init,
      headers: {
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    const payload = (await res.json().catch(() => null)) as
      | { ok?: boolean; data?: T; error?: string }
      | null;

    if (!res.ok || !payload?.ok) {
      return {
        ok: false,
        error: payload?.error ?? `Request failed (${res.status})`,
        status: res.status,
      };
    }
    return { ok: true, data: payload.data as T };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error",
      status: 0,
    };
  }
}

export function apiGet<T>(url: string) {
  return request<T>(url, { method: "GET" });
}

export function apiPost<T>(url: string, body?: unknown) {
  return request<T>(url, { method: "POST", body: JSON.stringify(body ?? {}) });
}

export function apiPatch<T>(url: string, body?: unknown) {
  return request<T>(url, { method: "PATCH", body: JSON.stringify(body ?? {}) });
}
