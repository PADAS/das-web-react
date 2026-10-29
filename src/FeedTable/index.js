import { useCallback, useMemo, useState } from 'react';
import isPlainObject from 'lodash/isPlainObject';
import { createPortal } from 'react-dom';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import MoonLoader from 'react-spinners/MoonLoader';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';

import { showToast } from '../utils/toast';

import * as styles from './styles.module.scss';

ModuleRegistry.registerModules([AllCommunityModule]);

// How close to the last loaded row a scroll asks for the next page.
const LOAD_MORE_EDGE_ROWS = 10;

const SELECTION_COLUMN_ID = 'ag-Grid-SelectionColumn';

const ROW_SELECTION = {
  checkboxes: true,
  enableClickSelection: false,
  headerCheckbox: true,
  mode: 'multiRow',
};

// `unSortIcon` marks sortable columns with an arrow even before they're sorted.
const DEFAULT_COL_DEF = { resizable: true, sortable: false, unSortIcon: true };

// Mirrors the web app's palette and type in common/styles/vars (_colors.scss, _fonts.scss).
const gridTheme = themeQuartz.withParams({
  accentColor: '#006cd9', // $bright-blue
  backgroundColor: '#fff',
  borderColor: '#ddd', // $light-gray-lines
  fontFamily: '"Helvetica Neue", helvetica, arial, sans-serif',
  fontSize: 14,
  foregroundColor: '#323335', // $primary-font-color
  headerBackgroundColor: '#f4f7fd', // $very-light-blue
  headerFontSize: 13,
  headerFontWeight: 600,
  headerTextColor: '#333', // $off-black
  oddRowBackgroundColor: '#fbfbfb', // $off-white
  rowHoverColor: '#e8f0fb', // $blue-highlight
  selectedRowBackgroundColor: '#e8f0fb', // $blue-highlight
  wrapperBorderRadius: 0,
  wrapperBorder: false,
});

// Column resizes the user made, as opposed to the grid fitting flex columns.
const USER_RESIZE_SOURCES = ['autosizeColumns', 'uiColumnResized'];

const storageKey = (setting, tableKey, scope) => `feedTable.${setting}.${tableKey}${scope ? `.${scope}` : ''}`;

const readStored = (key, isValid, fallback) => {
  try {
    const value = JSON.parse(window.localStorage.getItem(key));
    return isValid(value) ? value : fallback;
  } catch {
    return fallback;
  }
};

const writeStored = (key, value) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Column choices are a convenience; the table works without remembering them.
  }
};

const readColumnOrder = (tableKey, scope) => readStored(storageKey('columnOrder', tableKey, scope), Array.isArray, null);

// Columns in the saved order; ones it doesn't know go last, in their own order.
const orderColumns = (columns, order) => {
  const positions = new Map(order.map((colId, index) => [colId, index]));
  const positionOf = (column) => positions.get(column.colId) ?? order.length;

  return [...columns].sort((a, b) => positionOf(a) - positionOf(b));
};

// The expanded, tabular view of a feed. Filters stay with the feed; the table
// adds what only makes sense with room to spare: column choice, multi-select,
// bulk actions and export. A column hides by default with `defaultHidden`.
// Column order and widths the user sets are remembered per table. A column
// marked `layoutScoped` belongs to `layoutScope` (an event type's fields), whose
// order is remembered on its own, so it doesn't disturb the table's base order.
// The Export button shows when the feed passes `onExport`.
// Its controls render into `toolbarContainer`, a spot the feed keeps for them
// beside the filter summary, so they take no row of their own.
const FeedTable = ({
  columnDefs,
  getRowId,
  layoutScope = '',
  loading = false,
  onLoadMore,
  onExport,
  onOpenRow,
  onSortChanged,
  renderBulkActions,
  rowData,
  tableKey,
  toolbarContainer,
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'feedTable' });

  const [exporting, setExporting] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [columnOrders, setColumnOrders] = useState({});
  const [columnWidths, setColumnWidths] = useState(
    () => readStored(storageKey('columnWidths', tableKey), isPlainObject, {})
  );
  const [hiddenColumns, setHiddenColumns] = useState(
    () => readStored(storageKey('hiddenColumns', tableKey), isPlainObject, {})
  );
  const [selectedRows, setSelectedRows] = useState([]);

  const isColumnHidden = useCallback(
    (column) => hiddenColumns[column.colId] ?? !!column.defaultHidden,
    [hiddenColumns]
  );

  const columnOrder = useMemo(() => {
    const orderOf = (scope) => columnOrders[scope] ?? readColumnOrder(tableKey, scope);

    return (layoutScope && orderOf(layoutScope)) || orderOf('') || [];
  }, [columnOrders, layoutScope, tableKey]);

  // The grid lays columns out in definition order, so the definitions carry the
  // user's order and survive being rebuilt.
  const visibleColumnDefs = useMemo(
    () => orderColumns(columnDefs, columnOrder).map(({ defaultHidden, layoutScoped: _layoutScoped, ...column }) => ({
      ...column,
      ...(columnWidths[column.colId] && { flex: null, width: columnWidths[column.colId] }),
      hide: isColumnHidden({ ...column, defaultHidden }),
    })),
    [columnDefs, columnOrder, columnWidths, isColumnHidden]
  );

  const toggleColumn = (column) => {
    const nextHiddenColumns = { ...hiddenColumns, [column.colId]: !isColumnHidden(column) };

    setHiddenColumns(nextHiddenColumns);
    writeStored(storageKey('hiddenColumns', tableKey), nextHiddenColumns);
  };

  const onColumnMoved = (event) => {
    if (!event.finished) return;

    const order = event.api.getColumnState().map((column) => column.colId).filter((colId) => colId !== SELECTION_COLUMN_ID);
    const scopedColIds = columnDefs.filter((column) => column.layoutScoped).map((column) => column.colId);
    const nextColumnOrders = {
      ...columnOrders,
      '': order.filter((colId) => !scopedColIds.includes(colId)),
      ...(layoutScope && { [layoutScope]: order }),
    };

    setColumnOrders(nextColumnOrders);
    writeStored(storageKey('columnOrder', tableKey), nextColumnOrders['']);
    if (layoutScope) {
      writeStored(storageKey('columnOrder', tableKey, layoutScope), order);
    }
  };

  const onColumnResized = (event) => {
    if (!event.finished || !USER_RESIZE_SOURCES.includes(event.source) || !event.columns?.length) return;

    const nextColumnWidths = { ...columnWidths };
    event.columns.forEach((column) => {
      nextColumnWidths[column.getColId()] = column.getActualWidth();
    });

    setColumnWidths(nextColumnWidths);
    writeStored(storageKey('columnWidths', tableKey), nextColumnWidths);
  };

  const clearSelection = useCallback(() => gridApi?.deselectAll(), [gridApi]);

  // A control inside a cell, like a drill-down link, does its own thing instead of opening the row.
  const opensRow = (event) => event.column.getColId() !== SELECTION_COLUMN_ID && !event.event?.target?.closest?.('button, a');

  const onCellClicked = (event) => {
    if (opensRow(event)) {
      onOpenRow(event.data);
    }
  };

  const onCellKeyDown = (event) => {
    if (event.event?.key === 'Enter' && opensRow(event)) {
      onOpenRow(event.data);
    }
  };

  const onBodyScroll = (event) => {
    if (!onLoadMore || event.direction !== 'vertical') return;

    const lastDisplayedRowIndex = event.api.getLastDisplayedRowIndex();
    const displayedRowCount = event.api.getDisplayedRowCount();
    if (displayedRowCount > 0 && lastDisplayedRowIndex >= displayedRowCount - LOAD_MORE_EDGE_ROWS) {
      onLoadMore();
    }
  };

  const onExportClick = async () => {
    setExporting(true);
    try {
      await onExport();
    } catch {
      showToast({ message: t('exportError') });
    } finally {
      setExporting(false);
    }
  };

  return <div className={styles.feedTable} data-testid={`feedTable-${tableKey}`}>
    {!!toolbarContainer && createPortal(<div className={styles.toolbar}>
      {selectedRows.length > 0 && <div className={styles.selection}>
        <span className={styles.selectionCount}>{t('selectedCount', { count: selectedRows.length })}</span>

        {renderBulkActions?.(selectedRows, clearSelection)}

        <Button onClick={clearSelection} size="sm" type="button" variant="link">{t('clearSelection')}</Button>
      </div>}

      <div className={styles.toolbarEnd}>
        <Dropdown autoClose="outside">
          <Dropdown.Toggle data-testid="feedTable-columnsToggle" size="sm" variant="outline-secondary">
            {t('columns')}
          </Dropdown.Toggle>

          <Dropdown.Menu className={styles.columnsMenu}>
            {columnDefs.map((column) => <Form.Check
              checked={!isColumnHidden(column)}
              className={styles.columnsMenuItem}
              id={`feedTable-${tableKey}-column-${column.colId}`}
              key={column.colId}
              label={column.headerName}
              onChange={() => toggleColumn(column)}
              type="checkbox"
            />)}
          </Dropdown.Menu>
        </Dropdown>

        {!!onExport && <Button
          data-testid="feedTable-exportButton"
          disabled={exporting || loading}
          onClick={onExportClick}
          size="sm"
          type="button"
          variant="outline-secondary"
        >
          {t('export')}
        </Button>}
      </div>
    </div>, toolbarContainer)}

    <div className={styles.grid}>
      <AgGridReact
        columnDefs={visibleColumnDefs}
        defaultColDef={DEFAULT_COL_DEF}
        enableCellTextSelection
        ensureDomOrder
        getRowId={getRowId}
        loading={loading || exporting}
        loadingOverlayComponent={() => <MoonLoader size={40} />}
        onBodyScroll={onBodyScroll}
        onCellClicked={onCellClicked}
        onCellKeyDown={onCellKeyDown}
        onColumnMoved={onColumnMoved}
        onColumnResized={onColumnResized}
        onGridReady={(event) => setGridApi(event.api)}
        onSelectionChanged={(event) => setSelectedRows(event.api.getSelectedRows())}
        onSortChanged={onSortChanged}
        rowClass={styles.row}
        rowData={rowData}
        rowSelection={ROW_SELECTION}
        theme={gridTheme}
      />
    </div>
  </div>;
};

export default FeedTable;
