import {
  MAX_FILTER_IDS,
  MAX_HEATMAP_SUBJECTS,
  MAX_TEXT_LENGTH,
  MAX_TRACK_SUBJECTS,
  MAX_VISIBILITY_SUBJECTS,
  parseAtlasAppMessage,
} from './atlas-app-messages';

const UUID = '6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f';
const OTHER_UUID = '0a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d';

const uuids = (count) => Array.from(
  { length: count },
  (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`
);

const SINCE = '2026-11-01T00:00:00+03:00';
const SINCE_UTC = '2026-10-31T21:00:00.000Z';
const UNTIL = '2026-11-05T12:30:00Z';
const UNTIL_UTC = '2026-11-05T12:30:00.000Z';

describe('utils - atlas-app-messages', () => {
  describe('parseAtlasAppMessage', () => {
    test.each([
      ['null', null],
      ['a string', 'events-filter'],
      ['an array', [{ action: 'events-filter' }]],
      ['a missing action', { id: UUID }],
      ['an unknown action', { action: 'delete-everything' }],
      ['an inherited action name', { action: 'toString' }],
    ])('returns null for %s', (_, data) => {
      expect(parseAtlasAppMessage(data)).toBeNull();
    });

    test('drops unknown keys', () => {
      expect(parseAtlasAppMessage({ action: 'open-event', id: UUID, extra: 'x', type: 'otus:app' }))
        .toEqual({ action: 'open-event', id: UUID });
    });

    describe('events-filter', () => {
      const parse = (params) => parseAtlasAppMessage({ action: 'events-filter', ...params });

      test('returns every param, with times normalized to UTC', () => {
        expect(parse({
          event_types: [UUID, OTHER_UUID],
          open: true,
          priority: [300, 200],
          reported_by: [UUID],
          since: SINCE,
          sort: { dir: 'up', field: 'event_time' },
          state: 'resolved',
          text: 'snare',
          until: UNTIL,
        })).toEqual({
          action: 'events-filter',
          event_types: [UUID, OTHER_UUID],
          open: true,
          priority: [300, 200],
          reported_by: [UUID],
          since: SINCE_UTC,
          sort: { dir: 'up', field: 'event_time' },
          state: 'resolved',
          text: 'snare',
          until: UNTIL_UTC,
        });
      });

      test('accepts no params', () => {
        expect(parse({})).toEqual({ action: 'events-filter' });
      });

      test('accepts a null until as open-ended', () => {
        expect(parse({ since: SINCE, until: null })).toEqual({ action: 'events-filter', since: SINCE_UTC, until: null });
      });

      test('accepts an empty text, to clear the search', () => {
        expect(parse({ text: '' })).toEqual({ action: 'events-filter', text: '' });
      });

      test('removes duplicate ids', () => {
        expect(parse({ event_types: [UUID, UUID] }).event_types).toEqual([UUID]);
      });

      test.each([
        ['a time without an offset', { since: '2026-11-01T00:00:00' }],
        ['a date without a time', { since: '2026-11-01' }],
        ['an impossible date', { since: '2026-13-45T00:00:00Z' }],
        ['a numeric time', { since: 1730000000000 }],
        ['a window ending before it starts', { since: UNTIL, until: SINCE }],
        ['an event type that is not a uuid', { event_types: ['snare'] }],
        ['too many event types', { event_types: uuids(MAX_FILTER_IDS + 1) }],
        ['an unknown priority', { priority: [250] }],
        ['a priority given as a word', { priority: ['red'] }],
        ['an unknown state', { state: 'open' }],
        ['a state given as a list', { state: ['active'] }],
        ['a text that is too long', { text: 'a'.repeat(MAX_TEXT_LENGTH + 1) }],
        ['a text that is not a string', { text: 42 }],
        ['a reporter that is not a uuid', { reported_by: ['Joseph'] }],
        ['an unknown sort field', { sort: { dir: 'up', field: 'serial_number' } }],
        ['an unknown sort direction', { sort: { dir: 'sideways', field: 'event_time' } }],
        ['a sort given as a string', { sort: 'event_time' }],
        ['an open flag that is not a boolean', { open: 'yes' }],
      ])('returns null for %s', (_, params) => {
        expect(parse(params)).toBeNull();
      });

      test('accepts the longest text', () => {
        expect(parse({ text: 'a'.repeat(MAX_TEXT_LENGTH) })).not.toBeNull();
      });
    });

    describe('patrols-filter', () => {
      const parse = (params) => parseAtlasAppMessage({ action: 'patrols-filter', ...params });

      test('returns every param', () => {
        expect(parse({
          leaders: [UUID],
          open: false,
          patrol_types: [OTHER_UUID],
          since: SINCE,
          status: ['active', 'done'],
          text: 'foot',
          until: null,
        })).toEqual({
          action: 'patrols-filter',
          leaders: [UUID],
          open: false,
          patrol_types: [OTHER_UUID],
          since: SINCE_UTC,
          status: ['active', 'done'],
          text: 'foot',
          until: null,
        });
      });

      test.each([
        ['an unknown status', { status: ['scheduled'] }],
        ['a status given as a string', { status: 'active' }],
        ['a leader that is not a uuid', { leaders: ['Ranger X'] }],
        ['a patrol type that is not a uuid', { patrol_types: ['foot'] }],
        ['a window ending before it starts', { since: UNTIL, until: SINCE }],
        ['a text that is too long', { text: 'a'.repeat(MAX_TEXT_LENGTH + 1) }],
      ])('returns null for %s', (_, params) => {
        expect(parse(params)).toBeNull();
      });
    });

    describe.each(['open-event', 'open-patrol', 'show-feature', 'show-analyzer'])('%s', (action) => {
      test('returns the id', () => {
        expect(parseAtlasAppMessage({ action, id: UUID })).toEqual({ action, id: UUID });
      });

      test.each([
        ['a missing id', {}],
        ['an id that is not a uuid', { id: '1042' }],
        ['a numeric id', { id: 1042 }],
      ])('returns null for %s', (_, params) => {
        expect(parseAtlasAppMessage({ action, ...params })).toBeNull();
      });
    });

    describe('subject-popup', () => {
      test('returns the id and track flag', () => {
        expect(parseAtlasAppMessage({ action: 'subject-popup', id: UUID, track: true }))
          .toEqual({ action: 'subject-popup', id: UUID, track: true });
      });

      test('returns null for a track flag that is not a boolean', () => {
        expect(parseAtlasAppMessage({ action: 'subject-popup', id: UUID, track: 1 })).toBeNull();
      });

      test('returns null for a missing id', () => {
        expect(parseAtlasAppMessage({ action: 'subject-popup' })).toBeNull();
      });
    });

    describe.each([
      ['subject-track', MAX_TRACK_SUBJECTS],
      ['subject-heatmap', MAX_HEATMAP_SUBJECTS],
    ])('%s', (action, maxSubjects) => {
      test('returns the ids and window', () => {
        expect(parseAtlasAppMessage({ action, ids: [UUID], since: SINCE, until: UNTIL }))
          .toEqual({ action, ids: [UUID], since: SINCE_UTC, until: UNTIL_UTC });
      });

      test('accepts the largest number of ids', () => {
        expect(parseAtlasAppMessage({ action, ids: uuids(maxSubjects) })).not.toBeNull();
      });

      test.each([
        ['missing ids', {}],
        ['no ids', { ids: [] }],
        ['too many ids', { ids: uuids(maxSubjects + 1) }],
        ['an id that is not a uuid', { ids: ['Kito'] }],
        ['a window ending before it starts', { ids: [UUID], since: UNTIL, until: SINCE }],
        ['a since without an offset', { ids: [UUID], since: '2026-11-01T00:00' }],
      ])('returns null for %s', (_, params) => {
        expect(parseAtlasAppMessage({ action, ...params })).toBeNull();
      });
    });

    describe('subject-at-time', () => {
      test('returns the id and time', () => {
        expect(parseAtlasAppMessage({ action: 'subject-at-time', id: UUID, time: UNTIL }))
          .toEqual({ action: 'subject-at-time', id: UUID, time: UNTIL_UTC });
      });

      test.each([
        ['a missing time', { id: UUID }],
        ['a null time', { id: UUID, time: null }],
        ['a time without an offset', { id: UUID, time: '2026-11-03T14:00' }],
        ['a missing id', { time: UNTIL }],
      ])('returns null for %s', (_, params) => {
        expect(parseAtlasAppMessage({ action: 'subject-at-time', ...params })).toBeNull();
      });
    });

    describe('report-heatmap', () => {
      test.each([true, false])('returns on: %s', (on) => {
        expect(parseAtlasAppMessage({ action: 'report-heatmap', on })).toEqual({ action: 'report-heatmap', on });
      });

      test.each([
        ['a missing flag', {}],
        ['a flag that is not a boolean', { on: 'true' }],
      ])('returns null for %s', (_, params) => {
        expect(parseAtlasAppMessage({ action: 'report-heatmap', ...params })).toBeNull();
      });
    });

    describe('subjects-visibility', () => {
      test.each(['only', 'hide', 'show'])('returns the %s ids', (mode) => {
        expect(parseAtlasAppMessage({ action: 'subjects-visibility', [mode]: [UUID] }))
          .toEqual({ action: 'subjects-visibility', [mode]: [UUID] });
      });

      test('accepts the largest number of ids', () => {
        expect(parseAtlasAppMessage({ action: 'subjects-visibility', hide: uuids(MAX_VISIBILITY_SUBJECTS) }))
          .not.toBeNull();
      });

      test.each([
        ['no mode', {}],
        ['two modes', { hide: [UUID], show: [OTHER_UUID] }],
        ['an empty list', { only: [] }],
        ['too many ids', { show: uuids(MAX_VISIBILITY_SUBJECTS + 1) }],
        ['an id that is not a uuid', { only: ['Rhinos'] }],
      ])('returns null for %s', (_, params) => {
        expect(parseAtlasAppMessage({ action: 'subjects-visibility', ...params })).toBeNull();
      });
    });

    describe('layers-search', () => {
      test('returns the text and tab', () => {
        expect(parseAtlasAppMessage({ action: 'layers-search', tab: 'features', text: 'boma' }))
          .toEqual({ action: 'layers-search', tab: 'features', text: 'boma' });
      });

      test('accepts an empty text', () => {
        expect(parseAtlasAppMessage({ action: 'layers-search', text: '' })).toEqual({ action: 'layers-search', text: '' });
      });

      test.each([
        ['a missing text', { tab: 'subjects' }],
        ['a text that is too long', { text: 'a'.repeat(MAX_TEXT_LENGTH + 1) }],
        ['an unknown tab', { tab: 'events', text: 'x' }],
      ])('returns null for %s', (_, params) => {
        expect(parseAtlasAppMessage({ action: 'layers-search', ...params })).toBeNull();
      });
    });

    test('returns null for the removed restore-view action', () => {
      expect(parseAtlasAppMessage({ action: 'restore-view' })).toBeNull();
    });
  });
});
