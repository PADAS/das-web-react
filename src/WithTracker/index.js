import React, { useEffect } from 'react';
import ReactGA from 'react-ga';
import ReactGA4 from 'react-ga4';
import { useLocation } from 'react-router-dom';

const withTracker = (WrappedComponent, options = {}) => {
  const trackPage = page => {
    ReactGA.set({ page, ...options });
    ReactGA.pageview(page);
    ReactGA4.set({ page, ...options });
    ReactGA4.send({ hitType: 'pageview', page });
  };

  const HOC = props => {
    const location = useLocation();

    useEffect(() => trackPage(location.pathname), [location.pathname]);

    return <WrappedComponent {...props} />;
  };

  return HOC;
};

export default withTracker;