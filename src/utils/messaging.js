import axios from 'axios';
import faker from 'faker';
import sample from 'lodash/sample';

const MESSAGING_API_URL = 'whatever';

const { get, post } = axios;

const fetchMessages = (params) => get(MESSAGING_API_URL, {
  params,
});

const fetchMessagesForId = (id, params) => get(`${MESSAGING_API_URL}/${id}`, {
  params,
});

const markMessageAsRead = (id) => post(`${MESSAGING_API_URL}/${id}/status`, {
  read: true,
});

export const generateNewMessage = (mapSubjects, config = {}) => {
  
  const randomSubject = sample(mapSubjects);

  return {
    receiver_id: randomSubject.properties.id, 
    device_id : faker.random.uuid(), 
    id: faker.random.uuid(),
    message_type : 'inbox', 
    read: false,
    text : faker.lorem.sentence(), 
    status : sample(['pending', 'sent', 'errored', 'received']),
    device_location: { latitude: randomSubject.geometry.coordinates[1], longitude: randomSubject.geometry.coordinates[0] }, 
    message_time: new Date().toISOString(),
    additional: {},
    ...config,
  };
};


/* 
{
      sender_id:" ", 
      receiver_id:" ", 
      device_id :" ", 
      message_type : "inbox", 
      text : " sample text",  
      status : "received",  // pending, sent, errored, received
      sender_address: " ", 
      device_location: " ", 
      message_time: " ",
      additional:{}
}

 */