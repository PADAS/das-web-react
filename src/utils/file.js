import { post } from 'axios';

export const uploadFiles = (url, files, progressHandler = () => null) => {
  const formData = new FormData();
  files.forEach((file) => {
    formData.append('file', file, file.name);
  });
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
