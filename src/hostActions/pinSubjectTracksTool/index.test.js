import { fetchTracksIfNecessary } from '../../utils/tracks';
import { mockStore } from '../../__test-helpers/MockStore';

import pinSubjectTracksTool from './';

jest.mock('../../utils/tracks', () => ({
  ...jest.requireActual('../../utils/tracks'),
  fetchTracksIfNecessary: jest.fn(),
}));

const lineTrack = (coordinates) => ({
  track: { features: [{ geometry: { coordinates, type: 'LineString' }, type: 'Feature' }] },
});

describe('hostActions - pinSubjectTracksTool', () => {
  let jumpToLocation, store;
  beforeEach(() => {
    fetchTracksIfNecessary.mockResolvedValue();
    jumpToLocation = jest.fn();
    store = mockStore({
      data: {
        mapLayerFilter: { hiddenSubjectIDs: ['kubwa'] },
        subjectGroups: [{
          id: 'elephants',
          name: 'Elephants',
          subgroups: [{ id: 'herd-a', name: 'Herd A', subgroups: [], subjects: ['tembo'] }],
          subjects: ['kubwa', 'gate-camera'],
        }],
        subjectStore: {
          'gate-camera': { id: 'gate-camera', tracks_available: false },
          kubwa: { id: 'kubwa', tracks_available: true },
          tembo: { id: 'tembo', tracks_available: true },
        },
        tracks: { kubwa: lineTrack([[36.1, -1.1], [36.2, -1.2]]) },
      },
      view: { subjectTrackState: { pinned: [], visible: [] } },
    });
  });

  const runTool = (args) => pinSubjectTracksTool.run(
    args,
    { dispatch: store.dispatch, getState: store.getState, jumpToLocation }
  );

  test('pins only the subjects directly in a group, returning its subgroups to pin on their own', async () => {
    const result = await runTool({ subject_group_ids: ['elephants'] });

    expect(store.getActions()).toContainEqual({
      payload: { pinned: ['kubwa'], visible: [] },
      type: 'UPDATE_SUBJECT_TRACK_STATE',
    });
    expect(result.pinned_subject_ids).toEqual(['kubwa']);
    expect(result.subgroup_ids).toEqual(['herd-a']);
  });

  test('fetches the tracks before pinning them', async () => {
    await runTool({ subject_ids: ['kubwa', 'tembo'] });

    expect(fetchTracksIfNecessary).toHaveBeenCalledWith(['kubwa', 'tembo']);
  });

  test('shows a subject hidden on the map', async () => {
    const result = await runTool({ subject_ids: ['kubwa', 'tembo'] });

    expect(store.getActions()).toContainEqual({ payload: ['kubwa'], type: 'SHOW_SUBJECTS' });
    expect(result.shown_subject_ids).toEqual(['kubwa']);
  });

  test('fits the map to the pinned tracks', async () => {
    const result = await runTool({ subject_ids: ['kubwa'] });

    expect(jumpToLocation).toHaveBeenCalledWith([[36.1, -1.1], [36.2, -1.2]]);
    expect(result.map_centered).toBe(true);
  });

  test('reports subjects without a track and ids it did not find, pinning nothing for them', async () => {
    const result = await runTool({ subject_ids: ['gate-camera', 'ghost'] });

    expect(fetchTracksIfNecessary).not.toHaveBeenCalled();
    expect(jumpToLocation).not.toHaveBeenCalled();
    expect(result.no_track_subject_ids).toEqual(['gate-camera']);
    expect(result.not_found).toEqual({ subject_group_ids: [], subject_ids: ['ghost'] });
  });
});
