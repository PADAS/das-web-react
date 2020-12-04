import React, { memo, useState, useEffect } from 'react';
import { Image } from '../PatrolStartStopLayer/node_modules/react-mapbox-gl';
import { connect } from 'react-redux';

const MapImagesLayer = (props) => {
  const { mapImages } = props;

  const [images, setImages] = useState([]);

  useEffect(() => {
    setImages(Object.entries(mapImages).map(([id, { image, options }]) => ({ id, image, options })));
  }, [mapImages]);
  
  return images.map(({ id, image, options }) => <Image id={id} data={image} options={options} key={id} />);
  
};

const mapStateToProps = ({ view: { mapImages } }) => ({
  mapImages,
});

export default connect(mapStateToProps, null)(memo(MapImagesLayer));