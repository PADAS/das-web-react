import { createSelector } from 'reselect';

const getMapImages = ({ view: { mapImages } }) => mapImages;
const getMapFromProps = (_state, props) => props.map;

const getMapImageList = createSelector(
  [getMapImages],
  (mapImages) => Object.entries((mapImages)).map(([key, value]) => ({
    id: key, data: value,
  }))
);

export const getUnaddedMapImages = createSelector([getMapImageList, getMapFromProps],
  (mapImages, map) => {
    if (!map) return [];
    return mapImages
      .filter(({ id }) =>
        !map.hasImage(id)
      );
  }
);