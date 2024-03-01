import axios from 'axios';
import { Buffer } from 'buffer';
import i18next from 'i18next';

export const convertFileListToArray = (list) => {
  const array = [];
  for (var i = 0; i < list.length; i++) {
    array.push(list.item(i));
  }
  return array;
};

export const fetchImageAsBase64FromUrl = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });

  return `data:image/png;base64, ${new Buffer.from(response.data, 'binary').toString('base64')}`;
};

export const filterDuplicateUploadFilenames = (currentFiles, newFilesToUpload) => newFilesToUpload.filter((file) => {
  const t = i18next.getFixedT(null, 'utils', 'filterDuplicateUploadFilenames');

  const filenameAlreadyExists = currentFiles
    .some((currentFile) => (currentFile.name || currentFile.filename) === file.name);
  if (filenameAlreadyExists) {
    window.alert(t('duplicationAlert', { fileName: file.name }));
  }

  return !filenameAlreadyExists;
});
