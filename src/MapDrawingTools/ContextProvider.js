import React, { createContext, useState } from 'react';

export const MapDrawingToolsContext = createContext();

const MapDrawingToolsContextProvider = ({ children }) => {
  const [mapDrawingData, setMapDrawingData] = useState(null);

  const MapDrawingToolsContextValue = { mapDrawingData, setMapDrawingData };

  return <MapDrawingToolsContext.Provider value={MapDrawingToolsContextValue}>
    {children}
  </MapDrawingToolsContext.Provider>;
};

export default MapDrawingToolsContextProvider;
