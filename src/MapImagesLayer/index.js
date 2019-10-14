import React, { memo, useState, useEffect } from 'react';
import { Image } from 'react-mapbox-gl';
import { connect } from 'react-redux';

const MapImagesLayer = (props) => {
  const { mapImages } = props;

  const [images, setImages] = useState([]);

  useEffect(() => {
    setImages(Object.entries(mapImages).map(([id, data]) => ({ id, data })));
  }, [mapImages]);
  
  return images.map(({ id, data }) => <Image id={id} data={data} key={id} />);
  
};

const mapStateToProps = ({ view: { mapImages } }) => ({
  mapImages,
});

export default connect(mapStateToProps, null)(memo(MapImagesLayer));