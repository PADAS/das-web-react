import { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import isPlainObject from 'lodash/isPlainObject';
import { createPortal } from 'react-dom';
import MoonLoader from 'react-spinners/MoonLoader';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';
import { AgGridReact } from 'ag-grid-react';
import {
  ClientSideRowModelModule,
  ColumnApiModule,
  LocaleModule,
  ModuleRegistry,
  RenderApiModule,
  RowApiModule,
  RowSelectionModule,
  RowStyleModule,
  ScrollApiModule,
  themeQuartz,
} from 'ag-grid-community';
import { useTranslation } from 'react-i18next';

import { ReactComponent as CheckIcon } from '../common/images/icons/check-light.svg';
import { ReactComponent as GripDotsVerticalIcon } from '../common/images/icons/grip-dots-vertical.svg';

import { format, STANDARD_DATE_FORMAT } from '../utils/datetime';
import navigateMenuWithKeyboard from '../SideBar/utils/navigateMenuWithKeyboard';
import { showToast } from '../utils/toast';

import * as styles from './styles.module.scss';

ModuleRegistry.registerModules([
  ClientSideRowModelModule,
  ColumnApiModule,
  LocaleModule,
  RenderApiModule,
  RowApiModule,
  RowSelectionModule,
  RowStyleModule,
  ScrollApiModule,
]);

// How close to the last loaded row a scroll asks for the next page.
const LOAD_MORE_EDGE_ROWS = 10;

const SELECTION_COLUMN_ID = 'ag-Grid-SelectionColumn';

const CELL_CONTROLS = 'a[href], button';
const CONTROL_KEYS = ['Enter', ' '];

const COLUMN_MOVE_OFFSET_BY_KEY = { ArrowLeft: -1, ArrowRight: 1 };

const ROW_SELECTION = {
  checkboxes: true,
  enableClickSelection: false,
  headerCheckbox: true,
  mode: 'multiRow',
};

const HeaderLabel = ({ displayName }) => <span className={styles.headerLabel}>
  <GripDotsVerticalIcon aria-hidden="true" className={styles.dragHandle} />

  {displayName}
</span>;

// Alt and an arrow move the focused header's column, the keyboard's drag.
const moveColumnWithKeyboard = ({ api, column, event }) => {
  const offset = COLUMN_MOVE_OFFSET_BY_KEY[event.key];
  if (!event.altKey || !offset) return false;

  if (event.type === 'keydown') {
    const colIds = api.getAllDisplayedColumns().map((displayedColumn) => displayedColumn.getColId());
    const targetIndex = colIds.indexOf(column.getColId()) + offset;

    if (targetIndex >= 0 && targetIndex < colIds.length && colIds[targetIndex] !== SELECTION_COLUMN_ID) {
      event.preventDefault();
      api.moveColumns([column], targetIndex);
      api.setFocusedHeader(column);
    }
  }
  return true;
};

const DEFAULT_COL_DEF = {
  headerClass: styles.headerCell,
  headerComponentParams: { innerHeaderComponent: HeaderLabel },
  resizable: true,
  sortable: false,
  // A control in a cell answers Enter and Space itself, not the grid.
  suppressKeyboardEvent: ({ event }) => CONTROL_KEYS.includes(event.key) && !!event.target.closest(CELL_CONTROLS),
  suppressHeaderKeyboardEvent: moveColumnWithKeyboard,
  // Marks sortable columns with an arrow even before they're sorted.
  unSortIcon: true,
};

const gridTheme = themeQuartz.withParams({
  accentColor: styles.accentColor,
  backgroundColor: styles.backgroundColor,
  borderColor: styles.borderColor,
  fontFamily: 'inherit',
  fontSize: 14,
  foregroundColor: styles.foregroundColor,
  headerBackgroundColor: styles.headerBackgroundColor,
  headerFontSize: 13,
  headerFontWeight: 600,
  headerTextColor: styles.headerTextColor,
  oddRowBackgroundColor: styles.oddRowBackgroundColor,
  selectedRowBackgroundColor: styles.selectedRowBackgroundColor,
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

// With every shown column at a fixed width, the last one fills the rest.
const fillWidthWithLastColumn = (columns) => {
  const shownColumns = columns.filter((column) => !column.hide);
  const lastShownColumn = shownColumns[shownColumns.length - 1];
  if (!lastShownColumn || shownColumns.some((column) => column.flex)) return columns;

  return columns.map((column) => column === lastShownColumn
    ? { ...column, flex: 1, minWidth: Math.max(column.minWidth ?? 0, column.width ?? 0) }
    : column);
};

const controlInCell = (element) => element.classList?.contains('ag-cell')
  ? element.querySelector(CELL_CONTROLS)
  : null;

export const formatDateValue = (params) => {
  const date = params.value ? new Date(params.value) : null;

  return date && !Number.isNaN(date.getTime()) ? format(date, STANDARD_DATE_FORMAT) : '';
};

// `layoutScoped` columns, such as an event type's fields, keep their own order.
const FeedTable = ({
  ariaLabel,
  columnDefs,
  getRowClass,
  getRowId,
  layoutScope = '',
  loading = false,
  onLoadMore,
  onExport,
  onOpenRow,
  onSortChanged,
  renderBulkActions,
  rowData,
  statusMessage,
  tableKey,
  toolbarContainer,
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'feedTable' });

  const columnsMenuItemRefs = useRef([]);

  const columnsMenuId = useId();
  const moveColumnHintId = useId();

  const [columnOrders, setColumnOrders] = useState({});
  const [columnWidths, setColumnWidths] = useState(
    () => readStored(storageKey('columnWidths', tableKey), isPlainObject, {})
  );
  const [columnsButton, setColumnsButton] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [gridApi, setGridApi] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState(
    () => readStored(storageKey('hiddenColumns', tableKey), isPlainObject, {})
  );
  const [isColumnsMenuOpen, setIsColumnsMenuOpen] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

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
    () => fillWidthWithLastColumn(orderedColumnDefs.map(({ defaultHidden, layoutScoped: _layoutScoped, ...column }) => ({
      ...column,
      ...(columnWidths[column.colId] && { flex: null, width: columnWidths[column.colId] }),
      hide: isColumnHidden({ ...column, defaultHidden }),
    }))),
    [columnWidths, isColumnHidden, orderedColumnDefs]
  );

  const closeColumnsMenu = () => {
    setIsColumnsMenuOpen(false);

    columnsButton?.focus();
  };

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

  const onColumnResized = (event) => {
    if (!event.finished || !USER_RESIZE_SOURCES.includes(event.source) || !event.columns?.length) return;

    const nextColumnWidths = { ...columnWidths };
    event.columns.forEach((column) => {
      nextColumnWidths[column.getColId()] = column.getActualWidth();
    });

    setColumnWidths(nextColumnWidths);
    writeStored(storageKey('columnWidths', tableKey), nextColumnWidths);
  };

  // The selection controls unmount with the selection, so focus goes back to
  // the grid instead of falling to the page.
  const clearSelection = useCallback(() => {
    gridApi.deselectAll();

    const focusedCell = gridApi.getFocusedCell();
    const firstColumn = gridApi.getAllDisplayedColumns()[0];
    if (focusedCell) {
      gridApi.setFocusedCell(focusedCell.rowIndex, focusedCell.column);
    } else if (firstColumn && gridApi.getDisplayedRowCount() > 0) {
      gridApi.setFocusedCell(0, firstColumn);
    }
  }, [gridApi]);

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
      showToast({ message: t('exportErrorMessage') });
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    gridApi?.setGridAriaProperty('label', ariaLabel ?? null);
    gridApi?.setGridAriaProperty('describedby', moveColumnHintId);
  }, [ariaLabel, gridApi, moveColumnHintId]);

  useEffect(() => {
    if (isColumnsMenuOpen) {
      columnsMenuItemRefs.current[0]?.focus();
    }
  }, [isColumnsMenuOpen]);

  return <div className={styles.feedTable} data-testid={`feedTable-${tableKey}`}>
    {!!toolbarContainer && createPortal(<div className={styles.toolbar}>
      {selectedRows.length > 0 && <div className={styles.selection}>
        <span className={styles.selectionCount}>{t('selectedCountMessage', { count: selectedRows.length })}</span>

        {renderBulkActions?.(selectedRows, clearSelection)}

        <button className={styles.toolbarButton} onClick={clearSelection} type="button">
          {t('clearSelectionButtonLabel')}
        </button>
      </div>}

      {!!statusMessage && <span className={styles.statusMessage} role="status">{statusMessage}</span>}

      <div className={styles.toolbarEnd}>
        <button
          aria-controls={columnsMenuId}
          aria-expanded={isColumnsMenuOpen}
          aria-haspopup="menu"
          className={styles.toolbarButton}
          data-testid="feedTable-columnsButton"
          onClick={() => setIsColumnsMenuOpen(true)}
          ref={setColumnsButton}
          type="button"
        >
          {t('columnsButtonLabel')}
        </button>

        <Overlay
          onHide={() => setIsColumnsMenuOpen(false)}
          placement="bottom-end"
          rootClose
          show={isColumnsMenuOpen}
          target={columnsButton}
        >
          <Popover className={styles.columnsMenuPopover} id={columnsMenuId} role="presentation">
            <ul
              aria-label={t('columnsMenuLabel')}
              className={styles.columnsMenu}
              onKeyDown={(event) => navigateMenuWithKeyboard(
                event,
                columnsMenuItemRefs.current.filter(Boolean),
                closeColumnsMenu
              )}
              role="menu"
            >
              {orderedColumnDefs.map((column, index) => <li key={column.colId} role="none">
                <button
                  aria-checked={!isColumnHidden(column)}
                  className={styles.columnsMenuItem}
                  onClick={() => toggleColumn(column)}
                  ref={(element) => {
                    columnsMenuItemRefs.current[index] = element;
                  }}
                  role="menuitemcheckbox"
                  tabIndex={-1}
                  type="button"
                >
                  {!isColumnHidden(column) && <CheckIcon aria-hidden="true" className={styles.checkIcon} />}

                  {column.headerName}
                </button>
              </li>)}
            </ul>
          </Popover>
        </Overlay>

        {!!onExport && <button
          className={styles.toolbarButton}
          data-testid="feedTable-exportButton"
          disabled={exporting || loading}
          onClick={onExportClick}
          type="button"
        >
          {t('exportButtonLabel')}
        </button>}
      </div>
    </div>, toolbarContainer)}

    <p hidden id={moveColumnHintId}>{t('moveColumnHintMessage')}</p>

    <div className={styles.grid} onKeyDownCapture={onGridKeyDownCapture}>
      <AgGridReact
        columnDefs={visibleColumnDefs}
        defaultColDef={DEFAULT_COL_DEF}
        enableCellTextSelection
        ensureDomOrder
        getRowClass={getRowClass}
        getRowId={getRowId}
        loading={loading || exporting}
        loadingOverlayComponent={() => <div className={styles.loadingOverlay}><MoonLoader size={40} /></div>}
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
        rowSelection={renderBulkActions ? ROW_SELECTION : undefined}
        theme={gridTheme}
      />
    </div>
  </div>;
};

export default FeedTable;
