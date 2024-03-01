import { memo, useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';

import { MapContext } from '../App';

const MapImagesLayer = () => {
  const map = useContext(MapContext);

  const mapImages = useSelector((state) => state.view.mapImages);

  useEffect(() => {
    Object.entries(mapImages).forEach(([mapImageId, mapImageData]) => {
      if (!map.hasImage(mapImageId)) {
        map.addImage(mapImageId, mapImageData.image, mapImageData.options);
      }
    });
  }, [map, mapImages]);

  return null;
};

export default memo(MapImagesLayer);
