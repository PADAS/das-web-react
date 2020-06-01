import React, { memo, useEffect, useState } from 'react';
import { connect } from 'react-redux';

import { calcImgIdFromUrlForMapImages } from '../utils/img';
import { addTitleWithDateToGeoJson, getEventTypeTitle } from '../utils/map';

import styles from './styles.module.scss';

const SpideredReportMarker = (props) => {
  const { eventTypes, mapImages, report } = props;
  const [imageAttributes, setImgAttributes] = useState(null);
  const [displayTitle, setDisplayTitle] = useState('');
  
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
        if (nodeName === 'crossorigin') {
          attributes.crossOrigin = nodeValue;
        } else {
          attributes[nodeName] = nodeValue;
        }
      }
      setImgAttributes(attributes);
    }
  }, [mapImages, report.height, report.image, report.image_url, report.width]);

  useEffect(() => {
    const { title, event_type } = report;
    const displayTitle = title || getEventTypeTitle(eventTypes, event_type);
    setDisplayTitle(addTitleWithDateToGeoJson({ properties: { ...report } }, displayTitle).properties.display_title);
  }, [eventTypes, report]);


  
  return <div className={styles.marker}>
    {!!imageAttributes && <img alt='wow' {...imageAttributes} />}
    <h6>{displayTitle}</h6>
    {/* style up to be a close match */}
    {/* increase zoom threshold tolerance for declustering, line up w/spiderification behavior */}
  </div>;
};

const mapStateToProps = ({ data: { eventTypes }, view: { mapImages } }) => ({
  eventTypes,
  mapImages,
});


export default connect(mapStateToProps, null)(memo(SpideredReportMarker));