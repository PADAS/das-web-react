import axios from 'axios';
import sample from 'lodash/sample';
import subDays from 'date-fns/sub_days';
import { store } from '../';
import { API_URL } from '../constants';

const MESSAGING_API_URL = `${API_URL}messaging`;

const { get, post } = axios;

export const extractSubjectFromMessage = (message) =>
  message.message_type === 'inbox' ? message.sender : message.receiver;

export const generateNewMessage = ({ geometry, properties }, config = {}) => {
  const sender = store.getState().data.subjectStore[properties.id];

  const hasCoords = geometry?.coordinates;

  return {
    sender,
    message_type: 'outbox', 
    message_time: new Date().toISOString(),
    device_location: hasCoords ? { latitude: geometry?.coordinates?.[1], longitude: geometry?.coordinates?.[0] } : null, 
    ...config,
  };
};

export const calcSenderNameForMessage = (message) => message?.sender?.name ?? message?.sender?.username ?? 'Operator';
