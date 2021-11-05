import React, { memo, useEffect } from 'react';
import { getUnaddedMapImages } from './selectors';
import { connect } from 'react-redux';


const MapImagesLayer = (props) => {
  const { map, newMapImages } = props;

  useEffect(() => {
    newMapImages.forEach(({ id, data: { image, options } }) => {
      map.addImage(id, image, options);
    });
  }, [map, newMapImages]);

  return null;
};

const mapStateToProps = (state, props) => ({
  newMapImages: getUnaddedMapImages(state, props),
});

export default connect(mapStateToProps, null)(memo(MapImagesLayer));