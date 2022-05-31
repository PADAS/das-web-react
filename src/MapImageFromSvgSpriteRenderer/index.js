import React, { memo, useRef } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { calcIconColorByPriority } from '../utils/event-types';
import { calcUrlForImage, imgElFromSrc } from '../utils/img';
import { addImageToMapIfNecessary } from '../ducks/map-images';

import { DAS_HOST, MAP_ICON_SIZE, MAP_ICON_SCALE } from '../constants';

export const calcSvgImageIconId = ({ icon_id, priority, height, width }) => {
  let string = `${icon_id}`;

  [priority, height, width]
    .filter(item => item === 0 || !!item)
    .forEach((item) => {
      string+=`-${item}`;
    });

  return string;
};

const fetchSpriteImage = (icon_id) => axios.get(`${DAS_HOST}/static/sprite-src/${icon_id}.svg`,
  {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
    responseType: 'text',
  }
);

const imageElFromSvgString = (svgString, report) => {

  const { height, priority, width = MAP_ICON_SIZE } = report;
  const color = calcIconColorByPriority(priority);

  const parser = new DOMParser();
  const doc = parser.parseFromString(svgString, 'image/svg+xml');
  const svgEl = doc.documentElement;

  svgEl.style.fill = `${color} !important`;
  svgEl.setAttribute('fill', color);

  const svgContent = svgEl.querySelectorAll('*');

  svgContent.forEach((item) => {
    const attributesToRemove = ['class', 'style', 'fill', 'stroke'];
    attributesToRemove.forEach(attr => item.removeAttribute(attr));
  });

  var xml = (new XMLSerializer()).serializeToString(svgEl);
  const withStyleElRemoved = xml.replace(/<style>.*?<\/style>/g, '');

  const blob = new Blob([withStyleElRemoved], { type: 'image/svg+xml' });
  const url = URL.createObjectURL(blob);

  return imgElFromSrc(
    url,
    width * MAP_ICON_SCALE,
    (height ? (height * MAP_ICON_SCALE) : undefined),
  );
};

const getImageAssemblyDataFromReport = (report) => {
  const reportTypeIconId = report.icon_id || 'generic';
  const icon_id = calcSvgImageIconId(report);
  const color = calcIconColorByPriority(report.priority);

  return { color, report, icon_id, reportTypeIconId };
};

const MapImageFromSvgSpriteRenderer = (props) => {
  const { addImageToMapIfNecessary, mapImages, reportFeatureCollection = { features: [] } } = props;

  const reports = reportFeatureCollection.features.map(({ properties }) => properties);
  const spriteCache = useRef({});
  const ongoingRequests = useRef({});

  const reportImageAssemblyData = reports
    .map(getImageAssemblyDataFromReport)
    .filter(({ icon_id }) => !mapImages[icon_id]);

  const toRequest = reportImageAssemblyData
    .filter(({ reportTypeIconId }) =>
      !spriteCache.current[reportTypeIconId]
    );

  const toGenerateFromCache = reportImageAssemblyData
    .filter(({ reportTypeIconId }) =>
      !!spriteCache.current[reportTypeIconId]
    );

  toRequest.forEach(({ report, icon_id, reportTypeIconId }) => {
    if (!ongoingRequests.current[reportTypeIconId]) {
      ongoingRequests.current[reportTypeIconId] = fetchSpriteImage(reportTypeIconId);
    }

    ongoingRequests.current[reportTypeIconId]
      .then((response) => {
        spriteCache.current[reportTypeIconId] = response.data;

        return imageElFromSvgString(response.data, report);
      })
      .then((image) => {
        addImageToMapIfNecessary({ icon_id, image });
      })
      .catch((error) => {
        if (/4[0-9][0-9]/.test(error?.response?.status)) {
          /* not in the sprite, fetch from the url instead */
          const iconSrc = calcUrlForImage(report.image);

          const { height, width = MAP_ICON_SIZE } = report;

          imgElFromSrc(
            iconSrc,
            width * MAP_ICON_SCALE,
            (height ? (height * MAP_ICON_SCALE) : undefined),
          )
            .then((image) => {
              addImageToMapIfNecessary({ icon_id, image });
            })
            .catch((error) => {
              console.warn('imgElFromSrc error', error);
            });


        } else {
          delete spriteCache.current[reportTypeIconId];
          console.warn('error generating image for report', error);
        }
      })
      .finally(() => {
        delete ongoingRequests.current[reportTypeIconId];
      });

  });

  toGenerateFromCache.forEach(({ icon_id, reportTypeIconId, report }) => {
    imageElFromSvgString(spriteCache.current[reportTypeIconId], report)
      .then((image) => {
        addImageToMapIfNecessary({ icon_id, image });
      })
      .catch((error) => {
        console.warn('error generating image from cache', error);
      });
  });

  return null;

};

const mapStateToProps = ({ view: { mapImages } }) => ({
  mapImages,
});


export default connect(mapStateToProps, { addImageToMapIfNecessary })(memo(MapImageFromSvgSpriteRenderer));
