import React from 'react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';

import { render, screen, waitFor, within } from '../../../../../test-utils';
import { mockStore } from '../../../../../__test-helpers/MockStore';
import { setStoredCoordinateReferenceSystems } from '../../../../../ducks/coordinate-reference-systems';

import CoordinateReferenceSystemFinder from './';

jest.mock('../../../../../ducks/coordinate-reference-systems', () => ({
  ...jest.requireActual('../../../../../ducks/coordinate-reference-systems'),
  setStoredCoordinateReferenceSystems: jest.fn(),
}));

describe('SideBar - SettingsPane - MapTab - CoordinateSystemSettingsView - CoordinateReferenceSystemFinder', () => {
  let store;
  beforeEach(() => {
    setStoredCoordinateReferenceSystems.mockImplementation(() => () => {});

    store = {
      data: {},
      view: {
        coordinateReferenceSystems: {
          storedSystems: [],
        },
      },
    };
  });

  const renderCoordinateReferenceSystemFinder = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <CoordinateReferenceSystemFinder {...props} />
    </Provider>
  );

  test('shows a loader in the results table while loading the supported CRS', async () => {
    renderCoordinateReferenceSystemFinder();

    const resultsTable = screen.getByRole('table', { name: 'List of coordinate reference system search results' });
    const firstResultsRow = within(resultsTable).getAllByRole('row')[1];

    expect(within(firstResultsRow).getByTestId('moonLoader')).toBeVisible();
  });

  test('shows the CRS results in the table once the supported CRS are loaded', async () => {
    renderCoordinateReferenceSystemFinder();

    const resultsTable = screen.getByRole('table', { name: 'List of coordinate reference system search results' });

    expect(within(resultsTable).getAllByRole('row')[1])
      .not.toHaveTextContent('2001Antigua 1943 / British West Indies GridAntigua island - onshore.Add');

    await waitFor(() => {
      const resultRows = within(resultsTable).getAllByRole('row');

      // The first row is the table header row.
      expect(resultRows).toHaveLength(11);
      expect(within(resultRows[1]).queryByTestId('moonLoader')).toBeNull();
      expect(resultRows[1])
        .toHaveTextContent('2001Antigua 1943 / British West Indies GridAntigua island - onshore.Add');
    });
  });

  test('filters the CRS results by typing in the search bar', async () => {
    renderCoordinateReferenceSystemFinder();

    const resultsTable = screen.getByRole('table', { name: 'List of coordinate reference system search results' });

    await waitFor(() => {
      expect(within(resultsTable).getAllByRole('row')[1])
        .toHaveTextContent('2001Antigua 1943 / British West Indies GridAntigua island - onshore.Add');
    });

    const searchBar = screen.getByRole('searchbox', { name: 'Search additional coordinate reference systems' });
    await userEvent.type(searchBar, 'CRTM05');

    expect(searchBar).toHaveValue('CRTM05');

    const resultRows = within(resultsTable).getAllByRole('row');

    // The first row is the table header row.
    expect(resultRows).toHaveLength(4);
    expect(resultRows[1]).toHaveTextContent('5367CR05 / CRTM05Costa Rica - onshore and offshore east of 86°30\'W.Add');
  });

  test('clears the search bar', async () => {
    renderCoordinateReferenceSystemFinder();

    const searchBar = screen.getByRole('searchbox', { name: 'Search additional coordinate reference systems' });
    await userEvent.type(searchBar, 'CRTM05');

    expect(searchBar).toHaveValue('CRTM05');

    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));

    expect(searchBar).toHaveValue('');
  });

  test('shows the full CRS area if its text is small', async () => {
    renderCoordinateReferenceSystemFinder();

    const resultsTable = screen.getByRole('table', { name: 'List of coordinate reference system search results' });

    await waitFor(() => {
      expect(within(resultsTable).getAllByRole('row')[1])
        .toHaveTextContent('2001Antigua 1943 / British West Indies GridAntigua island - onshore.Add');
    });

    await userEvent.type(screen.getByRole('searchbox', {
      name: 'Search additional coordinate reference systems',
    }), '2159');
    const resultRows = within(resultsTable).getAllByRole('row');

    expect(resultRows[1]).toHaveTextContent('2159Sierra Leone 1924 / New Colony GridSierra Leone - Freetown Peninsula.Add');
  });

  test('shows the CRS area truncated and a Read more button if its text is long', async () => {
    renderCoordinateReferenceSystemFinder();

    const resultsTable = screen.getByRole('table', { name: 'List of coordinate reference system search results' });

    await waitFor(() => {
      expect(within(resultsTable).getAllByRole('row')[1])
        .toHaveTextContent('2001Antigua 1943 / British West Indies GridAntigua island - onshore.Add');
    });

    await userEvent.type(screen.getByRole('searchbox', {
      name: 'Search additional coordinate reference systems',
    }), '2231');
    const resultRows = within(resultsTable).getAllByRole('row');

    expect(resultRows[1])
      .toHaveTextContent('2231NAD83 / Colorado North (ftUS)United States (USA) - Colorado - counties Adams; Boulder; Gi...Read moreAdd');
    expect(
      within(resultRows[1]).getByRole('button', {
        name: 'Show full area description for EPSG:2231 NAD83 / Colorado North (ftUS)',
      })
    ).toBeVisible();
  });

  test('Expands and collapses a lon CRS area description when the user clicks the Read more and Read less buttons', async () => {
    renderCoordinateReferenceSystemFinder();

    const resultsTable = screen.getByRole('table', { name: 'List of coordinate reference system search results' });

    await waitFor(() => {
      expect(within(resultsTable).getAllByRole('row')[1])
        .toHaveTextContent('2001Antigua 1943 / British West Indies GridAntigua island - onshore.Add');
    });

    await userEvent.type(screen.getByRole('searchbox', {
      name: 'Search additional coordinate reference systems',
    }), '2231');
    const resultRows = within(resultsTable).getAllByRole('row');

    expect(resultRows[1])
      .toHaveTextContent('2231NAD83 / Colorado North (ftUS)United States (USA) - Colorado - counties Adams; Boulder; Gi...Read moreAdd');

    await userEvent.click(within(resultRows[1]).getByRole('button', {
      name: 'Show full area description for EPSG:2231 NAD83 / Colorado North (ftUS)',
    }));

    expect(resultRows[1])
      .toHaveTextContent('2231NAD83 / Colorado North (ftUS)United States (USA) - Colorado - counties Adams; Boulder; Gilpin; Grand; Jackson; Larimer; Logan; Moffat; Morgan; Phillips; Rio Blanco; Routt; Sedgwick; Washington; Weld; Yuma.Read lessAdd');

    await userEvent.click(within(resultRows[1]).getByRole('button', {
      name: 'Hide full area description for EPSG:2231 NAD83 / Colorado North (ftUS)',
    }));

    expect(resultRows[1])
      .toHaveTextContent('2231NAD83 / Colorado North (ftUS)United States (USA) - Colorado - counties Adams; Boulder; Gi...Read moreAdd');
  });

  test('stores a CRS when the user clicks the Add button of its row', async () => {
    renderCoordinateReferenceSystemFinder();

    const resultsTable = screen.getByRole('table', { name: 'List of coordinate reference system search results' });

    await waitFor(() => {
      expect(within(resultsTable).getAllByRole('row')[1])
        .toHaveTextContent('2001Antigua 1943 / British West Indies GridAntigua island - onshore.Add');
    });

    await userEvent.type(screen.getByRole('searchbox', {
      name: 'Search additional coordinate reference systems',
    }), 'CRTM05');

    expect(setStoredCoordinateReferenceSystems).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', {
      name: 'Add EPSG:5367 CR05 / CRTM05 to the GPS format selector options',
    }));

    expect(setStoredCoordinateReferenceSystems).toHaveBeenCalledTimes(1);
    expect(setStoredCoordinateReferenceSystems).toHaveBeenCalledWith([{
      area: 'Costa Rica - onshore and offshore east of 86°30\'W.',
      bbox: [11.77, -86.5, 2.21, -81.43],
      code: '5367',
      name: 'CR05 / CRTM05',
      proj4: '+proj=tmerc +lat_0=0 +lon_0=-84 +k=0.9999 +x_0=500000 +y_0=0 +ellps=WGS84 +towgs84=-0.16959,0.35312,0.51846,-0.03385,0.16325,-0.03446,0.03693 +units=m +no_defs +type=crs',
    }]);
  });

  test('shows an empty state if the supported CRS are loaded and the filter criteria did not match any', async () => {
    renderCoordinateReferenceSystemFinder();

    const resultsTable = screen.getByRole('table', { name: 'List of coordinate reference system search results' });

    await waitFor(() => {
      expect(within(resultsTable).getAllByRole('row')[1])
        .toHaveTextContent('2001Antigua 1943 / British West Indies GridAntigua island - onshore.Add');
    });

    await userEvent.type(screen.getByRole('searchbox', {
      name: 'Search additional coordinate reference systems',
    }), 'xxx');

    const firstResultsRow = within(resultsTable).getAllByRole('row')[1];

    expect(firstResultsRow).toHaveTextContent('No results found.Adjust your search to find what you are looking for.');
  });

  test('shows a message when the filter criteria matches more than the maximum results shown', async () => {
    renderCoordinateReferenceSystemFinder();

    const resultsTable = screen.getByRole('table', { name: 'List of coordinate reference system search results' });

    await waitFor(() => {
      expect(within(resultsTable).getAllByRole('row')[1])
        .toHaveTextContent('2001Antigua 1943 / British West Indies GridAntigua island - onshore.Add');
    });

    expect(screen.getByText('Showing the top 10 results. Try refining your search to narrow down the list.'))
      .toBeVisible();
  });

  test('does not show a message when the filter criteria matches less than the maximum results shown', async () => {
    renderCoordinateReferenceSystemFinder();

    const resultsTable = screen.getByRole('table', { name: 'List of coordinate reference system search results' });

    await waitFor(() => {
      expect(within(resultsTable).getAllByRole('row')[1])
        .toHaveTextContent('2001Antigua 1943 / British West Indies GridAntigua island - onshore.Add');
    });

    await userEvent.type(screen.getByRole('searchbox', {
      name: 'Search additional coordinate reference systems',
    }), 'CRTM05');

    expect(screen.queryByText('Showing the top 10 results. Try refining your search to narrow down the list.'))
      .toBeNull();
  });
});
