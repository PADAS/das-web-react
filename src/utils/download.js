import axios, { CancelToken } from 'axios';
import { createWriteStream } from 'streamsaver';

import { uuid } from '../utils/string';
const { get } = axios;

export const downloadFileFromUrl = async (url, params = {}, { token:cancelToken } = CancelToken.source()) => {
  const { data, headers } = await get(url, {
    cancelToken,
    params,
    responseType: 'blob',
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


export const downloadFileStreamFromUrl = async (url, params = {}, { token:cancelToken } = CancelToken.source()) => {
  const response = await get(url, {
    cancelToken,
    params,
    responseType: 'stream',
  }).catch(e => console.log('error downloading file stream', e));

  const { data, headers } = response;

  const fileStream = createWriteStream(headers['x-das-download-filename']);
  const writer = fileStream.getWriter();

  if (data.pipeTo) {
    writer.releaseLock();
    return data.pipeTo(fileStream);
  }

  const reader = data.getReader();
  const pump = () => reader
    .read()
    .then(({ value, done }) => (done ? writer.close() : writer.write(value).then(pump)));

  return pump();
};

