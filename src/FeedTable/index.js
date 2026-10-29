import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import isPlainObject from 'lodash/isPlainObject';
import { createPortal } from 'react-dom';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import MoonLoader from 'react-spinners/MoonLoader';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownIcon } from '../common/images/icons/arrow-down.svg';
import { ReactComponent as ArrowUpIcon } from '../common/images/icons/arrow-up.svg';

import { showToast } from '../utils/toast';

import * as styles from './styles.module.scss';

ModuleRegistry.registerModules([AllCommunityModule]);

// How close to the last loaded row a scroll asks for the next page.
const LOAD_MORE_EDGE_ROWS = 10;

const SELECTION_COLUMN_ID = 'ag-Grid-SelectionColumn';

const CELL_CONTROLS = 'a[href], button';
const CONTROL_KEYS = ['Enter', ' '];

const ROW_SELECTION = {
  checkboxes: true,
  enableClickSelection: false,
  headerCheckbox: true,
  mode: 'multiRow',
};

const DEFAULT_COL_DEF = {
  resizable: true,
  sortable: false,
  // A control in a cell answers Enter and Space itself, not the grid.
  suppressKeyboardEvent: ({ event }) => CONTROL_KEYS.includes(event.key) && !!event.target.closest(CELL_CONTROLS),
  // Marks sortable columns with an arrow even before they're sorted.
  unSortIcon: true,
};

// Mirrors the palette and type in common/styles/vars.
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

// Resizes the user made, as opposed to the grid fitting flex columns.
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
    // Column choices are a convenience; the table works without them.
  }
};

const readColumnOrder = (tableKey, scope) => readStored(storageKey('columnOrder', tableKey, scope), Array.isArray, null);

// Columns the saved order doesn't know go last, in their own order.
const orderColumns = (columns, order) => {
  const positions = new Map(order.map((colId, index) => [colId, index]));
  const positionOf = (column) => positions.get(column.colId) ?? order.length;

  return [...columns].sort((a, b) => positionOf(a) - positionOf(b));
};

const controlInCell = (element) => element.classList?.contains('ag-cell')
  ? element.querySelector(CELL_CONTROLS)
  : null;

// `layoutScoped` columns, such as an event type's fields, keep their own order.
const FeedTable = ({
  ariaLabel,
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
  const [movedColumn, setMovedColumn] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);

  const moveButtonRefs = useRef({});

  const localeText = useMemo(() => ({
    ariaChecked: t('grid.checkedStateLabel'),
    ariaHeaderSelection: t('grid.allRowsCheckboxLabel'),
    ariaIndeterminate: t('grid.indeterminateStateLabel'),
    ariaRowDeselect: t('grid.rowDeselectMessage'),
    ariaRowSelect: t('grid.rowSelectMessage'),
    ariaRowSelectAll: t('grid.allRowsCheckboxLabel'),
    ariaRowToggleSelection: t('grid.rowCheckboxLabel'),
    ariaUnchecked: t('grid.uncheckedStateLabel'),
    noRowsToShow: t('grid.noRowsMessage'),
  }), [t]);

  const isColumnHidden = useCallback(
    (column) => hiddenColumns[column.colId] ?? !!column.defaultHidden,
    [hiddenColumns]
  );

  const columnOrder = useMemo(() => {
    const orderOf = (scope) => columnOrders[scope] ?? readColumnOrder(tableKey, scope);

    return (layoutScope && orderOf(layoutScope)) || orderOf('') || [];
  }, [columnOrders, layoutScope, tableKey]);

  const orderedColumnDefs = useMemo(() => orderColumns(columnDefs, columnOrder), [columnDefs, columnOrder]);

  // The grid lays columns out in definition order, so the order survives a
  // rebuild only if the definitions carry it.
  const visibleColumnDefs = useMemo(
    () => orderedColumnDefs.map(({ defaultHidden, layoutScoped: _layoutScoped, ...column }) => ({
      ...column,
      ...(columnWidths[column.colId] && { flex: null, width: columnWidths[column.colId] }),
      hide: isColumnHidden({ ...column, defaultHidden }),
    })),
    [columnWidths, isColumnHidden, orderedColumnDefs]
  );

  useEffect(() => {
    gridApi?.setGridAriaProperty('label', ariaLabel ?? null);
  }, [ariaLabel, gridApi]);

  useEffect(() => {
    if (!movedColumn) return;

    const { colId, direction } = movedColumn;
    const otherDirection = direction === 'up' ? 'down' : 'up';
    const button = moveButtonRefs.current[`${colId}.${direction}`];
    (button?.disabled ? moveButtonRefs.current[`${colId}.${otherDirection}`] : button)?.focus();
  }, [movedColumn]);

  const toggleColumn = (column) => {
    const nextHiddenColumns = { ...hiddenColumns, [column.colId]: !isColumnHidden(column) };

    setHiddenColumns(nextHiddenColumns);
    writeStored(storageKey('hiddenColumns', tableKey), nextHiddenColumns);
  };

  const saveColumnOrder = (order) => {
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

  const onColumnMoved = (event) => {
    if (event.finished) {
      saveColumnOrder(
        event.api.getColumnState().map((column) => column.colId).filter((colId) => colId !== SELECTION_COLUMN_ID)
      );
    }
  };

  const moveColumn = (index, direction) => {
    const order = orderedColumnDefs.map((column) => column.colId);
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [order[index], order[targetIndex]] = [order[targetIndex], order[index]];

    saveColumnOrder(order);
    setMovedColumn({ colId: order[targetIndex], direction });
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

  // A control in a cell, such as a drill-down link, acts instead of the row.
  const opensRow = (event) => event.column.getColId() !== SELECTION_COLUMN_ID
    && !event.event?.target?.closest?.(CELL_CONTROLS);

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

  // Runs before the grid's own handler, which skips keys already handled.
  const onGridKeyDownCapture = (event) => {
    const control = controlInCell(event.target);
    if (!control) return;

    if (CONTROL_KEYS.includes(event.key)) {
      event.preventDefault();
      control.click();
    } else if (event.key === 'Tab' && !event.shiftKey) {
      event.preventDefault();
      control.focus();
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
            {orderedColumnDefs.map((column, index) => <div className={styles.columnsMenuItem} key={column.colId}>
              <Form.Check
                checked={!isColumnHidden(column)}
                className={styles.columnsMenuItemCheck}
                id={`feedTable-${tableKey}-column-${column.colId}`}
                label={column.headerName}
                onChange={() => toggleColumn(column)}
                type="checkbox"
              />

              <button
                aria-label={t('moveColumnUpButtonLabel', { column: column.headerName })}
                className={styles.moveColumnButton}
                disabled={index === 0}
                onClick={() => moveColumn(index, 'up')}
                ref={(element) => { moveButtonRefs.current[`${column.colId}.up`] = element; }}
                title={t('moveColumnUpButtonLabel', { column: column.headerName })}
                type="button"
              >
                <ArrowUpIcon aria-hidden="true" />
              </button>

              <button
                aria-label={t('moveColumnDownButtonLabel', { column: column.headerName })}
                className={styles.moveColumnButton}
                disabled={index === orderedColumnDefs.length - 1}
                onClick={() => moveColumn(index, 'down')}
                ref={(element) => { moveButtonRefs.current[`${column.colId}.down`] = element; }}
                title={t('moveColumnDownButtonLabel', { column: column.headerName })}
                type="button"
              >
                <ArrowDownIcon aria-hidden="true" />
              </button>
            </div>)}
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

    <div className={styles.grid} onKeyDownCapture={onGridKeyDownCapture}>
      <AgGridReact
        columnDefs={visibleColumnDefs}
        defaultColDef={DEFAULT_COL_DEF}
        enableCellTextSelection
        ensureDomOrder
        getRowId={getRowId}
        loading={loading || exporting}
        loadingOverlayComponent={() => <MoonLoader size={40} />}
        localeText={localeText}
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
