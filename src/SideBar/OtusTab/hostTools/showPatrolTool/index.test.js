import { DAS_HOST } from '../../../../constants';
import { fetchPatrol, UPDATE_PATROL_TRACK_STATE } from '../../../../ducks/patrols';
import { fetchTracksIfNecessary } from '../../../../utils/tracks';
import { getBoundsForPatrol, patrolHasTrackData } from '../../../../utils/patrols';
import { HOST_TOOL_ERROR_CODES } from '../HostToolError';
import { mockStore } from '../../../../__test-helpers/MockStore';
import { selectPatrolMeasuredSubjectIds, selectPatrolTrackData } from '../../../../selectors/patrols';

import showPatrolTool from './';

jest.mock('../../../../ducks/patrols', () => ({
  ...jest.requireActual('../../../../ducks/patrols'),
  fetchPatrol: jest.fn(),
}));

jest.mock('../../../../selectors/patrols', () => ({
  ...jest.requireActual('../../../../selectors/patrols'),
  selectPatrolMeasuredSubjectIds: jest.fn(),
  selectPatrolTrackData: jest.fn(),
}));

jest.mock('../../../../utils/patrols', () => ({
  ...jest.requireActual('../../../../utils/patrols'),
  getBoundsForPatrol: jest.fn(),
  patrolHasTrackData: jest.fn(),
}));

jest.mock('../../../../utils/tracks', () => ({
  ...jest.requireActual('../../../../utils/tracks'),
  fetchTracksIfNecessary: jest.fn(),
}));

const PATROL = {
  id: 'river-patrol',
  patrol_segments: [{ id: 'leg', patrol_type: 'foot', time_range: { start_time: '2026-11-01T06:00:00.000Z' } }],
  serial_number: 112,
  state: 'open',
  title: 'River patrol',
};

describe('SideBar - OtusTab - hostTools - showPatrolTool', () => {
  let jumpToLocation, state, store;
  beforeEach(() => {
    fetchPatrol.mockImplementation(() => () => Promise.resolve());
    fetchTracksIfNecessary.mockResolvedValue();
    getBoundsForPatrol.mockReturnValue([36.1, -1.4, 36.3, -1.2]);
    jumpToLocation = jest.fn();
    patrolHasTrackData.mockReturnValue(true);
    selectPatrolMeasuredSubjectIds.mockReturnValue(['ranger']);
    selectPatrolTrackData.mockReturnValue({});
    state = {
      data: { patrolStore: { [PATROL.id]: PATROL }, patrolTypes: [] },
      view: { patrolTrackState: { hiddenSubjects: {}, pinned: [], visible: [] } },
    };
  });

  const runTool = (args) => {
    store = mockStore(() => state);

    return showPatrolTool.run(args, { dispatch: store.dispatch, getState: store.getState, jumpToLocation });
  };

  test('turns on a hidden patrol track', async () => {
    await runTool({ patrol_id: PATROL.id });

    expect(store.getActions()).toEqual([{
      payload: { visible: [PATROL.id] },
      type: UPDATE_PATROL_TRACK_STATE,
    }]);
  });

  test('leaves a pinned patrol track pinned', async () => {
    state.view.patrolTrackState.pinned = [PATROL.id];

    const result = await runTool({ patrol_id: PATROL.id });

    expect(store.getActions()).toEqual([]);
    expect(result.track_state).toBe('pinned');
  });

  test('fetches the tracks of the patrol\'s subjects over its time', async () => {
    await runTool({ patrol_id: PATROL.id });

    expect(fetchTracksIfNecessary).toHaveBeenCalledWith(['ranger'], {
      optionalDateBoundaries: { since: '2026-11-01T06:00:00.000Z', until: null },
    });
  });

  test('fits the map to the patrol\'s bounds', async () => {
    await runTool({ patrol_id: PATROL.id });

    expect(jumpToLocation).toHaveBeenCalledWith([[36.1, -1.4], [36.3, -1.2]], undefined, { maxZoom: 17 });
  });

  test('resolves with what Otus needs to confirm it and link to it', async () => {
    await expect(runTool({ patrol_id: PATROL.id })).resolves.toEqual({
      detail_url: `${DAS_HOST}/patrols/${PATROL.id}`,
      has_track: true,
      map_centered: true,
      patrol_id: PATROL.id,
      serial_number: 112,
      state: 'open',
      title: 'River patrol',
      track_state: 'visible',
    });
  });

  test('rejects as not found when the site has no such patrol', async () => {
    fetchPatrol.mockImplementation(() => () => Promise.reject({ response: { status: 404 } }));

    await expect(runTool({ patrol_id: 'unknown-patrol' }))
      .rejects.toMatchObject({ code: HOST_TOOL_ERROR_CODES.NOT_FOUND });
  });
});
