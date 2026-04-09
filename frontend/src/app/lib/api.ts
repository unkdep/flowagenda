export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

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

function extractMessage(data: any, fallback = "Ocorreu um erro ao processar sua solicitação.") {
  if (!data) return fallback;

  if (typeof data === "string" && data.trim()) {
    return data;
  }

  if (typeof data?.error === "string" && data.error.trim()) {
    return data.error;
  }

  if (typeof data?.detail === "string" && data.detail.trim()) {
    return data.detail;
  }

  if (typeof data?.message === "string" && data.message.trim()) {
    return data.message;
  }

  if (typeof data === "object") {
    const entries = Object.entries(data)
      .map(([key, value]) => {
        if (Array.isArray(value)) {
          return `${key}: ${value.join(", ")}`;
        }

        if (typeof value === "string") {
          return `${key}: ${value}`;
        }

        return null;
      })
      .filter(Boolean);

    if (entries.length > 0) {
      return entries.join(" | ");
    }
  }

  return fallback;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestOptions = {}
): Promise<T> {
  const method = (options.method || "GET").toUpperCase();
  const headers = new Headers(options.headers || {});

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

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    method,
    credentials: "include",
    headers,
    body: isJsonBody
      ? JSON.stringify(options.body)
      : (options.body as BodyInit | null | undefined),
  });

  const contentType = response.headers.get("content-type") || "";
  let data: any = null;

  try {
    if (contentType.includes("application/json")) {
      data = await response.json();
    } else {
      const text = await response.text();
      data = text || null;
    }
  } catch {
    data = null;
  }

  if (!response.ok) {
    throw new Error(extractMessage(data));
  }

  return data as T;
}