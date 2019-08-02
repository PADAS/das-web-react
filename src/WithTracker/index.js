import React, { Component, } from "react";
import ReactGA from "react-ga";
import { REACT_APP_GA_TRACKING_ID } from '../constants';

// Initialize ReactGA with const from .env
ReactGA.initialize(REACT_APP_GA_TRACKING_ID);

// XXX not using effects here, we can revisit that
const withTracker = (WrappedComponent, options = {}) => {

  const trackPage = page => {
    ReactGA.set({
      page,
      ...options,
    });
    console.log('logging pageview' + page);
    ReactGA.pageview(page);
  };

  // eslint-disable-next-line
  const HOC = class extends Component {
    componentDidMount() {
      // eslint-disable-next-line
      const page = this.props.location.pathname + this.props.location.search;
      trackPage(page);
    }

    componentDidUpdate(prevProps) {
      const currentPage =
        prevProps.location.pathname + prevProps.location.search;
      const nextPage =
        this.props.location.pathname + this.props.location.search;

      if (currentPage !== nextPage) {
        trackPage(nextPage);
      }
    }

    render() {
      return <WrappedComponent {...this.props} />;
    }
  };

  return HOC;
};

export default withTracker;