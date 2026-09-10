import { applyAccessToken, POST_AUTH_SUCCESS } from './auth';

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
