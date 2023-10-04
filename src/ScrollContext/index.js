import React, { createContext, useCallback, useMemo, useRef, useState } from 'react';

export const ScrollContext = createContext();

export const Feeds = {
  patrol: 'patrols',
  report: 'reports',
};

const getElement = (ref) => ref?.current?.el ?? ref?.current;

const ScrollContextProvider = ({ children }) => {
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

export default ScrollContextProvider;
