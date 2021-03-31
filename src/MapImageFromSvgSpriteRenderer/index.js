import React, { memo, useEffect, useCallback, useRef, useState } from 'react';
import axios from 'axios';
import { connect } from 'react-redux';
import { calcIconColorByPriority } from '../utils/event-types';
import { displayEventTypes } from '../selectors/events';

import html2canvas from 'html2canvas';
import drop from 'lodash/drop';
import unionBy from 'lodash/unionBy';

import { errorIsHttpError } from '../utils/request';

import EventIcon from '../EventIcon';

const calcSvgImageIconId = (icon_id, priority = 0, height = 'x', width = 'x') => {
  return `${icon_id}-${priority}-${width}-${height}`;
};

const fetchSpriteImage = (icon_id) => axios.get(`${process.env.REACT_APP_DAS_HOST}/static/sprite-src/${icon_id}.svg`, 
  {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    },
    responseType: 'text',
  });

const MapImageFromSvgSpriteRenderer = (props) => {
  const { eventTypes, reports = [] } = props;

  const requestsToIgnore = useRef({});

  const matchingTypes = reports
    .map((report) => {
      const reportTypeIconId = eventTypes.find(({ value }) => value === report.event_type)?.icon_id ?? 'generic';
      const svgImageIconId = calcSvgImageIconId(reportTypeIconId, report.priority, report.width, report.height);

      return { report, svgImageIconId, reportTypeIconId };

    }, [])
    .filter(({ report, svgImageIconId, reportTypeIconId }) => {
      return !requestsToIgnore.current[svgImageIconId];
    });


  if (!!matchingTypes.length) {
    fetchSpriteImage(matchingTypes[0].reportTypeIconId)
      .then((response) => {
        console.log({ response });
        requestsToIgnore.current[matchingTypes[0].svgImageIconId] = response;

        const color = calcIconColorByPriority(matchingTypes[0].report);

        /* programmatically set fill */
        /* save to cache of requests to ignore */
        /* set feature property to be accessed by style expression somehow??? */
        /* add to map if necessary */
      })
      .catch((error) => {
        if (/4[0-9][0-9]/.test(error?.response?.status)) {
          requestsToIgnore.current[matchingTypes[0].svgImageIconId] = true; /* ignore missing images, this is expected */
        } else {
          return new Error(error);
        }
      });
  }

  return null;
  
};

const mapStateToProps = (state) => ({ eventTypes: displayEventTypes(state) });


export default connect(mapStateToProps, null)(memo(MapImageFromSvgSpriteRenderer));