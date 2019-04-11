import axios from 'axios';
import { createWriteStream } from 'streamsaver';

import { uuid } from '../utils/string';
const { get } = axios;

export const downloadFileFromUrl = async (url) => {
  const { data, headers } = await get(url, {
    responseType: 'blob'
  })
    .catch(error => console.log('error downloading file', error));
  const link = document.createElement('a');

  link.href = window.URL.createObjectURL(new Blob([data], { type: headers['Content-Type'] }));
  link.id = uuid();
  link.setAttribute('download', headers['x-das-download-filename']);

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(document.getElementById(link.id));
};


export const downloadFileStreamFromUrl = async (url) => {
  const response = await get(url, {
    responseType: 'stream',
  }).catch(e => console.log('error downloading file stream', e));

  const { body, data, headers } = response;

  const fileStream = createWriteStream(headers['x-das-download-filename']);
  const writer = fileStream.getWriter();

  if (data.pipeTo) {
    writer.releaseLock();
    return data.pipeTo(fileStream);
  }

  const reader = body.getReader();
  const pump = () => reader
    .read()
    .then(({ value, done }) => (done ? writer.close() : writer.write(value).then(pump)));

  return pump();
};

