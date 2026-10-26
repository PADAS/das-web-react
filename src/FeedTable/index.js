import { useCallback, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import Button from 'react-bootstrap/Button';
import Dropdown from 'react-bootstrap/Dropdown';
import Form from 'react-bootstrap/Form';
import MoonLoader from 'react-spinners/MoonLoader';
import { AgGridReact } from 'ag-grid-react';
import { AllCommunityModule, ModuleRegistry, themeQuartz } from 'ag-grid-community';
import { useTranslation } from 'react-i18next';

import { processCellForCsvExport } from './csvCellSerialization';
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

const DEFAULT_COL_DEF = { resizable: true, sortable: false };

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

const hiddenColumnsStorageKey = (tableKey) => `feedTable.hiddenColumns.${tableKey}`;

const readHiddenColumns = (tableKey) => {
  try {
    return JSON.parse(window.localStorage.getItem(hiddenColumnsStorageKey(tableKey))) ?? {};
  } catch {
    return {};
  }
};

const writeHiddenColumns = (tableKey, hiddenColumns) => {
  try {
    window.localStorage.setItem(hiddenColumnsStorageKey(tableKey), JSON.stringify(hiddenColumns));
  } catch {
    // Column choices are a convenience; the table works without remembering them.
  }
};

// The expanded, tabular view of a feed. Filters stay with the feed; the table
// adds what only makes sense with room to spare: column choice, multi-select,
// bulk actions and CSV export. A column hides by default with `defaultHidden`.
// Its controls render into `toolbarContainer`, a spot the feed keeps for them
// beside the filter summary, so they take no row of their own.
const FeedTable = ({
  columnDefs,
  exportFileName,
  getRowId,
  loading = false,
  onLoadAllRows,
  onLoadMore,
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
  const [hiddenColumns, setHiddenColumns] = useState(() => readHiddenColumns(tableKey));
  const [selectedRows, setSelectedRows] = useState([]);

  const isColumnHidden = useCallback(
    (column) => hiddenColumns[column.colId] ?? !!column.defaultHidden,
    [hiddenColumns]
  );

  const visibleColumnDefs = useMemo(
    () => columnDefs.map(({ defaultHidden, ...column }) => ({ ...column, hide: isColumnHidden({ ...column, defaultHidden }) })),
    [columnDefs, isColumnHidden]
  );

  const toggleColumn = (column) => {
    const nextHiddenColumns = { ...hiddenColumns, [column.colId]: !isColumnHidden(column) };

    setHiddenColumns(nextHiddenColumns);
    writeHiddenColumns(tableKey, nextHiddenColumns);
  };

  const clearSelection = useCallback(() => gridApi?.deselectAll(), [gridApi]);

  const onCellClicked = (event) => {
    if (event.column.getColId() !== SELECTION_COLUMN_ID) {
      onOpenRow(event.data);
    }
  };

  const onCellKeyDown = (event) => {
    if (event.event?.key === 'Enter' && event.column.getColId() !== SELECTION_COLUMN_ID) {
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

  const onExport = async () => {
    const onlySelected = selectedRows.length > 0;

    setExporting(true);
    try {
      if (!onlySelected && onLoadAllRows) {
        await onLoadAllRows();
        // Lets the grid take in the rows the last page added.
        await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      }

      gridApi?.exportDataAsCsv({
        fileName: `earthranger-${exportFileName}.csv`,
        onlySelected,
        processCellCallback: processCellForCsvExport,
      });
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

        <Button
          data-testid="feedTable-exportButton"
          disabled={exporting || loading}
          onClick={onExport}
          size="sm"
          type="button"
          variant="outline-secondary"
        >
          {t(selectedRows.length > 0 ? 'exportSelected' : 'exportAll')}
        </Button>
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
