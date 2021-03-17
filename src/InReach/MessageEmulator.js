import React, { memo, useCallback, useEffect, useMemo, useContext, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { connect } from 'react-redux';
import sample from 'lodash/sample';
import booleanIntersects from '@turf/boolean-intersects';
import bboxPolygon from '@turf/bbox-polygon';
import { generateNewMessage } from '../utils/messaging';

import { getBboxParamsFromMap } from '../utils/query';

import MessageContext from './context';

import { newMessage, fetchMessagesSuccess } from '../ducks/messaging';

import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';

import styles from './styles.module.scss';

const getMessage = (mapSubjects, map) => generateNewMessage(mapSubjects);

const MessageEmulator = (props) => {
  const { map, mapSubjects } = props;

  const [hiddenState, setHiddenState] = useState(true);

  const hasMapSubjects = !!mapSubjects?.features?.length;

  const sampleableMapSubjects = useMemo(() => {
    if (!map || !hasMapSubjects) return null;
    const bboxPoly = bboxPolygon(
      getBboxParamsFromMap(map, false)
    );

    return mapSubjects.features.filter(feature => booleanIntersects(bboxPoly, feature));

  }, [hasMapSubjects, map, mapSubjects.features]);

  const { state, dispatch } = useContext(MessageContext);

  const getMsg = useCallback(() => {
    const msg = getMessage(sampleableMapSubjects, map);

    dispatch(newMessage(msg));

  }, [dispatch, map, sampleableMapSubjects]);


  const getBulkMsg = useCallback(() => {
    const messages = new Array(10);

    for (let i = 0; i < messages.length; i++) {
      messages[i] = getMessage(sampleableMapSubjects, map);
    }

    dispatch(fetchMessagesSuccess(messages));
  }, [dispatch, map, sampleableMapSubjects]);

  /*  const sendMsg = useCallback(() => {
    const msg = sendMessage(mapSubjects);

  }, [mapSubjects]); */

  useEffect(() => {
    const handleKeyDown = (event) => {
      const { ctrlKey, shiftKey, keyCode } = event;

      if (ctrlKey && shiftKey && keyCode === 71) {
        setHiddenState(!hiddenState);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [hiddenState]);
  
  return <div className={`${styles.emulator} ${hiddenState ? styles.hidden : ''}`}>
    <h3>Radio Message Emulator</h3>
    <div className={styles.buttons}>
      <Button variant='primary' disabled={!sampleableMapSubjects?.length} onClick={getMsg} type='button'>Get Message</Button>
      <Button variant='primary' disabled={!sampleableMapSubjects?.length} onClick={getBulkMsg} type='button'>Get 10 Messages</Button>
    </div>
    {/* <Button variant='primary' disabled={!hasMapSubjects} onClick={sendMsg} type='button'>Send Message</Button> */}
  </div>;
};

const mapStateToProps = (state) => ({
  mapSubjects: getMapSubjectFeatureCollectionWithVirtualPositioning(state),
});

export default connect(mapStateToProps, null)(memo(MessageEmulator));


/* 
sender_id: faker.random.uuid(), 
receiver_id: faker.random.uuid(), 
device_id : faker.random.uuid(), 
message_type : 'inbox', 
text : faker.lorem.sentence(), 
status : sample(['pending', 'sent', 'errored', 'received']),
sender_address: faker.internet.ip(), 
device_location: [faker.address.longitude(), faker.address.latitude()], 
message_time: faker.time.recent(),
additional:{}

 */