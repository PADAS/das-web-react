import feedTableViewReducer, { INITIAL_STATE, SET_FEED_TABLE_VIEW, setFeedTableView } from './';

describe('Ducks - Feed table view', () => {
  test('starts with the feed, not the table, for events and patrols', () => {
    expect(feedTableViewReducer(undefined, { type: 'UNKNOWN' })).toEqual({ events: false, patrols: false });
  });

  test('sets the view of one feed without touching the other', () => {
    expect(feedTableViewReducer(INITIAL_STATE, setFeedTableView('patrols', true)))
      .toEqual({ events: false, patrols: true });
  });

  test('setFeedTableView names the feed and its view', () => {
    expect(setFeedTableView('events', true))
      .toEqual({ payload: { isTableView: true, tab: 'events' }, type: SET_FEED_TABLE_VIEW });
  });
});
