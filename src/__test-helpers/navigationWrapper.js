import React from 'react';
import { MemoryRouter } from 'react-router-dom';

import NavigationContextProvider from '../NavigationContextProvider';

const NavigationWrapper = ({ children }) => <MemoryRouter>
  <NavigationContextProvider>
    {children}
  </NavigationContextProvider>
</MemoryRouter>;

export default NavigationWrapper;
