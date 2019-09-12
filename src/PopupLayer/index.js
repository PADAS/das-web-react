import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';

import SubjectPopup from '../SubjectPopup';
import TimepointPopup from '../TimepointPopup';
import DroppedMarkerPopup from '../DroppedMarkerPopup';
import UserCurrentLocationPopup from '../UserCurrentLocationPopup';
import AnalyzerConfigPopup from '../AnalyzerConfigPopup';

const PopupLayer = ({ popup, ...rest }) => {
  const { id, type, data } = popup;
  let Template;

  if (type === 'subject') Template = SubjectPopup;
  if (type === 'timepoint') Template = TimepointPopup;
  if (type === 'dropped-marker') Template = DroppedMarkerPopup;
  if (type === 'current-user-location') Template = UserCurrentLocationPopup;
  if (type === 'analyzer-config') Template = AnalyzerConfigPopup;
  
  return Template ? <Template key={id} data={data} {...rest} /> : null;
};

export default memo(withMap(PopupLayer));

PopupLayer.propTypes = {
  popup: PropTypes.object.isRequired,
  trackState: PropTypes.object.isRequired,
};