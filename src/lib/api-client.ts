export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string; status?: number };
export type ApiResult<T> = ApiOk<T> | ApiErr;

export function getPublicApiBaseUrl(): string {
  // Server-side prefer API_URL — LAN NEXT_PUBLIC hosts often time out from Node.
  const serverUrl = typeof window === "undefined" ? process.env.API_URL : undefined;
  return (serverUrl || process.env.NEXT_PUBLIC_API_URL || "").trim().replace(/\/$/, "");
}

export async function safeFetchJson<T>(
  url: string,
  init?: RequestInit & { timeoutMs?: number },
): Promise<ApiResult<T>> {
  const timeoutMs = init?.timeoutMs ?? 10_000;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...init,
      signal: controller.signal,
      cache: init?.cache ?? "no-store",
    });

    if (!res.ok) {
      return { ok: false, error: `HTTP ${res.status}`, status: res.status };
    }

    const json = (await res.json()) as T;
    return { ok: true, data: json };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    return { ok: false, error: msg };
  } finally {
    clearTimeout(t);
  }
}
