import React, { useContext, useEffect } from 'react';
import { render, screen } from '@testing-library/react';

import NavigationContextProvider, { NavigationContext } from './';

describe('NavigationContextProvider', () => {
  test('can read and update navigation data', async () => {
    const ChildComponent = () => {
      const { navigationData, setNavigationData } = useContext(NavigationContext);

      useEffect(() => {
        setNavigationData('Navigation data!');
      }, [setNavigationData]);

      return <p>{JSON.stringify(navigationData)}</p>;
    };

    render(
      <NavigationContextProvider>
        <ChildComponent />
      </NavigationContextProvider>
    );

    expect((await screen.findByText('"Navigation data!"'))).toBeDefined();
  });
});
