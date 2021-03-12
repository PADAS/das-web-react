import axios from 'axios';

const MESSAGING_API_URL = 'whatever';

const { get, post } = axios;

export const fetchMessages = (params) => get(MESSAGING_API_URL, {
  params,
});

export const fetchMessagesForId = (id, params) => get(`${MESSAGING_API_URL}/${id}`, {
  params,
});

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