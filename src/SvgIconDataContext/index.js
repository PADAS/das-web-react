import React, { createContext, useCallback, useMemo, useRef, useState } from 'react';
import axios from 'axios';

import { DAS_HOST } from '../constants';

export const SvgIconContext = createContext({});

const fetchSvgIconAsString = (iconId, requestCache, errorCache) => {
  const REQUEST_URLS = {
    STATIC: `${DAS_HOST}/static`,
    SPRITE: `${DAS_HOST}/static/sprite-src`,
  };

  const request = axios.get(`${REQUEST_URLS.SPRITE}/${iconId}.svg`,
    {
      headers: {
        Accept: 'image/svg+xml,image/*,*/*;q=0.8',
      },
      responseType: 'text',
    }
  )
    .catch((error) => {
      errorCache[iconId] = error;

      return Promise.reject(error);
    });

  requestCache[iconId] = request;

  return request;
};

const SvgIconContextProvider = ({ children }) => {
  const [svgIconData, setSvgIconData] = useState({});

  const ongoingRequests = useRef({});
  const requestErrorCache = useRef({});

  const addSvgIconData = useCallback((iconId, svgString) => {
    setSvgIconData({
      ...svgIconData,
      [iconId]: svgString,
    });
  }, [svgIconData]);

  const fetchSvgIconData = useCallback(async (iconId) => {

    if (requestErrorCache.current[iconId]) return Promise.reject('icon not available', iconId);

    const request = ongoingRequests.current[iconId] || fetchSvgIconAsString(iconId, ongoingRequests.current, requestErrorCache.current);

    const { data } = await request
      .catch((error => {
        console.log('fuck you', error);
      }));

    ongoingRequests.current[iconId] = null;

    addSvgIconData(iconId, data);

    return Promise.resolve(data);
  }, [addSvgIconData]);

  const value = useMemo(() => ({
    addSvgIconData,
    fetchSvgIconData,
    svgIconData,
  }), [addSvgIconData, fetchSvgIconData, svgIconData]);


  return <SvgIconContext.Provider value={value}>
    {children}
  </SvgIconContext.Provider>;
};

export default SvgIconContextProvider;