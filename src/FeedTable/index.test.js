import { act } from 'react';
import { getGridApi } from 'ag-grid-community';
import userEvent from '@testing-library/user-event';

import { render, screen, waitFor } from '../test-utils';

import FeedTable from '.';

const COLUMNS = [
  { colId: 'a', field: 'a', headerName: 'A' },
  { colId: 'b', field: 'b', headerName: 'B' },
  { colId: 'c', field: 'c', headerName: 'C' },
];
const ROWS = [{ a: 1, b: 2, c: 3, id: 'row-1' }];

describe('FeedTable', () => {
  let gridApi, toolbarContainer;

  beforeEach(() => {
    window.localStorage.clear();
    toolbarContainer = document.createElement('div');
    document.body.appendChild(toolbarContainer);
  });

  const feedTable = (columnDefs) => <FeedTable
    columnDefs={columnDefs}
    getRowId={(params) => params.data.id}
    onOpenRow={jest.fn()}
    rowData={ROWS}
    tableKey="test"
    toolbarContainer={toolbarContainer}
  />;

  const renderFeedTable = async () => {
    const result = render(feedTable(COLUMNS));
    await waitFor(() => expect(document.querySelector('.ag-root')).toBeTruthy());
    // The grid's API is the one place to read and move its column order.
    gridApi = getGridApi(document.querySelector('[grid-id]').parentElement);
    return result;
  };

  const shownColumnOrder = () => gridApi.getColumnState().filter((column) => !column.hide).map((column) => column.colId);

  const dragCToFront = () => act(() => gridApi.moveColumns(['c'], 1));

  test('keeps a dragged column order when new column definitions arrive', async () => {
    const { rerender } = await renderFeedTable();
    dragCToFront();
    expect(shownColumnOrder().slice(-3)).toEqual(['c', 'a', 'b']);

    rerender(feedTable(COLUMNS.map((column) => ({ ...column }))));

    await waitFor(() => expect(shownColumnOrder().slice(-3)).toEqual(['c', 'a', 'b']));
  });

  test('keeps the order when a column is hidden and shown again', async () => {
    await renderFeedTable();
    dragCToFront();

    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'A' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'A' }));

    await waitFor(() => expect(shownColumnOrder().slice(-3)).toEqual(['c', 'a', 'b']));
  });

  test('adds new columns at the end without resetting the order', async () => {
    const { rerender } = await renderFeedTable();
    dragCToFront();

    rerender(feedTable([...COLUMNS, { colId: 'd', field: 'd', headerName: 'D' }]));

    await waitFor(() => expect(shownColumnOrder().slice(-4)).toEqual(['c', 'a', 'b', 'd']));
  });
});
