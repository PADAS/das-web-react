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
const FIELD_COLUMNS = [
  { colId: 'x', field: 'x', headerName: 'X', layoutScoped: true },
  { colId: 'y', field: 'y', headerName: 'Y', layoutScoped: true },
];

const stored = (key) => JSON.parse(window.localStorage.getItem(key));

describe('FeedTable', () => {
  let gridApi, toolbarContainer;

  beforeEach(() => {
    window.localStorage.clear();
    toolbarContainer = document.createElement('div');
    document.body.appendChild(toolbarContainer);
  });

  const feedTable = (columnDefs, layoutScope) => <FeedTable
    columnDefs={columnDefs}
    getRowId={(params) => params.data.id}
    layoutScope={layoutScope}
    onOpenRow={jest.fn()}
    rowData={ROWS}
    tableKey="test"
    toolbarContainer={toolbarContainer}
  />;

  const findGridApi = async () => {
    await waitFor(() => expect(document.querySelector('[grid-id]')).toBeTruthy());
    // The grid's API is the one place to read and move its column order.
    gridApi = getGridApi(document.querySelector('[grid-id]').parentElement);
  };

  const renderFeedTable = async (columnDefs = COLUMNS, layoutScope) => {
    const result = render(feedTable(columnDefs, layoutScope));
    await findGridApi();
    return result;
  };

  // A reload: the table mounts again from what this browser remembers.
  const remountFeedTable = async (unmount, columnDefs = COLUMNS, layoutScope) => {
    unmount();
    document.body.innerHTML = '';
    document.body.appendChild(toolbarContainer);
    return renderFeedTable(columnDefs, layoutScope);
  };

  const shownColumnOrder = () => gridApi.getColumnState().filter((column) => !column.hide).map((column) => column.colId);

  // The grid hands column events to its listeners after the current task.
  const userArranges = async (arrange) => {
    act(arrange);
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  };

  const dragCToFront = () => userArranges(() => gridApi.moveColumns(['c'], 1));

  test('keeps a dragged column order when new column definitions arrive', async () => {
    const { rerender } = await renderFeedTable();
    await dragCToFront();
    expect(shownColumnOrder().slice(-3)).toEqual(['c', 'a', 'b']);

    rerender(feedTable(COLUMNS.map((column) => ({ ...column }))));

    await waitFor(() => expect(shownColumnOrder().slice(-3)).toEqual(['c', 'a', 'b']));
  });

  test('keeps the order when a column is hidden and shown again', async () => {
    await renderFeedTable();
    await dragCToFront();

    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'A' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'A' }));

    await waitFor(() => expect(shownColumnOrder().slice(-3)).toEqual(['c', 'a', 'b']));
  });

  test('adds new columns at the end without resetting the order', async () => {
    const { rerender } = await renderFeedTable();
    await dragCToFront();

    rerender(feedTable([...COLUMNS, { colId: 'd', field: 'd', headerName: 'D' }]));

    await waitFor(() => expect(shownColumnOrder().slice(-4)).toEqual(['c', 'a', 'b', 'd']));
  });

  test('keeps a dragged order and column widths across a reload', async () => {
    const { unmount } = await renderFeedTable();
    await dragCToFront();
    await userArranges(() => gridApi.setColumnWidths([{ key: 'b', newWidth: 321 }], true, 'uiColumnResized'));

    expect(stored('feedTable.columnOrder.test')).toEqual(['c', 'a', 'b']);
    expect(stored('feedTable.columnWidths.test')).toEqual({ b: 321 });

    await remountFeedTable(unmount);

    expect(shownColumnOrder().slice(-3)).toEqual(['c', 'a', 'b']);
    expect(gridApi.getColumnState().find((column) => column.colId === 'b').width).toBe(321);
  });

  test('ignores saved columns that are gone and puts unknown columns last', async () => {
    window.localStorage.setItem('feedTable.columnOrder.test', JSON.stringify(['gone', 'c', 'a']));

    await renderFeedTable();

    expect(shownColumnOrder().slice(-3)).toEqual(['c', 'a', 'b']);
  });

  test('treats unreadable saved columns as none', async () => {
    window.localStorage.setItem('feedTable.columnOrder.test', '{broken');
    window.localStorage.setItem('feedTable.columnWidths.test', '[1]');

    await renderFeedTable();

    expect(shownColumnOrder().slice(-3)).toEqual(['a', 'b', 'c']);
  });

  test('remembers the order of an event type\'s field columns apart from the base columns', async () => {
    const { unmount } = await renderFeedTable([...COLUMNS, ...FIELD_COLUMNS], 'type-1');
    await userArranges(() => gridApi.moveColumns(['y'], 1));
    await dragCToFront();

    expect(shownColumnOrder().slice(-5)).toEqual(['c', 'y', 'a', 'b', 'x']);
    expect(stored('feedTable.columnOrder.test')).toEqual(['c', 'a', 'b']);
    expect(stored('feedTable.columnOrder.test.type-1')).toEqual(['c', 'y', 'a', 'b', 'x']);

    const otherTypeColumns = [{ colId: 'z', field: 'z', headerName: 'Z', layoutScoped: true }];
    const { unmount: unmountOtherType } = await remountFeedTable(unmount, [...COLUMNS, ...otherTypeColumns], 'type-2');

    expect(shownColumnOrder().slice(-4)).toEqual(['c', 'a', 'b', 'z']);

    await remountFeedTable(unmountOtherType, [...COLUMNS, ...FIELD_COLUMNS], 'type-1');

    expect(shownColumnOrder().slice(-5)).toEqual(['c', 'y', 'a', 'b', 'x']);
  });
});
