import { trackEventFactory, MAP_INTERACTION_CATEGORY, REPORTS_CATEGORY } from './analytics';
let tracker;

beforeEach(() => {
  tracker = jest.fn();
});

test('it will trigger track for provided category', () => {
  const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY, tracker);
  mapInteractionTracker.track('some action', 'some label');

  expect(tracker).toHaveBeenCalledWith(MAP_INTERACTION_CATEGORY, 'some action', 'some label');
});


test('it will trigger track after specific delay by calling debouncedTrack', () => {
  const mapInteractionTracker = trackEventFactory(REPORTS_CATEGORY, tracker);
  const debounceTracker = mapInteractionTracker.debouncedTrack();
  debounceTracker('my action', 'my label');

  setTimeout(() => {
    expect(tracker).toHaveBeenCalledWith(REPORTS_CATEGORY, 'my action', 'my label');
    expect(tracker).toHaveBeenCalledTimes(1);
  }, 450);
});