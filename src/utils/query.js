import { get } from 'axios';
import toString from 'lodash/toString';

import bbox from '@turf/bbox';
import buffer from '@turf/buffer';
import bboxPolygon from '@turf/bbox-polygon';
import distance from '@turf/distance';
import { point } from '@turf/helpers';

export const getBboxParamsFromMap = (map, asString = true) => {

  const mapBounds = map.getBounds();
  
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
