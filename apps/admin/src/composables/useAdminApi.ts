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

  async function request<T>(path: string, options: RequestInit = {}, token?: string | null): Promise<T> {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(token ? {Authorization: `Bearer ${token}`} : {}),
        ...options.headers,
      },
    });
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
