import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen, within } from '../../../test-utils';
import { MAP_LAYER_SORT_VALUES, SORT_DIRECTION } from '../../../constants';
import { mockStore } from '../../../__test-helpers/MockStore';
import {
  setMapLayersFilterText,
  setMapLayersGrouped,
  setMapLayersSortBy,
  setMapLayersSortDirection,
} from '../../../ducks/map-layer-filter';
import { TAB_KEYS } from '../utils/constants';

import Filters from './';

jest.mock('../../../ducks/map-layer-filter', () => {
  const actual = jest.requireActual('../../../ducks/map-layer-filter');

  return {
    __esModule: true,
    ...actual,
    default: actual.default,
    setMapLayersFilterText: jest.fn(),
    setMapLayersGrouped: jest.fn(),
    setMapLayersSortBy: jest.fn(),
    setMapLayersSortDirection: jest.fn(),
  };
});

describe('SideBar - MapLayersTab - Filters', () => {
  let store;
  beforeEach(() => {
    setMapLayersFilterText.mockImplementation(() => () => {});
    setMapLayersGrouped.mockImplementation(() => () => {});
    setMapLayersSortBy.mockImplementation(() => () => {});
    setMapLayersSortDirection.mockImplementation(() => () => {});

    store = {
      data: {
        mapLayerFilter: {
          grouped: true,
          sortBy: MAP_LAYER_SORT_VALUES.LAST_UPDATE,
          sortDirection: SORT_DIRECTION.down,
          text: '',
        },
      },
      view: {},
    };
  });

  const renderFilters = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <Filters tab={TAB_KEYS.SUBJECTS} {...props} />
    </Provider>
  );

  it('searches map layers by text when the user types in the search bar', async () => {
    renderFilters();

    expect(setMapLayersFilterText).not.toHaveBeenCalled();

    await userEvent.type(screen.getByRole('searchbox', { name: 'Search layers' }), 's');

    expect(setMapLayersFilterText).toHaveBeenCalledTimes(1);
    expect(setMapLayersFilterText).toHaveBeenCalledWith('s');
  });

  it('clears the map layers search when the user clicks the clear search button', async () => {
    store.data.mapLayerFilter.text = 's';
    renderFilters();

    expect(setMapLayersFilterText).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(setMapLayersFilterText).toHaveBeenCalledTimes(1);
    expect(setMapLayersFilterText).toHaveBeenCalledWith('');
  });

  it('does not show the sorting buttons if the current tab is not subjects', async () => {
    renderFilters({ tab: TAB_KEYS.ANALYZERS });

    expect(screen.queryByRole('button', { name: 'Ungroup layers' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Open sort options for layers' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Sort layers in ascending order' })).toBeNull();
  });

  it('shows the sorting buttons if the current tab is subjects', async () => {
    renderFilters();

    expect(screen.getByRole('button', { name: 'Ungroup layers' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Open sort options for layers' })).toBeVisible();
    expect(screen.getByRole('button', { name: 'Sort layers in ascending order' })).toBeVisible();
  });

  it('groups and ungroups the layers when clicking the group button', async () => {
    const { rerender } = renderFilters();

    const groupButton = screen.getByRole('button', { name: 'Ungroup layers' });

    expect(groupButton).toHaveTextContent('Grouped');
    expect(groupButton).toHaveAttribute('aria-label', 'Ungroup layers');
    expect(groupButton).toHaveAttribute('aria-pressed', 'false');
    expect(groupButton).toHaveClass('inactive');
    expect(groupButton).toHaveAttribute('title', 'Ungroup layers');
    expect(setMapLayersGrouped).not.toHaveBeenCalled();

    await userEvent.click(groupButton);

    expect(setMapLayersGrouped).toHaveBeenCalledTimes(1);
    expect(setMapLayersGrouped).toHaveBeenCalledWith(false);

    store.data.mapLayerFilter.grouped = false;
    rerender(
      <Provider store={mockStore(store)}>
        <Filters tab={TAB_KEYS.SUBJECTS} />
      </Provider>
    );

    expect(groupButton).toHaveTextContent('Ungrouped');
    expect(groupButton).toHaveAttribute('aria-label', 'Group layers');
    expect(groupButton).toHaveAttribute('aria-pressed', 'true');
    expect(groupButton).toHaveClass('active');
    expect(groupButton).toHaveAttribute('title', 'Group layers');

    await userEvent.click(groupButton);

    expect(setMapLayersGrouped).toHaveBeenCalledTimes(2);
    expect(setMapLayersGrouped).toHaveBeenCalledWith(true);
  });

  it('changes the sort by when selecting an option from the sort by menu', async () => {
    const { rerender } = renderFilters();

    const sortByButton = screen.getByRole('button', { name: 'Open sort options for layers' });

    expect(sortByButton).toHaveTextContent('Last update');
    expect(sortByButton).toHaveAttribute('aria-label', 'Open sort options for layers');
    expect(sortByButton).toHaveAttribute('aria-expanded', 'false');
    expect(sortByButton).toHaveClass('inactive');
    expect(sortByButton).toHaveAttribute('title', 'Open sort options for layers');

    await userEvent.click(sortByButton);

    expect(sortByButton).toHaveAttribute('aria-expanded', 'true');
    expect(setMapLayersSortBy).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Sort layers alphabetically' }));

    expect(sortByButton).toHaveAttribute('aria-expanded', 'false');
    expect(setMapLayersSortBy).toHaveBeenCalledTimes(1);
    expect(setMapLayersSortBy).toHaveBeenCalledWith(MAP_LAYER_SORT_VALUES.ALPHABETICAL);

    store.data.mapLayerFilter.sortBy = MAP_LAYER_SORT_VALUES.ALPHABETICAL;
    rerender(
      <Provider store={mockStore(store)}>
        <Filters tab={TAB_KEYS.SUBJECTS} />
      </Provider>
    );

    expect(sortByButton).toHaveTextContent('Alphabetical');
    expect(sortByButton).toHaveAttribute('aria-label', 'Open sort options for layers');
    expect(sortByButton).toHaveAttribute('aria-expanded', 'false');
    expect(sortByButton).toHaveClass('active');
    expect(sortByButton).toHaveAttribute('title', 'Open sort options for layers');

    await userEvent.click(sortByButton);

    expect(sortByButton).toHaveAttribute('aria-expanded', 'true');

    await userEvent.click(screen.getByRole('menuitemradio', { name: 'Sort layers by last update' }));

    expect(sortByButton).toHaveAttribute('aria-expanded', 'false');
    expect(setMapLayersSortBy).toHaveBeenCalledTimes(2);
    expect(setMapLayersSortBy).toHaveBeenCalledWith(MAP_LAYER_SORT_VALUES.LAST_UPDATE);
  });

  it('navigates the sort by menu with the keyboard', async () => {
    renderFilters();

    const sortByButton = screen.getByRole('button', { name: 'Open sort options for layers' });
    await userEvent.click(sortByButton);

    expect(screen.getByRole('menuitemradio', { name: 'Sort layers by last update' })).toBe(document.activeElement);

    await userEvent.keyboard('[ArrowDown]');

    expect(screen.getByRole('menuitemradio', { name: 'Sort layers alphabetically' })).toBe(document.activeElement);

    await userEvent.keyboard('[ArrowUp]');

    expect(screen.getByRole('menuitemradio', { name: 'Sort layers by last update' })).toBe(document.activeElement);

    await userEvent.keyboard('[End]');

    expect(screen.getByRole('menuitemradio', { name: 'Sort layers alphabetically' })).toBe(document.activeElement);

    await userEvent.keyboard('[Home]');

    expect(screen.getByRole('menuitemradio', { name: 'Sort layers by last update' })).toBe(document.activeElement);

    await userEvent.keyboard('[Escape]');

    expect(sortByButton).toBe(document.activeElement);

    await userEvent.keyboard('[Space]');

    expect(screen.getByRole('menuitemradio', { name: 'Sort layers by last update' })).toBe(document.activeElement);

    await userEvent.keyboard('[ArrowDown]');

    expect(setMapLayersSortBy).not.toHaveBeenCalled();

    await userEvent.keyboard('[Enter]');

    expect(setMapLayersSortBy).toHaveBeenCalledTimes(1);
    expect(setMapLayersSortBy).toHaveBeenCalledWith(MAP_LAYER_SORT_VALUES.ALPHABETICAL);
  });

  it('changes the sort direction when clicking the sort direction button', async () => {
    const { rerender } = renderFilters();

    const sortDirectionButton = screen.getByRole('button', { name: 'Sort layers in ascending order' });

    expect(within(sortDirectionButton).getByTestId('arrow-down-icon')).toBeVisible();
    expect(sortDirectionButton).toHaveAttribute('aria-label', 'Sort layers in ascending order');
    expect(sortDirectionButton).toHaveAttribute('aria-pressed', 'false');
    expect(sortDirectionButton).toHaveClass('inactive');
    expect(sortDirectionButton).toHaveAttribute('title', 'Sort layers in ascending order');
    expect(setMapLayersSortDirection).not.toHaveBeenCalled();

    await userEvent.click(sortDirectionButton);

    expect(setMapLayersSortDirection).toHaveBeenCalledTimes(1);
    expect(setMapLayersSortDirection).toHaveBeenCalledWith(SORT_DIRECTION.up);

    store.data.mapLayerFilter.sortDirection = SORT_DIRECTION.up;
    rerender(
      <Provider store={mockStore(store)}>
        <Filters tab={TAB_KEYS.SUBJECTS} />
      </Provider>
    );

    expect(within(sortDirectionButton).getByTestId('arrow-up-icon')).toBeVisible();
    expect(sortDirectionButton).toHaveAttribute('aria-label', 'Sort layers in descending order');
    expect(sortDirectionButton).toHaveAttribute('aria-pressed', 'true');
    expect(sortDirectionButton).toHaveClass('active');
    expect(sortDirectionButton).toHaveAttribute('title', 'Sort layers in descending order');

    await userEvent.click(sortDirectionButton);

    expect(setMapLayersSortDirection).toHaveBeenCalledTimes(2);
    expect(setMapLayersSortDirection).toHaveBeenCalledWith(SORT_DIRECTION.down);
  });
});
