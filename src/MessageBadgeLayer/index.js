import { useEffect, useContext, useReducer, useRef, memo } from 'react';
import { bboxPolygon, booleanContains, featureCollection } from '@turf/turf';
import { useSelector } from 'react-redux';

import MessageBadgeIcon from '../common/images/icons/map-message-badge-icon.png';

import { addMapImage } from '../utils/map';
import { extractSubjectFromMessage } from '../utils/messaging';
import { getBboxParamsFromMap } from '../utils/query';
import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';
import { MapContext } from '../MapContext';
import {
  fetchAllMessages,
  fetchMessagesSuccess,
  INITIAL_MESSAGE_LIST_STATE,
  messageListReducer,
  removeMessageById,
  updateMessageFromRealtime,
} from '../ducks/messaging';
import { SocketContext } from '../withSocketConnection';
import { useMessagesPermissions } from '../hooks/usePermissions';

const SOURCE_ID = 'MESSAGE_BADGES';
const LAYER_ID = `${SOURCE_ID}_LAYER`;

const MESSAGE_BADGE_LAYOUT = {
  'icon-anchor': 'bottom-left',
  'icon-ignore-placement': true,
  'icon-allow-overlap': true,
  'icon-image': 'message-badge',
  'icon-offset': [2, -0.35],
  'icon-size': 0.5,
  'text-field': '{unread_message_count}',
  'text-offset': [2, -0.65],
  'text-size': 14,
};

const MESSAGE_BADGE_PAINT = {
  'text-halo-color': 'white',
  'text-halo-width': 0.2,
  'text-color': 'white',
};

const calcMapMessages = (messages = [], subjectFeatureCollection) => {
  if (!messages.length || !subjectFeatureCollection?.features?.length) return featureCollection([]);

  const subjectFeaturesWithUnreadMessages =
    subjectFeatureCollection.features
      .map(feature =>
        ({
          feature, messages: messages
            .filter(msg =>
              extractSubjectFromMessage(msg)?.id === feature.properties.id
            )
            .filter(msg => !msg.read)
        }))
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

const MessageBadgeLayer = ({ onBadgeClick }) => {
  const map = useContext(MapContext);
  const socket = useContext(SocketContext);

  const subjectFeatureCollection = useSelector(getMapSubjectFeatureCollectionWithVirtualPositioning);

  const { hasMessagesReadPermission } = useMessagesPermissions();

  const lastRequestedSubjectIdList = useRef(null);

  const [state, dispatch] = useReducer(messageListReducer, INITIAL_MESSAGE_LIST_STATE);

  useEffect(() => {
    if (!!hasMessagesReadPermission) {
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

      const [, fnRef] = socket.on('radio_message', handleRealtimeMessage);

      return () => {
        socket.off('radio_message', fnRef);
      };
    }
  }, [hasMessagesReadPermission, socket]);

  useEffect(() => {
    if (map && hasMessagesReadPermission) {
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
          layout: MESSAGE_BADGE_LAYOUT,
          paint: MESSAGE_BADGE_PAINT,
        });
      }
    }
  }, [hasMessagesReadPermission, map, state.results, subjectFeatureCollection]);

  useEffect(() => {
    if (hasMessagesReadPermission) {
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
              fetchAllMessages({ read: false, subject_id: toRequest })
                .then((results = []) => {
                  dispatch(fetchMessagesSuccess({ results }));
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
  }, [hasMessagesReadPermission, map, subjectFeatureCollection.features]);

  useEffect(() => {
    if (!map.hasImage('message-badge') && hasMessagesReadPermission) {
      addMapImage({ src: MessageBadgeIcon, id: 'message-badge', width: 36 });
    }
  }, [hasMessagesReadPermission, map]);

  useEffect(() => {
    if (hasMessagesReadPermission) {
      const onClick = (event) => {
        const layer = map.queryRenderedFeatures(event.point, { layers: [LAYER_ID] })[0];

        return onBadgeClick({ event, layer });
      };

      map.on('click', LAYER_ID, onClick);
      return () => {
        map.off('click', LAYER_ID, onClick);
      };
    }
  }, [hasMessagesReadPermission, map, onBadgeClick]);

  return null;
};

export default memo(MessageBadgeLayer);
