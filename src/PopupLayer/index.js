import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';

import SubjectPopup from '../SubjectPopup';
import TimepointPopup from '../TimepointPopup';

const PopupLayer = ({ popup, ...rest }) => {
  const { id, type, data } = popup;
  let Template;

  if (type === 'subject') Template = SubjectPopup;
  if (type === 'timepoint') Template = TimepointPopup;
  
  return Template ? <Template key={id} data={data} {...rest} /> : null;
};

export default memo(withMap(PopupLayer));

PopupLayer.propTypes = {
  popup: PropTypes.object.isRequired,
  trackState: PropTypes.object.isRequired,
};