import React, { createContext, useState } from 'react';

export const NavigationContext = createContext();

const NavigationContextProvider = ({ children }) => {
  const [navigationData, setNavigationData] = useState({});

  const navigationContextValue = { navigationData, setNavigationData };

  return <NavigationContext.Provider value={navigationContextValue}>
    {children}
  </NavigationContext.Provider>;
};

export default NavigationContextProvider;
