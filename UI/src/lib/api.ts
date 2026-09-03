const API_BASE_URL = (import.meta.env["VITE_API_URL"] || "http://localhost:5000/api").replace(/\/$/, "");

export class ApiClientError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status = 0, data?: unknown) {
    super(message);
    this.name = "ApiClientError";
    this.status = status;
    this.data = data;
  }
}

let refreshing: Promise<string | null> | null = null;

function getToken() {
  return typeof window === "undefined" ? null : localStorage.getItem("accessToken");
}

function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("accessToken", token);
  else localStorage.removeItem("accessToken");
}

async function refreshAccessToken(): Promise<string | null> {
  if (!refreshing) {
    refreshing = fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    })
      .then(async (res) => {
        if (!res.ok) return null;
        const json = await res.json();
        const token = json?.data?.accessToken ?? null;
        setToken(token);
        return token;
      })
      .catch(() => null)
      .finally(() => {
        refreshing = null;
      });
  }
  return refreshing;
}

async function rawRequest(path: string, options: RequestInit = {}, retry = true): Promise<any> {
  const headers = new Headers(options.headers);
  if (!headers.has("Content-Type") && options.body && !(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }

  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry && !path.includes("/auth/refresh-token")) {
    const nextToken = await refreshAccessToken();
    if (nextToken) return rawRequest(path, options, false);
    setToken(null);
  }

  const text = await response.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = null;
  }

  if (!response.ok) {
    throw new ApiClientError(json?.message || json?.error || `Request failed (${response.status})`, response.status, json);
  }

  return json;
}

export async function apiFetch<T = unknown>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const json = await rawRequest(path, options, retry);
  return (json?.data ?? json) as T;
}

/**
 * Same as apiFetch, but keeps the `pagination` envelope ({ page, limit, total, totalPages })
 * instead of unwrapping to just `data`. Use this when you need `total` counts (e.g. admin stats).
 */
export async function apiFetchEnvelope<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<{ data: T; pagination?: { page: number; limit: number; total: number; totalPages: number } }> {
  const json = await rawRequest(path, options);
  return { data: (json?.data ?? json) as T, pagination: json?.pagination };
}

export const api = {
  get: <T,>(path: string) => apiFetch<T>(path),
  post: <T,>(path: string, body?: unknown) =>
    apiFetch<T>(path, {
      method: "POST",
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),
  patch: <T,>(path: string, body: unknown) => apiFetch<T>(path, { method: "PATCH", body: JSON.stringify(body) }),
  delete: <T,>(path: string) => apiFetch<T>(path, { method: "DELETE" }),
  getPaginated: <T,>(path: string) => apiFetchEnvelope<T>(path),
};

export function clearAuth() {
  setToken(null);
}

export { API_BASE_URL };