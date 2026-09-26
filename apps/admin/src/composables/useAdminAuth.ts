import {AdminApiError} from "./useAdminApi";

const SESSION_KEY = "mecorion.auth.session";

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  roles: string[];
  permissions: string[];
}

interface AdminSession {
  token: string;
  refreshToken?: string;
  user: AdminUser;
  createdAt: string;
}

interface EmailStartResponse {
  ok: boolean;
  challengeId: string;
  expiresIn: number;
  devCode?: string;
}

interface EmailConfirmResponse {
  user: AdminUser;
  tokens: {accessToken: string; refreshToken?: string};
}

interface AdminAccessResponse {
  allowed: true;
  user: AdminUser;
}

export function useAdminAuth() {
  const session = useState<AdminSession | null>("admin-session", () => null);
  const initialized = useState("admin-session-initialized", () => false);
  const validating = useState("admin-session-validating", () => false);
  const {request} = useAdminApi();

  function hydrate() {
    if (initialized.value || !import.meta.client) return;
    initialized.value = true;
    try {
      session.value = JSON.parse(localStorage.getItem(SESSION_KEY) ?? "null");
    } catch {
      localStorage.removeItem(SESSION_KEY);
      session.value = null;
    }
  }

  function persist(nextSession: AdminSession) {
    session.value = nextSession;
    if (import.meta.client) localStorage.setItem(SESSION_KEY, JSON.stringify(nextSession));
  }

  function clear() {
    session.value = null;
    if (import.meta.client) localStorage.removeItem(SESSION_KEY);
  }

  async function startEmailSignIn(email: string) {
    return request<EmailStartResponse>("/api/v1/auth/email/sign-in/start", {
      method: "POST",
      body: JSON.stringify({email}),
    });
  }

  async function confirmEmailSignIn(email: string, code: string) {
    const response = await request<EmailConfirmResponse>("/api/v1/auth/email/confirm", {
      method: "POST",
      body: JSON.stringify({email, code}),
    });
    const nextSession: AdminSession = {
      token: response.tokens.accessToken,
      refreshToken: response.tokens.refreshToken,
      user: response.user,
      createdAt: new Date().toISOString(),
    };
    persist(nextSession);
    return nextSession;
  }

  async function validateAccess() {
    hydrate();
    if (!session.value?.token) return "unauthenticated" as const;

    validating.value = true;
    try {
      const response = await request<AdminAccessResponse>(
        "/api/v1/admin/access",
        {},
        session.value.token,
      );
      persist({...session.value, user: response.user});
      return "allowed" as const;
    } catch (error) {
      if (error instanceof AdminApiError && error.status === 403) return "forbidden" as const;
      if (error instanceof AdminApiError && error.status === 401) {
        clear();
        return "unauthenticated" as const;
      }
      throw error;
    } finally {
      validating.value = false;
    }
  }

  async function signOut() {
    const token = session.value?.token;
    try {
      if (token) await request("/api/v1/auth/logout", {method: "POST"}, token);
    } finally {
      clear();
    }
  }

  return {
    session: readonly(session),
    validating: readonly(validating),
    hydrate,
    clear,
    startEmailSignIn,
    confirmEmailSignIn,
    validateAccess,
    signOut,
  };
}
