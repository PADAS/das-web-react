import { post, get } from 'axios';
import { Buffer } from 'buffer';

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

export const fetchImageAsBase64FromUrl = async (url) => {
  const response = await get(url, {
    responseType: 'arraybuffer',
  });

  return `data:image/png;base64, ${new Buffer.from(response.data, 'binary').toString('base64')}`;
};

export const filterDuplicateUploadFilenames = (currentFiles, newFilesToUpload) => newFilesToUpload.filter((file) => {
  const { name } = file;
  const filenameAlreadyExists = currentFiles.some(({ name: n }) => n === name);

  if (filenameAlreadyExists) {
    window.alert(`Can not add ${name}: 
        file already exists`);
  }
  return !filenameAlreadyExists;
});