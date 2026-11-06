/**
 * HTTP client for the bria API.
 *
 * - Reads the access token from localStorage and sends it as a Bearer header.
 * - Turns the backend's ErrorResponse ({ code, message, details }) into a thrown `ApiError`
 *   whose `message` is the API's own Spanish text; network failures get a Spanish message too.
 * - On 401 it renews the session once with the stored refresh token
 *   (POST /auth/refresh-token) and retries the request; only if that fails does it clear
 *   the session and redirect to /login. Concurrent 401s share one refresh call.
 * - Identical GETs in flight at the same time (e.g. the sidebar and the page both asking for
 *   the signed-in user) share one network request.
 */
export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v1";

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";

const OFFLINE_MESSAGE = "No pudimos conectar con el servidor. Revisa tu internet e inténtalo de nuevo.";

export function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    /** The ErrorResponse's `details`, when the API sends any (e.g. stock shortages). */
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions {
  /** Skip attaching the Authorization header (used by login/register). */
  anonymous?: boolean;
}

/** `fetch` that reports a network failure as an `ApiError` (status 0) in Spanish. */
async function send(url: string, init: RequestInit): Promise<Response> {
  try {
    return await fetch(url, init);
  } catch {
    throw new ApiError(OFFLINE_MESSAGE, 0);
  }
}

/** Builds the `ApiError` for a failed response, keeping the API's message, code and details. */
async function errorFrom(response: Response): Promise<ApiError> {
  let message = `No se pudo completar la operación (error ${response.status}). Inténtalo de nuevo.`;
  let code: string | undefined;
  let details: unknown;
  try {
    const data = await response.json();
    if (typeof data?.message === "string" && data.message) message = data.message;
    code = data?.code;
    details = data?.details;
  } catch {
    /* response had no JSON body */
  }
  return new ApiError(message, response.status, code, details);
}

/** The single refresh in flight: every 401 that arrives meanwhile waits for this one. */
let refreshInFlight: Promise<boolean> | null = null;

/**
 * Trades the stored refresh token for a new pair. Uses a bare `fetch` (never `request`), so
 * a 401 from the refresh endpoint itself can't trigger another refresh: no loops.
 */
function refreshSession(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;
  const refreshToken = getRefreshToken();
  if (!refreshToken || typeof window === "undefined") return Promise.resolve(false);
  refreshInFlight = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });
      if (!response.ok) return false;
      const data = (await response.json()) as { access_token?: string; refresh_token?: string };
      if (!data?.access_token) return false;
      setTokens(data.access_token, data.refresh_token ?? refreshToken);
      return true;
    } catch {
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();
  return refreshInFlight;
}

function endSession(): never {
  clearTokens();
  if (window.location.pathname !== "/login") window.location.replace("/login");
  throw new ApiError("Tu sesión expiró. Vuelve a ingresar.", 401);
}

/**
 * Sends an authenticated request; on a 401 it renews the session once and retries. If the
 * token changed while this request was in the air (another call already refreshed), it
 * just retries with the new one instead of refreshing again.
 */
async function sendWithSession(sendWith: (token: string | null) => Promise<Response>): Promise<Response> {
  const sentToken = getAccessToken();
  const response = await sendWith(sentToken);
  if (response.status !== 401 || typeof window === "undefined") return response;

  const current = getAccessToken();
  const renewed = current && current !== sentToken ? true : await refreshSession();
  if (!renewed) endSession();

  const retry = await sendWith(getAccessToken());
  if (retry.status === 401) endSession();
  return retry;
}

async function request<TResponse>(
  method: string,
  path: string,
  body?: unknown,
  options: RequestOptions = {},
): Promise<TResponse> {
  const headers: Record<string, string> = {};
  let payload: BodyInit | undefined;

  if (body instanceof FormData) {
    payload = body;
  } else if (body !== undefined) {
    headers["Content-Type"] = "application/json";
    payload = JSON.stringify(body);
  }

  const sendWith = (token: string | null) =>
    send(`${API_BASE_URL}${path}`, {
      method,
      headers: token ? { ...headers, Authorization: `Bearer ${token}` } : headers,
      body: payload,
    });

  // Login/register answer 401 for wrong credentials: surface the API's message as is.
  const response = options.anonymous ? await sendWith(null) : await sendWithSession(sendWith);

  if (!response.ok) throw await errorFrom(response);

  if (response.status === 204) return undefined as TResponse;

  const contentType = response.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return (await response.blob()) as TResponse;
  }
  return (await response.json()) as TResponse;
}

/** GETs in flight, keyed by token and path, so simultaneous identical reads share one request. */
const pendingGets = new Map<string, Promise<unknown>>();

function get<T>(path: string): Promise<T> {
  const key = `${getAccessToken() ?? ""} ${path}`;
  const pending = pendingGets.get(key);
  if (pending) return pending as Promise<T>;
  const promise = request<T>("GET", path).finally(() => pendingGets.delete(key));
  pendingGets.set(key, promise);
  return promise;
}

/** Fetches a file response as a blob, regardless of content-type, with its filename. */
async function requestBlob(path: string): Promise<{ blob: Blob; filename: string }> {
  const response = await sendWithSession((token) =>
    send(`${API_BASE_URL}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {} }),
  );
  if (!response.ok) throw await errorFrom(response);

  const disposition = response.headers.get("content-disposition") ?? "";
  const match = /filename\*?=(?:UTF-8''|")?([^";]+)/i.exec(disposition);
  const filename = match ? decodeURIComponent(match[1].replace(/"/g, "")) : "descarga";
  return { blob: await response.blob(), filename };
}

export const apiClient = {
  get,
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>("POST", path, body, options),
  patch: <T>(path: string, body?: unknown) => request<T>("PATCH", path, body),
  put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
  del: <T>(path: string) => request<T>("DELETE", path),
  getBlob: (path: string) => requestBlob(path),
};
