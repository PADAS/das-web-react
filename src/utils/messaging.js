import store from '../store';

export const extractSubjectFromMessage = (message) =>
  message.message_type === 'inbox' ? message.sender : message.receiver;

export const messageIsValidForDisplay = (message, subjectStore) => {
  const subject = extractSubjectFromMessage(message);
  const { id } = subject;

  const subjectFromStore = subjectStore[id];

  return !!subjectFromStore?.messaging?.length;
};

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
