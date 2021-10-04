import React, { useEffect, useContext, useReducer, useRef, memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { featureCollection } from '@turf/helpers';
import bboxPolygon from '@turf/bbox-polygon';
import booleanContains from '@turf/boolean-contains';

import { PERMISSION_KEYS, PERMISSIONS } from '../constants';

import { usePermissions } from '../hooks';
import { addMapImage } from '../utils/map';
import { getBboxParamsFromMap } from '../utils/query';
import { SocketContext } from '../withSocketConnection';

import { withMap } from '../EarthRangerMap';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { extractSubjectFromMessage } from '../utils/messaging';
import { messageListReducer, removeMessageById, fetchMessagesSuccess, updateMessageFromRealtime, INITIAL_MESSAGE_LIST_STATE } from '../ducks/messaging';

import { fetchMessages } from '../ducks/messaging';

import MessageBadgeIcon from '../common/images/icons/map-message-badge-icon.png';

const calcMapMessages = (messages = [], subjectFeatureCollection) => {
  if (!messages.length || !subjectFeatureCollection?.features?.length) return featureCollection([]);


  const subjectFeaturesWithUnreadMessages =
    subjectFeatureCollection.features
      .map(feature =>
        ({ feature, messages: messages
          .filter(msg =>
            extractSubjectFromMessage(msg)?.id === feature.properties.id
          )
          .filter(msg => !msg.read) }))
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
  'icon-anchor': 'bottom-left',
  'icon-image': 'message-badge',
  'icon-offset': [2, -0.35],
  'icon-size': 0.5,
  'text-field': '{unread_message_count}',
  'text-offset': [2, -0.65],
  'text-size': 14,
};

const messageBadgePaint = {
  'text-halo-color': 'white',
  'text-halo-width': 0.2,
  'text-color': 'white',
};

const MessageBadgeLayer = (props) => {
  /* "messages" prop needs to be replaced by a FETCH that retrieves only unread messages and has a huge page size to guarantee full retrieval */
  const { map, onBadgeClick, subjectFeatureCollection }  = props;

  const [state, dispatch] = useReducer(messageListReducer, INITIAL_MESSAGE_LIST_STATE);
  const canViewMessages = usePermissions(PERMISSION_KEYS.MESSAGING, PERMISSIONS.READ);

  const socket = useContext(SocketContext);

  const lastRequestedSubjectIdList = useRef(null);

  useEffect(() => {
    if (!!canViewMessages) {
      const handleRealtimeMessage = ({ data: msg }) => {
        if (!!lastRequestedSubjectIdList.current &&
        lastRequestedSubjectIdList.current.includes(extractSubjectFromMessage(msg)?.id)
        ) {
          if (msg.read) {
            dispatch(removeMessageById(msg.id));
          } else {
            dispatch(updateMessageFromRealtime(msg));
          }
        }
      };

      socket.on('radio_message', handleRealtimeMessage);

      return () => {
        socket.off('radio_message', handleRealtimeMessage);
      };
    }
  }, [canViewMessages, socket]);

  useEffect(() => {
    if (map && !!canViewMessages) {
      const source = map.getSource(SOURCE_ID);
      const layer = map.getLayer(LAYER_ID);

      const hasSource = !!source;
      const hasLayer = !!layer;

      const data = calcMapMessages(state.results, subjectFeatureCollection);

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
  }, [canViewMessages, map, state.results, subjectFeatureCollection]);

  useEffect(() => {
    if (!!canViewMessages) {

      const requestMapMessages = async () => {
        try {
          if (subjectFeatureCollection.features.length) {
            const mapBboxParams = await getBboxParamsFromMap(map, false);
            const mapBboxPolygon = bboxPolygon(mapBboxParams);

            const toRequest = subjectFeatureCollection.features /* only request messages for subjects within the current bbox */
              .filter(feature => booleanContains(mapBboxPolygon, feature))
              .map(({ properties: { id } }) => id)
              .join(',');


            if (toRequest.length && (toRequest !== lastRequestedSubjectIdList.current)) {
              fetchMessages({ read: false, subject_id: toRequest })
                .then((response) => {
                  dispatch(fetchMessagesSuccess(response?.data?.data));
                });
            }
            lastRequestedSubjectIdList.current = toRequest;
          }
        } catch (e) {
          console.warn('error getting messages', e);
        }
      };

      const handler = setTimeout(requestMapMessages, 300);
      return () => {
        clearTimeout(handler);
      };
    }
  }, [canViewMessages, map, subjectFeatureCollection.features]);



  useEffect(() => {
    if (!map.hasImage('message-badge') && !!canViewMessages) {
      addMapImage({ src: MessageBadgeIcon, id: 'message-badge', width: 36 });
    }
  }, [canViewMessages, map]);

  useEffect(() => {
    if (!!canViewMessages) {

      const onClick = (event) => {
        const layer = map.queryRenderedFeatures(event.point, { layers: [LAYER_ID] })[0];

        return onBadgeClick({ event, layer });
      };

      map.on('click', LAYER_ID, onClick);
      return () => {
        map.off('click', LAYER_ID, onClick);
      };
    }
  }, [canViewMessages, map, onBadgeClick]);

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