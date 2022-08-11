import React from 'react';
import { Provider } from 'react-redux';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { addModal } from '../../ducks/modals';
import InformationModal from './InformationModal';
import { mockStore } from '../../__test-helpers/MockStore';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import { report } from '../../__test-helpers/fixtures/reports';
import ReportOverview from './';

jest.mock('../../ducks/modals', () => ({
  ...jest.requireActual('../../ducks/modals'),
  addModal: jest.fn(),
}));

describe('ReportOverview', () => {
  let addModalMock, store;

  beforeEach(() => {
    addModalMock = jest.fn(() => () => {});
    addModal.mockImplementation(addModalMock);

    store = { data: { eventTypes: [], patrolTypes: [] }, view: { userMapInteraction: { event: report } } };

    render(
      <Provider store={mockStore(store)}>
        <NavigationWrapper>
          <ReportOverview />
        </NavigationWrapper>
      </Provider>
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('opens the report information modal when clicking the information icon', async () => {
    expect(addModal).toHaveBeenCalledTimes(0);

    const informationIcon = await screen.findByText('information.svg');
    userEvent.click(informationIcon);

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].content).toBe(InformationModal);
  });

  test('closes and opens the card', async () => {
    const collapse = await screen.findByTestId('ReportOverview-collapse');

    expect(collapse).toHaveClass('show');

    const arrowUpIcon = await screen.findByText('arrow-up-simple.svg');
    userEvent.click(arrowUpIcon);

    expect(collapse).not.toHaveClass('show');

    const arrowDownIcon = await screen.findByText('arrow-down-simple.svg');
    userEvent.click(arrowDownIcon);

    await waitFor(() => {
      expect(collapse).toHaveClass('show');
    });
  });
});
