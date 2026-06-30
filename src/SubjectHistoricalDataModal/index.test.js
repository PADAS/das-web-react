import React from 'react';
import { Provider } from 'react-redux';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { fetchObservationsForSubject } from '../ducks/observations';

import { mockStore } from '../__test-helpers/MockStore';
import { GPS_FORMATS } from '../utils/location';
import mockedObservationsData from '../__test-helpers/fixtures/observations';
import { render, waitFor, screen, act } from '../test-utils';
import { epsg5367 } from '../__test-helpers/fixtures/location';

import SubjectHistoricalDataModal, { ITEMS_PER_PAGE, getObservationUniqProperties, SORT_BY } from './';

// A store whose state can be mutated in place without swapping the store
// instance. Swapping instances changes `dispatch`, which retriggers the
// fetch effect and clobbers the realtime prepend - an artifact of the test
// harness, not production. Mutating in place keeps `dispatch` stable and
// notifies subscribers so `useSelector` re-reads.
const mutableStore = (initialState) => {
  let state = initialState;
  const baseStore = mockStore(state);

  return {
    ...baseStore,
    getState: () => state,
    setState: (nextState) => {
      state = nextState;
      baseStore.dispatch({ type: 'TEST_STATE_UPDATE' });
    },
  };
};

jest.mock('../ducks/observations', () => ({
  ...jest.requireActual('../ducks/observations'),
  fetchObservationsForSubject: jest.fn(),
}));

describe('SubjectHistoricalDataModal', () => {
  let fetchObservationsForSubjectMock, store;
  beforeEach(() => {
    fetchObservationsForSubjectMock = jest.fn(() => () => Promise.resolve({
      count: 16,
      results: mockedObservationsData
    }));
    fetchObservationsForSubject.mockImplementation(fetchObservationsForSubjectMock);

    store = {
      data: {
        subjectStore: {
          'fake-id': {
            last_position_date: '2026-06-30T00:00:00.000Z',
            last_position: {
              geometry: { coordinates: [-103.572941, 20.701133] },
              properties: { coordinateProperties: { time: '2026-06-30T00:00:00.000Z' } },
            },
            device_status_properties: [
              { label: 'speed', units: 'km', value: 42 },
            ],
          },
        },
      },
      view: {
        coordinateReferenceSystems: {
          storedSystems: [],
        },
        userPreferences: {
          gpsFormat: GPS_FORMATS.DEG,
        },
      },
    };
  });

  test('fetching observations on render', async () => {
    render(<Provider store={mockStore(store)}>
      <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
    </Provider>);

    expect(fetchObservationsForSubject).toHaveBeenCalledWith({
      include_empty_location: true,
      page: 1,
      page_size: ITEMS_PER_PAGE,
      subject_id: 'fake-id',
      sort_by: SORT_BY,
    });
  });

  describe('rendering table correctly', () => {
    test('getting all uniq properties from the observations chunk', () => {
      const uniqResultsValue = getObservationUniqProperties(mockedObservationsData);
      expect(uniqResultsValue).toEqual(['speed', 'temperature']);
    });

    test('rendering table cells matched with property header', async () => {
      render(<Provider store={mockStore(store)}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      const tableCells = await screen.findAllByRole('cell');
      const tableHeaders = await screen.findAllByRole('columnheader');

      expect(tableHeaders[1].childNodes[0]).toHaveTextContent('Speed');
      expect(tableCells[1].childNodes[0]).toHaveTextContent('500 km');

      expect(tableHeaders[2].childNodes[0]).toHaveTextContent('Temperature');
      expect(tableCells[2].childNodes[0]).toHaveTextContent('1000 c');

      expect(tableHeaders[3].childNodes[0]).toHaveTextContent('Location');
      expect(tableCells[3].childNodes[0]).toHaveTextContent('20.701133°, -103.572941°');
    });

    test('renders the location in DEG if the coordinates fall outside the BBOX of the current representation and shows a warning tooltip', async () => {
      store.view.coordinateReferenceSystems.storedSystems = [epsg5367];
      store.view.userPreferences.gpsFormat = '5367';
      render(<Provider store={mockStore(store)}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      const tableCells = await screen.findAllByRole('cell');
      const tableHeaders = await screen.findAllByRole('columnheader');
      const locationCell = within(tableCells[3].childNodes[0]).getByText('20.701133°, -103.572941°');

      expect(tableHeaders[3].childNodes[0]).toHaveTextContent('Location');
      expect(locationCell).toHaveAccessibleDescription('Location is displayed in DEG format. EPSG:5367 CR05 / CRTM05 is not supported at this location.');
    });
  });

  describe('pagination', () => {
    test('should show pagination if has as total more than items per page', async () => {
      render(<Provider store={mockStore(store)}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      const table = await screen.getByRole('table');
      expect(table).toBeDefined();

      const pagination = await screen.findByRole('list');
      expect(pagination).toBeDefined();
    });

    test('Should not show pagination if has less items than allowed per page', async () => {
      const totalCount = 8;
      fetchObservationsForSubjectMock = jest.fn(() => () => Promise.resolve({
        count: totalCount,
        results: mockedObservationsData
      }));
      fetchObservationsForSubject.mockImplementation(fetchObservationsForSubjectMock);

      render(<Provider store={mockStore(store)}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      expect(totalCount).toBeLessThan(ITEMS_PER_PAGE);

      const table = await screen.getByRole('table');
      expect(table).toBeDefined();
      expect(() => screen.getByRole('list')).toThrow();
    });

    test('clicking in page should fetch observations again', async () => {
      let paginationListItems, pageLink;

      render(<Provider store={mockStore(store)}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      expect(fetchObservationsForSubject).toHaveBeenCalledWith({
        include_empty_location: true,
        page: 1,
        page_size: ITEMS_PER_PAGE,
        subject_id: 'fake-id',
        sort_by: SORT_BY,
      });

      await waitFor(() => {
        paginationListItems = screen.getAllByRole('listitem');
        pageLink = within(paginationListItems[3]).getByRole('button');
      });

      expect(pageLink).toHaveTextContent('2');
      await userEvent.click(pageLink);

      expect(fetchObservationsForSubject).toHaveBeenCalledWith({
        include_empty_location: true,
        page: 2,
        page_size: ITEMS_PER_PAGE,
        subject_id: 'fake-id',
        sort_by: SORT_BY,
      });
    });
  });

  describe('realtime prepend', () => {
    const updatedSubjectStore = (lastPositionDate, deviceValue, time = lastPositionDate) => ({
      'fake-id': {
        last_position_date: lastPositionDate,
        last_position: {
          geometry: { coordinates: [-103.572941, 20.701133] },
          properties: { coordinateProperties: { time } },
        },
        device_status_properties: [
          { label: 'speed', units: 'km', value: deviceValue },
        ],
      },
    });

    test('prepends a new observation row when last_position_date changes while on page 1', async () => {
      const dynamicStore = mutableStore(store);

      render(<Provider store={dynamicStore}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      await waitFor(() => {
        const bodyRows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(bodyRows.length).toBe(ITEMS_PER_PAGE);
      });

      expect(screen.queryByText('777 km')).not.toBeInTheDocument();

      act(() => {
        dynamicStore.setState({
          ...store,
          data: {
            ...store.data,
            subjectStore: updatedSubjectStore('2026-06-30T01:00:00.000Z', 777),
          },
        });
      });

      // The new observation is prepended to the top of the page. The page is
      // capped at ITEMS_PER_PAGE rows, so the row count stays put while the
      // bottom row is dropped; the new row appears first.
      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(ITEMS_PER_PAGE);
        expect(within(rows[0]).getByText('777 km')).toBeInTheDocument();
      });
    });

    test('updates the existing row in place without bumping the count when the observation instant matches', async () => {
      fetchObservationsForSubjectMock = jest.fn(() => () => Promise.resolve({
        count: 0,
        results: [],
      }));
      fetchObservationsForSubject.mockImplementation(fetchObservationsForSubjectMock);

      const dynamicStore = mutableStore(store);

      render(<Provider store={dynamicStore}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(0);
      });

      // First update prepends a row recorded at the observation instant.
      act(() => {
        dynamicStore.setState({
          ...store,
          data: {
            ...store.data,
            subjectStore: updatedSubjectStore('2026-06-30T01:00:00.000Z', 777),
          },
        });
      });

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(1);
        expect(within(rows[0]).getByText('777 km')).toBeInTheDocument();
      });

      // Second update has a new last_position_date (so the effect runs) but the
      // same observation instant, so it matches the existing row. The row's
      // values are updated in place, the count is not bumped, and no duplicate
      // row is added.
      act(() => {
        dynamicStore.setState({
          ...store,
          data: {
            ...store.data,
            subjectStore: updatedSubjectStore('2026-06-30T02:00:00.000Z', 999, '2026-06-30T01:00:00.000Z'),
          },
        });
      });

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(1);
        expect(within(rows[0]).getByText('999 km')).toBeInTheDocument();
      });

      const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
      expect(rows.length).toBe(1);
      expect(screen.queryByText('777 km')).not.toBeInTheDocument();
      // Count was not bumped, so it stays at 1 and no pagination control renders.
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    test('a re-delivered fetched observation replaces in place and leaves the count unchanged', async () => {
      // API row carries a UUID id distinct from its recorded_at; the socket
      // update arrives with the same instant in a different string format/offset.
      const fetchedRecordedAt = '2022-02-22T07:22:05-08:00';
      const socketTime = new Date(fetchedRecordedAt).toISOString();
      fetchObservationsForSubjectMock = jest.fn(() => () => Promise.resolve({
        count: 1,
        results: [{
          id: 'fetched-uuid-0001',
          recorded_at: fetchedRecordedAt,
          location: { latitude: '20.701133', longitude: '-103.572941' },
          device_status_properties: [{ label: 'speed', units: 'km', value: 42 }],
        }],
      }));
      fetchObservationsForSubject.mockImplementation(fetchObservationsForSubjectMock);

      const dynamicStore = mutableStore(store);

      render(<Provider store={dynamicStore}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(1);
        expect(within(rows[0]).getByText('42 km')).toBeInTheDocument();
      });

      act(() => {
        dynamicStore.setState({
          ...store,
          data: {
            ...store.data,
            subjectStore: updatedSubjectStore('2026-06-30T01:00:00.000Z', 999, socketTime),
          },
        });
      });

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(1);
        expect(within(rows[0]).getByText('999 km')).toBeInTheDocument();
      });

      // The fetched row's values are replaced in place: no duplicate row, the
      // stale value is gone, and the count is not bumped (no extra page).
      const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
      expect(rows.length).toBe(1);
      expect(screen.queryByText('42 km')).not.toBeInTheDocument();
      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });

    test('a position-only update with object-shaped device_status_properties does not crash and derives columns', async () => {
      fetchObservationsForSubjectMock = jest.fn(() => () => Promise.resolve({
        count: 0,
        results: [],
      }));
      fetchObservationsForSubject.mockImplementation(fetchObservationsForSubjectMock);

      const dynamicStore = mutableStore(store);

      render(<Provider store={dynamicStore}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(0);
      });

      // Simulates the post-reducer state where a position-only socket frame
      // leaves device_status_properties as a numeric-keyed object instead of an
      // array.
      act(() => {
        dynamicStore.setState({
          ...store,
          data: {
            ...store.data,
            subjectStore: {
              'fake-id': {
                last_position_date: '2026-06-30T01:00:00.000Z',
                last_position: {
                  geometry: { coordinates: [-103.572941, 20.701133] },
                  properties: { coordinateProperties: { time: '2026-06-30T01:00:00.000Z' } },
                },
                device_status_properties: {
                  0: { label: 'speed', units: 'km', value: 777 },
                  1: { label: 'temperature', units: 'c', value: 12 },
                },
              },
            },
          },
        });
      });

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(1);
        expect(within(rows[0]).getByText('777 km')).toBeInTheDocument();
        expect(within(rows[0]).getByText('12 c')).toBeInTheDocument();
      });

      // Columns are derived from the coerced array (real labels, not [undefined]).
      const headers = within(screen.getByRole('table')).getAllByRole('columnheader');
      expect(headers.some((header) => header.textContent === 'Speed')).toBe(true);
      expect(headers.some((header) => header.textContent === 'Temperature')).toBe(true);
    });

    test('a position-only update with no last_position builds a null location and does not crash', async () => {
      fetchObservationsForSubjectMock = jest.fn(() => () => Promise.resolve({
        count: 0,
        results: [],
      }));
      fetchObservationsForSubject.mockImplementation(fetchObservationsForSubjectMock);

      const dynamicStore = mutableStore(store);

      render(<Provider store={dynamicStore}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(0);
      });

      act(() => {
        dynamicStore.setState({
          ...store,
          data: {
            ...store.data,
            subjectStore: {
              'fake-id': {
                last_position_date: '2026-06-30T01:00:00.000Z',
                device_status_properties: [{ label: 'speed', units: 'km', value: 777 }],
              },
            },
          },
        });
      });

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(1);
        expect(within(rows[0]).getByText('777 km')).toBeInTheDocument();
      });

      // No location cell is rendered for the location-less row (date + speed).
      const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
      expect(within(rows[0]).getAllByRole('cell')).toHaveLength(2);
    });

    test('a static subject renders no location column', async () => {
      fetchObservationsForSubjectMock = jest.fn(() => () => Promise.resolve({
        count: 0,
        results: [],
      }));
      fetchObservationsForSubject.mockImplementation(fetchObservationsForSubjectMock);

      const dynamicStore = mutableStore(store);

      render(<Provider store={dynamicStore}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' subjectIsStatic fetchObservationsForSubject/>
      </Provider>);

      act(() => {
        dynamicStore.setState({
          ...store,
          data: {
            ...store.data,
            subjectStore: updatedSubjectStore('2026-06-30T01:00:00.000Z', 777),
          },
        });
      });

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(1);
        expect(within(rows[0]).getByText('777 km')).toBeInTheDocument();
      });

      const headers = within(screen.getByRole('table')).getAllByRole('columnheader');
      expect(headers.some((header) => header.textContent === 'Location')).toBe(false);
    });

    test('does not prepend a new observation row when last_position_date changes while on page > 1', async () => {
      const dynamicStore = mutableStore(store);
      let paginationListItems, pageLink;

      render(<Provider store={dynamicStore}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      await waitFor(() => {
        paginationListItems = screen.getAllByRole('listitem');
        pageLink = within(paginationListItems[3]).getByRole('button');
      });

      expect(pageLink).toHaveTextContent('2');
      await userEvent.click(pageLink);

      let bodyRows;
      await waitFor(() => {
        bodyRows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(bodyRows.length).toBe(ITEMS_PER_PAGE);
      });
      const rowCountBeforeUpdate = bodyRows.length;

      act(() => {
        dynamicStore.setState({
          ...store,
          data: {
            ...store.data,
            subjectStore: updatedSubjectStore('2026-06-30T01:00:00.000Z', 777),
          },
        });
      });

      // Give any erroneous effect a chance to fire before asserting no prepend.
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0));
      });

      const rowsAfterUpdate = within(screen.getByRole('table')).getAllByRole('row').slice(1);
      expect(rowsAfterUpdate.length).toBe(rowCountBeforeUpdate);
      expect(screen.queryByText('777 km')).not.toBeInTheDocument();
    });

    test('uses the update device properties for columns when the table is empty', async () => {
      fetchObservationsForSubjectMock = jest.fn(() => () => Promise.resolve({
        count: 0,
        results: [],
      }));
      fetchObservationsForSubject.mockImplementation(fetchObservationsForSubjectMock);

      const dynamicStore = mutableStore(store);

      render(<Provider store={dynamicStore}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(0);
      });

      act(() => {
        dynamicStore.setState({
          ...store,
          data: {
            ...store.data,
            subjectStore: updatedSubjectStore('2026-06-30T01:00:00.000Z', 777),
          },
        });
      });

      await waitFor(() => {
        const rows = within(screen.getByRole('table')).getAllByRole('row').slice(1);
        expect(rows.length).toBe(1);
        expect(within(rows[0]).getByText('777 km')).toBeInTheDocument();
      });

      const headers = within(screen.getByRole('table')).getAllByRole('columnheader');
      expect(headers.some((header) => header.textContent === 'Speed')).toBe(true);
    });
  });
});
