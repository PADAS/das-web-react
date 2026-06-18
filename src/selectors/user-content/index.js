import { createSelector, weakMapMemoize } from 'reselect';

const selectUserContent = (state) => state.data.userContent;

export const selectUploadStatesByIds = createSelector(
  [selectUserContent, (_, uploadIds) => uploadIds],
  (userContent, uploadIds) => Object.fromEntries(
    uploadIds.filter((uploadId) => uploadId in userContent).map((uploadId) => [uploadId, userContent[uploadId]])
  ),
  { memoize: weakMapMemoize }
);
