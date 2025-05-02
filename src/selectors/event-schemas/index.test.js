import { snareSchemaV2 } from '../../__test-helpers/fixtures/event-schemas';
import { selectEventSchema } from './';

describe('Selectors - Event schemas', () => {
  const state = {
    data: {
      eventSchemas: {
        'snare-event-type-id': {
          'event-id': snareSchemaV2,
        }
      },
    },
  };

  describe('selectEventSchema', () => {
    test('gets an event schema mapping by its event type and its id', () => {
      expect(selectEventSchema(state, 'snare-event-type-id', 'event-id')).toBe(snareSchemaV2);
    });
  });
});
