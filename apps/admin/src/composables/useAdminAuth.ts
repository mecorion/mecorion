import {AdminApiError} from "./useAdminApi";

export interface AdminUser {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  roles: string[];
  permissions: string[];
}

interface AdminSession {
  token?: string;
  user: AdminUser;
  createdAt: string;
}

interface SeedChallengeStartResponse {
  challengeId: string;
  challengeToken: string;
  positions: number[];
  expiresIn: number;
}

interface SignInResponse {
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
    // Remove the legacy session that exposed tokens to browser JavaScript.
    localStorage.removeItem("mecorion.auth.session");
    initialized.value = true;
  }

  function persist(nextSession: AdminSession) {
    session.value = nextSession;
  }

  function clear() {
    session.value = null;
  }

  async function startSeedChallenge(login: string) {
    return request<SeedChallengeStartResponse>("/api/v1/auth/seed/challenge/start", {
      method: "POST",
      body: JSON.stringify({login}),
    });
  }

  async function confirmSeedChallenge(input: {
    login: string;
    challengeId: string;
    challengeToken: string;
    words: string[];
  }) {
    const response = await request<SignInResponse>("/api/v1/auth/seed/challenge/confirm", {
      method: "POST",
      body: JSON.stringify(input),
    });
    const nextSession: AdminSession = {
      token: response.tokens.accessToken,
      user: response.user,
      createdAt: new Date().toISOString(),
    };
    persist(nextSession);
    return nextSession;
  }

  async function validateAccess() {
    hydrate();
    validating.value = true;
    try {
      const response = await request<AdminAccessResponse>(
        "/api/v1/admin/access",
        {},
        session.value?.token,
      );
      persist({token: session.value?.token, user: response.user, createdAt: session.value?.createdAt ?? new Date().toISOString()});
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
    try {
      await request("/api/v1/auth/logout", {method: "POST"}, session.value?.token);
    } finally {
      clear();
    }
  }

  return {
    session: readonly(session),
    validating: readonly(validating),
    hydrate,
    clear,
    startSeedChallenge,
    confirmSeedChallenge,
    validateAccess,
    signOut,
  };
}
