import { get } from 'axios';
import toString from 'lodash/toString';

export const getBboxParamsFromMap = map => toString(Object.entries(map.getBounds()).reduce((accumulator, [, { lng, lat }]) => [...accumulator, lng, lat], []));

export const recursivePaginatedQuery = (initialQuery, cancelToken = null, resultsToDate = []) => {
  return new Promise(async (resolve, reject) => {
    try {
      const { data: { data: res } } = await initialQuery;
      const { results, next } = res;
      const config = {};

      if (cancelToken) config.cancelToken = cancelToken;
      if (next) {
        const finalValues = await recursivePaginatedQuery(get(next, config), cancelToken, [...resultsToDate, ...results]);
        resolve(finalValues);
      } else {
        resolve([...resultsToDate, ...results]);
      }
    } catch (e) {
      reject(e);
    }
  });
}
