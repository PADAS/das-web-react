import React, { useEffect, useCallback, useContext, useMemo, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { featureCollection } from '@turf/helpers';

import { withMap } from '../EarthRangerMap';
import MessageContext from '../InReach/context';

import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';


const calcMapMessages = (messageStore, subjectFeatureCollection) => {
  if (!subjectFeatureCollection?.features?.length) return null;

  const subjectFeaturesWithUnreadMessages =
    subjectFeatureCollection.features
      .map(feature => 
        ({ feature, messages: (messageStore[feature.properties.id] || []).filter(msg => !msg.read) }))
      .filter(item => !!item.messages.length);

  return featureCollection(
    subjectFeaturesWithUnreadMessages
      .map(item => ({
        ...item.feature,
        properties: {
          ...item.feature.properties,
          unread_message_count: item.messages.length,
        }
      }))
  );
};

const SOURCE_ID = 'MESSAGE_BADGES';
const LAYER_ID = `${SOURCE_ID}_LAYER`;

const messageBadgeLayout = {
  'text-field': '{unread_message_count}',
  'text-offset': [1.1, -1.1],
};

const messageBadgePaint = {
  'text-color': 'white',
  'text-halo-color': 'red',
  'text-halo-width': 3,
};

const MessageBadgeLayer = (props) => {
  const { map, messages, subjectFeatureCollection }  = props;

  const { state, dispatch } = useContext(MessageContext);


  useEffect(() => {
    if (map) {
      const source = map.getSource(SOURCE_ID);
      const layer = map.getLayer(LAYER_ID);

      const hasSource = !!source;
      const hasLayer = !!layer;

      const data = calcMapMessages(state, subjectFeatureCollection);

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
    }
  }, [map, messages, state, subjectFeatureCollection]);
  
  return null;
};

const mapStateToProps = (state) => ({
  subjectFeatureCollection: getMapSubjectFeatureCollectionWithVirtualPositioning(state),
});

export default connect(mapStateToProps, null)(memo(withMap(MessageBadgeLayer)));


MessageBadgeLayer.propTypes = {
  messages: PropTypes.array.isRequired,
  subjectFeatureCollection: PropTypes.array.isRequired,
};