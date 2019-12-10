import { post, get } from 'axios';

export const uploadFile = (url, file, progressHandler = () => null) => {
  const formData = new FormData();
  formData.append('file', file, file.name);
  return post(url, formData, {
    onUploadProgress(event) {
      progressHandler(event);
    },
  });
};

export const convertFileListToArray = (list) => {
  const array = [];
  for (var i = 0; i < list.length; i++) {
    array.push(list.item(i));
  }
  return array;
};

export const downloadFileFromUrl = (url, filename) => {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
};

export const fetchImageAsBase64FromUrl = async (url) => {
  const response = await get(url, {
    responseType: 'arraybuffer',
  });

  return `data:image/png;base64, ${new Buffer(response.data, 'binary').toString('base64')}`;
};