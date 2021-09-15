import { get, isCancel } from 'axios';
import toString from 'lodash/toString';
import isEmpty from 'lodash/isEmpty';
import isNil from 'lodash/isNil';

import bbox from '@turf/bbox';
import buffer from '@turf/buffer';
import bboxPolygon from '@turf/bbox-polygon';
import distance from '@turf/distance';
import { point } from '@turf/helpers';

import { waitForMapBounds } from './map';

export const getBboxParamsFromMap = async (map, asString = true) => {
  const mapBounds = await waitForMapBounds(map);
  
  const asArray = Object.entries(mapBounds).reduce((accumulator, [, { lng, lat }]) => [...accumulator, lng, lat], []);
  const asPointArray = Object.entries(mapBounds).reduce((accumulator, [, { lng, lat }]) => [...accumulator, point([lng, lat])], []);

  const asPolygon = bboxPolygon(asArray);
  const bufferPadding = Math.max( // pad the bbox by 10% of the distance between the SW and NE points, with a 0.333km min and a 10km max
    Math.min(
      (distance(asPointArray[0], asPointArray[1]) / 10), 10
    ), 0.333,
  ); 
  const withBuffer = buffer(asPolygon, bufferPadding);

  const finalBounds = bbox(withBuffer);

  return asString ? toString(finalBounds) : finalBounds;
};

export const recursivePaginatedQuery = async (initialQuery, cancelToken = null, onEach = null, resultsToDate = []) => 
  initialQuery
    .then((response) => {
      if (response) {
        const { data: { data: res } } = response;
        const { results, next } = res;
        
        onEach && onEach(results);

        const config = {};
        if (cancelToken) config.cancelToken = cancelToken;

        if (next) {
          return recursivePaginatedQuery(get(next, config), cancelToken, onEach, [...resultsToDate, ...results]);
        }
        
        return [...resultsToDate, ...results];
      }
    })
    .catch((e) => {
      if (!isCancel(e)) {
        console.warn('recursive query failure', e);
      }
    });

export const cleanedUpFilterObject = (filter) =>
  Object.entries(filter)
    .reduce((accumulator, [key, value]) => {

      if (Array.isArray(value)) {
        return !!value.length ? {
          ...accumulator,
          [key]: value,
        } : accumulator;
      }

      if (!!value
      || (!isNil(value) && !isEmpty(value))) {
        return {
          ...accumulator,
          [key]: value,
        };
      }
      
      return accumulator;
    }, {});

export const objectToParamString = (obj) => {
  const props = Object.entries(obj);
  
  return props.reduce((params, [key, value], _index) => {
    if (Array.isArray(value)) {
      value.forEach((v, i) => {
        params.append(key, v);
      });
    } else if (typeof value === 'object') {
      params.append(key, JSON.stringify(value));
    } else {
      params.append(key, value);
    }
    return params;
  }, new URLSearchParams()).toString();
};
