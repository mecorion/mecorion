import {AdminApiError} from "./useAdminApi";

export function useAdminClient() {
  const auth = useAdminAuth();
  const api = useAdminApi();

  async function request<T>(path: string, options: RequestInit = {}) {
    try {
      return await api.request<T>(path, options, auth.session.value?.token);
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 401) auth.clear();
      throw error;
    }
  }

  return {request};
}
