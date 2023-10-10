import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AddItemContext } from '../../';
import AddPatrolTab from './';
import { mockStore } from '../../../__test-helpers/MockStore';
import patrolTypes from '../../../__test-helpers/fixtures/patrol-types';

jest.mock('../../../constants', () => ({
  ...jest.requireActual('../../../constants'),
  DEVELOPMENT_FEATURE_FLAGS: {
    ENABLE_PATROL_NEW_UI: true,
  },
}));

describe('AddItemButton - AddItemModal - AddPatrolTab', () => {
  const navigate = jest.fn(), onHideModal = jest.fn();
  let renderAddPatrolTab, store;
  beforeEach(() => {
    store = { data: { patrolTypes }, view: { featureFlagOverrides: {} } };

    renderAddPatrolTab = (props, addItemContext, overrideStore) => {
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
              onAddPatrol: null,
              patrolData: {},
            ...addItemContext
          }}>
            <AddPatrolTab navigate={navigate} onHideModal={onHideModal} {...props} />
          </AddItemContext.Provider>
        </Provider>
      );
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('sorts patrol types by ordernum, with null ordernums last', async () => {
    renderAddPatrolTab();

    const renderedResults = await screen.findAllByTestId((content) => content.startsWith('categoryList-button-'));
    expect(renderedResults).toHaveLength(4);

    expect(renderedResults[0]).toHaveTextContent('Routine Patrol');
    expect(renderedResults[1]).toHaveTextContent('Dog Patrol');
    expect(renderedResults[2]).toHaveTextContent('Fence Patrol');
    expect(renderedResults[3]).toHaveTextContent('Aerial');
  });

  test('filters patrol types by search text', async () => {
    renderAddPatrolTab();

    expect((await screen.findAllByTestId((content) => content.startsWith('categoryList-button-')))).toHaveLength(4);

    const searchBar = await screen.findByTestId('search-input');
    userEvent.type(searchBar, 'routine');

    const typeListItems = await screen.findAllByTestId((content) => content.startsWith('categoryList-button-'));

    expect(typeListItems).toHaveLength(1);
    expect(typeListItems[0]).toHaveTextContent('Routine Patrol');
  });

  test('clears search text filter', async () => {
    renderAddPatrolTab();

    const searchBar = await screen.findByTestId('search-input');
    userEvent.type(searchBar, 'routine');

    expect((await screen.findAllByTestId((content) => content.startsWith('categoryList-button-')))).toHaveLength(1);

    const clearSearchBarButton = await screen.findByTestId('reset-search-button');
    userEvent.click(clearSearchBarButton);

    expect((await screen.findAllByTestId((content) => content.startsWith('categoryList-button-')))).toHaveLength(4);
  });

  test('triggers onAddPatrol if new UI is enabled and the callback was sent', async () => {
    const onAddPatrol = jest.fn();

    renderAddPatrolTab({}, { onAddPatrol });

    expect(onAddPatrol).toHaveBeenCalledTimes(0);

    const typeButton = await screen.findByTestId('categoryList-button-c6f88fd2-2b87-477a-9c23-3bc4b3eb845d');
    userEvent.click(typeButton);

    expect(onHideModal).toHaveBeenCalledTimes(1);
    expect(onAddPatrol).toHaveBeenCalledTimes(1);
    expect(onAddPatrol.mock.calls[0][2]).toBe('c6f88fd2-2b87-477a-9c23-3bc4b3eb845d');
  });

  test('navigates to /patrols/new if onAddPatrols is not defined when user clicks a patrol type', async () => {
    renderAddPatrolTab();

    expect(navigate).toHaveBeenCalledTimes(0);

    const typeButton = await screen.findByTestId('categoryList-button-c6f88fd2-2b87-477a-9c23-3bc4b3eb845d');
    userEvent.click(typeButton);

    expect(onHideModal).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledTimes(1);
    expect(navigate.mock.calls[0][0].pathname).toBe('/patrols/new');
    expect(navigate.mock.calls[0][0].search).toBe('?patrolType=c6f88fd2-2b87-477a-9c23-3bc4b3eb845d');
  });
});
