import { addMinutes } from 'date-fns';

import {
  actualEndTimeForPatrol,
  calcPatrolState,
  createNewPatrolForPatrolType,
  DELTA_FOR_OVERDUE,
  displayEndTimeForPatrol,
  displayEndTimeForPatrolSegment,
  displayNameForPatrolType,
  displayStartTimeForPatrol,
  displayStartTimeForPatrolSegment,
  displayTitleForPatrol,
  effectiveEndTimeForPatrol,
  extractLegPatrolPoints,
  finalizeCombinedPatrolPoints,
  getActivePatrolsForLeaderId,
  getBoundsForPatrol,
  getCancellationTimeForPatrol,
  getElapsedTimeForPatrol,
  getPatrolLocationCoordinates,
  getPatrolsForLeaderId,
  getPausedTimeForPatrol,
  getReportsForPatrol,
  getTrackedSubjectsForPatrolSegment,
  iconIdForPatrolSegment,
  iconIdForPatrolType,
  iconTypeForPatrol,
  getIsMobilePatrol,
  PATROL_SAVE_ACTIONS,
  sortPatrolList
} from './patrols';
import { PATROL_UI_STATES } from '../constants';
import {
  newPatrol,
  readyToStartPatrol,
  scheduledPatrol,
  activePatrol,
  overduePatrol,
  donePatrol,
  cancelledPatrol,
  multiLegPatrol,
} from '../__test-helpers/fixtures/patrols';
import patrolTypes, { dogPatrol, routinePatrol } from '../__test-helpers/fixtures/patrol-types';
import store from '../store';
import { uploadPatrolFile } from '../ducks/patrols';

jest.mock('../store', () => ({ dispatch: jest.fn(), getState: jest.fn() }));

jest.mock('../ducks/patrols', () => ({
  addNoteToPatrol: jest.fn(),
  createPatrol: jest.fn(),
  updatePatrol: jest.fn(),
  uploadPatrolFile: jest.fn(),
}));

const { SCHEDULED, READY_TO_START, ACTIVE, START_OVERDUE, DONE, CANCELLED, INVALID } = PATROL_UI_STATES;

describe('Patrols utils', () => {
  beforeEach(() => {
    store.getState.mockReturnValue({
      data: {
        eventSchemas: { globalSchema: null },
        patrolStore: {},
        patrolTypes: [],
      },
    });
  });

  afterEach(() => {
    store.getState.mockReset();
  });


  describe('calcPatrolState', () => {
    test('returns scheduled for a patrol that has scheduled_start but no value in time_range properties', () => {
      expect(calcPatrolState(scheduledPatrol)).toBe(SCHEDULED);
    });

    test('returns ready to start for patrols with time range in the same current day but few hours previous current time', () => {
      expect(calcPatrolState(readyToStartPatrol)).toBe(READY_TO_START);
    });

    test('returns ready to start for patrols with scheduled start in the past, before overdue delta', () => {
      const now = new Date();
      readyToStartPatrol.patrol_segments[0].scheduled_start = addMinutes(now, DELTA_FOR_OVERDUE - 1);

      expect(calcPatrolState(readyToStartPatrol)).toBe(READY_TO_START);
    });

    test('returns active for patrols with time range between actual date', () => {
      expect(calcPatrolState(activePatrol)).toBe(ACTIVE);
    });

    test('return overdue for patrols with overdue segment', () => {
      expect(calcPatrolState(overduePatrol)).toBe(START_OVERDUE);
    });

    test('return done for patrols with done as state', () => {
      expect(calcPatrolState(donePatrol)).toBe(DONE);
    });

    test('returns cancelled for patrols with cancelled as state', () => {
      expect(calcPatrolState(cancelledPatrol)).toBe(CANCELLED);
    });

    test('returns invalid for patrols without segments', () => {
      const patrolWithoutSegments = { ...newPatrol, ...{ patrol_segments: [] } };
      expect(calcPatrolState(patrolWithoutSegments)).toBe(INVALID);
    });

    test('returns active for a multi-leg patrol whose earlier leg has ended but whose latest leg is still active', () => {
      expect(calcPatrolState(multiLegPatrol)).toBe(ACTIVE);
    });
  });

  describe('createNewPatrolForPatrolType', () => {
    const data = {
      location: {
        latitude: 0.20972935311753815,
        longitude: 37.414685045175275
      },
      reportedById: 'reportedById',
      time: new Date(2020, 1),
    };

    test('returns a new patrol from a type', () => {
      expect(createNewPatrolForPatrolType(patrolTypes[0], data)).toMatchObject({
        files: [],
        icon_id: 'suspicious_person_rep',
        is_collection: false,
        notes: [],
        patrol_segments: [{
          end_location: null,
          events: [],
          leader: null,
          patrol_type: 'The_Don_Patrol',
          priority: 0,
          scheduled_start: null,
          start_location: {
            latitude: 0.20972935311753815,
            longitude: 37.414685045175275,
          },
          time_range: {
            start_time: new Date(2020, 1),
            end_time: null,
          },
        }],
        priority: 0,
        title: null,
      });
    });

    test('returns a new patrol with automatic start off', () => {
      expect(createNewPatrolForPatrolType(patrolTypes[0], data, false)).toMatchObject({
        patrol_segments: [{
          patrol_type: 'The_Don_Patrol',
          scheduled_start: new Date(2020, 1),
          time_range: { start_time: null },
        }],
      });
    });
  });

  describe('sortPatrolList', () => {

    const modifyPatrolUpdatesTime = (patrol, updateTime) => {
      const { patrol_segments } = patrol;
      const [firstLeg] = patrol_segments;
      const { updates } = firstLeg;
      const [update] = updates;
      return {
        ...patrol,
        patrol_segments: [{
          ...firstLeg,
          updates: [{
            ...update,
            time: updateTime
          }]
        }]
      };
    };

    test('should return patrols in correct sort', async () => {
      const donePatrolUpdateTime = '2023-06-18T22:12:24.207505+00:00';
      const donePatrolWithLatestUpdate = modifyPatrolUpdatesTime(donePatrol, donePatrolUpdateTime);

      const scheduledPatrolUpdateTime = '2023-06-20T22:12:24.207505+00:00';
      const scheduledPatrolWithLatestUpdate = modifyPatrolUpdatesTime(scheduledPatrol, scheduledPatrolUpdateTime);

      const cancelledPatrolUpdateTime = '2023-06-21T22:12:24.207505+00:00';
      const cancelledPatrolWithLatestUpdate = modifyPatrolUpdatesTime(cancelledPatrol, cancelledPatrolUpdateTime);

      const unorderedPatrols = [donePatrol, scheduledPatrol, activePatrol, cancelledPatrol, overduePatrol, readyToStartPatrol, cancelledPatrolWithLatestUpdate, donePatrolWithLatestUpdate, scheduledPatrolWithLatestUpdate ];
      const expectedPatrolStateOrder = [READY_TO_START, START_OVERDUE, ACTIVE, SCHEDULED, SCHEDULED, DONE, DONE, CANCELLED, CANCELLED];
      const sortedPatrols = await sortPatrolList(unorderedPatrols);

      sortedPatrols.forEach((patrol, index) =>
        expect(calcPatrolState(patrol)).toBe(expectedPatrolStateOrder[index])
      );

      const [,,, mostRecentScheduledPatrol,, mostRecentDonePatrol,, mostRecentCancelledPatrol] = sortedPatrols;

      expect(mostRecentScheduledPatrol.patrol_segments[0].updates[0].time).toBe(scheduledPatrolUpdateTime);
      expect(mostRecentDonePatrol.patrol_segments[0].updates[0].time).toBe(donePatrolUpdateTime);
      expect(mostRecentCancelledPatrol.patrol_segments[0].updates[0].time).toBe(cancelledPatrolUpdateTime);
    });

    test('uses the most recent update across every leg, not only the first, to break ties', async () => {
      const [firstLeg] = donePatrol.patrol_segments;

      const recentlyContinuedDonePatrol = {
        ...donePatrol,
        patrol_segments: [
          { ...firstLeg, updates: [{ ...firstLeg.updates[0], time: '2023-01-01T00:00:00.000Z' }] },
          { ...firstLeg, updates: [{ ...firstLeg.updates[0], time: '2023-06-25T00:00:00.000Z' }] },
        ],
      };
      const staleDonePatrol = modifyPatrolUpdatesTime(donePatrol, '2023-06-18T22:12:24.207505+00:00');

      const [mostRecent] = await sortPatrolList([staleDonePatrol, recentlyContinuedDonePatrol]);

      expect(mostRecent).toBe(recentlyContinuedDonePatrol);
    });
  });

  describe('getBoundsForPatrol', () => {
    const trackDataWithLine = (coordinates) => ({
      track: {
        type: 'FeatureCollection',
        features: [{ type: 'Feature', geometry: { type: 'LineString', coordinates }, properties: {} }],
      },
    });

    test('returns null when the patrol has no segments', () => {
      const patrol = { patrol_segments: [] };

      expect(getBoundsForPatrol(patrol, { startStopGeometries: null, trackData: null })).toBeNull();
    });

    test('returns null when there is no geo data to display', () => {
      const patrol = { patrol_segments: [{ time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' } }] };

      expect(getBoundsForPatrol(patrol, { startStopGeometries: null, trackData: null })).toBeNull();
    });

    test('includes the leader live position while its leg is still active', () => {
      const patrol = {
        patrol_segments: [{
          events: [],
          leader: { last_position: { type: 'Feature', geometry: { type: 'Point', coordinates: [50, 50] } } },
          time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' },
        }],
      };

      const bounds = getBoundsForPatrol(patrol, {
        startStopGeometries: null,
        trackData: trackDataWithLine([[0, 0], [1, 1]]),
      });

      expect(bounds).toEqual([0, 0, 50, 50]);
    });

    test('excludes the leader live position once its leg has finished', () => {
      const patrol = {
        patrol_segments: [{
          events: [],
          leader: { last_position: { type: 'Feature', geometry: { type: 'Point', coordinates: [50, 50] } } },
          time_range: { end_time: '2022-06-15T11:00:00.000Z', start_time: '2022-06-15T10:00:00.000Z' },
        }],
      };

      const bounds = getBoundsForPatrol(patrol, {
        startStopGeometries: null,
        trackData: trackDataWithLine([[0, 0], [1, 1]]),
      });

      expect(bounds).toEqual([0, 0, 1, 1]);
    });

    test('excludes the leader live position once the patrol is marked done, even when its leg has no end time', () => {
      const patrol = {
        state: 'done',
        patrol_segments: [{
          events: [],
          leader: { last_position: { type: 'Feature', geometry: { type: 'Point', coordinates: [50, 50] } } },
          time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' },
        }],
      };

      const bounds = getBoundsForPatrol(patrol, {
        startStopGeometries: null,
        trackData: trackDataWithLine([[0, 0], [1, 1]]),
      });

      expect(bounds).toEqual([0, 0, 1, 1]);
    });

    test('excludes the leader live position once the patrol is marked cancelled, even when its leg has no end time', () => {
      const patrol = {
        state: 'cancelled',
        patrol_segments: [{
          events: [],
          leader: { last_position: { type: 'Feature', geometry: { type: 'Point', coordinates: [50, 50] } } },
          time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' },
        }],
      };

      const bounds = getBoundsForPatrol(patrol, {
        startStopGeometries: null,
        trackData: trackDataWithLine([[0, 0], [1, 1]]),
      });

      expect(bounds).toEqual([0, 0, 1, 1]);
    });

    test('combines events from every leg, and only the last (currently active) leg leader contributes its position', () => {
      const finishedLegLeader = { last_position: { type: 'Feature', geometry: { type: 'Point', coordinates: [90, 90] } } };
      const activeLegLeader = { last_position: { type: 'Feature', geometry: { type: 'Point', coordinates: [5, 5] } } };

      const patrol = {
        patrol_segments: [
          {
            events: [{ geojson: { type: 'Feature', geometry: { type: 'Point', coordinates: [-10, -10] } } }],
            leader: finishedLegLeader,
            time_range: { end_time: '2022-06-15T09:00:00.000Z', start_time: '2022-06-15T08:00:00.000Z' },
          },
          {
            events: [{ geojson: { type: 'Feature', geometry: { type: 'Point', coordinates: [10, 10] } } }],
            leader: activeLegLeader,
            time_range: { end_time: null, start_time: '2022-06-15T09:00:00.000Z' },
          },
        ],
      };

      const bounds = getBoundsForPatrol(patrol, {
        startStopGeometries: null,
        trackData: trackDataWithLine([[0, 0], [1, 1]]),
      });

      // The finished leg's leader position at [90, 90] must not stretch the bounds.
      expect(bounds).toEqual([-10, -10, 10, 10]);
    });
  });

  describe('extractLegPatrolPoints', () => {
    test('returns null when the leg has neither an explicit location nor track data', () => {
      const segment = {
        end_location: null,
        icon_id: 'icon',
        start_location: null,
        time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' },
      };

      expect(extractLegPatrolPoints(segment, null, null, null, true)).toBeNull();
    });

    test('uses the segment start_location for the start marker when set', () => {
      const segment = {
        end_location: null,
        icon_id: 'icon',
        start_location: { latitude: 1, longitude: 2 },
        time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' },
      };

      const points = extractLegPatrolPoints(segment, null, null, null, true);

      expect(points.start_location.geometry.coordinates).toEqual([2, 1]);
      expect(points.start_location.properties.title).toBe('Patrol Start');
      expect(points.end_location).toBeNull();
    });

    test('does not compute an end marker while the leg is still active', () => {
      const segment = {
        end_location: { latitude: 3, longitude: 4 },
        icon_id: 'icon',
        start_location: { latitude: 1, longitude: 2 },
        time_range: { end_time: '2022-06-15T11:00:00.000Z', start_time: '2022-06-15T10:00:00.000Z' },
      };

      const points = extractLegPatrolPoints(segment, null, null, null, true);

      expect(points.end_location).toBeNull();
    });

    test('uses the segment end_location for the end marker once the leg is no longer active', () => {
      const segment = {
        end_location: { latitude: 3, longitude: 4 },
        icon_id: 'icon',
        start_location: { latitude: 1, longitude: 2 },
        time_range: { end_time: '2022-06-15T11:00:00.000Z', start_time: '2022-06-15T10:00:00.000Z' },
      };

      const points = extractLegPatrolPoints(segment, null, null, null, false);

      expect(points.end_location.geometry.coordinates).toEqual([4, 3]);
      expect(points.end_location.properties.title).toBe('Patrol End');
    });

    test('infers the start marker from the earliest track point and uses its stroke', () => {
      const segment = {
        end_location: null,
        icon_id: 'icon',
        start_location: null,
        time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' },
      };
      const legTrackData = {
        points: {
          features: [
            { geometry: { coordinates: [9, 9] }, properties: { stroke: '#123456', time: '2022-06-15T11:00:00.000Z' } },
            { geometry: { coordinates: [1, 1] }, properties: { time: '2022-06-15T10:00:00.000Z' } },
          ],
        },
      };

      const points = extractLegPatrolPoints(segment, null, legTrackData, null, true);

      expect(points.start_location.geometry.coordinates).toEqual([1, 1]);
      expect(points.start_location.properties.title).toBe('Patrol Start');
      expect(points.start_location.properties.stroke).toBe('#123456');
    });

    test('marks the inferred start marker as estimated when the earliest track point does not match the segment start time', () => {
      const segment = {
        end_location: null,
        icon_id: 'icon',
        start_location: null,
        time_range: { end_time: null, start_time: '2022-06-15T09:00:00.000Z' },
      };
      const legTrackData = {
        points: {
          features: [
            { geometry: { coordinates: [9, 9] }, properties: { time: '2022-06-15T11:00:00.000Z' } },
            { geometry: { coordinates: [1, 1] }, properties: { time: '2022-06-15T10:00:00.000Z' } },
          ],
        },
      };

      const points = extractLegPatrolPoints(segment, null, legTrackData, null, true);

      expect(points.start_location.properties.title).toBe('Patrol Start (Est)');
    });

    test('infers the end marker from the latest track point once the leg is no longer active', () => {
      const segment = {
        end_location: null,
        icon_id: 'icon',
        start_location: null,
        time_range: { end_time: '2022-06-15T11:00:00.000Z', start_time: '2022-06-15T10:00:00.000Z' },
      };
      const legTrackData = {
        points: {
          features: [
            { geometry: { coordinates: [9, 9] }, properties: { time: '2022-06-15T11:00:00.000Z' } },
            { geometry: { coordinates: [1, 1] }, properties: { time: '2022-06-15T10:00:00.000Z' } },
          ],
        },
      };

      const points = extractLegPatrolPoints(segment, null, legTrackData, null, false);

      expect(points.end_location.geometry.coordinates).toEqual([9, 9]);
      expect(points.end_location.properties.title).toBe('Patrol End');
    });

    test('uses a later raw track point instead of the trimmed data\'s own last point when it lines up closer to the segment end time', () => {
      const segment = {
        end_location: null,
        icon_id: 'icon',
        start_location: null,
        time_range: { end_time: '2022-06-15T11:50:00.000Z', start_time: '2022-06-15T10:00:00.000Z' },
      };
      const legTrackData = {
        indices: { until: 2 },
        points: {
          features: [
            { geometry: { coordinates: [9, 9] }, properties: { time: '2022-06-15T11:00:00.000Z' } },
            { geometry: { coordinates: [1, 1] }, properties: { time: '2022-06-15T10:00:00.000Z' } },
          ],
        },
      };
      const rawLegTrackData = {
        points: {
          features: [
            { geometry: { coordinates: [20, 20] }, properties: { time: '2022-06-15T12:30:00.000Z' } },
            { geometry: { coordinates: [15, 15] }, properties: { time: '2022-06-15T12:00:00.000Z' } },
            { geometry: { coordinates: [9, 9] }, properties: { time: '2022-06-15T11:00:00.000Z' } },
            { geometry: { coordinates: [1, 1] }, properties: { time: '2022-06-15T10:00:00.000Z' } },
          ],
        },
      };

      const points = extractLegPatrolPoints(segment, null, legTrackData, rawLegTrackData, false);

      expect(points.end_location.geometry.coordinates).toEqual([15, 15]);
      expect(points.end_location.properties.title).toBe('Patrol End (Est)');
    });

    test('falls back to the leader\'s last known stroke when the track has no stroke of its own', () => {
      const segment = {
        end_location: null,
        icon_id: 'icon',
        start_location: { latitude: 1, longitude: 2 },
        time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' },
      };
      const leader = { last_position: { properties: { stroke: '#654321' } } };
      const legTrackData = { points: { features: [] } };

      const points = extractLegPatrolPoints(segment, leader, legTrackData, null, true);

      expect(points.start_location.properties.stroke).toBe('#654321');
    });

    test('falls back to the leader\'s additional rgb color when there is no other stroke source', () => {
      const segment = {
        end_location: null,
        icon_id: 'icon',
        start_location: { latitude: 1, longitude: 2 },
        time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' },
      };
      const leader = { additional: { rgb: '10,20,30' } };
      const legTrackData = { points: { features: [] } };

      const points = extractLegPatrolPoints(segment, leader, legTrackData, null, true);

      expect(points.start_location.properties.stroke).toBe('rgb(10,20,30)');
    });

    test('falls back to the default stroke when no stroke source is available', () => {
      const segment = {
        end_location: null,
        icon_id: 'icon',
        start_location: { latitude: 1, longitude: 2 },
        time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' },
      };

      const points = extractLegPatrolPoints(segment, null, null, null, true);

      expect(points.start_location.properties.stroke).toBe('#FF0080');
    });
  });

  describe('finalizeCombinedPatrolPoints', () => {
    const patrolDone = { patrol_segments: [{ time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' } }], state: 'done' };
    const patrolOpen = { patrol_segments: [{ time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' } }], state: 'open' };
    const startLocation = () => ({ geometry: { coordinates: [1, 2], type: 'Point' }, properties: { title: 'Patrol Start' }, type: 'Feature' });

    test('folds an estimated end marker into the start marker when the patrol is done but has no end marker', () => {
      // The estimated end is cloned from the start, so it's always at the same coordinates -
      // the very next check merges same-spot markers, collapsing this into a single marker.
      const result = finalizeCombinedPatrolPoints(patrolDone, { end_location: null, start_location: startLocation() });

      expect(result.end_location).toBeUndefined();
      expect(result.start_location.properties.title).toBe('Patrol Start & Patrol End (Est)');
    });

    test('does not invent an end marker for a patrol that is not done', () => {
      const result = finalizeCombinedPatrolPoints(patrolOpen, { end_location: null, start_location: startLocation() });

      expect(result.end_location).toBeNull();
    });

    test('merges start and end into a single marker when they land on the same spot', () => {
      const endLocation = { geometry: { coordinates: [1, 2], type: 'Point' }, properties: { title: 'Patrol End' }, type: 'Feature' };

      const result = finalizeCombinedPatrolPoints(patrolDone, { end_location: endLocation, start_location: startLocation() });

      expect(result.end_location).toBeUndefined();
      expect(result.start_location.properties.title).toBe('Patrol Start & Patrol End');
    });
  });

  describe('getPatrolLocationCoordinates', () => {
    test('returns the last patrol track coordinates when there is track data', () => {
      const patrolTrackData = {
        trackData: {
          points: {
            type: 'FeatureCollection',
            features: [{ type: 'Feature', geometry: { type: 'Point', coordinates: [37.482, 0.232] } }],
          },
        },
        startStopGeometries: {
          points: { start_location: { type: 'Feature', geometry: { type: 'Point', coordinates: [37.472, 0.226] } } },
        },
      };

      expect(getPatrolLocationCoordinates(patrolTrackData)).toEqual([37.482, 0.232]);
    });

    test('falls back to the patrol start location when there is no track data', () => {
      const patrolTrackData = {
        trackData: null,
        startStopGeometries: {
          points: { start_location: { type: 'Feature', geometry: { type: 'Point', coordinates: [37.472, 0.226] } } },
        },
      };

      expect(getPatrolLocationCoordinates(patrolTrackData)).toEqual([37.472, 0.226]);
    });

    test('returns null when there is neither track data nor a start location', () => {
      expect(getPatrolLocationCoordinates({ trackData: null, startStopGeometries: null })).toBeNull();
      expect(getPatrolLocationCoordinates()).toBeNull();
    });
  });

  describe('getIsMobilePatrol', () => {
    test('returns true when the provenance is "mobile"', () => {
      expect(getIsMobilePatrol({ provenance: 'mobile' })).toBe(true);
    });

    test('returns false for any other provenance', () => {
      expect(getIsMobilePatrol({ provenance: 'web' })).toBe(false);
      expect(getIsMobilePatrol({ provenance: 'ER Mobile' })).toBe(false);
      expect(getIsMobilePatrol({ provenance: '' })).toBe(false);
    });

    test('returns false when the patrol has no provenance', () => {
      expect(getIsMobilePatrol({})).toBe(false);
      expect(getIsMobilePatrol(undefined)).toBe(false);
    });
  });

  describe('displayNameForPatrolType', () => {
    test('returns the display name for a type matched by value', () => {
      expect(displayNameForPatrolType(patrolTypes, routinePatrol.value)).toBe('Routine Patrol');
    });

    test('returns the display name for a type matched by id', () => {
      expect(displayNameForPatrolType(patrolTypes, dogPatrol.id)).toBe('Dog Patrol');
    });

    test('returns null when no type matches', () => {
      expect(displayNameForPatrolType(patrolTypes, 'unknown_type')).toBeNull();
    });

    test('returns null when there are no patrol types', () => {
      expect(displayNameForPatrolType(undefined, routinePatrol.value)).toBeNull();
    });
  });

  describe('iconIdForPatrolType', () => {
    test('returns the icon id for a matching type', () => {
      expect(iconIdForPatrolType(patrolTypes, dogPatrol.value)).toBe('dog-patrol-icon');
    });

    test('returns null when no type matches', () => {
      expect(iconIdForPatrolType(patrolTypes, 'unknown_type')).toBeNull();
    });
  });

  describe('iconIdForPatrolSegment', () => {
    test('uses the icon id from the matching patrol type over the segment\'s own icon id', () => {
      const segment = { patrol_type: routinePatrol.value, icon_id: 'segment-icon' };

      expect(iconIdForPatrolSegment(patrolTypes, segment)).toBe('routine-patrol-icon');
    });

    test('falls back to the segment\'s own icon id when no type matches', () => {
      const segment = { patrol_type: 'unknown_type', icon_id: 'segment-icon' };

      expect(iconIdForPatrolSegment(patrolTypes, segment)).toBe('segment-icon');
    });

    test('returns null when neither the type nor the segment has an icon id', () => {
      const segment = { patrol_type: 'unknown_type', icon_id: null };

      expect(iconIdForPatrolSegment(patrolTypes, segment)).toBeNull();
    });
  });

  describe('displayStartTimeForPatrolSegment', () => {
    test('returns the time_range start_time when set', () => {
      const segment = { scheduled_start: '2022-06-01T00:00:00.000Z', time_range: { start_time: '2022-06-15T10:00:00.000Z' } };

      expect(displayStartTimeForPatrolSegment(segment)).toEqual(new Date('2022-06-15T10:00:00.000Z'));
    });

    test('falls back to scheduled_start when there is no start_time', () => {
      const segment = { scheduled_start: '2022-06-01T00:00:00.000Z', time_range: {} };

      expect(displayStartTimeForPatrolSegment(segment)).toEqual(new Date('2022-06-01T00:00:00.000Z'));
    });

    test('returns null when neither start_time nor scheduled_start is set', () => {
      const segment = { time_range: {} };

      expect(displayStartTimeForPatrolSegment(segment)).toBeNull();
    });
  });

  describe('displayStartTimeForPatrol', () => {
    test('returns null when the patrol has no segments', () => {
      expect(displayStartTimeForPatrol({ patrol_segments: [] })).toBeNull();
    });

    test('uses the first segment\'s start time', () => {
      const patrol = { patrol_segments: [{ time_range: { start_time: '2022-06-15T10:00:00.000Z' } }] };

      expect(displayStartTimeForPatrol(patrol)).toEqual(new Date('2022-06-15T10:00:00.000Z'));
    });
  });

  describe('displayEndTimeForPatrolSegment', () => {
    test('returns the time_range end_time when set', () => {
      const segment = { scheduled_end: '2022-06-01T00:00:00.000Z', time_range: { end_time: '2022-06-15T11:00:00.000Z' } };

      expect(displayEndTimeForPatrolSegment(segment)).toEqual(new Date('2022-06-15T11:00:00.000Z'));
    });

    test('falls back to scheduled_end when there is no end_time', () => {
      const segment = { scheduled_end: '2022-06-01T00:00:00.000Z', time_range: {} };

      expect(displayEndTimeForPatrolSegment(segment)).toEqual(new Date('2022-06-01T00:00:00.000Z'));
    });

    test('returns null when neither end_time nor scheduled_end is set', () => {
      const segment = { time_range: {} };

      expect(displayEndTimeForPatrolSegment(segment)).toBeNull();
    });
  });

  describe('displayEndTimeForPatrol', () => {
    test('returns null when the patrol has no segments', () => {
      expect(displayEndTimeForPatrol({ patrol_segments: [] })).toBeNull();
    });

    test('uses the last segment\'s end time', () => {
      const patrol = { patrol_segments: [{ time_range: { end_time: '2022-06-15T11:00:00.000Z' } }] };

      expect(displayEndTimeForPatrol(patrol)).toEqual(new Date('2022-06-15T11:00:00.000Z'));
    });

    test('uses the last segment\'s end time for a multi-leg patrol, not the first', () => {
      const patrol = {
        patrol_segments: [
          { time_range: { end_time: '2022-06-15T11:00:00.000Z' } },
          { time_range: { end_time: null } },
        ],
      };

      expect(displayEndTimeForPatrol(patrol)).toBeNull();
    });
  });

  describe('actualEndTimeForPatrol', () => {
    test('returns null when the patrol has no segments', () => {
      expect(actualEndTimeForPatrol({ patrol_segments: [] })).toBeNull();
    });

    test('returns null for a multi-leg patrol whose last leg is still ongoing, even though an earlier leg has ended', () => {
      const patrol = {
        patrol_segments: [
          { time_range: { end_time: '2022-06-15T11:00:00.000Z', start_time: '2022-06-15T10:00:00.000Z' } },
          { time_range: { end_time: null, start_time: '2022-06-15T11:00:00.000Z' } },
        ],
      };

      expect(actualEndTimeForPatrol(patrol)).toBeNull();
    });

    test('uses the last leg\'s end time for a multi-leg patrol that has fully ended', () => {
      const patrol = {
        patrol_segments: [
          { time_range: { end_time: '2022-06-15T11:00:00.000Z', start_time: '2022-06-15T10:00:00.000Z' } },
          { time_range: { end_time: '2022-06-15T12:00:00.000Z', start_time: '2022-06-15T11:00:00.000Z' } },
        ],
      };

      expect(actualEndTimeForPatrol(patrol)).toEqual(new Date('2022-06-15T12:00:00.000Z'));
    });
  });

  describe('getTrackedSubjectsForPatrolSegment', () => {
    test('returns the leg\'s leader', () => {
      const leader = { id: 'leader-a', name: 'Ranger Amara' };

      expect(getTrackedSubjectsForPatrolSegment({ leader })).toEqual([leader]);
    });

    test('returns an empty list for a leg without a leader', () => {
      expect(getTrackedSubjectsForPatrolSegment({ leader: null })).toEqual([]);
    });
  });

  describe('effectiveEndTimeForPatrol', () => {
    test('returns the end time of the last leg', () => {
      const patrol = {
        patrol_segments: [{ time_range: { end_time: '2022-06-15T13:00:00.000Z', start_time: '2022-06-15T10:00:00.000Z' } }],
      };

      expect(effectiveEndTimeForPatrol(patrol)).toEqual(new Date('2022-06-15T13:00:00.000Z'));
    });

    test('falls back to the moment a cancelled patrol was cancelled', () => {
      expect(effectiveEndTimeForPatrol(cancelledPatrol)).toEqual(new Date('2022-01-18T22:42:04.843502+00:00'));
    });

    test('falls back to the moment a done patrol was marked done', () => {
      const patrol = {
        ...donePatrol,
        patrol_segments: [{
          ...donePatrol.patrol_segments[0],
          time_range: { ...donePatrol.patrol_segments[0].time_range, end_time: null },
        }],
      };

      expect(effectiveEndTimeForPatrol(patrol)).toEqual(new Date('2022-01-18T22:12:24.207505+00:00'));
    });

    test('falls back to the last state change of a finished patrol however it is worded', () => {
      const patrol = {
        patrol_segments: [{ time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' } }],
        state: 'cancelled',
        updates: [
          { message: 'Estado actualizado', time: '2022-06-15T13:00:00.000Z', type: 'update_patrol_state' },
          { message: 'Updated fields: State is open', time: '2022-06-15T10:00:00.000Z', type: 'update_patrol_state' },
        ],
      };

      expect(effectiveEndTimeForPatrol(patrol)).toEqual(new Date('2022-06-15T13:00:00.000Z'));
    });

    test('falls back to the start time of a finished patrol with nothing recording when it stopped', () => {
      const patrol = {
        patrol_segments: [{ time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' } }],
        state: 'cancelled',
        updates: [{ message: 'Patrol Added', time: '2022-06-15T09:00:00.000Z', type: 'add_patrol' }],
      };

      expect(effectiveEndTimeForPatrol(patrol)).toEqual(new Date('2022-06-15T10:00:00.000Z'));
    });

    test('returns null for a patrol that has not ended', () => {
      const patrol = {
        patrol_segments: [{ time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' } }],
      };

      expect(effectiveEndTimeForPatrol(patrol)).toBeNull();
    });

    test('ignores the state changes of a patrol that is still running', () => {
      const patrol = {
        patrol_segments: [{ time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' } }],
        state: 'open',
        updates: [
          { message: 'Updated fields: State is open', time: '2022-06-15T13:00:00.000Z', type: 'update_patrol_state' },
        ],
      };

      expect(effectiveEndTimeForPatrol(patrol)).toBeNull();
    });
  });

  describe('getCancellationTimeForPatrol', () => {
    test('returns the time of the most recent update that cancelled the patrol', () => {
      expect(getCancellationTimeForPatrol(cancelledPatrol))
        .toEqual(new Date('2022-01-18T22:42:04.843502+00:00'));
    });

    test('returns the time of the last state change however it is worded', () => {
      const patrol = {
        ...cancelledPatrol,
        updates: [{ message: 'Estado actualizado', time: '2022-01-19T10:00:00.000Z', type: 'update_patrol_state' }],
      };

      expect(getCancellationTimeForPatrol(patrol)).toEqual(new Date('2022-01-19T10:00:00.000Z'));
    });

    test('returns null for a patrol that is not cancelled', () => {
      expect(getCancellationTimeForPatrol({ ...cancelledPatrol, state: 'open' })).toBeNull();
    });

    test('returns null for a cancelled patrol without a state update recording it', () => {
      expect(getCancellationTimeForPatrol({ ...cancelledPatrol, updates: [] })).toBeNull();
    });
  });

  describe('getElapsedTimeForPatrol', () => {
    const HOUR = 60 * 60 * 1000;

    test('measures from the first leg\'s start time to the last leg\'s end time', () => {
      const patrol = {
        patrol_segments: [
          { time_range: { end_time: '2022-06-15T11:00:00.000Z', start_time: '2022-06-15T10:00:00.000Z' } },
          { time_range: { end_time: '2022-06-15T13:00:00.000Z', start_time: '2022-06-15T11:00:00.000Z' } },
        ],
      };

      expect(getElapsedTimeForPatrol(patrol)).toBe(3 * HOUR);
    });

    test('measures up to the given fallback end time while the patrol has not ended', () => {
      const patrol = {
        patrol_segments: [{ time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' } }],
      };

      expect(getElapsedTimeForPatrol(patrol, new Date('2022-06-15T12:00:00.000Z').getTime())).toBe(2 * HOUR);
    });

    test('measures an ongoing patrol up to now by default', () => {
      jest.useFakeTimers().setSystemTime(new Date('2022-06-15T12:00:00.000Z'));

      const patrol = {
        patrol_segments: [{ time_range: { end_time: null, start_time: '2022-06-15T10:00:00.000Z' } }],
      };

      expect(getElapsedTimeForPatrol(patrol)).toBe(2 * HOUR);

      jest.useRealTimers();
    });

    test('measures a cancelled patrol up to the moment it was cancelled, not the fallback end time', () => {
      const patrol = {
        ...cancelledPatrol,
        patrol_segments: [{ time_range: { end_time: null, start_time: '2022-01-18T21:42:04.843502+00:00' } }],
      };

      expect(getElapsedTimeForPatrol(patrol, new Date('2022-01-20T00:00:00.000Z').getTime())).toBe(HOUR);
    });

    test('stops measuring a finished patrol with nothing recording when it stopped', () => {
      const patrol = {
        patrol_segments: [{ time_range: { end_time: null, start_time: '2022-01-18T21:42:04.843502+00:00' } }],
        state: 'cancelled',
        updates: [],
      };

      expect(getElapsedTimeForPatrol(patrol, new Date('2022-01-20T00:00:00.000Z').getTime())).toBe(0);
    });

    test('returns zero for a patrol that has not started', () => {
      const patrol = { patrol_segments: [{ time_range: { end_time: null, start_time: null } }] };

      expect(getElapsedTimeForPatrol(patrol)).toBe(0);
    });

    test('returns zero for a patrol without legs', () => {
      expect(getElapsedTimeForPatrol({ patrol_segments: [] })).toBe(0);
    });

    test('never returns a negative elapsed time', () => {
      const patrol = {
        patrol_segments: [{ time_range: { end_time: '2022-06-15T09:00:00.000Z', start_time: '2022-06-15T10:00:00.000Z' } }],
      };

      expect(getElapsedTimeForPatrol(patrol)).toBe(0);
    });
  });

  describe('getPausedTimeForPatrol', () => {
    test('returns zero while no leg can be recognized as a pause', () => {
      const patrol = {
        patrol_segments: [
          { time_range: { end_time: '2022-06-15T11:00:00.000Z', start_time: '2022-06-15T10:00:00.000Z' } },
          { time_range: { end_time: null, start_time: '2022-06-15T11:00:00.000Z' } },
        ],
      };

      expect(getPausedTimeForPatrol(patrol)).toBe(0);
    });

    test('returns zero for a patrol without legs', () => {
      expect(getPausedTimeForPatrol({ patrol_segments: [] })).toBe(0);
    });
  });

  describe('iconTypeForPatrol', () => {
    test('returns the patrol-level icon_id when set', () => {
      const patrol = { icon_id: 'custom-icon', patrol_segments: [{ icon_id: 'first-leg-icon' }] };

      expect(iconTypeForPatrol(patrol)).toBe('custom-icon');
    });

    test('falls back to the last leg\'s icon_id for a multi-leg patrol, not the first', () => {
      const patrol = {
        patrol_segments: [
          { icon_id: 'first-leg-icon' },
          { icon_id: 'second-leg-icon' },
        ],
      };

      expect(iconTypeForPatrol(patrol)).toBe('second-leg-icon');
    });

    test('returns an empty string when there is no icon anywhere', () => {
      expect(iconTypeForPatrol({ patrol_segments: [{}] })).toBe('');
    });
  });

  describe('displayTitleForPatrol', () => {
    test('falls back to the last leg\'s patrol type name, not the first, when there is no title or leader name', () => {
      store.getState.mockReturnValue({ data: { patrolTypes: [dogPatrol, routinePatrol] } });

      const patrol = {
        title: null,
        patrol_segments: [
          { patrol_type: routinePatrol.value },
          { patrol_type: dogPatrol.value },
        ],
      };

      expect(displayTitleForPatrol(patrol, null)).toBe(dogPatrol.display);
    });
  });

  describe('getPatrolsForLeaderId', () => {
    test('matches the last leg\'s leader for a multi-leg patrol, not the first', () => {
      const patrol = {
        id: 'patrol-1',
        patrol_segments: [
          { leader: { id: 'leader-a' } },
          { leader: { id: 'leader-b' } },
        ],
      };
      store.getState.mockReturnValue({ data: { patrolStore: { 'patrol-1': patrol } } });

      expect(getPatrolsForLeaderId('leader-b')).toEqual([patrol]);
      expect(getPatrolsForLeaderId('leader-a')).toEqual([]);
    });
  });

  describe('getActivePatrolsForLeaderId', () => {
    test('matches the last leg\'s leader and requires the patrol to currently be active', () => {
      const activeLastLegPatrol = {
        ...activePatrol,
        id: 'patrol-active',
        patrol_segments: [
          { ...activePatrol.patrol_segments[0], leader: { id: 'leader-a' } },
          { ...activePatrol.patrol_segments[0], leader: { id: 'leader-b' } },
        ],
      };
      store.getState.mockReturnValue({ data: { patrolStore: { 'patrol-active': activeLastLegPatrol } } });

      expect(getActivePatrolsForLeaderId('leader-b')).toEqual([activeLastLegPatrol]);
      expect(getActivePatrolsForLeaderId('leader-a')).toEqual([]);
    });
  });

  describe('getReportsForPatrol', () => {
    const patrolWithLegEvents = (...eventsPerLeg) => ({
      ...multiLegPatrol,
      patrol_segments: multiLegPatrol.patrol_segments.map((leg, index) => ({ ...leg, events: eventsPerLeg[index] })),
    });

    test('collects the events of every leg in leg order', () => {
      const firstLegEvent = { id: 'event-1' };
      const secondLegEvent = { id: 'event-2' };

      expect(getReportsForPatrol(patrolWithLegEvents([firstLegEvent], [secondLegEvent])))
        .toEqual([firstLegEvent, secondLegEvent]);
    });

    test('skips the legs that carry no events', () => {
      const secondLegEvent = { id: 'event-2' };

      expect(getReportsForPatrol(patrolWithLegEvents(undefined, [secondLegEvent]))).toEqual([secondLegEvent]);
    });

    test('returns an empty list for a patrol without legs', () => {
      expect(getReportsForPatrol({ patrol_segments: [] })).toEqual([]);
    });

    test('returns an empty list without a patrol', () => {
      expect(getReportsForPatrol(undefined)).toEqual([]);
    });
  });

  describe('PATROL_SAVE_ACTIONS.addFile', () => {
    test('uploads the file against the saved patrol without going through the store', () => {
      const upload = Promise.resolve({ data: {} });
      uploadPatrolFile.mockReturnValue(upload);

      const file = new File(['content'], 'photo.png');

      expect(PATROL_SAVE_ACTIONS.addFile(file).action('patrol-1')).toBe(upload);
      expect(uploadPatrolFile).toHaveBeenCalledWith('patrol-1', file);
      expect(store.dispatch).not.toHaveBeenCalled();
    });
  });
});
