import axios from 'axios';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { checkTokenUsable, TOKEN_RESULT, TOKEN_USABILITY_PROBE_URL } from './token-usability';

const TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.test.signature';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const respond = (resolver) => server.use(http.get(TOKEN_USABILITY_PROBE_URL, resolver));

describe('checkTokenUsable', () => {
  test('reports a token the API accepts as usable', async () => {
    respond(() => HttpResponse.json({ data: { id: 'user-1' } }));

    expect(await checkTokenUsable(TOKEN)).toBe(TOKEN_RESULT.USABLE);
  });

  test('reports a token the API rejects as refused', async () => {
    // The authorization server issued it, but this application is not permitted to present
    // DAS-issued tokens to this site.
    respond(() => new HttpResponse(null, { status: 401 }));

    expect(await checkTokenUsable(TOKEN)).toBe(TOKEN_RESULT.REFUSED);
  });

  test('reports a transport failure as transient rather than refused', async () => {
    respond(() => HttpResponse.error());

    expect(await checkTokenUsable(TOKEN)).toBe(TOKEN_RESULT.TRANSIENT);
  });

  test('reports a server error as transient rather than refused', async () => {
    respond(() => new HttpResponse(null, { status: 503 }));

    expect(await checkTokenUsable(TOKEN)).toBe(TOKEN_RESULT.TRANSIENT);
  });

  test('attaches the token per-call, since the shared header is not installed yet', async () => {
    let authorization = null;
    respond(({ request }) => {
      authorization = request.headers.get('authorization');
      return HttpResponse.json({ data: {} });
    });

    await checkTokenUsable(TOKEN);

    expect(authorization).toBe(`Bearer ${TOKEN}`);
  });

  test('keeps its 401 away from the global auth-recovery interceptor', async () => {
    respond(() => new HttpResponse(null, { status: 401 }));

    // Mirrors the test RequestConfigManager applies before it tries to recover and then
    // signs the user out. Recovering here would reproduce the bounce loop from inside the
    // check meant to prevent it.
    const treatedAsAuthError = [];
    const interceptor = axios.interceptors.response.use(undefined, (error) => {
      treatedAsAuthError.push(error?.response?.status === 401 && !error.config?.skipAuth);
      return Promise.reject(error);
    });

    await checkTokenUsable(TOKEN);
    axios.interceptors.response.eject(interceptor);

    expect(treatedAsAuthError).toEqual([false]);
  });
});
