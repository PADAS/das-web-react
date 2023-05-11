import React, { useEffect } from 'react';
import ReactGA from 'react-ga';
import ReactGA4 from 'react-ga4';
import { useLocation } from 'react-router-dom';

const withTracker = (WrappedComponent, title) => {
  const trackPage = page => {
    ReactGA.set({ page });
    ReactGA.pageview(page);
    ReactGA4.set({ page });
    ReactGA4.event('page_view', { page_path: page, page_title: title });
  };

  const HOC = props => {
    const location = useLocation();

    useEffect(() => trackPage(location.pathname), [location.pathname]);

    return <WrappedComponent {...props} />;
  };

  return HOC;
};

export default withTracker;