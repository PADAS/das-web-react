import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';

import communityReducer, {
  COMMUNITY_INPUT_API_URL,
  FETCH_COMMUNITY_INFO_SUCCESS,
  fetchCommunityInfo,
  INITIAL_STATE,
} from './community';

const COMMUNITY_VALUE = 'test-community';
const COMMUNITY_INFO = { id: 'community-id', name: 'Test Community' };

const server = setupServer(
  http.get(COMMUNITY_INPUT_API_URL(COMMUNITY_VALUE), () => HttpResponse.json({ data: COMMUNITY_INFO })),
);

describe('Ducks - Community', () => {
  beforeAll(() => server.listen());

  afterEach(() => server.resetHandlers());

  afterAll(() => server.close());

  test('fetchCommunityInfo dispatches FETCH_COMMUNITY_INFO_SUCCESS and resolves to the response data', async () => {
    const dispatch = jest.fn();

    const result = await fetchCommunityInfo(COMMUNITY_VALUE)(dispatch);

    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith({
      payload: COMMUNITY_INFO,
      type: FETCH_COMMUNITY_INFO_SUCCESS,
    });
    expect(result).toEqual(COMMUNITY_INFO);
  });

  describe('communityReducer', () => {
    test('returns the initial state', () => {
      expect(communityReducer(undefined, {})).toEqual(INITIAL_STATE);
    });

    test('handles a FETCH_COMMUNITY_INFO_SUCCESS action', () => {
      const action = { payload: COMMUNITY_INFO, type: FETCH_COMMUNITY_INFO_SUCCESS };

      expect(communityReducer(INITIAL_STATE, action)).toEqual(COMMUNITY_INFO);
    });
  });
});
