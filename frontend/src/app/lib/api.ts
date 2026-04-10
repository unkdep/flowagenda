export const API_BASE_URL = "/backend";

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown;
};

function getCookie(name: string) {
  if (typeof document === "undefined") return null;

  const cookies = document.cookie ? document.cookie.split("; ") : [];

  for (const cookie of cookies) {
    const [key, ...rest] = cookie.split("=");

    if (key === name) {
      return decodeURIComponent(rest.join("="));
    }
  }

  return null;
}

async function ensureCsrfCookie() {
  await fetch(`${API_BASE_URL}/api/auth/csrf/`, {
    method: "GET",
    credentials: "include",
  });
}

function extractMessage(
  data: any,
  fallback = "Ocorreu um erro ao processar sua solicitação."
) {
  if (!data) return fallback;

  if (typeof data === "string" && data.trim()) return data;
  if (typeof data?.error === "string") return data.error;
  if (typeof data?.detail === "string") return data.detail;
  if (typeof data?.message === "string") return data.message;

  return fallback;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

  let normalizedPath = path;

  if (!normalizedPath.startsWith("/")) {
    normalizedPath = `/${normalizedPath}`;
  }

  if (!normalizedPath.endsWith("/")) {
    normalizedPath += "/";
  }

  const isJsonBody =
    options.body !== undefined &&
    options.body !== null &&
    !(options.body instanceof FormData);

  const needsCsrf = !["GET", "HEAD", "OPTIONS"].includes(method);

  if (isJsonBody) {
    headers.set("Content-Type", "application/json");
  }

  if (needsCsrf) {
    await ensureCsrfCookie();

    const csrfToken = getCookie("csrftoken");
    if (csrfToken) {
      headers.set("X-CSRFToken", csrfToken);
    }
  }

  const response = await fetch(`${API_BASE_URL}${normalizedPath}`, {
    ...options,
    method,
    credentials: "include",
    headers,
    body: isJsonBody
      ? JSON.stringify(options.body)
      : (options.body as BodyInit | null | undefined),
  });

  let data: any = null;

  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(extractMessage(data));
  }

  return data as T;
}