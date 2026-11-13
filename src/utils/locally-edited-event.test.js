import { applyLocalEditsToEvent } from './locally-edited-event';

describe('utils - locally edited event', () => {
  describe('applyLocalEditsToEvent', () => {
    test('overlays the defined local edits onto the stored event and flags it', () => {
      const stored = { id: 'e1', title: 'stored', priority: 200 };
      const edited = { id: 'e1', title: 'edited', priority: undefined };

      expect(applyLocalEditsToEvent(stored, edited)).toEqual({
        id: 'e1',
        title: 'edited',
        priority: 200,
        locallyEdited: true,
      });
    });
  });
});
