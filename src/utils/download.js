import axios, { CancelToken } from 'axios';

import { uuid } from './string';
const { get } = axios;

const triggerBlobDownload = (blob, filename) => {
  const link = document.createElement('a');

  const objectUrl = window.URL.createObjectURL(blob);

  link.href = objectUrl;
  link.id = uuid();
  link.setAttribute('download', filename);

  document.body.appendChild(link);

  link.click();

  URL.revokeObjectURL(objectUrl);

  document.body.removeChild(document.getElementById(link.id));
};

export const downloadFileFromUrl = async (url, { params = {}, filename = null }, { token: cancelToken } = CancelToken.source()) => {
  const { data, headers } = await get(url, {
    cancelToken,
    params,
    responseType: 'blob',
  })
    .catch((error) => {
      console.log('error downloading file', error);
    });

  triggerBlobDownload(new Blob([data], { type: headers['Content-Type'] }), filename ? filename : headers['x-das-download-filename']);
};

export const downloadJsonAsFile = (data, filename) => {
  triggerBlobDownload(new Blob([JSON.stringify(data)], { type: 'application/json' }), filename);
};
