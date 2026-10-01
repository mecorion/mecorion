export class AdminApiError extends Error {
  status: number;
  code: string;
  details: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AdminApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function useAdminApi() {
  const config = useRuntimeConfig();
  const baseUrl = String(config.public.mecorionApiUrl).replace(/\/+$/, "");

  async function request<T>(path: string, options: RequestInit = {}, token?: string | null, retry = true): Promise<T> {
    const isFormData = options.body instanceof FormData;
    let response: Response;
    try {
      response = await fetch(`${baseUrl}${path}`, {
        ...options,
        credentials: "include",
        headers: {
          ...(!isFormData ? {"Content-Type": "application/json"} : {}),
          ...(token ? {Authorization: `Bearer ${token}`} : {}),
          ...options.headers,
        },
      });
    } catch {
      throw new AdminApiError(
        0,
        "API_UNAVAILABLE",
        "Не удалось подключиться к Mecorion API. Проверьте, что API запущено на порту 4000.",
      );
    }

    if (response.status === 401 && retry && path !== "/api/v1/auth/refresh") {
      const refreshed = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: "POST",
        credentials: "include",
        headers: {"Content-Type": "application/json"},
        body: "{}",
      });
      if (refreshed.ok) return request<T>(path, options, token, false);
    }
    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new AdminApiError(
        response.status,
        payload?.error ?? "ADMIN_API_ERROR",
        payload?.message ?? "Mecorion API временно недоступен",
        payload?.details,
      );
    }

    return payload as T;
  }

  return {request};
}
