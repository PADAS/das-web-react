import toolsDocument from './tools.json';
import { ATLAS_TOOL_NAMES, ATLAS_TOOLS, validateToolCall } from './validate';

const UUID = '6f1c2d3e-4b5a-4c7d-8e9f-0a1b2c3d4e5f';
const OTHER_UUID = '0a1b2c3d-4e5f-4a7b-8c9d-0e1f2a3b4c5d';

const MAX_TEXT_LENGTH = 100;
const MAX_FILTER_IDS = 500;
const MAX_TRACK_SUBJECTS = 20;
const MAX_HEATMAP_SUBJECTS = 200;
const MAX_VISIBILITY_SUBJECTS = 500;

const uuids = (count) => Array.from(
  { length: count },
  (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`
);

const SINCE = '2026-11-01T00:00:00+03:00';
const SINCE_UTC = '2026-10-31T21:00:00.000Z';
const UNTIL = '2026-11-05T12:30:00Z';
const UNTIL_UTC = '2026-11-05T12:30:00.000Z';

const valid = (params = expect.any(Object)) => ({ ok: true, params });

const INVALID = { message: expect.any(String), ok: false };

describe('utils - atlas-tools - validate', () => {
  describe('ATLAS_TOOLS', () => {
    test('lists every tool of the contract with its name, description, input schema and annotations', () => {
      expect(ATLAS_TOOLS).toEqual(toolsDocument.tools.map((tool) => ({
        annotations: tool.annotations,
        description: tool.description,
        inputSchema: tool.inputSchema,
        name: tool.name,
      })));
      expect(ATLAS_TOOLS).toHaveLength(16);
    });

    test('names every tool', () => {
      expect(ATLAS_TOOL_NAMES).toEqual([
        'events-filter',
        'patrols-filter',
        'open-event',
        'open-patrol',
        'subject-popup',
        'subject-track',
        'subject-at-time',
        'subject-heatmap',
        'report-heatmap',
        'subjects-visibility',
        'show-feature',
        'show-analyzer',
        'layers-search',
        'jump-to',
        'fit-bounds',
        'open-record',
      ]);
    });
  });

  describe('validateToolCall', () => {
    test.each([
      ['an unknown tool', 'delete-everything'],
      ['an inherited name', 'toString'],
      ['the removed restore-view tool', 'restore-view'],
      ['a missing name', undefined],
      ['a numeric name', 42],
    ])('rejects %s', (_, name) => {
      expect(validateToolCall(name, {})).toEqual({ message: `Unknown tool: ${String(name)}`, ok: false });
    });

    test.each([
      ['null', null],
      ['a string', 'events-filter'],
      ['an array', [{ text: 'x' }]],
    ])('rejects arguments that are %s', (_, args) => {
      expect(validateToolCall('events-filter', args)).toEqual(INVALID);
    });

    test('treats missing arguments as none', () => {
      expect(validateToolCall('events-filter', undefined)).toEqual(valid({}));
    });

    test.each(ATLAS_TOOL_NAMES)('rejects an unknown key for %s', (name) => {
      const result = validateToolCall(name, { extra: 'x' });

      expect(result.ok).toBe(false);
    });

    test('names the unknown key', () => {
      expect(validateToolCall('open-event', { extra: 'x', id: UUID })).toEqual({
        message: 'Invalid arguments for open-event: arguments must NOT have additional properties (extra)',
        ok: false,
      });
    });

    test('names the invalid argument', () => {
      expect(validateToolCall('report-heatmap', { on: 'yes' })).toEqual({
        message: 'Invalid arguments for report-heatmap: on must be boolean',
        ok: false,
      });
    });

    test('leaves out a known key whose value is undefined', () => {
      expect(validateToolCall('subject-popup', { id: UUID, track: undefined })).toEqual(valid({ id: UUID }));
    });

    test('rejects an unknown key even when its value is undefined', () => {
      expect(validateToolCall('open-event', { extra: undefined, id: UUID })).toEqual(INVALID);
    });

    test('treats a visibility mode whose value is undefined as absent', () => {
      expect(validateToolCall('subjects-visibility', { hide: undefined, only: [UUID] })).toEqual(valid({ only: [UUID] }));
    });

    test('does not hand back the caller\'s lists', () => {
      const ids = [UUID];
      const { params } = validateToolCall('subject-track', { ids });

      expect(params.ids).not.toBe(ids);
    });

    describe('events-filter', () => {
      const validate = (args) => validateToolCall('events-filter', args);

      test('returns every param, with times normalized to UTC', () => {
        expect(validate({
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
          ok: true,
          params: {
            event_types: [UUID, OTHER_UUID],
            open: true,
            priority: [300, 200],
            reported_by: [UUID],
            since: SINCE_UTC,
            sort: { dir: 'up', field: 'event_time' },
            state: 'resolved',
            text: 'snare',
            until: UNTIL_UTC,
          },
        });
      });

      test('accepts no params', () => {
        expect(validateToolCall('events-filter', {})).toEqual(valid({}));
      });

      test('accepts a null until as open-ended', () => {
        expect(validateToolCall('events-filter', { since: SINCE, until: null })).toEqual(valid({ since: SINCE_UTC, until: null }));
      });

      test('accepts an empty text, to clear the search', () => {
        expect(validateToolCall('events-filter', { text: '' })).toEqual(valid({ text: '' }));
      });

      test('removes duplicate ids, keeping the first of each', () => {
        expect(validate({ event_types: [OTHER_UUID, UUID, OTHER_UUID] }).params.event_types).toEqual([OTHER_UUID, UUID]);
      });

      test('removes duplicate priorities', () => {
        expect(validate({ priority: [300, 300] }).params.priority).toEqual([300]);
      });

      test('accepts a window that starts and ends at the same instant', () => {
        expect(validateToolCall('events-filter', { since: '2026-11-01T03:00:00+03:00', until: '2026-11-01T00:00:00Z' })).toEqual(valid());
      });

      test('compares the window by instant, not by its text', () => {
        expect(validateToolCall('events-filter', { since: '2026-11-01T02:00:00+03:00', until: '2026-11-01T00:00:00Z' })).toEqual(valid());
      });

      test('accepts a lowercase time separator and zone', () => {
        expect(validateToolCall('events-filter', { since: '2026-11-01t00:00z' })).toEqual(valid({ since: '2026-11-01T00:00:00.000Z' }));
      });

      test.each([
        ['a time without an offset', { since: '2026-11-01T00:00:00' }],
        ['a date without a time', { since: '2026-11-01' }],
        ['an impossible date', { since: '2026-13-45T00:00:00Z' }],
        ['an impossible hour', { until: '2026-11-01T25:00:00Z' }],
        ['a numeric time', { since: 1730000000000 }],
        ['a window ending before it starts', { since: UNTIL, until: SINCE }],
        ['an event type that is not a uuid', { event_types: ['snare'] }],
        ['too many event types', { event_types: uuids(MAX_FILTER_IDS + 1) }],
        ['an unknown priority', { priority: [250] }],
        ['a priority given as a word', { priority: ['red'] }],
        ['too many priorities', { priority: [0, 100, 200, 300, 300] }],
        ['an unknown state', { state: 'open' }],
        ['a state given as a list', { state: ['active'] }],
        ['a text that is too long', { text: 'a'.repeat(MAX_TEXT_LENGTH + 1) }],
        ['a text that is too long in UTF-16 units', { text: '😀'.repeat(MAX_TEXT_LENGTH / 2 + 1) }],
        ['a text that is not a string', { text: 42 }],
        ['a reporter that is not a uuid', { reported_by: ['Joseph'] }],
        ['an unknown sort field', { sort: { dir: 'up', field: 'serial_number' } }],
        ['an unknown sort direction', { sort: { dir: 'sideways', field: 'event_time' } }],
        ['a sort given as a string', { sort: 'event_time' }],
        ['a sort with an unknown key', { sort: { dir: 'up', field: 'event_time', nulls: 'last' } }],
        ['an open flag that is not a boolean', { open: 'yes' }],
      ])('rejects %s', (_, args) => {
        expect(validateToolCall('events-filter', args)).toEqual(INVALID);
      });

      test('accepts the longest text', () => {
        expect(validateToolCall('events-filter', { text: 'a'.repeat(MAX_TEXT_LENGTH) })).toEqual(valid());
      });

      test('accepts the longest text in UTF-16 units', () => {
        expect(validateToolCall('events-filter', { text: '😀'.repeat(MAX_TEXT_LENGTH / 2) })).toEqual(valid());
      });
    });

    describe('patrols-filter', () => {
      test('returns every param', () => {
        expect(validateToolCall('patrols-filter', {
          leaders: [UUID],
          open: false,
          patrol_types: [OTHER_UUID],
          since: SINCE,
          status: ['active', 'done'],
          text: 'foot',
          until: null,
        })).toEqual(valid({
          leaders: [UUID],
          open: false,
          patrol_types: [OTHER_UUID],
          since: SINCE_UTC,
          status: ['active', 'done'],
          text: 'foot',
          until: null,
        }));
      });

      test('removes duplicate statuses', () => {
        expect(validateToolCall('patrols-filter', { status: ['done', 'done'] }).params.status).toEqual(['done']);
      });

      test.each([
        ['an unknown status', { status: ['scheduled'] }],
        ['a status given as a string', { status: 'active' }],
        ['a leader that is not a uuid', { leaders: ['Ranger X'] }],
        ['a patrol type that is not a uuid', { patrol_types: ['foot'] }],
        ['a window ending before it starts', { since: UNTIL, until: SINCE }],
        ['a text that is too long', { text: 'a'.repeat(MAX_TEXT_LENGTH + 1) }],
      ])('rejects %s', (_, args) => {
        expect(validateToolCall('patrols-filter', args)).toEqual(INVALID);
      });
    });

    describe.each(['open-event', 'open-patrol', 'show-feature', 'show-analyzer'])('%s', (name) => {
      test('returns the id', () => {
        expect(validateToolCall(name, { id: UUID })).toEqual(valid({ id: UUID }));
      });

      test('accepts an uppercase uuid', () => {
        expect(validateToolCall(name, { id: UUID.toUpperCase() })).toEqual(valid({ id: UUID.toUpperCase() }));
      });

      test.each([
        ['a missing id', {}],
        ['an id that is not a uuid', { id: '1042' }],
        ['a numeric id', { id: 1042 }],
      ])('rejects %s', (_, args) => {
        expect(validateToolCall(name, args)).toEqual(INVALID);
      });
    });

    describe('subject-popup', () => {
      test('returns the id and track flag', () => {
        expect(validateToolCall('subject-popup', { id: UUID, track: true })).toEqual(valid({ id: UUID, track: true }));
      });

      test('rejects a track flag that is not a boolean', () => {
        expect(validateToolCall('subject-popup', { id: UUID, track: 1 })).toEqual(INVALID);
      });

      test('rejects a missing id', () => {
        expect(validateToolCall('subject-popup', {})).toEqual(INVALID);
      });
    });

    describe.each([
      ['subject-track', MAX_TRACK_SUBJECTS],
      ['subject-heatmap', MAX_HEATMAP_SUBJECTS],
    ])('%s', (name, maxSubjects) => {
      test('returns the ids and window', () => {
        expect(validateToolCall(name, { ids: [UUID], since: SINCE, until: UNTIL })).toEqual(valid({ ids: [UUID], since: SINCE_UTC, until: UNTIL_UTC }));
      });

      test('removes duplicate ids', () => {
        expect(validateToolCall(name, { ids: [UUID, UUID] }).params.ids).toEqual([UUID]);
      });

      test('accepts the largest number of ids', () => {
        expect(validateToolCall(name, { ids: uuids(maxSubjects) })).toEqual(valid());
      });

      test.each([
        ['missing ids', {}],
        ['no ids', { ids: [] }],
        ['too many ids', { ids: uuids(maxSubjects + 1) }],
        ['an id that is not a uuid', { ids: ['Kito'] }],
        ['a window ending before it starts', { ids: [UUID], since: UNTIL, until: SINCE }],
        ['a since without an offset', { ids: [UUID], since: '2026-11-01T00:00' }],
      ])('rejects %s', (_, args) => {
        expect(validateToolCall(name, args)).toEqual(INVALID);
      });
    });

    describe('subject-at-time', () => {
      test('returns the id and time', () => {
        expect(validateToolCall('subject-at-time', { id: UUID, time: UNTIL })).toEqual(valid({ id: UUID, time: UNTIL_UTC }));
      });

      test.each([
        ['a missing time', { id: UUID }],
        ['a null time', { id: UUID, time: null }],
        ['a time without an offset', { id: UUID, time: '2026-11-03T14:00' }],
        ['a time that is not a real instant', { id: UUID, time: '2026-13-03T14:00Z' }],
        ['a missing id', { time: UNTIL }],
      ])('rejects %s', (_, args) => {
        expect(validateToolCall('subject-at-time', args)).toEqual(INVALID);
      });
    });

    describe('report-heatmap', () => {
      test.each([true, false])('returns on: %s', (on) => {
        expect(validateToolCall('report-heatmap', { on })).toEqual(valid({ on }));
      });

      test.each([
        ['a missing flag', {}],
        ['a flag that is not a boolean', { on: 'true' }],
      ])('rejects %s', (_, args) => {
        expect(validateToolCall('report-heatmap', args)).toEqual(INVALID);
      });
    });

    describe('subjects-visibility', () => {
      test.each(['only', 'hide', 'show'])('returns the %s ids', (mode) => {
        expect(validateToolCall('subjects-visibility', { [mode]: [UUID] })).toEqual(valid({ [mode]: [UUID] }));
      });

      test('accepts the largest number of ids', () => {
        expect(validateToolCall('subjects-visibility', { hide: uuids(MAX_VISIBILITY_SUBJECTS) })).toEqual(valid());
      });

      test('removes duplicate ids', () => {
        expect(validateToolCall('subjects-visibility', { only: [UUID, UUID] }).params.only).toEqual([UUID]);
      });

      test.each([
        ['no mode', {}],
        ['two modes', { hide: [UUID], show: [OTHER_UUID] }],
        ['an empty list', { only: [] }],
        ['too many ids', { show: uuids(MAX_VISIBILITY_SUBJECTS + 1) }],
        ['an id that is not a uuid', { only: ['Rhinos'] }],
      ])('rejects %s', (_, args) => {
        expect(validateToolCall('subjects-visibility', args)).toEqual(INVALID);
      });
    });

    describe('layers-search', () => {
      test('returns the text and tab', () => {
        expect(validateToolCall('layers-search', { tab: 'features', text: 'boma' })).toEqual(valid({ tab: 'features', text: 'boma' }));
      });

      test('accepts an empty text', () => {
        expect(validateToolCall('layers-search', { text: '' })).toEqual(valid({ text: '' }));
      });

      test.each([
        ['a missing text', { tab: 'subjects' }],
        ['a text that is too long', { text: 'a'.repeat(MAX_TEXT_LENGTH + 1) }],
        ['an unknown tab', { tab: 'events', text: 'x' }],
      ])('rejects %s', (_, args) => {
        expect(validateToolCall('layers-search', args)).toEqual(INVALID);
      });
    });

    describe('jump-to', () => {
      test('returns the coordinates', () => {
        expect(validateToolCall('jump-to', { coordinates: [36.8, -1.3] })).toEqual(valid({ coordinates: [36.8, -1.3] }));
      });

      test('returns the zoom when present', () => {
        expect(validateToolCall('jump-to', { coordinates: [36.8, -1.3], zoom: 12 })).toEqual(valid({ coordinates: [36.8, -1.3], zoom: 12 }));
      });

      test('keeps repeated coordinates', () => {
        expect(validateToolCall('jump-to', { coordinates: [1, 1] })).toEqual(valid({ coordinates: [1, 1] }));
      });

      test.each([0, 22])('accepts the zoom bound %s', (zoom) => {
        expect(validateToolCall('jump-to', { coordinates: [0, 0], zoom })).toEqual(valid());
      });

      test.each([
        ['missing coordinates', {}],
        ['coordinates that are not an array', { coordinates: '1,2' }],
        ['a single coordinate', { coordinates: [1] }],
        ['three coordinates', { coordinates: [1, 2, 3] }],
        ['a string coordinate', { coordinates: ['1', 2] }],
        ['a NaN coordinate', { coordinates: [NaN, 2] }],
        ['an infinite coordinate', { coordinates: [Infinity, 2] }],
        ['a longitude above 180', { coordinates: [180.1, 0] }],
        ['a longitude below -180', { coordinates: [-180.1, 0] }],
        ['a latitude above 90', { coordinates: [0, 90.1] }],
        ['a latitude below -90', { coordinates: [0, -90.1] }],
        ['a zoom below 0', { coordinates: [0, 0], zoom: -1 }],
        ['a zoom above 22', { coordinates: [0, 0], zoom: 22.1 }],
        ['a string zoom', { coordinates: [0, 0], zoom: '10' }],
        ['a null zoom', { coordinates: [0, 0], zoom: null }],
        ['an infinite zoom', { coordinates: [0, 0], zoom: Infinity }],
        ['a NaN zoom', { coordinates: [0, 0], zoom: NaN }],
      ])('rejects %s', (_, args) => {
        expect(validateToolCall('jump-to', args)).toEqual(INVALID);
      });
    });

    describe('fit-bounds', () => {
      test('returns the bbox', () => {
        expect(validateToolCall('fit-bounds', { bbox: [-10, -5, 10, 5] })).toEqual(valid({ bbox: [-10, -5, 10, 5] }));
      });

      test('accepts a bbox without area', () => {
        expect(validateToolCall('fit-bounds', { bbox: [1, 2, 1, 2] })).toEqual(valid({ bbox: [1, 2, 1, 2] }));
      });

      test.each([
        ['a missing bbox', {}],
        ['a bbox that is not an array', { bbox: '-10,-5,10,5' }],
        ['a bbox with three values', { bbox: [-10, -5, 10] }],
        ['a bbox with five values', { bbox: [-10, -5, 10, 5, 0] }],
        ['a non-numeric value', { bbox: [-10, '-5', 10, 5] }],
        ['a NaN value', { bbox: [-10, NaN, 10, 5] }],
        ['a west out of range', { bbox: [-181, -5, 10, 5] }],
        ['an east out of range', { bbox: [-10, -5, 181, 5] }],
        ['a south out of range', { bbox: [-10, -91, 10, 5] }],
        ['a north out of range', { bbox: [-10, -5, 10, 91] }],
        ['a west greater than east', { bbox: [10, -5, -10, 5] }],
        ['a south greater than north', { bbox: [-10, 5, 10, -5] }],
      ])('rejects %s', (_, args) => {
        expect(validateToolCall('fit-bounds', args)).toEqual(INVALID);
      });
    });

    describe('open-record', () => {
      test.each(['event', 'patrol'])('returns a %s record', (erType) => {
        expect(validateToolCall('open-record', { er_type: erType, id: UUID })).toEqual(valid({ er_type: erType, id: UUID }));
      });

      test('accepts an uppercase uuid', () => {
        expect(validateToolCall('open-record', { er_type: 'event', id: UUID.toUpperCase() })).toEqual(valid());
      });

      test.each([
        ['an unknown record type', { er_type: 'subject', id: UUID }],
        ['a missing record type', { id: UUID }],
        ['a missing id', { er_type: 'event' }],
        ['a numeric id', { er_type: 'event', id: 123 }],
        ['an id that is not a uuid', { er_type: 'event', id: 'abc' }],
        ['an id with a path', { er_type: 'event', id: `${UUID}/../settings` }],
        ['an id with surrounding text', { er_type: 'event', id: ` ${UUID}` }],
      ])('rejects %s', (_, args) => {
        expect(validateToolCall('open-record', args)).toEqual(INVALID);
      });
    });
  });
});
