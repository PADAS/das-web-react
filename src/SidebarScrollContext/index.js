import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, forwardRef } from 'react';
import PropTypes from 'prop-types';

export const SidebarScrollContext = createContext();

const getElement = (ref) => ref?.current?.el ?? ref?.current;

export const SidebarScrollProvider = ({ children }) => {
  const scrollRef = useRef(null);
  const [scrollPositionValues, setScrollPositionValues] = useState({});

  const setScrollPosition = useCallback((tab, position = null) => {
    const element = getElement(scrollRef);
    const value = position ?? element.scrollTop;
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

  const scrollContextValue = useMemo(() => ({ setScrollPosition, scrollToLastPosition, scrollRef, scrollPositionValues }), [scrollToLastPosition, setScrollPosition, scrollPositionValues]);

  return <SidebarScrollContext.Provider value={scrollContextValue}>
    {children}
  </SidebarScrollContext.Provider>;
};

export const ScrollRestoration = ({ Component, namespace, children, ...props }) => {
  const { scrollRef, setScrollPosition, scrollToLastPosition } = useContext(SidebarScrollContext);
  const onScrollFeed = useCallback(() => setScrollPosition(namespace), [setScrollPosition, namespace]);

  useEffect(() => {
    let element = null;

    setTimeout(() => {
      element = getElement(scrollRef);
      element?.addEventListener?.('scroll', onScrollFeed);
    }, 1000);

    return () => element?.removeEventListener?.('scroll', onScrollFeed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    scrollToLastPosition(namespace);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <Component ref={scrollRef} {...props}>
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
};

ScrollRestoration.propTypes = {
  Component: PropTypes.oneOfType([PropTypes.object, PropTypes.element, PropTypes.array, PropTypes.func]),
  namespace: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([PropTypes.element, PropTypes.array]).isRequired,
};
