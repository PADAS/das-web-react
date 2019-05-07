import { createSelector } from '../selectors';

const tracksLoaded = ({ data: { tracks } }, props) => !!tracks[props.subject.id];
const tracksVisible = ({ view: { subjectTrackState: { visible } } }, props) => visible.includes(props.subject.id);
const tracksPinned = ({ view: { subjectTrackState: { pinned } } }, props) => pinned.includes(props.subject.id);
const subjectIsInHeatmap = ({ view: { heatmapSubjectIDs } }, props) => heatmapSubjectIDs.includes(props.subject.id);

export const getSubjectControlState = createSelector(
  [tracksLoaded, tracksVisible, tracksPinned, subjectIsInHeatmap],
  (tracksLoaded, tracksVisible, tracksPinned, subjectIsInHeatmap) => ({
    tracksLoaded, tracksVisible, tracksPinned, subjectIsInHeatmap,
  }),
);