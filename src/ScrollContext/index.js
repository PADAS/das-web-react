import React, { createContext, useCallback, useMemo, useRef, useState } from 'react';

export const ScrollContext = createContext();

const ScrollContextProvider = ({ children }) => {
  const toScrollElementRef = useRef();
  const [toScrollElementId, setToScrollElementId] = useState(null);

  const scrollElementIntoView = () => {
    if (toScrollElementRef?.current){
      toScrollElementRef.current?.scrollIntoView();
      toScrollElementRef.current = null;
    }
  };

  const assignRefToScrollElement = useCallback((id) => {
    return toScrollElementId === id ? toScrollElementRef : null;
  }, [toScrollElementId]);

  const scrollContextValue = useMemo(() => ({ setToScrollElementId, toScrollElementRef, scrollElementIntoView, assignRefToScrollElement }), [assignRefToScrollElement]);

  return <ScrollContext.Provider value={scrollContextValue}>
    {children}
  </ScrollContext.Provider>;
};

export default ScrollContextProvider;
