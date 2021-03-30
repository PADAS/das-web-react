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

const fetchSpriteImage = (icon_id) => axios.get(`${process.env.REACT_APP_DAS_HOST}/static/sprite-src/${icon_id}.svg`, 
  {
    headers: {
      Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
    }
  });

const MapImageFromSvgSpriteRenderer = (props) => {
  const { eventTypes, reports = [] } = props;
  const [reportsToProcess, updateReportsToProcess] = useState([]);

  const failedRequests = useRef({});

  const matchingTypes = reports.map((report) => {
    return eventTypes.find(({ value }) => value === report.event_type)?.icon_id ?? 'generic';
  }, []).filter(icon_id => !failedRequests.current[icon_id]);

  console.log({ matchingTypes });

  if (!!matchingTypes.length) {
    fetchSpriteImage(matchingTypes[0])
      .then((response) => {
        console.log({ response });
      })
      .catch((error) => {
        if (/4[0-9][0-9]/.test(error?.response?.status)) {

        }
      });
  }

  return null;
  
};

const mapStateToProps = (state) => ({ eventTypes: displayEventTypes(state) });


export default connect(mapStateToProps, null)(memo(MapImageFromSvgSpriteRenderer));