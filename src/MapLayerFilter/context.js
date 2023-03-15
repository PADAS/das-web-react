import React, { createContext, useMemo, useState } from 'react';

const INITIAL_STATE_VALUE = '';

export const LayerFilterContext = createContext();

const LayerFilterContextProvider = ({ children }) => {
  const [filterText, setFilterValue] = useState(INITIAL_STATE_VALUE);

  const contextValue = useMemo(() => ({
    filterText,
    setFilterValue,
  }), [filterText, setFilterValue]);

  return <LayerFilterContext.Provider value={contextValue}>
    {children}
  </LayerFilterContext.Provider>;

};

export default (LayerFilterContextProvider);