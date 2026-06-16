import axios from 'axios';

import auth0CallbackInProgressReducer, {
  GATE_RESULT,
  SET_AUTH0_CALLBACK_IN_PROGRESS,
  checkAccountLinked,
  setAuth0CallbackInProgress,
} from './account-linking';

jest.mock('axios');

describe('checkAccountLinked', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  test('204 → LINKED', async () => {
    axios.get.mockResolvedValue({ status: 204, data: '' });

    await expect(checkAccountLinked('tok')).resolves.toEqual({ result: GATE_RESULT.LINKED });
  });

  test('200 → UNLINKED with a trimmed link URL', async () => {
    axios.get.mockResolvedValue({ status: 200, data: '  https://site.example/auth/link-accounts/\n' });

    await expect(checkAccountLinked('tok')).resolves.toEqual({
      result: GATE_RESULT.UNLINKED,
      linkUrl: 'https://site.example/auth/link-accounts/',
    });
  });

  test('200 with a non-http(s) URL → TRANSIENT (fails safe, no hand-off)', async () => {
    axios.get.mockResolvedValue({ status: 200, data: 'javascript:alert(1)' });

    await expect(checkAccountLinked('tok')).resolves.toEqual({ result: GATE_RESULT.TRANSIENT });
  });

  test('200 with a non-URL body → TRANSIENT', async () => {
    axios.get.mockResolvedValue({ status: 200, data: 'not a url' });

    await expect(checkAccountLinked('tok')).resolves.toEqual({ result: GATE_RESULT.TRANSIENT });
  });

  test('unexpected 2xx (e.g. 202) → TRANSIENT', async () => {
    axios.get.mockResolvedValue({ status: 202, data: 'https://site.example/auth/link-accounts/' });

    await expect(checkAccountLinked('tok')).resolves.toEqual({ result: GATE_RESULT.TRANSIENT });
  });

  test('400 → INVALID', async () => {
    axios.get.mockRejectedValue({ response: { status: 400 } });

    await expect(checkAccountLinked('tok')).resolves.toEqual({ result: GATE_RESULT.INVALID });
  });

  test('5xx → TRANSIENT', async () => {
    axios.get.mockRejectedValue({ response: { status: 503 } });

    await expect(checkAccountLinked('tok')).resolves.toEqual({ result: GATE_RESULT.TRANSIENT });
  });

  test('network error (no response) → TRANSIENT', async () => {
    axios.get.mockRejectedValue(new Error('Network Error'));

    await expect(checkAccountLinked('tok')).resolves.toEqual({ result: GATE_RESULT.TRANSIENT });
  });

  test('attaches the bearer token and bypasses the global 401 handler', async () => {
    axios.get.mockResolvedValue({ status: 204, data: '' });

    await checkAccountLinked('my-token');

    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining('user/linked'),
      expect.objectContaining({
        headers: { Authorization: 'Bearer my-token' },
        skipAuth: true,
      }),
    );
  });
});

describe('auth0CallbackInProgress reducer', () => {
  test('defaults to false', () => {
    expect(auth0CallbackInProgressReducer(undefined, {})).toBe(false);
  });

  test('setAuth0CallbackInProgress toggles the flag', () => {
    expect(auth0CallbackInProgressReducer(false, setAuth0CallbackInProgress(true))).toBe(true);
    expect(auth0CallbackInProgressReducer(true, setAuth0CallbackInProgress(false))).toBe(false);
  });

  test('coerces the payload to a boolean', () => {
    expect(setAuth0CallbackInProgress('truthy'))
      .toEqual({ type: SET_AUTH0_CALLBACK_IN_PROGRESS, payload: true });
  });
});
