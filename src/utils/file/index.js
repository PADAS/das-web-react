import axios from 'axios';
import { Buffer } from 'buffer';
import i18next from 'i18next';

import { calcUrlForImage } from '../img';
import { showToast } from '../toast';

export const convertFileListToArray = (list) => Array.from(list ?? []);

export const fetchImageAsBase64FromUrl = async (url) => {
  const response = await axios.get(calcUrlForImage(url), { responseType: 'arraybuffer' });
  // Parameters such as `; charset=utf-8` are dropped: they would end up inside
  // the data url.
  const [contentType] = (response.headers?.['content-type'] ?? 'image/png').split(';');

  // The app's own index.html answers with a 200 to any unmatched path, so a
  // non-image body has to be rejected instead of encoded into a broken source.
  if (!contentType.startsWith('image/')) {
    throw new Error(`Expected an image from ${url}, got ${contentType}`);
  }

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
