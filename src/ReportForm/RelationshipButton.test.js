import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { fetchEvent } from '../ducks/events';
import { fetchPatrol } from '../ducks/patrols';
import { FormDataContext } from '../EditableItem/context';
import RelationshipButton from './RelationshipButton';
import { mockStore } from '../__test-helpers/MockStore';
import NavigationWrapper from '../__test-helpers/navigationWrapper';
import useNavigate from '../hooks/useNavigate';

jest.mock('../constants', () => ({
  ...jest.requireActual('../constants'),
  DEVELOPMENT_FEATURE_FLAGS: {
    ENABLE_PATROL_NEW_UI: true,
    ENABLE_REPORT_NEW_UI: true,
  },
}));
jest.mock('../ducks/events', () => ({
  ...jest.requireActual('../ducks/events'),
  fetchEvent: jest.fn(),
}));
jest.mock('../ducks/patrols', () => ({
  ...jest.requireActual('../ducks/patrols'),
  fetchPatrol: jest.fn(),
}));
jest.mock('../hooks/useNavigate', () => jest.fn());

describe('RelationshipButton', () => {
  const removeModal = jest.fn();
  let fetchEventMock, fetchPatrolMock, navigate, store, useNavigateMock;
  beforeEach(() => {
    fetchEventMock = jest.fn(() => () => Promise.resolve({ data: { data: { id: 'report1234' } } }));
    fetchEvent.mockImplementation(fetchEventMock);
    fetchPatrolMock = jest.fn(() => () => Promise.resolve({ data: {} }));
    fetchPatrol.mockImplementation(fetchPatrolMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    store = mockStore({ data: {} });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('navigates to parent collection if report is a collection child', async () => {
    render(
      <Provider store={store}>
        <NavigationWrapper>
          <FormDataContext.Provider value={{ is_collection: true, is_contained_in: [{ related_event: { id: 123 } }] }}>
            <RelationshipButton removeModal={removeModal} />
          </FormDataContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect(navigate).toHaveBeenCalledTimes(0);

    const attachmentButton = await screen.findByTitle('Go To Collection');
    userEvent.click(attachmentButton);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/reports/report1234');
    });
  });

  test('navigates to parent patrol if report is a patrol report', async () => {
    render(
      <Provider store={store}>
        <NavigationWrapper>
          <FormDataContext.Provider value={{ patrols: ['patrol1234'] }}>
            <RelationshipButton removeModal={removeModal} />
          </FormDataContext.Provider>
        </NavigationWrapper>
      </Provider>
    );

    expect(navigate).toHaveBeenCalledTimes(0);

    const attachmentButton = await screen.findByTitle('Go To Patrol');
    userEvent.click(attachmentButton);

    await waitFor(() => {
      expect(navigate).toHaveBeenCalledTimes(1);
      expect(navigate).toHaveBeenCalledWith('/patrols/patrol1234');
    });
  });
});