import React, { createContext, useCallback, useMemo, useRef, useState } from 'react';

export const ScrollContext = createContext();

const ScrollContextProvider = ({ children }) => {
  const scrollRef = useRef(null);
  const [scroll, setScroll] = useState(0);

  const getElement = useCallback(() => scrollRef?.current?.el ?? scrollRef?.current, []);

  const setScrollTop = useCallback(() => {
    const element = getElement();
    setScroll(element.scrollTop);
  }, [getElement]);

  const scrollToLastVisitedElement = useCallback(() => {
    const element = getElement();
    if (element?.scrollTo){
      element.scrollTo({
        top: scroll
      });
      setScroll(0);
    }
  }, [scroll, getElement]);

  const scrollContextValue = useMemo(() => ({ setScrollTop, scrollToLastVisitedElement, scrollRef }), [scrollToLastVisitedElement, setScrollTop]);

  return <ScrollContext.Provider value={scrollContextValue}>
    {children}
  </ScrollContext.Provider>;
};

export default ScrollContextProvider;
