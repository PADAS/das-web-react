import React, { Fragment, memo } from 'react';
import EventIcon from '../EventIcon';

const SpideredReportMarker = (props) => {
  const { report } = props;
  return <Fragment>
    <EventIcon report={report} /> {/* this should be the <img /> tag from the store rather 
    than the icon, to match the map presentation */}
    {/* calc title with date to go here */}
    {/* style up to be a close match */}
    {/* increase zoom threshold tolerance for declustering, line up w/spiderification behavior */}
  </Fragment>;
};

export default memo(SpideredReportMarker);