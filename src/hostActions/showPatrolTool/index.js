import {
  actualEndTimeForPatrol,
  actualStartTimeForPatrol,
  calcTitleAndSubtitleForPatrol,
  getBoundsForPatrol,
  getPatrolLocationCoordinates,
  patrolHasTrackData,
} from '../../utils/patrols';
import { DAS_HOST } from '../../constants';
import { fetchPatrol, togglePatrolTrackState } from '../../ducks/patrols';
import { fetchTracksIfNecessary } from '../../utils/tracks';
import HostToolError, { HOST_TOOL_ERROR_CODES } from '../HostToolError';
import { selectPatrolMeasuredSubjectIds, selectPatrolTrackData } from '../../selectors/patrols';

const findPatrol = async (patrolId, context) => {
  if (!context.getState().data.patrolStore[patrolId]) {
    try {
      await context.dispatch(fetchPatrol(patrolId));
    } catch (error) {
      if (error?.response?.status === 404) {
        throw new HostToolError(HOST_TOOL_ERROR_CODES.NOT_FOUND, `No patrol with id ${patrolId}.`);
      }

      throw error;
    }
  }

  return context.getState().data.patrolStore[patrolId];
};

const showPatrolTool = {
  description: 'Show a patrol\'s track and fit the map to everything it covered, like "fit to bounds" in the '
    + 'patrol overview. A hidden track is turned on and a pinned one stays pinned. It does not open the patrol: '
    + 'the result carries a link to its detail view.',
  inputSchema: {
    additionalProperties: false,
    properties: {
      patrol_id: { description: 'The patrol id, a UUID.', format: 'uuid', type: 'string', 'x-source': 'recent_patrols' },
    },
    required: ['patrol_id'],
    type: 'object',
  },
  name: 'show_patrol',
  run: async (args, context) => {
    const patrol = await findPatrol(args.patrol_id, context);

    const patrolTrackState = context.getState().view.patrolTrackState;
    if (!patrolTrackState.pinned.includes(patrol.id) && !patrolTrackState.visible.includes(patrol.id)) {
      context.dispatch(togglePatrolTrackState(patrol.id));
    }

    const patrolMeasuredSubjectIds = selectPatrolMeasuredSubjectIds(context.getState(), patrol);
    if (patrolMeasuredSubjectIds.length) {
      await fetchTracksIfNecessary(patrolMeasuredSubjectIds, {
        optionalDateBoundaries: {
          since: actualStartTimeForPatrol(patrol)?.toISOString() ?? null,
          until: actualEndTimeForPatrol(patrol)?.toISOString() ?? null,
        },
      });
    }

    const patrolTrackData = selectPatrolTrackData(context.getState(), patrol);
    const patrolBounds = getBoundsForPatrol(patrol, patrolTrackData);
    const patrolLocationCoordinates = getPatrolLocationCoordinates(patrolTrackData);

    if (patrolBounds) {
      context.jumpToLocation(
        [[patrolBounds[0], patrolBounds[1]], [patrolBounds[2], patrolBounds[3]]],
        undefined,
        { maxZoom: 17 }
      );
    } else if (patrolLocationCoordinates) {
      context.jumpToLocation(patrolLocationCoordinates);
    }

    const state = context.getState();

    return {
      detail_url: `${DAS_HOST}/patrols/${patrol.id}`,
      has_track: patrolHasTrackData(patrolTrackData),
      map_centered: !!patrolBounds || !!patrolLocationCoordinates,
      patrol_id: patrol.id,
      serial_number: patrol.serial_number,
      state: patrol.state,
      title: calcTitleAndSubtitleForPatrol(patrol, state.data.patrolTypes).title || null,
      track_state: state.view.patrolTrackState.pinned.includes(patrol.id) ? 'pinned' : 'visible',
    };
  },
};

export default showPatrolTool;
