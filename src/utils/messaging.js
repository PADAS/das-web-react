import axios from 'axios';
import faker from 'faker';
import sample from 'lodash/sample';
import subDays from 'date-fns/sub_days';
import { store } from '../';
import { API_URL } from '../constants';

const MESSAGING_API_URL = `${API_URL}messaging`;

const { get, post } = axios;

export const extractSubjectFromMessage = (message) =>
  message.message_type === 'inbox' ? message.sender : message.receiver;

const fetchMessages = params => get(MESSAGING_API_URL, {
  params,
});

const fetchMessagesForId = (id, params) => get(`${MESSAGING_API_URL}/${id}`, {
  params,
});

const markMessageAsRead = id => post(`${MESSAGING_API_URL}/${id}/status`, {
  read: true,
});

export const generateNewMessage = (mapSubjects, config = {}) => {
  
  const types = ['inbox', 'outbox'];
  const statuses = ['pending', 'sent', 'errored', 'received'];

  const randomSubject = sample(mapSubjects);
  const subjectFromStore = store.getState()?.data.subjectStore[randomSubject.properties.id];
  const message_type = config.message_type || sample(types);
  const status = sample(statuses);

  const sender = message_type === 'inbox' ? subjectFromStore : null;
  const receiver = message_type === 'inbox' ? null : subjectFromStore;

  return {
    receiver,
    sender,
    message_type, 
    status,
    device_id : faker.random.uuid(), 
    id: faker.random.uuid(),
    read: false,
    text : faker.lorem.sentence(), 
    device_location: { latitude: randomSubject.geometry.coordinates[1], longitude: randomSubject.geometry.coordinates[0] }, 
    message_time: faker.date.between(subDays(new Date(), 13), new Date()),
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