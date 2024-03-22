import axios, { CancelToken } from 'axios';

import { uuid } from './string';
const { get } = axios;

export const downloadFileFromUrl = async (url, { params = {}, filename = null }, { token: cancelToken } = CancelToken.source()) => {
  const { data, headers } = await get(url, {
    cancelToken,
    params,
    responseType: 'blob',
  })
    .catch((error) => {
      console.log('error downloading file', error);
    });
  const link = document.createElement('a');

  const objectUrl = window.URL.createObjectURL(new Blob([data], { type: headers['Content-Type'] }));

  link.href = objectUrl;
  link.id = uuid();
  link.setAttribute('download', filename ? filename : headers['x-das-download-filename']);

  document.body.appendChild(link);

  link.click();

  URL.revokeObjectURL(objectUrl);

  document.body.removeChild(document.getElementById(link.id));
};
