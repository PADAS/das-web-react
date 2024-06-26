import React from 'react';
import { useLocation } from 'react-router-dom';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import Link from './';
import { BLOCKER_STATES, NavigationContext } from '../NavigationContextProvider';
import NavigationWrapper from '../__test-helpers/navigationWrapper';

describe('Link', () => {
  const LocationDisplay = () => {
    const location = useLocation();

    return <div data-testid="location-display">{location.pathname}</div>;
  };

  let onNavigationAttemptBlocked = jest.fn(), reset = jest.fn();
  const blocker = { reset, state: BLOCKER_STATES.UNBLOCKED };

  test('navigates to the link route when user clicks it', async () => {
    render(<NavigationWrapper>
      <Link to="/route" />

      <LocationDisplay />
    </NavigationWrapper>);

    const link = await screen.findByRole('link');
    userEvent.click(link);

    expect((await screen.findByTestId('location-display'))).toHaveTextContent('/route');
  });

  test('blocks a navigation attempt when navigation is blocked', async () => {
    render(<NavigationWrapper>
      <NavigationContext.Provider value={{
        blocker,
        isNavigationBlocked: true,
        onNavigationAttemptBlocked,
      }}>
        <Link to="/route" />

        <LocationDisplay />
      </NavigationContext.Provider>
    </NavigationWrapper>);

    const link = await screen.findByRole('link');
    userEvent.click(link);

    expect((await screen.findByTestId('location-display'))).toHaveTextContent('/');
  });

  test('blocks a navigation attempt and unblocks it after the user decides to continue', async () => {
    blocker.state = BLOCKER_STATES.PROCEEDING;

    render(<NavigationWrapper>
      <NavigationContext.Provider value={{
        blocker,
        isNavigationBlocked: true,
        onNavigationAttemptBlocked,
      }}>
        <Link to="/route" />

        <LocationDisplay />
      </NavigationContext.Provider>
    </NavigationWrapper>);

    const link = await screen.findByRole('link');
    userEvent.click(link);

    expect((await screen.findByTestId('location-display'))).toHaveTextContent('/');

    await waitFor(async () => {
      expect((await screen.findByTestId('location-display'))).toHaveTextContent('/route');
    });
  });
});
