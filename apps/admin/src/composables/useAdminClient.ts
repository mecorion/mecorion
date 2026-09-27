import {AdminApiError} from "./useAdminApi";

export function useAdminClient() {
  const auth = useAdminAuth();
  const api = useAdminApi();

  async function request<T>(path: string, options: RequestInit = {}) {
    const token = auth.session.value?.token;
    if (!token) throw new AdminApiError(401, "UNAUTHENTICATED", "Требуется вход в панель администратора");
    try {
      return await api.request<T>(path, options, token);
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) auth.clear();
      throw error;
    }
  }

  return {request};
}
