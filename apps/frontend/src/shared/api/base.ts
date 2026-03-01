import { env } from '@/shared/config/env';
import { HttpError } from '@/shared/lib/http-error';

type HttpMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

type ApiFetchOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: HeadersInit;
  auth?: boolean;
  retryOnUnauthorized?: boolean;
};

type RefreshResponse = {
  accessToken: string;
};

type AuthProvider = {
  getAccessToken: () => string | null;
  setAccessToken: (token: string | null) => void;
  clearAuth: () => void;
};

function buildUrl(path: string) {
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = env.apiBaseUrl.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${base}${normalizedPath}`;
}

async function parseResponse<T>(response: Response): Promise<T> {
  if (response.status === 204) {
    return null as T;
  }

  const text = await response.text();
  if (!text) {
    return null as T;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return text as T;
  }
}

export function createApiFetcher(authProvider: AuthProvider) {
  let isRefreshing = false;
  let refreshPromise: Promise<string | null> | null = null;

  async function refreshAccessToken(): Promise<string | null> {
    const response = await fetch(buildUrl('/auth/refresh'), {
      method: 'POST',
      credentials: 'include',
    });

    if (!response.ok) {
      return null;
    }

    const data = await parseResponse<RefreshResponse>(response);
    if (!data?.accessToken) {
      return null;
    }

    authProvider.setAccessToken(data.accessToken);
    return data.accessToken;
  }

  return async function apiFetch<T>(
    path: string,
    options: ApiFetchOptions = {},
  ): Promise<T> {
    const {
      method = 'GET',
      body,
      headers,
      auth = true,
      retryOnUnauthorized = true,
    } = options;

    const requestHeaders = new Headers(headers);

    if (body !== undefined && !requestHeaders.has('Content-Type')) {
      requestHeaders.set('Content-Type', 'application/json');
    }

    if (auth) {
      const accessToken = authProvider.getAccessToken();
      if (accessToken) {
        requestHeaders.set('Authorization', `Bearer ${accessToken}`);
      }
    }

    const response = await fetch(buildUrl(path), {
      method,
      headers: requestHeaders,
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: 'include',
    });

    if (response.status === 401 && auth && retryOnUnauthorized) {
      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken().finally(() => {
          isRefreshing = false;
          refreshPromise = null;
        });
      }

      const nextAccessToken = await refreshPromise;

      if (nextAccessToken) {
        return apiFetch<T>(path, {
          ...options,
          retryOnUnauthorized: false,
        });
      }

      authProvider.clearAuth();
      throw new HttpError('Unauthorized', 401);
    }

    if (!response.ok) {
      const errorBody = await parseResponse<{ message?: string } | string>(
        response,
      );
      const message =
        typeof errorBody === 'string'
          ? errorBody
          : (errorBody?.message ??
            `Request failed with status ${response.status}`);

      throw new HttpError(message, response.status);
    }

    return parseResponse<T>(response);
  };
}
