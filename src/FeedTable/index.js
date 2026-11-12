import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import {
  CellStyleModule,
  ClientSideRowModelModule,
  ColumnApiModule,
  EventApiModule,
  LocaleModule,
  ModuleRegistry,
  RenderApiModule,
  RowApiModule,
  RowSelectionModule,
  RowStyleModule,
  ScrollApiModule,
  themeQuartz,
  ValueCacheModule,
} from 'ag-grid-community';
import { createPortal } from 'react-dom';
import isPlainObject from 'lodash/isPlainObject';
import MoonLoader from 'react-spinners/MoonLoader';
import omit from 'lodash/omit';
import { useTranslation } from 'react-i18next';

import FeedTableContext from './FeedTableContext';
import { format, STANDARD_DATE_FORMAT } from '../utils/datetime';
import { showToast } from '../utils/toast';
import useMenuToggle from '../hooks/useMenuToggle';

import HeaderCell from './HeaderCell';
import Menu from '../Menu';
import TitleCell from './TitleCell';

import * as styles from './styles.module.scss';

ModuleRegistry.registerModules([
  CellStyleModule,
  ClientSideRowModelModule,
  ColumnApiModule,
  EventApiModule,
  LocaleModule,
  RenderApiModule,
  RowApiModule,
  RowSelectionModule,
  RowStyleModule,
  ScrollApiModule,
  ValueCacheModule,
]);

// How close to the last loaded row a scroll asks for the next page.
const LOAD_MORE_EDGE_ROWS = 10;

// Keys pressed on a control in a cell or a header are the control's, so Tab
// moves through the controls as it does anywhere else in the page.
const CONTROLS = 'a[href], button, input, label';

const ROW_SELECTION = {
  checkboxes: false,
  enableClickSelection: false,
  headerCheckbox: false,
  mode: 'multiRow',
};

const isFromControl = (params) => !!params.event.target.closest(CONTROLS);

const DEFAULT_COL_DEF = {
  headerClass: styles.headerCell,
  headerComponent: HeaderCell,
  resizable: true,
  sortable: false,
  suppressHeaderKeyboardEvent: isFromControl,
  suppressKeyboardEvent: isFromControl,
};

const gridTheme = themeQuartz.withParams({
  accentColor: styles.accentColor,
  backgroundColor: styles.backgroundColor,
  borderColor: styles.borderColor,
  cellHorizontalPadding: 8,
  fontFamily: 'inherit',
  fontSize: 14,
  foregroundColor: styles.foregroundColor,
  headerBackgroundColor: styles.backgroundColor,
  headerCellHoverBackgroundColor: styles.backgroundColor,
  headerColumnBorder: true,
  headerColumnBorderHeight: '100%',
  headerColumnResizeHandleColor: 'transparent',
  headerFontSize: 14,
  headerFontWeight: 400,
  headerTextColor: styles.headerTextColor,
  rowBorder: false,
  rowHoverColor: styles.rowHoverColor,
  selectedRowBackgroundColor: styles.selectedRowBackgroundColor,
  wrapperBorder: false,
  wrapperBorderRadius: 0,
});

const TABLE_ONLY_COLUMN_KEYS = ['defaultHidden', 'layoutScoped', 'menuName', 'serverSorted'];

// Resizes the user made, as opposed to the grid fitting flex columns.
const USER_RESIZE_SOURCES = ['autosizeColumns', 'uiColumnResized'];

// The version resets saved column choices when the default columns change.
const STORAGE_VERSION = 'v2';

const storageKey = (setting, tableKey, scope) => [`feedTable.${STORAGE_VERSION}.${setting}.${tableKey}`, scope]
  .filter(Boolean)
  .join('.');

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

const readColumnOrder = (tableKey, scope) => readStored(
  storageKey('columnOrder', tableKey, scope),
  Array.isArray,
  null
);

// A column the saved order doesn't know goes first or last when it leads or
// ends the definitions, and otherwise after the column it follows there.
const orderColumns = (columns, order) => {
  const positions = new Map(order.map((colId, index) => [colId, index]));
  const orderedColumns = columns
    .filter((column) => positions.has(column.colId))
    .sort((column, otherColumn) => positions.get(column.colId) - positions.get(otherColumn.colId));

  columns.forEach((column, index) => {
    if (!positions.has(column.colId)) {
      const previousColumn = columns.slice(0, index).findLast((other) => orderedColumns.includes(other));
      const hasKnownNextColumn = columns.slice(index + 1).some((other) => positions.has(other.colId));
      const insertIndex = !previousColumn
        ? 0
        : (hasKnownNextColumn ? orderedColumns.indexOf(previousColumn) + 1 : orderedColumns.length);

      orderedColumns.splice(insertIndex, 0, column);
    }
  });

  return orderedColumns;
};

const fillWidthWithLastColumn = (columns) => {
  const shownColumns = columns.filter((column) => !column.hide);
  const lastShownColumn = shownColumns[shownColumns.length - 1];
  if (!lastShownColumn || shownColumns.some((column) => column.flex)) return columns;

  return columns.map((column) => column === lastShownColumn
    ? { ...column, flex: 1, minWidth: Math.max(column.minWidth ?? 0, column.width ?? 0) }
    : column);
};

// Callers pass `renderIcon(row)` in `cellRendererParams`. The icon takes its
// colors from the row's theme.
export const TITLE_COLUMN = {
  cellClass: styles.titleColumnCell,
  cellRenderer: TitleCell,
  colId: 'title',
  flex: 2,
  headerClass: null,
  headerComponentParams: { hasSelectAll: true },
  lockPosition: 'left',
  lockVisible: true,
  minWidth: 240,
  suppressMovable: true,
};

export const formatDateValue = (params) => {
  const date = params.value ? new Date(params.value) : null;

  return date && !Number.isNaN(date.getTime()) ? format(date, STANDARD_DATE_FORMAT) : '';
};

// `layoutScoped` columns, such as a type's fields, keep an order per scope.
// `menuName` names a column in the menu; `serverSorted` marks an API sort.
const FeedTable = ({
  ariaLabel,
  columnDefs,
  fullLoad,
  getRowClass,
  getRowId,
  getRowPath,
  layoutScope = '',
  loading = false,
  onExport,
  onLoadMore,
  onOpenRow,
  onSortChanged,
  renderBulkActions,
  rowData,
  statusMessage,
  tableKey,
  toolbarContainer,
  totalCount,
}) => {
  const { t } = useTranslation('components', { keyPrefix: 'feedTable' });

  const columnsMenuToggle = useMenuToggle();

  const moveColumnHintId = useId();

  const [columnOrders, setColumnOrders] = useState({});
  const [columnWidths, setColumnWidths] = useState(
    () => readStored(storageKey('columnWidths', tableKey), isPlainObject, {})
  );
  const [gridApi, setGridApi] = useState(null);
  const [gridElement, setGridElement] = useState(null);
  const [hiddenColumns, setHiddenColumns] = useState(
    () => readStored(storageKey('hiddenColumns', tableKey), isPlainObject, {})
  );
  const [isExporting, setIsExporting] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);

  const clientSortColumn = columnDefs.find((column) => !!column.sort && !column.serverSorted);
  const clientSortMessageValues = clientSortColumn && {
    column: clientSortColumn.menuName ?? clientSortColumn.headerName,
    loaded: rowData.length,
    total: totalCount,
  };
  const isClientSortPaused = !!clientSortColumn && !loading && !!fullLoad?.isPaused;
  const isLoadingForClientSort = !!clientSortColumn && !loading && !!fullLoad?.isLoading;

  const columnOrder = useMemo(() => {
    const orderOf = (scope) => columnOrders[scope] ?? readColumnOrder(tableKey, scope);

    return (layoutScope && orderOf(layoutScope)) || orderOf('') || [];
  }, [columnOrders, layoutScope, tableKey]);

  const feedTableContext = useMemo(() => ({
    getRowPath,
    isSelectable: !!renderBulkActions,
    moveColumnHintId,
    onOpenRow,
  }), [getRowPath, moveColumnHintId, onOpenRow, renderBulkActions]);

  const isColumnHidden = useCallback(
    (column) => !column.lockVisible && (hiddenColumns[column.colId] ?? !!column.defaultHidden),
    [hiddenColumns]
  );

  const localeText = useMemo(() => ({ noRowsToShow: t('grid.noRowsMessage') }), [t]);

  const orderedColumnDefs = useMemo(() => orderColumns(columnDefs, columnOrder), [columnDefs, columnOrder]);

  // The grid lays columns out in definition order, so the order survives a
  // rebuild only if the definitions carry it.
  const visibleColumnDefs = useMemo(() => fillWidthWithLastColumn(orderedColumnDefs.map((column) => ({
    ...omit(column, TABLE_ONLY_COLUMN_KEYS),
    ...(columnWidths[column.colId] && { flex: null, width: columnWidths[column.colId] }),
    hide: isColumnHidden(column),
  }))), [columnWidths, isColumnHidden, orderedColumnDefs]);

  // The selection controls unmount with the selection, so focus goes to the
  // checkbox that selects every row instead of falling to the page.
  const clearSelection = () => {
    gridApi.deselectAll();

    gridElement?.querySelector('input[type="checkbox"]')?.focus();
  };

  const onBodyScroll = (event) => {
    if (onLoadMore && event.direction === 'vertical') {
      const displayedRowCount = event.api.getDisplayedRowCount();
      if (displayedRowCount > 0 && event.api.getLastDisplayedRowIndex() >= displayedRowCount - LOAD_MORE_EDGE_ROWS) {
        onLoadMore();
      }
    }
  };

  // A control in a cell, such as the title link, acts instead of the row.
  const onCellClicked = (event) => {
    if (!event.event?.target?.closest?.(CONTROLS)) {
      onOpenRow(event.data);
    }
  };

  const onColumnMoved = (event) => {
    if (event.finished) {
      saveColumnOrder(event.api.getColumnState().map((column) => column.colId));
    }
  };

  const onColumnResized = (event) => {
    if (event.finished && USER_RESIZE_SOURCES.includes(event.source) && event.columns?.length) {
      const nextColumnWidths = { ...columnWidths };
      event.columns.forEach((column) => {
        nextColumnWidths[column.getColId()] = column.getActualWidth();
      });

      setColumnWidths(nextColumnWidths);
      writeStored(storageKey('columnWidths', tableKey), nextColumnWidths);
    }
  };

  const onExportClick = async () => {
    setIsExporting(true);
    try {
      await onExport();
    } catch {
      showToast({ message: t('exportErrorMessage') });
    } finally {
      setIsExporting(false);
    }
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

  const toggleColumn = (column) => {
    const nextHiddenColumns = { ...hiddenColumns, [column.colId]: !isColumnHidden(column) };

    setHiddenColumns(nextHiddenColumns);
    writeStored(storageKey('hiddenColumns', tableKey), nextHiddenColumns);
  };

  useEffect(() => {
    gridApi?.setGridAriaProperty('label', ariaLabel ?? null);
  }, [ariaLabel, gridApi]);

  return <div className={styles.feedTable} data-testid={`feedTable-${tableKey}`}>
    {!!toolbarContainer && createPortal(<div className={styles.toolbar}>
      {selectedRows.length > 0 && <div className={styles.selection}>
        <span className={styles.selectionCount}>{t('selectedCountMessage', { count: selectedRows.length })}</span>

        {renderBulkActions?.(selectedRows, clearSelection)}

        <button className={styles.toolbarButton} onClick={clearSelection} type="button">
          {t('clearSelectionButtonLabel')}
        </button>
      </div>}

      {/* The count changes with every page, so only the start and the end of
          the load are announced. */}
      <span className="sr-only" role="status">
        {isLoadingForClientSort && t('clientSortStartedMessage', clientSortMessageValues)}
        {!!clientSortColumn && !loading && !fullLoad?.isLoading && !isClientSortPaused
          && t('clientSortFinishedMessage', clientSortMessageValues)}
      </span>

      {isClientSortPaused && <span className={styles.statusMessage} role="status">
        {t('clientSortPausedMessage', clientSortMessageValues)}

        <button className={styles.toolbarButton} onClick={fullLoad.retry} type="button">
          {t('clientSortRetryButtonLabel')}
        </button>
      </span>}

      {isLoadingForClientSort && <span aria-hidden="true" className={styles.statusMessage}>
        <MoonLoader size={12} />
        {t('clientSortLoadingMessage', clientSortMessageValues)}
      </span>}

      {!isLoadingForClientSort && !isClientSortPaused && !!statusMessage && <span
        className={styles.statusMessage}
        role="status"
      >
        {statusMessage}
      </span>}

      <div className={styles.toolbarEnd}>
        <button
          className={styles.toolbarButton}
          data-testid="feedTable-columnsButton"
          type="button"
          {...columnsMenuToggle.toggleProps}
        >
          {t('columnsButtonLabel')}
        </button>

        <Menu
          aria-label={t('columnsMenuLabel')}
          className={styles.columnsMenu}
          placement="bottom-end"
          {...columnsMenuToggle.menuProps}
        >
          {orderedColumnDefs.filter((column) => !column.lockVisible).map((column) => <Menu.Option
            aria-checked={!isColumnHidden(column)}
            key={column.colId}
            onClick={() => toggleColumn(column)}
            role="menuitemcheckbox"
          >
            {column.menuName ?? column.headerName}
          </Menu.Option>)}
        </Menu>

        {!!onExport && <button
          className={styles.toolbarButton}
          data-testid="feedTable-exportButton"
          disabled={isExporting || loading}
          onClick={onExportClick}
          type="button"
        >
          {t('exportButtonLabel')}
        </button>}
      </div>
    </div>, toolbarContainer)}

    <p hidden id={moveColumnHintId}>{t('moveColumnHintMessage')}</p>

    <div className={styles.grid} ref={setGridElement}>
      <FeedTableContext value={feedTableContext}>
        <AgGridReact
          columnDefs={visibleColumnDefs}
          defaultColDef={DEFAULT_COL_DEF}
          enableCellTextSelection
          ensureDomOrder
          getRowClass={getRowClass}
          getRowId={getRowId}
          loading={loading || isExporting}
          loadingOverlayComponent={() => <div className={styles.loadingOverlay}><MoonLoader size={40} /></div>}
          localeText={localeText}
          onBodyScroll={onBodyScroll}
          onCellClicked={onCellClicked}
          onColumnMoved={onColumnMoved}
          onColumnResized={onColumnResized}
          onGridReady={(event) => setGridApi(event.api)}
          onSelectionChanged={(event) => setSelectedRows(event.api.getSelectedRows())}
          onSortChanged={onSortChanged}
          rowClass={styles.row}
          rowData={rowData}
          rowSelection={renderBulkActions ? ROW_SELECTION : undefined}
          suppressCellFocus
          suppressHeaderFocus
          suppressMultiSort
          tabIndex={-1}
          theme={gridTheme}
          valueCache
        />
      </FeedTableContext>
    </div>
  </div>;
};

export default FeedTable;
