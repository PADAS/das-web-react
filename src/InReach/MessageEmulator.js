import React, { connect, memo, useCallback } from 'react';
import faker from 'faker';
import sample from 'lodash/sample';

import { getMapSubjectFeatureCollectionWithVirtualPositioning } from '../selectors/subjects';

const MessageEmulator = (props) => {
  const { mapSubjects } = props;

  const generateNewMessage = useCallback(() => {
    if (!mapSubjects.features.length)
  });
  
  return <div>
    <h3>Send a radio message</h3>
    <button disabled={!mapSubjects.features.length} onClick={generateNewMessage} type='button'>New Message</button>
  </div>;
};

const mapStateToProps = (state) => ({
  mapSubjects: getMapSubjectFeatureCollectionWithVirtualPositioning(state),
});

export default connect()(memo(MessageEmulator));


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