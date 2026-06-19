import axios from 'axios';
import { Buffer } from 'buffer';
import i18next from 'i18next';

import { showToast } from '../toast';

export const convertFileListToArray = (list) => Array.from(list ?? []);

export const fetchImageAsBase64FromUrl = async (url) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const contentType = response.headers?.['content-type'] ?? 'image/png';

  return `data:${contentType};base64,${Buffer.from(response.data).toString('base64')}`;
};

export const filterDuplicateUploadFilenames = (currentFiles, newFilesToUpload) => {
  const t = i18next.getFixedT(null, 'utils', 'filterDuplicateUploadFilenames');

  return newFilesToUpload.filter((file) => {
    const filenameAlreadyExists = currentFiles
      .some((currentFile) => (currentFile.name || currentFile.filename) === file.name);
    if (filenameAlreadyExists) {
      showToast({ message: t('duplicationAlert', { fileName: file.name }) });
    }

    return !filenameAlreadyExists;
  });
};
