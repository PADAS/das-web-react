import React, { memo, useCallback, useEffect, useState } from 'react';
import cloneDeep from 'lodash/cloneDeep';

import { calcImgIdFromUrlForMapImages } from '../utils/img';
import { addTitleWithDateToGeoJson, getEventTypeTitle } from '../utils/map';

import styles from './styles.module.scss';

const SpideredReportMarker = (props) => {
  const { eventTypes, mapImages, report, onClick, ...rest } = props;
  const [imageAttributes, setImgAttributes] = useState(null);
  const [displayTitle, setDisplayTitle] = useState('');
  
  const handleClick = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();

    onClick(report);
  }, [onClick, report]);
  
  useEffect(() => {
    const storeImage = mapImages[
      calcImgIdFromUrlForMapImages(
        (report.image || report.image_url), report.width, report.height,
      )
    ];
    if (storeImage) {
      const attributes = {};
      for (var i=0;i<storeImage.image.attributes.length;i++) {
        const { nodeName, nodeValue } = storeImage.image.attributes.item(i);
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
    setDisplayTitle(addTitleWithDateToGeoJson({ properties: cloneDeep(report) }, displayTitle).properties.display_title);
  }, [eventTypes, report]);


  
  return <div className={styles.marker} onClick={handleClick} {...rest}>
    {!!imageAttributes && <img alt='wow' {...imageAttributes} />}
    <h6>{displayTitle}</h6>
    {/* increase zoom threshold tolerance for declustering, line up w/spiderification behavior */}
  </div>;
};

export default memo(SpideredReportMarker);