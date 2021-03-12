import React, { useEffect, useCallback, useContext, useMemo, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { withMessageContext } from '../InReach';
import { withMap } from '../EarthRangerMap';
import { calcMapMessages } from '../utils/messaging';

const SOURCE_ID = 'MESSAGE_BADGES';
const LAYER_ID = `${SOURCE_ID}_LAYER`;

const messageBadgeLayout = {};
const messageBadgePaint = {};

const MessageBadgeLayer = (props) => {
  const { map, messages, subjects }  = props;

  useEffect(() => {
    if (map) {
      const source = map.getSource(SOURCE_ID);
      const layer = map.getLayer(LAYER_ID);

      const hasSource = !!source;
      const hasLayer = !!layer;

      const data = calcMapMessages(messages, subjects);

      if (hasSource) {
        source.setData(data);
      } else {
        map.addSource(SOURCE_ID, {
          type: 'geojson',
          data,
        });
      }

      if (!hasLayer) {
        map.addLayer({
          id: LAYER_ID,
          source: SOURCE_ID,
          type: 'symbol',
          layout: messageBadgeLayout,
          paint: messageBadgePaint,
        });
      } 

      if (hasSource) {

      }
    }
  }, [map, messages, subjects]);

  useEffect(() => {
    return () => {
      if (!map) return null;

      map.removeSource(SOURCE_ID);
      map.removeLayer(LAYER_ID);
    };
  }, [map]);
};

export default memo(withMessageContext(withMap(MessageBadgeLayer)));


MessageBadgeLayer.propTypes = {
  messages: PropTypes.array.isRequired,
  subjects: PropTypes.array.isRequired,
};