import { act } from 'react';
import { getGridApi, ModuleRegistry, ValidationModule } from 'ag-grid-community';
import userEvent from '@testing-library/user-event';

import { fireEvent, render, screen, waitFor } from '../test-utils';

import FeedTable, { formatDateValue, TITLE_COLUMN } from '.';

const COLUMNS = [
  { colId: 'a', field: 'a', headerName: 'A' },
  { colId: 'b', field: 'b', headerName: 'B' },
  { colId: 'c', field: 'c', headerName: 'C' },
];
const ROWS = [{ a: 1, b: 2, c: 3, id: 'row-1', title: 'First row' }];
const TITLED_COLUMNS = [
  { ...TITLE_COLUMN, cellRendererParams: { renderIcon: () => '!' }, field: 'title', headerName: 'Title', sortable: true },
  ...COLUMNS.map((column) => ({ ...column, sortable: true })),
];
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
    getRowPath={(row) => `/rows/${row.id}`}
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

  const renderFeedTableWithDetailsCell = () => renderFeedTable([
    ...TITLED_COLUMNS,
    { cellRenderer: DetailsCell, cellRendererParams: { onOpenDetails }, colId: 'details', headerName: 'Details' },
  ]);

  const headerCell = (colId) => document.querySelector(`.ag-header-cell[col-id="${colId}"]`);

  const shownColumnOrder = () => gridApi.getColumnState().filter((column) => !column.hide).map((column) => column.colId);

  const userArranges = async (arrange) => {
    act(arrange);
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
  };

  const dragCToFront = () => userArranges(() => gridApi.moveColumns(['c'], 0));

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
    await userArranges(() => gridApi.moveColumns(['y'], 0));
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

  test('names each checkbox in the app language, a row\'s after its title', async () => {
    await renderFeedTable(TITLED_COLUMNS);

    expect(await screen.findByRole('checkbox', { name: 'Select all rows' })).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: 'Select First row' })).toBeInTheDocument();
  });

  test('selects every row from the header checkbox, which shows a partial selection as mixed', async () => {
    const rows = [...ROWS, { a: 4, b: 5, c: 6, id: 'row-2', title: 'Second row' }];
    await renderFeedTable(TITLED_COLUMNS, undefined, rows);

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select First row' }));

    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBePartiallyChecked();
    expect(screen.getByText('1 selected')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toBeChecked();
    expect(screen.getByRole('checkbox', { name: 'Select Second row' })).toBeChecked();
    expect(screen.getByText('2 selected')).toBeInTheDocument();

    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all rows' }));

    expect(screen.getByRole('checkbox', { name: 'Select First row' })).not.toBeChecked();
    expect(screen.queryByText(/selected/)).toBeNull();
  });

  test('keeps the title column first, stretched and always shown, leaving it out of the Columns menu', async () => {
    window.localStorage.setItem('feedTable.v2.hiddenColumns.test', JSON.stringify({ title: true }));
    window.localStorage.setItem('feedTable.v2.columnOrder.test', JSON.stringify(['a', 'title', 'b', 'c']));
    await renderFeedTable(TITLED_COLUMNS);

    expect(gridApi.getColumn('title').isPinned()).toBe(false);
    expect(gridApi.getColumn('title').getFlex()).toBe(2);
    expect(gridApi.getColumn('title').isVisible()).toBe(true);
    expect(gridApi.getAllDisplayedColumns()[0].getColId()).toBe('title');

    await userEvent.click(screen.getByRole('button', { name: 'Columns' }));

    expect(screen.queryByRole('menuitemcheckbox', { name: 'Title' })).toBeNull();
  });

  test('shows the title as a link that opens the row', async () => {
    await renderFeedTable(TITLED_COLUMNS);

    const titleLink = await screen.findByRole('link', { name: 'First row' });
    expect(titleLink).toHaveAttribute('href', '/rows/row-1');

    await userEvent.click(titleLink);

    expect(onOpenRow).toHaveBeenCalledTimes(1);
    expect(onOpenRow).toHaveBeenCalledWith(ROWS[0]);
  });

  test('leaves a modified click on the title link to the browser', async () => {
    await renderFeedTable(TITLED_COLUMNS);

    const isOpenedInPage = fireEvent.click(await screen.findByRole('link', { name: 'First row' }), { ctrlKey: true });

    expect(isOpenedInPage).toBe(true);
    expect(onOpenRow).not.toHaveBeenCalled();
  });

  test('does not open the row when its checkbox is clicked', async () => {
    await renderFeedTable(TITLED_COLUMNS);

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select First row' }));

    expect(onOpenRow).not.toHaveBeenCalled();
  });

  test('has every grid module the tables use registered', async () => {
    ModuleRegistry.registerModules([ValidationModule]);
    const consoleError = jest.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarn = jest.spyOn(console, 'warn').mockImplementation(() => {});

    await renderFeedTable([
      TITLED_COLUMNS[0],
      { colId: 'a', field: 'a', headerName: 'A', sortable: true, sort: 'asc', sortingOrder: ['desc', 'asc'] },
      { cellDataType: false, colId: 'b', field: 'b', headerName: 'B', valueFormatter: formatDateValue },
      { colId: 'c', flex: 1, headerName: 'C', valueGetter: (params) => params.data.c },
    ], undefined, ROWS, { getRowClass: () => 'row-theme', statusMessage: 'Status' });
    await screen.findByText('!');

    const messages = [...consoleError.mock.calls, ...consoleWarn.mock.calls].map((args) => args.join(' '));
    expect(messages.filter((message) => message.includes('is not registered') || message.includes('AG Grid')))
      .toEqual([]);
    expect(document.querySelector('.ag-row .ag-cell[col-id="title"]')).toHaveClass('titleColumnCell');
  });

  test('offers no row selection without bulk actions', async () => {
    await renderFeedTable(TITLED_COLUMNS, undefined, ROWS, { renderBulkActions: undefined });

    await screen.findByRole('link', { name: 'First row' });
    expect(screen.queryByRole('checkbox')).toBeNull();
  });

  test('shows a status message in the toolbar', async () => {
    await renderFeedTable(COLUMNS, undefined, ROWS, { statusMessage: 'Showing 1 of 3' });

    expect(screen.getByText('Showing 1 of 3')).toHaveAttribute('role', 'status');
  });

  const SORTED_BY_A_COLUMNS = [{ ...COLUMNS[0], sort: 'asc', sortable: true }, COLUMNS[1]];

  test('shows how far the load behind a sort of its own got, announcing only that it started', async () => {
    await renderFeedTable(SORTED_BY_A_COLUMNS, undefined, ROWS, { fullLoad: { isLoading: true }, totalCount: 3 });

    expect(screen.getByText('Sorting by A: loaded 1 of 3')).toHaveAttribute('aria-hidden', 'true');
    expect(screen.getByRole('status')).toHaveTextContent(/^Loading every row to sort by A$/);
  });

  test('announces when the load behind a sort of its own is done', async () => {
    await renderFeedTable(SORTED_BY_A_COLUMNS, undefined, ROWS, { fullLoad: { isLoading: false }, totalCount: 1 });

    expect(screen.queryByText(/loaded 1 of/)).toBeNull();
    expect(screen.getByRole('status')).toHaveTextContent(/^Sorted by A: every row loaded$/);
  });

  test('offers to retry a paused load behind a sort of its own', async () => {
    const retry = jest.fn();
    await renderFeedTable(SORTED_BY_A_COLUMNS, undefined, ROWS, { fullLoad: { isPaused: true, retry }, totalCount: 3 });

    expect(screen.getByText(/Sorting paused: loaded 1 of 3/)).toHaveAttribute('role', 'status');
    await userEvent.click(screen.getByRole('button', { name: 'Retry' }));

    expect(retry).toHaveBeenCalled();
  });

  test('says nothing about loading behind a sort the API makes', async () => {
    await renderFeedTable(
      [{ ...COLUMNS[0], serverSorted: true, sort: 'asc', sortable: true }, COLUMNS[1]],
      undefined,
      ROWS,
      { fullLoad: { isLoading: false }, statusMessage: 'Status', totalCount: 3 }
    );

    expect(screen.getByText('Status')).toHaveAttribute('role', 'status');
    expect(screen.queryByText(/every row/)).toBeNull();
  });

  test('sorts by one column only, even when a header is shift-clicked', async () => {
    await renderFeedTable(COLUMNS.map((column) => ({ ...column, sortable: true })));

    await userEvent.click(await screen.findByRole('button', { name: 'A' }));
    fireEvent.click(screen.getByRole('button', { name: 'B' }), { shiftKey: true });

    await waitFor(() => expect(gridApi.getColumnState().filter((column) => column.sort).map((column) => column.colId))
      .toEqual(['b']));
  });

  test('says when there are no rows in the app language', async () => {
    await renderFeedTable(COLUMNS, undefined, []);

    expect(await screen.findByText('Nothing to show')).toBeVisible();
  });

  test('sorts a column from its header button and shows the direction', async () => {
    await renderFeedTable(TITLED_COLUMNS);

    await userEvent.click(await screen.findByRole('button', { name: 'A' }));

    expect(gridApi.getColumn('a').getSort()).toBe('asc');
    expect(headerCell('a')).toHaveAttribute('aria-sort', 'ascending');

    await userEvent.click(screen.getByRole('button', { name: 'A' }));

    expect(gridApi.getColumn('a').getSort()).toBe('desc');
  });

  test('shows a header without a sort as plain text', async () => {
    await renderFeedTable();

    expect(await screen.findByText('A')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'A' })).toBeNull();
  });

  test('tabs through the checkboxes, sort buttons, title links and cell controls only', async () => {
    await renderFeedTableWithDetailsCell();
    await screen.findByRole('link', { name: 'First row' });
    act(() => screen.getByRole('button', { name: 'Columns' }).focus());

    const tabStops = [];
    for (let index = 0; index < 8; index += 1) {
      await userEvent.tab();
      tabStops.push(document.activeElement);
    }

    expect(tabStops.slice(0, 7)).toEqual([
      screen.getByRole('checkbox', { name: 'Select all rows' }),
      screen.getByRole('button', { name: 'Title' }),
      screen.getByRole('button', { name: 'A' }),
      screen.getByRole('button', { name: 'B' }),
      screen.getByRole('button', { name: 'C' }),
      screen.getByRole('checkbox', { name: 'Select First row' }),
      screen.getByRole('link', { name: 'First row' }),
    ]);
    expect(tabStops[7]).toBe(screen.getByRole('button', { name: 'Open details' }));
    expect(document.querySelectorAll('.ag-cell[tabindex], .ag-header-cell[tabindex]')).toHaveLength(0);
  });

  test('activates the control in a cell with Enter or Space instead of opening the row', async () => {
    await renderFeedTableWithDetailsCell();
    const detailsButton = await screen.findByRole('button', { name: 'Open details' });
    act(() => detailsButton.focus());

    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');

    expect(onOpenDetails).toHaveBeenCalledTimes(2);
    await act(() => new Promise((resolve) => setTimeout(resolve, 0)));
    expect(onOpenRow).not.toHaveBeenCalled();
  });

  test('moves a column with Alt and an arrow on its sort button, keeping focus there and saving the order', async () => {
    await renderFeedTable(TITLED_COLUMNS);
    const sortButton = await screen.findByRole('button', { name: 'C' });
    act(() => sortButton.focus());

    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');

    expect(stored('feedTable.v2.columnOrder.test')).toEqual(['title', 'a', 'c', 'b']);
    await waitFor(() => expect(shownColumnOrder()).toEqual(['title', 'a', 'c', 'b']));
    await waitFor(() => expect(screen.getByRole('button', { name: 'C' })).toHaveFocus());
  });

  test('moves a column past a hidden one to the next shown column', async () => {
    window.localStorage.setItem('feedTable.v2.hiddenColumns.test', JSON.stringify({ b: true }));
    await renderFeedTable(TITLED_COLUMNS);
    const sortButton = await screen.findByRole('button', { name: 'C' });
    act(() => sortButton.focus());

    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');

    await waitFor(() => expect(shownColumnOrder()).toEqual(['title', 'c', 'a']));
  });

  test('does not move a column before the title column', async () => {
    await renderFeedTable(TITLED_COLUMNS);
    const sortButton = await screen.findByRole('button', { name: 'A' });
    act(() => sortButton.focus());

    await userEvent.keyboard('{Alt>}{ArrowLeft}{/Alt}');

    expect(stored('feedTable.v2.columnOrder.test')).toBeNull();
  });

  test('describes how to move a column on its sort button, but not on the title\'s', async () => {
    await renderFeedTable(TITLED_COLUMNS);

    expect(await screen.findByRole('button', { name: 'A' })).toHaveAccessibleDescription(
      'Press Alt and the left or right arrow on a column header to move the column.'
    );
    expect(screen.getByRole('button', { name: 'Title' })).not.toHaveAccessibleDescription();
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

  test('moves focus to the checkbox for every row when the selection is cleared', async () => {
    await renderFeedTable(TITLED_COLUMNS);
    await userEvent.click(await screen.findByRole('checkbox', { name: 'Select First row' }));

    await userEvent.click(screen.getByRole('button', { name: 'Clear' }));

    expect(screen.queryByRole('button', { name: 'Clear' })).toBeNull();
    expect(screen.getByRole('checkbox', { name: 'Select all rows' })).toHaveFocus();
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
