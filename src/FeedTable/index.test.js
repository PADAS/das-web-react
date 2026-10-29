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

const DetailsCell = ({ onOpenDetails }) => <button onClick={onOpenDetails} type="button">Open details</button>;

describe('FeedTable', () => {
  let gridApi, onOpenDetails, onOpenRow, toolbarContainer;

  beforeEach(() => {
    window.localStorage.clear();
    onOpenDetails = jest.fn();
    onOpenRow = jest.fn();
    toolbarContainer = document.createElement('div');
    document.body.appendChild(toolbarContainer);
  });

  const feedTable = (columnDefs, layoutScope, rowData = ROWS) => <FeedTable
    ariaLabel="Test table"
    columnDefs={columnDefs}
    getRowId={(params) => params.data.id}
    layoutScope={layoutScope}
    onOpenRow={onOpenRow}
    rowData={rowData}
    tableKey="test"
    toolbarContainer={toolbarContainer}
  />;

  const findGridApi = async () => {
    await waitFor(() => expect(document.querySelector('[grid-id]')).toBeTruthy());
    gridApi = getGridApi(document.querySelector('[grid-id]').parentElement);
  };

  const renderFeedTable = async (columnDefs = COLUMNS, layoutScope, rowData) => {
    const result = render(feedTable(columnDefs, layoutScope, rowData));
    await findGridApi();
    return result;
  };

  const remountFeedTable = async (unmount, columnDefs = COLUMNS, layoutScope) => {
    unmount();
    document.body.innerHTML = '';
    document.body.appendChild(toolbarContainer);
    return renderFeedTable(columnDefs, layoutScope);
  };

  const focusCell = (colId) => act(() => gridApi.setFocusedCell(0, colId));

  const renderFeedTableWithDetailsCell = () => renderFeedTable([
    ...COLUMNS,
    { cellRenderer: DetailsCell, cellRendererParams: { onOpenDetails }, colId: 'details', headerName: 'Details' },
  ]);

  const shownColumnOrder = () => gridApi.getColumnState().filter((column) => !column.hide).map((column) => column.colId);

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

  test('names the grid', async () => {
    await renderFeedTable();

    expect(await screen.findByRole('grid', { name: 'Test table' })).toBeInTheDocument();
  });

  test('names the selection checkboxes in the app language', async () => {
    await renderFeedTable();

    expect(await screen.findByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: 'Select row (not selected)' })).toBeInTheDocument();
  });

  test('says when there are no rows in the app language', async () => {
    await renderFeedTable(COLUMNS, undefined, []);

    expect(await screen.findByText('Nothing to show')).toBeVisible();
  });

  test('opens the row when Enter is pressed on a cell', async () => {
    await renderFeedTable();
    focusCell('a');

    await userEvent.keyboard('{Enter}');

    await waitFor(() => expect(onOpenRow).toHaveBeenCalledWith(ROWS[0]));
  });

  test('activates the control in a cell with Enter or Space instead of opening the row', async () => {
    await renderFeedTableWithDetailsCell();
    focusCell('details');

    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onOpenDetails).toHaveBeenCalledTimes(2);
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(onOpenRow).not.toHaveBeenCalled();
  });

  test('moves focus to the control in a cell with Tab, where Enter activates it', async () => {
    await renderFeedTableWithDetailsCell();
    focusCell('details');

    await userEvent.tab();

    expect(screen.getByRole('button', { name: 'Open details' })).toHaveFocus();

    await userEvent.keyboard('{Enter}');

    expect(onOpenDetails).toHaveBeenCalledTimes(1);
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(onOpenRow).not.toHaveBeenCalled();
  });

  test('moves a column from the Columns menu, keeping focus on it and saving the order', async () => {
    await renderFeedTable();
    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));

    expect(screen.getByRole('button', { name: 'Move A up' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Move C up' }));

    expect(screen.getByRole('button', { name: 'Move C up' })).toHaveFocus();
    expect(stored('feedTable.columnOrder.test')).toEqual(['a', 'c', 'b']);
    await waitFor(() => expect(shownColumnOrder().slice(-3)).toEqual(['a', 'c', 'b']));

    await userEvent.click(screen.getByRole('button', { name: 'Move C up' }));

    expect(screen.getByRole('button', { name: 'Move C up' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Move C down' })).toHaveFocus();
  });

  test('closes the Columns menu with Escape and returns focus to its button', async () => {
    await renderFeedTable();
    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'A' }));

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Columns' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Columns' })).toHaveFocus();
  });
});
