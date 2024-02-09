import React, { memo } from 'react';
import { useSelector } from 'react-redux';

import { trimmedVisibleTrackData } from '../selectors/tracks';

import TrackLegend from '../TrackLegend';

const SubjectTrackLegend = (props) => {
  const trackData = useSelector(trimmedVisibleTrackData);
  const trackState = useSelector((state) => state.view.subjectTrackState);

  return <TrackLegend trackData={trackData} trackState={trackState} {...props} />;
};

export default memo(SubjectTrackLegend);
