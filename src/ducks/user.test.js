import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';

import {
  CURRENT_USER_API_URL,
  FETCH_CURRENT_USER_SUCCESS,
  fetchCurrentUser,
  fetchUserProfile,
  SET_USER_PROFILE,
  USER_API_URL,
} from './user';

const PROFILE = { id: 'profile-id', username: 'profile' };
const SIGNED_IN_USER = { id: 'user-id', username: 'user' };

const server = setupServer(
  http.get(CURRENT_USER_API_URL, () => HttpResponse.json({ data: SIGNED_IN_USER })),
);

describe('ducks - user', () => {
  beforeAll(() => server.listen());

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  describe('fetchCurrentUser', () => {
    let dispatch, profileRequestHeaders;
    beforeEach(() => {
      dispatch = jest.fn((action) => typeof action === 'function' ? action(dispatch) : action);
      profileRequestHeaders = [];

      server.use(http.get(`${USER_API_URL}/${PROFILE.id}`, ({ request }) => {
        profileRequestHeaders.push(request.headers.get('User-Profile'));

        return HttpResponse.json({ data: PROFILE });
      }));
    });

    const runFetchCurrentUser = (selectedUserProfile) => fetchCurrentUser()(
      dispatch,
      () => ({ data: { selectedUserProfile, user: SIGNED_IN_USER } })
    );

    test('stores the signed-in account and refreshes the active profile as that profile', async () => {
      await runFetchCurrentUser({ id: PROFILE.id });

      expect(dispatch).toHaveBeenCalledWith({ payload: SIGNED_IN_USER, type: FETCH_CURRENT_USER_SUCCESS });
      expect(dispatch).toHaveBeenCalledWith({ payload: PROFILE, type: SET_USER_PROFILE });
      expect(profileRequestHeaders).toEqual([PROFILE.id]);
    });

    test('does not fetch a profile when none is active', async () => {
      await runFetchCurrentUser({});

      expect(dispatch).toHaveBeenCalledWith({ payload: SIGNED_IN_USER, type: FETCH_CURRENT_USER_SUCCESS });
      expect(profileRequestHeaders).toEqual([]);
    });

    test('rejects when the signed-in account cannot be fetched', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(http.get(CURRENT_USER_API_URL, () => new HttpResponse(null, { status: 500 })));

      await expect(runFetchCurrentUser({})).rejects.toBeDefined();

      expect(console.warn).toHaveBeenCalled();
    });

    test('rejects with a single warning when the active profile cannot be refreshed', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(http.get(`${USER_API_URL}/${PROFILE.id}`, () => new HttpResponse(null, { status: 403 })));

      await expect(runFetchCurrentUser({ id: PROFILE.id })).rejects.toBeDefined();

      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchUserProfile', () => {
    let dispatch;
    beforeEach(() => {
      dispatch = jest.fn((action) => typeof action === 'function' ? action(dispatch) : action);
    });

    test('stores the record of the profile, read as that profile', async () => {
      const profileRecord = { ...PROFILE, permissions: { patrol: ['view'] } };
      const profileRequestHeaders = [];
      server.use(http.get(`${USER_API_URL}/${PROFILE.id}`, ({ request }) => {
        profileRequestHeaders.push(request.headers.get('USER-PROFILE'));

        return HttpResponse.json({ data: profileRecord });
      }));

      await fetchUserProfile(PROFILE.id, true)(dispatch);

      expect(dispatch).toHaveBeenCalledWith({ payload: profileRecord, type: SET_USER_PROFILE });
      expect(profileRequestHeaders).toEqual([PROFILE.id]);
    });

    test('rejects without storing a profile when its record cannot be read', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      server.use(http.get(`${USER_API_URL}/${PROFILE.id}`, () => new HttpResponse(null, { status: 500 })));

      await expect(fetchUserProfile(PROFILE.id, true)(dispatch)).rejects.toBeDefined();

      expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: SET_USER_PROFILE }));
    });

    test('rejects without storing or warning when its read is cancelled', async () => {
      jest.spyOn(console, 'warn').mockImplementation(() => {});
      const abortController = new AbortController();
      abortController.abort();

      await expect(fetchUserProfile(PROFILE.id, true, abortController.signal)(dispatch)).rejects.toBeDefined();

      expect(dispatch).not.toHaveBeenCalledWith(expect.objectContaining({ type: SET_USER_PROFILE }));
      expect(console.warn).not.toHaveBeenCalled();
    });
  });
});
