import { createSelector } from 'reselect';
import intersection from 'lodash/intersection';

import { getHeatmapEligibleSubjectsFromGroups } from '../utils/subjects';

const heatmapSubjectIDs = ({ view: { heatmapSubjectIDs } }) => heatmapSubjectIDs;
const tracks = ({ data: { tracks } }) => tracks;
export const heatmapEligibleSubjectIDsForGroup = (_, props) => getHeatmapEligibleSubjectsFromGroups(props).map(s => s.id);

export const groupIsFullyHeatmapped = createSelector(
  [heatmapSubjectIDs, heatmapEligibleSubjectIDsForGroup],
  (heatmapSubjects, eligibleSubjects) => intersection(eligibleSubjects, heatmapSubjects).length === eligibleSubjects.length,
);

export const groupIsPartiallyHeatmapped = createSelector(
  [heatmapSubjectIDs, heatmapEligibleSubjectIDsForGroup, groupIsFullyHeatmapped],
  (heatmapSubjects, eligibleSubjects, fullyMapped) => !fullyMapped && !!intersection(eligibleSubjects, heatmapSubjects).length,
);

export const unloadedSubjectTrackIDs = createSelector(
  [heatmapEligibleSubjectIDsForGroup, tracks],
  (subjectIDs, tracks) => subjectIDs.filter(id => !tracks[id]),
);

export const subjectGroupHeatmapControlState = createSelector(
  [heatmapEligibleSubjectIDsForGroup, groupIsFullyHeatmapped, groupIsPartiallyHeatmapped, unloadedSubjectTrackIDs],
  (eligibleSubjects, fullyMapped, partiallyMapped, unloadedSubjectTrackIDs) => ({
    showHeatmapControl: !!eligibleSubjects.length,
    heatmapEligibleSubjectIDs: eligibleSubjects,
    groupIsFullyHeatmapped: fullyMapped,
    groupIsPartiallyHeatmapped: partiallyMapped,
    unloadedSubjectTrackIDs,
  }),
);
