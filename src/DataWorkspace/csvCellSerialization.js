/**
 * Compact JSON (or primitives) for CSV export — nested objects/arrays must not become "[object Object]" or shallow previews.
 */

export const serializeCellValueForExport = (value) => {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return String(value);
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
};

export const processMainGridCellForCsvExport = (params) => {
  const v = params.value;
  if (v === null || v === undefined) return '';
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return params.formatValue?.(v) ?? String(v);
  }
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    try {
      return JSON.stringify(v);
    } catch {
      return String(v);
    }
  }
  return String(v);
};

export const processDrillGridCellForCsvExport = (params) => {
  const field = params.column.getColDef().field;
  if (field === 'valueLabel') {
    const row = params.node?.data;
    if (!row) return '';
    return serializeCellValueForExport(row.raw);
  }
  const v = params.value;
  return params.formatValue?.(v) ?? (v == null ? '' : String(v));
};

/** Drill "Value" cells show previews like `Array(1)`; clipboard should get the real `raw` payload (same as CSV). */
export const resolveValueForDataWorkspaceClipboard = ({ api, column, node, value }) => {
  const colDef = column?.getColDef?.();
  if (colDef?.field === 'valueLabel' && node?.data && Object.prototype.hasOwnProperty.call(node.data, 'raw')) {
    return node.data.raw;
  }
  if (value !== undefined && value !== null) return value;
  if (api && node && column) {
    return api.getCellValue({ rowNode: node, colKey: column });
  }
  return undefined;
};
