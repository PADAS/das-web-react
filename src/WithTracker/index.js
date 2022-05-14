import React, { useEffect } from 'react';
import ReactGA from 'react-ga';
import { useLocation } from 'react-router-dom';

const withTracker = (WrappedComponent, options = {}) => {
  const trackPage = page => {
    ReactGA.set({
      page,
      ...options
    });
    ReactGA.pageview(page);
  };

  const HOC = props => {
    const location = useLocation();

    useEffect(() => trackPage(location.pathname), [location.pathname]);

    return <WrappedComponent {...props} />;
  };

  return HOC;
};

export default withTracker;