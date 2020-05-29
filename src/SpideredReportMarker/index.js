import React, { createElement, Fragment, memo, useEffect, useRef, useState } from 'react';
import ReactDOMServer from 'react-dom/server';
import { connect } from 'react-redux';

import { calcImgIdFromUrlForMapImages } from '../utils/img';

const SpideredReportMarker = (props) => {
  const { mapImages, report } = props;
  const [imageAttributes, setImgAttributes] = useState(null);
  
  useEffect(() => {
    const storeImage = mapImages[
      calcImgIdFromUrlForMapImages(
        (report.image || report.image_url), report.width, report.height,
      )
    ];
    if (storeImage) {
      const attributes = {};
      for (var i=0;i<storeImage.attributes.length;i++) {
        const { nodeName, nodeValue } = storeImage.attributes.item(i);
        attributes[nodeName] = nodeValue;
      }
      setImgAttributes(attributes);
    }
  }, [mapImages, report.height, report.image, report.image_url, report.width]);


  
  return <Fragment>
    {!!imageAttributes && <img alt='wow' {...imageAttributes} />}
    {/* calc title with date to go here */}
    {/* style up to be a close match */}
    {/* increase zoom threshold tolerance for declustering, line up w/spiderification behavior */}
  </Fragment>;
};

const mapStateToProps = ({ view: { mapImages } }) => ({
  mapImages,
});


export default connect(mapStateToProps, null)(memo(SpideredReportMarker));