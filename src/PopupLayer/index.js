import React, { memo, useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';

import { calculatePopoverPlacement } from '../utils/map';
import { MapContext } from '../App';

import AnalyzerConfigPopup from '../AnalyzerConfigPopup';
import DroppedMarkerPopup from '../DroppedMarkerPopup';
import FeatureSymbolPopup from '../FeatureLayer/FeatureSymbolPopup';
import LayerSelectorPopup from '../LayerSelectorPopup';
import Popup from '../Popup';
import SubjectPopup from '../SubjectPopup';
import SubjectMessagePopup from '../SubjectMessagePopup';
import SubjectMessagesPopup from '../SubjectMessagesPopup';
import TimepointPopup from '../TimepointPopup';
import UserCurrentLocationPopup from '../UserCurrentLocationPopup';

import droppedMarkerPopupStyles from '../DroppedMarkerPopup/styles.module.scss';
import layerSelectorPopupStyles from '../LayerSelectorPopup/styles.module.scss';
import subjectMessagesPopupStyles from '../SubjectMessagesPopup/styles.module.scss';
import userCurrentLocationPopupStyles from '../UserCurrentLocationPopup/styles.module.scss';

const TEMPLATES = {
  subject: {
    Component: SubjectPopup,
    popupAttrs: { anchor: 'bottom', offset: [0, -16] },
  },
  'subject-messages': {
    Component: SubjectMessagesPopup,
    popupAttrs: { className: subjectMessagesPopupStyles.popup },
  },
  'subject-message': {
    Component: SubjectMessagePopup,
    popupAttrs: {},
  },
  timepoint: {
    Component: TimepointPopup,
    popupAttrs: { anchor: 'bottom', offset: [0, -4] },
  },
  'dropped-marker': {
    Component: DroppedMarkerPopup,
    popupAttrs: {
      anchor: 'bottom',
      className: `${droppedMarkerPopupStyles.popup} dropped-marker-popup`,
      offset: [0, -26],
    },
  },
  'current-user-location': {
    Component: UserCurrentLocationPopup,
    popupAttrs: {
      anchor: 'bottom',
      className: userCurrentLocationPopupStyles.popup,
      offset: [0, -6],
    },
  },
  'feature-symbol': {
    Component: FeatureSymbolPopup,
    popupAttrs: { anchor: 'bottom', offset: [0, -26] },
  },
  'analyzer-config': {
    Component: AnalyzerConfigPopup,
    popupAttrs: { anchor: 'bottom', offset: [0, -16] },
  },
  'multi-layer-select': {
    Component: LayerSelectorPopup,
    popupAttrs: { className: layerSelectorPopupStyles.popup },
  },
  'cluster-select': {
    Component: LayerSelectorPopup,
    popupAttrs: { className: layerSelectorPopupStyles.popup },
  },
};

const PopupLayer = ({ popup, ...rest }) => {
  const map = useContext(MapContext);

  const [popoverPlacement, setPopoverPlacement] = useState('auto');

  const { id, type, data } = popup;
  const { coordinates, popupAttrsOverride = {} } = data;
  const template = TEMPLATES[type];

  useEffect(() => {
    const updatePopoverPlacement = async () => {
      const updatedPopoverPlacement = await calculatePopoverPlacement(map, {
        lng: coordinates?.[0],
        lat: coordinates?.[1],
      });
      setPopoverPlacement(updatedPopoverPlacement);
    };

    updatePopoverPlacement();
  }, [map, coordinates]);

  return template ? <Popup coordinates={coordinates} {...template.popupAttrs} {...popupAttrsOverride} key={id}>
    <template.Component data={data} id={id} map={map} popoverPlacement={popoverPlacement} {...rest} />
  </Popup> : null;
};

PopupLayer.propTypes = {
  popup: PropTypes.object.isRequired,
};

export default memo(PopupLayer);
