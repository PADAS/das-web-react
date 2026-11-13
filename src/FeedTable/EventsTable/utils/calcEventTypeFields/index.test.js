import { snareSchemaV2 } from '../../../../__test-helpers/fixtures/event-schemas';

import calcEventTypeFields from './';

describe('FeedTable - EventsTable - utils - calcEventTypeFields', () => {
  const v1Schema = {
    schema: {
      properties: {
        herd: { properties: { leader: { type: 'string' } }, title: 'Herd', type: 'object' },
        sighted_at: { format: 'date-time', title: 'Sighted at', type: 'string' },
        species: { enum: ['elephant', 'lion'], title: 'Species', type: 'string' },
      },
    },
    uiSchema: { 'ui:groups': [{ items: ['species', 'herd'] }], species: { 'ui:enumNames': ['Elephant', 'Lion'] } },
  };

  test('lists a v1 schema\'s fields in its group order, then the rest', () => {
    expect(calcEventTypeFields(v1Schema, []).map((field) => field.key)).toEqual(['species', 'herd', 'sighted_at']);
  });

  test('shows a v1 choice by its label and marks dates and objects', () => {
    const [species, herd, sightedAt] = calcEventTypeFields(v1Schema, []);

    expect(species.toText({ species: 'lion' })).toBe('Lion');
    expect(herd.complex).toBe(true);
    expect(sightedAt.isDate).toBe(true);
  });

  test('labels a v2 schema\'s fields from its layout', () => {
    const field = calcEventTypeFields(snareSchemaV2, [])
      .find((schemaField) => schemaField.key === 'number_of_snares_found');

    expect(field.label).toBe('Number of Snares Found');
    expect(field.toText({ number_of_snares_found: 4 })).toBe('4');
  });

  test('falls back to the loaded event details without a schema', () => {
    const events = [{ event_details: { animal: { name: 'Lion', value: 'lion' }, notes_count: 2 } }];

    expect(calcEventTypeFields(null, events).map((field) => [field.label, field.toText(events[0].event_details)]))
      .toEqual([['Animal', 'Lion'], ['Notes Count', '2']]);
  });

  test('falls back to the loaded event details when the schema cannot be read', () => {
    jest.spyOn(console, 'warn').mockImplementation(() => {});

    expect(calcEventTypeFields({ json: {} }, [{ event_details: { count: 1 } }]).map((field) => field.key))
      .toEqual(['count']);
  });
});
