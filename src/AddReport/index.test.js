import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';

import AddReport from './';
import { createMapMock } from '../__test-helpers/mocks';
import { TAB_KEYS } from '../constants';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import useNavigate from '../hooks/useNavigate';

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  DEVELOPMENT_FEATURE_FLAGS: {
    ENABLE_PATROL_NEW_UI: true,
    ENABLE_REPORT_NEW_UI: true,
    ENABLE_UFA_NAVIGATION_UI: true,
  },
}));
jest.mock('../hooks/useNavigate', () => jest.fn());

describe('AddReport', () => {
  let map, navigate, store, useNavigateMock;
  beforeEach(() => {
    map = createMapMock();
    store = mockStore({ data: { eventTypes } });

    render(
      <Provider store={store}>
        <NavigationWrapper>
          <AddReport map={map} patrolTypes={[]} />
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('open popover when pressing the button', async () => {
    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeNull();
    });

    const button = await screen.getByTestId('addReport-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeTruthy();
    });
  });

  test('close popover when pressing the esc key', async () => {
    const button = await screen.getByTestId('addReport-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeTruthy();
    });

    const container = await screen.getByTestId('addReport-container');
    fireEvent.keyDown(container, { key: 'Escape', code: 'Escape' });

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  test('close popover when clicking outside the container', async () => {
    const button = await screen.getByTestId('addReport-button');
    fireEvent.click(button);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toBeTruthy();
    });

    fireEvent.mouseDown(document);

    await waitFor(() => {
      expect(screen.queryByRole('tooltip')).toBeNull();
    });
  });

  test('opens the report detail view to add a new report', async () => {
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    const addRepportButton = await screen.getByTestId('addReport-button');
    fireEvent.click(addRepportButton);

    expect(navigate).toHaveBeenCalledTimes(0);

    const categoryListButton = await screen.findAllByTestId('categoryList-button-d0884b8c-4ecb-45da-841d-f2f8d6246abf');
    fireEvent.click(categoryListButton[0]);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalled();
      expect(navigate.mock.calls[0][0]).toMatchObject({
        pathname: `${TAB_KEYS.REPORTS}/new`,
        search: '?reportType=d0884b8c-4ecb-45da-841d-f2f8d6246abf',
      });
    });
  });
});
