import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import { applyAccessToken, AUTH_URL, POST_AUTH_SUCCESS, postAuth } from './auth';

const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('postAuth', () => {
  const capturedForm = async (dispatchedThunk) => {
    let form = null;
    server.use(http.post(AUTH_URL, async ({ request }) => {
      form = Object.fromEntries(await request.formData());
      return HttpResponse.json({ access_token: 'issued-token' });
    }));

    await dispatchedThunk();
    return form;
  };

  // The client ID belongs to the registration discovery resolved, not to this module. A build
  // whose registry names a different one must send that one.
  test('sends the client ID it is given rather than one of its own', async () => {
    const form = await capturedForm(postAuth({ username: 'alice', password: 'secret' }, 'some_other_client'));

    expect(form.client_id).toBe('some_other_client');
  });

  test('sends the password grant with the supplied credentials, and returns the token', async () => {
    let token;
    const form = await capturedForm(async () => {
      token = await postAuth({ username: 'alice', password: 'secret' }, 'das_web_client')();
    });

    expect(form).toEqual({
      grant_type: 'password',
      client_id: 'das_web_client',
      username: 'alice',
      password: 'secret',
    });
    expect(token).toBe('issued-token');
  });
});

describe('applyAccessToken', () => {
  let cookieWrites;
  let originalCookieDescriptor;

  beforeEach(() => {
    // document.cookie readback strips attributes (path/expires/domain/...), so a
    // toContain('token=...') assertion can't see path=/. Capture the raw setter
    // instead to assert the exact write, including the path scope.
    cookieWrites = [];
    originalCookieDescriptor = Object.getOwnPropertyDescriptor(document, 'cookie');
    Object.defineProperty(document, 'cookie', {
      configurable: true,
      get: () => cookieWrites.join('; '),
      set: (value) => { cookieWrites.push(value); },
    });
  });

  afterEach(() => {
    if (originalCookieDescriptor) {
      Object.defineProperty(document, 'cookie', originalCookieDescriptor);
    } else {
      delete document.cookie;
    }
  });

  test('writes the token cookie scoped to path=/ and dispatches POST_AUTH_SUCCESS', () => {
    const dispatch = jest.fn();

    applyAccessToken('new.jwt.token')(dispatch);

    expect(cookieWrites).toContain('token=new.jwt.token;path=/');
    expect(dispatch).toHaveBeenCalledWith({
      type: POST_AUTH_SUCCESS,
      payload: { data: { access_token: 'new.jwt.token' } },
    });
  });
});
