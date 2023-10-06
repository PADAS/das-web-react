import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import PropTypes from 'prop-types';

export const ScrollContext = createContext();

const getElement = (ref) => ref?.current?.el ?? ref?.current;

export const ScrollContextProvider = ({ children }) => {
  const scrollRef = useRef(null);
  const [scrollPositionValues, setScrollPositionValues] = useState({});

  const setScrollPosition = useCallback((tab) => {
    const element = getElement(scrollRef);
    const value = element.scrollTop;
    setScrollPositionValues({
      ...scrollPositionValues,
      [tab]: value
    });
  }, [scrollPositionValues]);

  const scrollToLastPosition = useCallback((tab) => {
    const element = getElement(scrollRef);
    if (element?.scrollTo){
      element.scrollTo({
        top: scrollPositionValues[tab]
      });
    }
  }, [scrollPositionValues]);

  const scrollContextValue = useMemo(() => ({ setScrollPosition, scrollToLastPosition, scrollRef }), [scrollToLastPosition, setScrollPosition]);

  return <ScrollContext.Provider value={scrollContextValue}>
    {children}
  </ScrollContext.Provider>;
};

export const ScrollRestoration = ({ Component, isScrollable, namespace, children, ...props }) => {
  const { scrollRef, setScrollPosition, scrollToLastPosition } = useContext(ScrollContext);
  const onScrollFeed = useCallback(() => setScrollPosition(namespace), [setScrollPosition, namespace]);

  useEffect(() => {
    if (!isScrollable){
      let element = null;

      setTimeout(() => {
        element = getElement(scrollRef);
        element?.addEventListener?.('scroll', onScrollFeed);
      }, 1000);

      return () => element?.removeEventListener?.('scroll', onScrollFeed);
    }
  }, []);

  useEffect(() => {
    scrollToLastPosition(namespace);
  }, []);

  return <Component ref={scrollRef} onScroll={isScrollable && onScrollFeed} {...props}>
    {children}
  </Component>;
};

ScrollRestoration.defaultProps = {
  // eslint-disable-next-line react/display-name
  Component: forwardRef(({ children, ...otherProps }, ref) => {
    return <div {...otherProps} ref={ref}>
      {children}
    </div>;
  }),
  isScrollable: true,
};

ScrollRestoration.propTypes = {
  Component: PropTypes.element,
  isScrollable: PropTypes.bool,
  namespace: PropTypes.string.isRequired,
  children: PropTypes.element.isRequired
};
