import { createSelector } from 'reselect';

const selectUserContent = (state) => state.data.userContent;

export const selectUploadStatesByIds = createSelector(
  [selectUserContent, (_, uploadIds) => uploadIds],
  (userContent, uploadIds) =>
    Object.fromEntries(uploadIds.map((uploadId) => [uploadId, userContent[uploadId]]))
);