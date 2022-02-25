import React from 'react';
import { Provider } from 'react-redux';
import { render, waitFor, screen } from '@testing-library/react';
import { within } from '@testing-library/dom';
import userEvent from '@testing-library/user-event';

import { fetchObservationsForSubject } from '../ducks/observations';

import { mockStore } from '../__test-helpers/MockStore';
import mockedObservationsData from '../__test-helpers/fixtures/observations';

import SubjectHistoricalDataModal, { ITEMS_PER_PAGE, getObservationUniqProperties } from './';

jest.mock('../ducks/observations', () => ({
  ...jest.requireActual('../ducks/observations'),
  fetchObservationsForSubject: jest.fn(),
}));

const store = mockStore({ data: {}, view: {} });

describe('SubjectHistoricalDataModal', () => {
  let fetchObservationsForSubjectMock;
  beforeEach(() => {
    fetchObservationsForSubjectMock = jest.fn(() => () => Promise.resolve({
      count: 16,
      results: mockedObservationsData
    }));
    fetchObservationsForSubject.mockImplementation(fetchObservationsForSubjectMock);
  });

  test('fetching observations on render', async () => {
    render(<Provider store={store}>
      <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
    </Provider>);

    expect(fetchObservationsForSubject).toHaveBeenCalledWith('fake-id', { 'page': 1, 'page_size': ITEMS_PER_PAGE });
  });

  describe('rendering table correctly', () => {
    test('getting all uniq properties from the observations chunk', () => {
      const uniqResultsValue = getObservationUniqProperties(mockedObservationsData);
      expect(uniqResultsValue).toEqual(['speed', 'temperature']);
    });

    test('rendering table cells matched with property header', async () => {
      render(<Provider store={store}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      const tableCells = await screen.findAllByRole('cell');
      const tableHeaders = await screen.findAllByRole('columnheader');

      expect(tableHeaders[1].childNodes[0]).toHaveTextContent('Speed');
      expect(tableCells[1].childNodes[0]).toHaveTextContent('500 km');

      expect(tableHeaders[2].childNodes[0]).toHaveTextContent('Temperature');
      expect(tableCells[2].childNodes[0]).toHaveTextContent('1000 c');

      expect(tableHeaders[3]).toBe(undefined);
    });
  });
  describe('pagination', () => {
    test('should show pagination if has as total more than items per page', async () => {
      render(<Provider store={store}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      const table = await screen.getByRole('table');
      expect(table).toBeDefined();

      const pagination = await screen.getByRole('list');
      expect(pagination).toBeDefined();
    });

    test('Do not should show pagination if has less items than allowed per page', async () => {
      const totalCount = 8;
      fetchObservationsForSubjectMock = jest.fn(() => () => Promise.resolve({
        count: totalCount,
        results: mockedObservationsData
      }));
      fetchObservationsForSubject.mockImplementation(fetchObservationsForSubjectMock);

      render(<Provider store={store}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      expect(totalCount).toBeLessThan(ITEMS_PER_PAGE);

      const table = await screen.getByRole('table');
      expect(table).toBeDefined();
      expect(() => screen.getByRole('list')).toThrow();
    });

    test('clicking in page should fetch observations again', async () => {
      let paginationListItems, pageLink;

      render(<Provider store={store}>
        <SubjectHistoricalDataModal title='Historical data' subjectId='fake-id' fetchObservationsForSubject/>
      </Provider>);

      expect(fetchObservationsForSubject).toHaveBeenCalledWith('fake-id', { 'page': 1, 'page_size': ITEMS_PER_PAGE });

      await waitFor(() => {
        paginationListItems = screen.getAllByRole('listitem');
        pageLink = within(paginationListItems[3]).getByRole('link');
      });

      expect(pageLink).toHaveTextContent('2');
      userEvent.click(pageLink);

      expect(fetchObservationsForSubject).toHaveBeenCalledWith('fake-id', { 'page': 2, 'page_size': ITEMS_PER_PAGE });
    });
  });
});