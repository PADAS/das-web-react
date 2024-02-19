import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { AddItemContext } from '../..';
import AddReportTab from '.';
import { eventTypes } from '../../../__test-helpers/fixtures/event-types';
import { mockStore } from '../../../__test-helpers/MockStore';
import { render, screen } from '../../../test-utils';

describe('AddItemButton - AddItemModal - AddReportTab', () => {
  const navigate = jest.fn(), onHideModal = jest.fn();
  let renderAddReportTab, store;
  beforeEach(() => {
    store = { data: { eventTypes }, view: { featureFlagOverrides: {} } };

    renderAddReportTab = (props, addItemContext, overrideStore) => {
      render(
        <Provider store={mockStore({ ...store, ...overrideStore })}>
          <AddItemContext.Provider value={{
              analyticsMetadata: {
                category: 'Feed',
                location: null,
              },
              formProps: {
                hidePatrols: false,
                isPatrolReport: false,
                onSaveError: null,
                onSaveSuccess: null,
                relationshipButtonDisabled: false,
              },
              onAddReport: null,
              reportData: {},
            ...addItemContext
          }}>
            <AddReportTab navigate={navigate} onHideModal={onHideModal} {...props} />
          </AddItemContext.Provider>
        </Provider>
      );
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('filters report types by search text', async () => {
    renderAddReportTab();

    expect((await screen.findAllByTestId((content) => content.startsWith('categoryList-button-')))).toHaveLength(106);

    const searchBar = await screen.findByTestId('search-input');
    userEvent.type(searchBar, 'fire');

    const typeListItems = await screen.findAllByTestId((content) => content.startsWith('categoryList-button-'));

    expect(typeListItems).toHaveLength(3);
    expect(typeListItems[0]).toHaveTextContent('Fire');
  });

  test('clears search text filter', async () => {
    renderAddReportTab();

    const searchBar = await screen.findByTestId('search-input');
    userEvent.type(searchBar, 'fire');

    expect((await screen.findAllByTestId((content) => content.startsWith('categoryList-button-')))).toHaveLength(3);

    const clearSearchBarButton = await screen.findByTestId('reset-search-button');
    userEvent.click(clearSearchBarButton);

    expect((await screen.findAllByTestId((content) => content.startsWith('categoryList-button-')))).toHaveLength(106);
  });

  test('triggers onAddReport if new UI is enabled and the callback was sent', async () => {
    const onAddReport = jest.fn();

    renderAddReportTab({}, { onAddReport });

    expect(onAddReport).toHaveBeenCalledTimes(0);

    const typeButton = await screen.findByTestId('categoryList-button-74941f0d-4b89-48be-a62a-a74c78db8383');
    userEvent.click(typeButton);

    expect(onHideModal).toHaveBeenCalledTimes(1);
    expect(onAddReport).toHaveBeenCalledTimes(1);
    expect(onAddReport.mock.calls[0][2]).toBe('74941f0d-4b89-48be-a62a-a74c78db8383');
  });


  test('removing the `location` property from the formData if the selected report `geometry_type` is incompatbile', async () => {
    const reportData = {
      other_field: true,
      location: {
        latitude: 0.61332575463517,
        longitude: 36.802334013780495
      },
    };

    renderAddReportTab({}, {
      reportData,
    });

    const pointTypeButton = await screen.findByTestId('categoryList-button-74941f0d-4b89-48be-a62a-a74c78db8383');
    userEvent.click(pointTypeButton);

    expect(onHideModal).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);

    const mockNavState = navigate.mock.calls[0][1];

    expect(mockNavState.state.reportData).toEqual(reportData);

    const polygonTypeButton = await screen.findByTestId('categoryList-button-3ff27054-da2a-41a5-8785-a10a90e57486'); // a known event type fixture with a Polygon geometry_type
    userEvent.click(polygonTypeButton);

    expect(onHideModal).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledTimes(2);

    const nextNavState = navigate.mock.calls[1][1];
    expect(nextNavState.state.reportData).toEqual({ other_field: true });
  });

  test('navigates to /reports/new if onAddReports is not defined when user clicks a report type', async () => {
    renderAddReportTab();

    expect(navigate).toHaveBeenCalledTimes(0);

    const typeButton = await screen.findByTestId('categoryList-button-74941f0d-4b89-48be-a62a-a74c78db8383');
    userEvent.click(typeButton);

    expect(onHideModal).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0].pathname).toBe('/reports/new');
    expect(navigate.mock.calls[0][0].search).toBe('?reportType=74941f0d-4b89-48be-a62a-a74c78db8383');
  });
});
