import React, { useEffect, useMemo, useRef } from 'react';
import { Redirect, useLocation } from 'react-router-dom';

import { EXTERNAL_SAME_DOMAIN_ROUTES, REACT_APP_ROUTE_PREFIX } from '../constants';

const PathNormalizationRoute = () => {
  const { pathname } = useLocation();

  const externalRedirectRef = useRef(null);

  useEffect(() => {
    externalRedirectRef?.current?.click();
  });

  const localMatch = useMemo(() => EXTERNAL_SAME_DOMAIN_ROUTES.find(item => item === pathname), [pathname]);

  if (process.env.NODE_ENV !== 'production' || !localMatch) {
    return <Redirect to={REACT_APP_ROUTE_PREFIX} />;
  }

  return <a href={localMatch} style={{ opacity: 0 }} target='_self' ref={externalRedirectRef}>{localMatch}</a>;
};

export default PathNormalizationRoute;
