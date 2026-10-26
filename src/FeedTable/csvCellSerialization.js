// Nested objects and arrays export as compact JSON, not "[object Object]".
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

export const processCellForCsvExport = (params) => {
  const v = params.value;
  if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
    return params.formatValue?.(v) ?? String(v);
  }
  return serializeCellValueForExport(v);
};
