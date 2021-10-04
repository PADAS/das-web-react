import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import { withMap } from '../EarthRangerMap';

import SubjectPopup from '../SubjectPopup';

import SubjectMessagesPopup from '../SubjectMessagesPopup';
import subjectMessagesPopupStyles from '../SubjectMessagesPopup/styles.module.scss';

import SubjectMessagePopup from '../SubjectMessagePopup';
import TimepointPopup from '../TimepointPopup';

import DroppedMarkerPopup from '../DroppedMarkerPopup';
import droppedMarkerPopupStyles from '../DroppedMarkerPopup/styles.module.scss';

import UserCurrentLocationPopup from '../UserCurrentLocationPopup';
import userCurrentLocationPopupStyles from '../UserCurrentLocationPopup/styles.module.scss';

import FeatureSymbolPopup from '../FeatureLayer/FeatureSymbolPopup';
import AnalyzerConfigPopup from '../AnalyzerConfigPopup';

import LayerSelectorPopup from '../LayerSelectorPopup';
import layerSelectorPopupStyles from '../LayerSelectorPopup/styles.module.scss';

const templates = {
  subject: {
    Component: SubjectPopup,
    popupAttrs: {
      anchor: 'bottom', offset: [0, -16],
    },
  },
  'subject-messages': {
    Component: SubjectMessagesPopup,
    popupAttrs: {
      className: subjectMessagesPopupStyles.popup,
    }
  },
  'subject-message': {
    Component: SubjectMessagePopup,
    popupAttrs: {
    }
  },
  timepoint: {
    Component: TimepointPopup,
    popupAttrs: {
      anchor: 'bottom',
      offset: [0, -4],
    }
  },
  'dropped-marker': {
    Component: DroppedMarkerPopup,
    popupAttrs: {
      className: droppedMarkerPopupStyles.popup,
      anchor: 'bottom',
      offset: [0, -26],
    }
  },
  'current-user-location': {
    Component: UserCurrentLocationPopup,
    popupAttrs: {
      className: userCurrentLocationPopupStyles.popup,
      anchor: 'bottom',
      offset: [0, -6],
    }
  },
  'feature-symbol': {
    Component: FeatureSymbolPopup,
    popupAttrs: {
      anchor: 'bottom',
      offset: [0, -26],
    }
  },
  'analyzer-config': {
    Component: AnalyzerConfigPopup,
    popupAttrs: {
      anchor: 'bottom',
      offset: [0, -16],
    }
  },
  'multi-layer-select': {
    Component: LayerSelectorPopup,
    popupAttrs: {
      className: layerSelectorPopupStyles.popup,
    }
  },
};

const PopupLayer = ({ popup, ...rest }) => {
  const { id, type, data } = popup;
  const template = templates[type];


  if (!template) return null;

  const { coordinates, popupAttrsOverride = {} } = data;
  const { Component, popupAttrs } = template;

  const finalPopupAttrs = {
    ...popupAttrs,
    ...popupAttrsOverride,
  };

  return <Popup coordinates={coordinates} {...finalPopupAttrs} key={id}>
    <Component data={data} {...rest} />
  </Popup>;
};

export default memo(withMap(PopupLayer));

PopupLayer.propTypes = {
  popup: PropTypes.object.isRequired,
};