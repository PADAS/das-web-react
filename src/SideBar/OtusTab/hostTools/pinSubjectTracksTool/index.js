import uniqBy from 'lodash/uniqBy';

import { canShowTrackForSubject } from '../../../../utils/subjects';
import { fetchTracksIfNecessary } from '../../../../utils/tracks';
import { pinSubjectTracks } from '../../../../ducks/map-ui';
import { selectHydratedSubjectGroupsWithLastPositionTime } from '../../../../selectors/subjects';
import { showSubjects } from '../../../../ducks/map-layer-filter';

// A track crossing the antimeridian is split into a MultiLineString.
const LINE_GEOMETRY_TYPES = ['LineString', 'MultiLineString'];

const UUID_LIST_SCHEMA = { items: { format: 'uuid', type: 'string' }, type: 'array' };

const findSubjectGroup = (subjectGroups, subjectGroupId) => {
  for (const subjectGroup of subjectGroups) {
    const foundSubjectGroup = subjectGroup.id === subjectGroupId
      ? subjectGroup
      : findSubjectGroup(subjectGroup.subgroups, subjectGroupId);

    if (foundSubjectGroup) return foundSubjectGroup;
  }

  return null;
};

const pinSubjectTracksTool = {
  description: 'Pin the tracks of subjects, like the track button in Map Layers, so a click on the map does not '
    + 'clear them. Hidden subjects are shown, and the map fits the pinned tracks. A group pins only the subjects '
    + 'directly in it: its subgroups come back in subgroup_ids, to pin as groups of their own.',
  inputSchema: {
    additionalProperties: false,
    minProperties: 1,
    properties: {
      subject_group_ids: { ...UUID_LIST_SCHEMA, description: 'Subject groups.' },
      subject_ids: { ...UUID_LIST_SCHEMA, description: 'Single subjects.' },
    },
    type: 'object',
  },
  name: 'pin_subject_tracks',
  run: async (args, context) => {
    const state = context.getState();

    const subjectGroups = selectHydratedSubjectGroupsWithLastPositionTime(state);
    const foundSubjectGroups = (args.subject_group_ids ?? [])
      .map((subjectGroupId) => findSubjectGroup(subjectGroups, subjectGroupId))
      .filter((subjectGroup) => !!subjectGroup);
    const subjects = uniqBy([
      ...(args.subject_ids ?? []).map((subjectId) => state.data.subjectStore[subjectId]).filter((subject) => !!subject),
      ...foundSubjectGroups.flatMap((subjectGroup) => subjectGroup.subjects),
    ], 'id');

    const trackableSubjectIds = subjects.filter(canShowTrackForSubject).map((subject) => subject.id);
    const hiddenSubjectIds = subjects
      .map((subject) => subject.id)
      .filter((subjectId) => state.data.mapLayerFilter.hiddenSubjectIDs.includes(subjectId));

    if (hiddenSubjectIds.length) {
      context.dispatch(showSubjects(...hiddenSubjectIds));
    }

    if (trackableSubjectIds.length) {
      await fetchTracksIfNecessary(trackableSubjectIds);

      context.dispatch(pinSubjectTracks(...trackableSubjectIds));
    }

    const trackCoordinates = trackableSubjectIds.flatMap((subjectId) => (
      context.getState().data.tracks[subjectId]?.track?.features ?? []
    )
      .filter((feature) => LINE_GEOMETRY_TYPES.includes(feature.geometry?.type))
      .flatMap((feature) => feature.geometry.coordinates));

    if (trackCoordinates.length) {
      context.jumpToLocation(trackCoordinates.length > 1 ? trackCoordinates : trackCoordinates[0]);
    }

    return {
      map_centered: !!trackCoordinates.length,
      no_track_subject_ids: subjects
        .filter((subject) => !trackableSubjectIds.includes(subject.id))
        .map((subject) => subject.id),
      not_found: {
        subject_group_ids: (args.subject_group_ids ?? [])
          .filter((subjectGroupId) => !foundSubjectGroups.some((subjectGroup) => subjectGroup.id === subjectGroupId)),
        subject_ids: (args.subject_ids ?? []).filter((subjectId) => !state.data.subjectStore[subjectId]),
      },
      pinned_subject_ids: trackableSubjectIds,
      shown_subject_ids: hiddenSubjectIds,
      subgroup_ids: foundSubjectGroups.flatMap((subjectGroup) => subjectGroup.subgroups.map((subgroup) => subgroup.id)),
    };
  },
};

export default pinSubjectTracksTool;
