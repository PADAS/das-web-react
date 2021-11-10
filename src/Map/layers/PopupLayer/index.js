import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'react-mapbox-gl';

import { calculatePopoverPlacement } from '../../../utils/map';
import { withMap } from '../../EarthRangerMap';

import SubjectPopup from '../../../subjects/map/popups/SubjectPopup';

import SubjectMessagesPopup from '../../../subjects/map/popups/SubjectMessagesPopup';
import subjectMessagesPopupStyles from '../../../subjects/map/popups/SubjectMessagesPopup/styles.module.scss';

import SubjectMessagePopup from '../../../subjects/map/popups/SubjectMessagePopup';
import TimepointPopup from '../../../tracks/TimepointPopup';

import DroppedMarkerPopup from '../../../map/popups/DroppedMarkerPopup';
import droppedMarkerPopupStyles from '../../../map/popups/DroppedMarkerPopup/styles.module.scss';

import UserCurrentLocationPopup from '../../../map/popups/UserCurrentLocationPopup';
import userCurrentLocationPopupStyles from '../../../map/popups/UserCurrentLocationPopup/styles.module.scss';

import FeatureSymbolPopup from '../../popups/FeatureSymbolPopup';
import AnalyzerConfigPopup from '../../../analyzers/AnalyzerConfigPopup';

import LayerSelectorPopup from '../../popups/LayerSelectorPopup';
import layerSelectorPopupStyles from '../../popups/LayerSelectorPopup/styles.module.scss';

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

const PopupLayer = ({ popup, map, ...rest }) => {
  const { id, type, data } = popup;
  const template = templates[type];


  if (!template) return null;

  const { coordinates, popupAttrsOverride = {} } = data;
  const { Component, popupAttrs } = template;

  const finalPopupAttrs = {
    ...popupAttrs,
    ...popupAttrsOverride,
  };

  const popoverPlacement = calculatePopoverPlacement(map, {
    lng: coordinates && coordinates[0],
    lat: coordinates && coordinates[1],
  });

  return <Popup coordinates={coordinates} {...finalPopupAttrs} key={id}>
    <Component data={data} map={map} popoverPlacement={popoverPlacement} {...rest} />
  </Popup>;
};

export default memo(withMap(PopupLayer));

PopupLayer.propTypes = {
  popup: PropTypes.object.isRequired,
};