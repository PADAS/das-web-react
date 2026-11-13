import { selectLocallyEditedEventFromStore } from './';

describe('Selectors - Locally edited event', () => {
  const eventStore = {
    e1: { id: 'e1', title: 'stored' },
    e2: { id: 'e2', title: 'another' },
  };

  const buildState = (locallyEditedEvent = null) => ({ data: { eventStore, locallyEditedEvent } });

  describe('selectLocallyEditedEventFromStore', () => {
    test('returns the locally edited event from the event store', () => {
      const state = buildState({ id: 'e1', title: 'edited' });

      expect(selectLocallyEditedEventFromStore(state)).toEqual({ id: 'e1', title: 'stored' });
    });

    test('returns undefined when no event is being edited', () => {
      expect(selectLocallyEditedEventFromStore(buildState())).toBeUndefined();
    });
  });
});
