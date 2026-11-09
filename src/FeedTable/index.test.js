import { act } from 'react';
import { getGridApi, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import userEvent from '@testing-library/user-event';

import { render, screen, waitFor } from '../test-utils';

import FeedTable, { BACKGROUND_LOAD_RETRY_DELAY, formatDateValue, ICON_COLUMN, IconCell } from '.';

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

  const feedTable = (columnDefs, layoutScope, rowData = ROWS, otherProps = {}) => <FeedTable
    ariaLabel="Test table"
    columnDefs={columnDefs}
    getRowId={(params) => params.data.id}
    layoutScope={layoutScope}
    onOpenRow={onOpenRow}
    renderBulkActions={() => null}
    rowData={rowData}
    tableKey="test"
    toolbarContainer={toolbarContainer}
    {...otherProps}
  />;

  const findGridApi = async () => {
    await waitFor(() => expect(document.querySelector('[grid-id]')).toBeTruthy());
    gridApi = getGridApi(document.querySelector('[grid-id]').parentElement);
  };

  const renderFeedTable = async (columnDefs = COLUMNS, layoutScope, rowData, otherProps) => {
    const result = render(feedTable(columnDefs, layoutScope, rowData, otherProps));
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
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'A' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'A' }));

    await waitFor(() => expect(shownColumnOrder().slice(-3)).toEqual(['c', 'a', 'b']));
  });

  test('adds new columns at the end without resetting the order', async () => {
    const { rerender } = await renderFeedTable();
    await dragCToFront();

    rerender(feedTable([...COLUMNS, { colId: 'd', field: 'd', headerName: 'D' }]));

    await waitFor(() => expect(shownColumnOrder().slice(-4)).toEqual(['c', 'a', 'b', 'd']));
  });

  test('adds a new leading column first without resetting the order', async () => {
    const { rerender } = await renderFeedTable();
    await dragCToFront();

    rerender(feedTable([{ colId: 'icon', field: 'icon', headerName: '', menuName: 'Icon' }, ...COLUMNS]));

    await waitFor(() => expect(shownColumnOrder().slice(-4)).toEqual(['icon', 'c', 'a', 'b']));
  });

  test('names a column without a header by its menu name in the Columns menu', async () => {
    await renderFeedTable([{ colId: 'icon', field: 'icon', headerName: '', menuName: 'Icon' }, ...COLUMNS]);
    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));

    expect(screen.getByRole('menuitemcheckbox', { name: 'Icon' })).toBeVisible();
  });

  test('keeps a dragged order and column widths across a reload', async () => {
    const { unmount } = await renderFeedTable();
    await dragCToFront();
    await userArranges(() => gridApi.setColumnWidths([{ key: 'b', newWidth: 321 }], true, 'uiColumnResized'));

    expect(stored('feedTable.v2.columnOrder.test')).toEqual(['c', 'a', 'b']);
    expect(stored('feedTable.v2.columnWidths.test')).toEqual({ b: 321 });

    await remountFeedTable(unmount);

    expect(shownColumnOrder().slice(-3)).toEqual(['c', 'a', 'b']);
    expect(gridApi.getColumnState().find((column) => column.colId === 'b').width).toBe(321);
  });

  test('ignores saved columns that are gone and puts unknown columns last', async () => {
    window.localStorage.setItem('feedTable.v2.columnOrder.test', JSON.stringify(['gone', 'c', 'a']));

    await renderFeedTable();

    expect(shownColumnOrder().slice(-3)).toEqual(['c', 'a', 'b']);
  });

  test('treats unreadable saved columns as none', async () => {
    window.localStorage.setItem('feedTable.v2.columnOrder.test', '{broken');
    window.localStorage.setItem('feedTable.v2.columnWidths.test', '[1]');

    await renderFeedTable();

    expect(shownColumnOrder().slice(-3)).toEqual(['a', 'b', 'c']);
  });

  test('remembers the order of an event type\'s field columns apart from the base columns', async () => {
    const { unmount } = await renderFeedTable([...COLUMNS, ...FIELD_COLUMNS], 'type-1');
    await userArranges(() => gridApi.moveColumns(['y'], 1));
    await dragCToFront();

    expect(shownColumnOrder().slice(-5)).toEqual(['c', 'y', 'a', 'b', 'x']);
    expect(stored('feedTable.v2.columnOrder.test')).toEqual(['c', 'a', 'b']);
    expect(stored('feedTable.v2.columnOrder.test.type-1')).toEqual(['c', 'y', 'a', 'b', 'x']);

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

  test('has every grid module the tables use registered', async () => {
    ModuleRegistry.registerModules([ValidationModule]);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await renderFeedTable([
      { ...ICON_COLUMN, cellRenderer: () => <IconCell>!</IconCell>, menuName: 'Icon' },
      { colId: 'a', field: 'a', headerName: 'A', sortable: true, sort: 'asc', sortingOrder: ['desc', 'asc'] },
      { cellDataType: false, colId: 'b', field: 'b', headerName: 'B', valueFormatter: formatDateValue },
      { colId: 'c', flex: 1, headerName: 'C', valueGetter: (params) => params.data.c },
    ], undefined, ROWS, { getRowClass: () => 'row-theme', statusMessage: 'Status' });
    await screen.findByText('!');

    const messages = [...consoleError.mock.calls, ...consoleWarn.mock.calls].map((args) => args.join(' '));
    expect(messages.filter((message) => message.includes('is not registered'))).toEqual([]);
    expect(document.querySelector('.ag-row .ag-cell[col-id="icon"]')).toHaveClass('iconColumnCell');
  });

  test('offers no row selection without bulk actions', async () => {
    await renderFeedTable(COLUMNS, undefined, ROWS, { renderBulkActions: undefined });

    await screen.findByText('A');
    expect(screen.queryByRole('checkbox', { name: 'Select all rows' })).toBeNull();
  });

  test('shows a status message in the toolbar', async () => {
    await renderFeedTable(COLUMNS, undefined, ROWS, { statusMessage: 'Showing 1 of 3' });

    expect(screen.getByRole('status')).toHaveTextContent('Showing 1 of 3');
  });

  test('loads every page behind a sort of its own and says how far it got', async () => {
    const onLoadMore = jest.fn()
      .mockReturnValueOnce(Promise.resolve())
      .mockReturnValueOnce(Promise.resolve())
      .mockReturnValue(undefined);
    await renderFeedTable([{ ...COLUMNS[0], sortable: true }, COLUMNS[1]], undefined, ROWS, { hasMorePages: true, onLoadMore, totalCount: 3 });

    act(() => gridApi.applyColumnState({ state: [{ colId: 'a', sort: 'asc' }] }));

    await waitFor(() => expect(onLoadMore).toHaveBeenCalledTimes(3));
    expect(screen.getByRole('status')).toHaveTextContent('Sorting by A: loaded 1 of 3');
  });

  test('retries a page that fails to load behind a sort, then pauses until retried', async () => {
    let failFirstPage;
    const onLoadMore = jest.fn()
      .mockReturnValueOnce(new Promise((resolve, reject) => {
        failFirstPage = reject;
      }))
      .mockImplementation(() => Promise.reject(new Error('offline')));
    await renderFeedTable([{ ...COLUMNS[0], sortable: true }, COLUMNS[1]], undefined, ROWS, { hasMorePages: true, onLoadMore, totalCount: 3 });

    act(() => gridApi.applyColumnState({ state: [{ colId: 'a', sort: 'asc' }] }));
    expect(await screen.findByRole('status')).toHaveTextContent('Sorting by A: loaded 1 of 3');

    jest.useFakeTimers();
    try {
      await act(async () => failFirstPage(new Error('offline')));
      for (const delay of [1, 2, 4]) {
        expect(screen.getByRole('status')).toHaveTextContent('Sorting by A: loaded 1 of 3');
        await act(async () => jest.advanceTimersByTime(BACKGROUND_LOAD_RETRY_DELAY * delay));
      }

      expect(onLoadMore).toHaveBeenCalledTimes(4);
      expect(screen.getByRole('status')).toHaveTextContent('Sorting paused: loaded 1 of 3');

      await act(async () => jest.advanceTimersByTime(BACKGROUND_LOAD_RETRY_DELAY * 8));
      expect(onLoadMore).toHaveBeenCalledTimes(4);

      onLoadMore.mockReturnValue(undefined);
      await act(async () => screen.getByRole('button', { name: 'Retry' }).click());

      expect(onLoadMore).toHaveBeenCalledTimes(5);
      expect(screen.getByRole('status')).toHaveTextContent('Sorting by A: loaded 1 of 3');
    } finally {
      jest.useRealTimers();
    }
  });

  test('loads no pages behind a sort the API makes', async () => {
    const onLoadMore = jest.fn(() => Promise.resolve());
    await renderFeedTable(
      [{ ...COLUMNS[0], serverSorted: true, sortable: true }, COLUMNS[1]],
      undefined,
      ROWS,
      { hasMorePages: true, onLoadMore, statusMessage: 'Status', totalCount: 3 }
    );

    await act(async () => gridApi.applyColumnState({ state: [{ colId: 'a', sort: 'asc' }] }));

    expect(onLoadMore).not.toHaveBeenCalled();
    expect(screen.getByRole('status')).toHaveTextContent('Status');
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

  const headerCell = (colId) => document.querySelector(`.ag-header-cell[col-id="${colId}"]`);

  test('moves the focused column header with Alt and an arrow, keeping focus on it and saving the order', async () => {
    await renderFeedTable();
    act(() => gridApi.setFocusedHeader('c'));

    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');

    expect(stored('feedTable.v2.columnOrder.test')).toEqual(['a', 'c', 'b']);
    await waitFor(() => expect(shownColumnOrder().slice(-3)).toEqual(['a', 'c', 'b']));
    expect(headerCell('c')).toHaveFocus();
  });

  test('does not move a column before the selection checkboxes', async () => {
    await renderFeedTable();
    act(() => gridApi.setFocusedHeader('a'));

    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');

    expect(stored('feedTable.v2.columnOrder.test')).toBeNull();
  });

  test('describes how to move columns from the keyboard', async () => {
    await renderFeedTable();

    expect(await screen.findByRole('grid', { name: 'Test table' })).toHaveAccessibleDescription(
      'Press Alt and the left or right arrow on a column header to move the column.'
    );
  });

  test('lets the last shown column fill the width when every column has a fixed one', async () => {
    window.localStorage.setItem('feedTable.v2.columnWidths.test', JSON.stringify({ a: 100, b: 100, c: 100 }));
    await renderFeedTable();

    await waitFor(() => expect(gridApi.getColumn('c').getFlex()).toBe(1));
    expect(gridApi.getColumn('b').getFlex()).toBeFalsy();
  });

  test('moves through the Columns menu with the arrow keys, Home and End', async () => {
    await renderFeedTable();
    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));

    expect(screen.getByRole('menu', { name: 'Columns shown' })).toBeVisible();
    expect(screen.getByRole('menuitemcheckbox', { name: 'A' })).toHaveFocus();

    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('menuitemcheckbox', { name: 'B' })).toHaveFocus();

    await userEvent.keyboard('{End}');
    expect(screen.getByRole('menuitemcheckbox', { name: 'C' })).toHaveFocus();

    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('menuitemcheckbox', { name: 'A' })).toHaveFocus();
  });

  test('marks the shown columns in the Columns menu', async () => {
    await renderFeedTable();
    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'B' }));

    expect(screen.getByRole('menuitemcheckbox', { name: 'A' })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('menuitemcheckbox', { name: 'B' })).toHaveAttribute('aria-checked', 'false');
    expect(stored('feedTable.v2.hiddenColumns.test')).toEqual({ b: true });
  });

  test('returns focus to the grid when the selection is cleared', async () => {
    await renderFeedTable();
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select row (not selected)' }));

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    expect(document.activeElement.closest('.ag-cell')).toBeTruthy();
  });

  test('closes the Columns menu with Escape and returns focus to its button', async () => {
    await renderFeedTable();
    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));
    await userEvent.click(screen.getByRole('menuitemcheckbox', { name: 'A' }));

    await userEvent.keyboard('{Escape}');

    expect(screen.getByRole('button', { name: 'Columns' })).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByRole('button', { name: 'Columns' })).toHaveFocus();
  });
});
