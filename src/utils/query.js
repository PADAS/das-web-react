import { get } from 'axios';
import toString from 'lodash/toString';

import bbox from '@turf/bbox';
import buffer from '@turf/buffer';
import bboxPolygon from '@turf/bbox-polygon';

export const getBboxParamsFromMap = (map, padding = 5, asString = true) => {
  const bounds = Object.entries(map.getBounds()).reduce((accumulator, [, { lng, lat }]) => [...accumulator, lng, lat], []);

  const asPolygon = bboxPolygon(bounds);
  const withBuffer = buffer(asPolygon, padding);
  const asBounds = bbox(withBuffer);

  return asString ? toString(asBounds) : asBounds;
};

export const recursivePaginatedQuery = (initialQuery, cancelToken = null, onEach = null, resultsToDate = []) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data: { data: res } } = await initialQuery;
      const { results, next } = res;
      onEach && onEach(results);
      const config = {};

      if (cancelToken) config.cancelToken = cancelToken;
      if (next) {
        const finalValues = await recursivePaginatedQuery(get(next, config), cancelToken, onEach, [...resultsToDate, ...results]);
        resolve(finalValues);
      } else {
        resolve([...resultsToDate, ...results]);
      }
    } catch (e) {
      reject(e);
    }
  });
};
