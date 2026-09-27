let apiBaseUrl = "http://127.0.0.1:4000";
let currentSession = null;
let initializationPromise = null;

export function configureAuthApi(baseUrl) {
  apiBaseUrl = baseUrl.replace(/\/+$/, "");
  // Earlier prototypes persisted refresh tokens in localStorage. The current
  // flow uses HttpOnly cookies, so remove the obsolete browser-readable copy.
  globalThis.localStorage?.removeItem("mecorion.auth.session");
}

export function readAuthSession() {
  return currentSession;
}

export function isAuthenticated() {
  return Boolean(currentSession?.user);
}

export function clearAuthSession() {
  currentSession = null;
}

export function getAuthToken() {
  return currentSession?.token ?? null;
}

async function rawRequest(path, options = {}) {
  return fetch(`${apiBaseUrl}${path}`, {
    ...options,
    credentials: "include",
    headers: {"Content-Type": "application/json", ...options.headers},
  });
}

async function requestAuth(path, options = {}, retry = true) {
  let response;
  try {
    response = await rawRequest(path, options);
  } catch {
    throw new Error("Не удалось подключиться к Mecorion API");
  }

  if (response.status === 401 && retry && !path.startsWith("/api/v1/auth/refresh")) {
    const refreshed = await rawRequest("/api/v1/auth/refresh", {method: "POST", body: "{}"});
    if (refreshed.ok) response = await rawRequest(path, options);
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message ?? "Mecorion API временно недоступен");
  return data;
}

function rememberAuthResponse(data) {
  currentSession = {token: data.tokens?.accessToken ?? null, user: data.user, createdAt: new Date().toISOString()};
  return currentSession;
}

export function startSeedSignIn(login) {
  return requestAuth("/api/v1/auth/seed/challenge/start", {method: "POST", body: JSON.stringify({login})});
}

export async function confirmSeedSignIn(input) {
  const data = await requestAuth("/api/v1/auth/seed/challenge/confirm", {method: "POST", body: JSON.stringify(input)});
  return rememberAuthResponse(data);
}

export function signUpWithSeed({displayName, username}) {
  return requestAuth("/api/v1/auth/seed/register", {
    method: "POST",
    body: JSON.stringify({displayName, username, wordCount: 12}),
  });
}

export async function confirmSeedSignUp(input) {
  const data = await requestAuth("/api/v1/auth/seed/register/confirm", {method: "POST", body: JSON.stringify(input)});
  return rememberAuthResponse(data);
}

export async function fetchCurrentUser() {
  try {
    const data = await requestAuth("/api/v1/auth/me");
    return rememberAuthResponse(data);
  } catch {
    clearAuthSession();
    return null;
  }
}

export function initializeAuthSession() {
  initializationPromise ??= fetchCurrentUser();
  return initializationPromise;
}

export async function signOut() {
  try {
    await requestAuth("/api/v1/auth/logout", {method: "POST"}, false);
  } finally {
    clearAuthSession();
    initializationPromise = null;
  }
}
