const SESSION_KEY = "mecorion.auth.session";
const API_BASE_URL = import.meta.env.VITE_MECORION_API_URL ?? "http://127.0.0.1:4000";

export function readAuthSession() {
  try {
    return JSON.parse(localStorage.getItem(SESSION_KEY)) ?? null;
  } catch {
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(readAuthSession()?.token);
}

function writeAuthSession(session) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  return session;
}

export function clearAuthSession() {
  localStorage.removeItem(SESSION_KEY);
}

export function getAuthToken() {
  return readAuthSession()?.token ?? null;
}

function authHeaders() {
  const token = getAuthToken();
  return token ? {Authorization: `Bearer ${token}`} : {};
}

async function requestAuth(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...authHeaders(),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data?.message ?? "Mecorion API временно недоступен");
  }

  return data;
}

function persistAuthResponse(data) {
  return writeAuthSession({
    token: data.token,
    user: data.user,
    createdAt: new Date().toISOString(),
  });
}

export async function signIn({email, password}) {
  const data = await requestAuth("/api/v1/auth/sign-in", {
    method: "POST",
    body: JSON.stringify({email, password}),
  });

  return persistAuthResponse(data);
}

export async function signUp({displayName, email, password}) {
  const data = await requestAuth("/api/v1/auth/sign-up", {
    method: "POST",
    body: JSON.stringify({displayName, email, password}),
  });

  return persistAuthResponse(data);
}

export async function fetchCurrentUser() {
  if (!getAuthToken()) return null;

  try {
    const data = await requestAuth("/api/v1/auth/me");
    const current = readAuthSession();

    // Токен остаётся тем же, но данные пользователя обновляем из API:
    // роль могла измениться, а guard должен работать с актуальным состоянием.
    return writeAuthSession({...current, user: data.user});
  } catch {
    clearAuthSession();
    return null;
  }
}

export async function signOut() {
  try {
    if (getAuthToken()) {
      await requestAuth("/api/v1/auth/logout", {method: "POST"});
    }
  } finally {
    clearAuthSession();
  }
}
