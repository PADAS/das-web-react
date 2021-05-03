import React, { memo } from 'react';
import PropTypes from 'prop-types';

import { withMap } from '../EarthRangerMap';

import SubjectPopup from '../SubjectPopup';
import SubjectMessagesPopup from '../SubjectMessagesPopup';
import TimepointPopup from '../TimepointPopup';
import DroppedMarkerPopup from '../DroppedMarkerPopup';
import UserCurrentLocationPopup from '../UserCurrentLocationPopup';
import FeatureSymbolPopup from '../FeatureLayer/FeatureSymbolPopup';
import AnalyzerConfigPopup from '../AnalyzerConfigPopup';
import LayerSelectorPopup from '../LayerSelectorPopup';

const PopupLayer = ({ popup, ...rest }) => {
  const { id, type, data } = popup;
  let Template;

  if (type === 'subject') Template = SubjectPopup;
  if (type === 'subject-messages') Template = SubjectMessagesPopup;
  if (type === 'timepoint') Template = TimepointPopup;
  if (type === 'dropped-marker') Template = DroppedMarkerPopup;
  if (type === 'current-user-location') Template = UserCurrentLocationPopup;
  if (type === 'feature-symbol') Template = FeatureSymbolPopup;
  if (type === 'analyzer-config') Template = AnalyzerConfigPopup;
  if (type === 'multi-layer-select') Template = LayerSelectorPopup;
  
  return Template ? <Template key={id} popupId={id} data={data} {...rest} /> : null;
};

export default memo(withMap(PopupLayer));

PopupLayer.propTypes = {
  popup: PropTypes.object.isRequired,
};