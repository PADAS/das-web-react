import {
  processDrillGridCellForCsvExport,
  processMainGridCellForCsvExport,
  resolveValueForDataWorkspaceClipboard,
  serializeCellValueForExport,
} from './csvCellSerialization';

describe('csvCellSerialization', () => {
  test('serializeCellValueForExport handles primitives and JSON for structures', () => {
    expect(serializeCellValueForExport(null)).toBe('');
    expect(serializeCellValueForExport('x')).toBe('x');
    expect(serializeCellValueForExport(3)).toBe('3');
    expect(serializeCellValueForExport(true)).toBe('true');
    expect(serializeCellValueForExport(new Date('2020-01-02T03:04:05.000Z'))).toBe('2020-01-02T03:04:05.000Z');
    expect(serializeCellValueForExport({ a: 1, b: [2, 3] })).toBe('{"a":1,"b":[2,3]}');
    expect(serializeCellValueForExport([{ x: 1 }])).toBe('[{"x":1}]');
  });

  test('processMainGridCellForCsvExport JSON-stringifies object cell values', () => {
    const out = processMainGridCellForCsvExport({
      value: { nested: true },
      formatValue: (v) => `fmt:${v}`,
      column: { getColDef: () => ({}) },
    });
    expect(out).toBe('{"nested":true}');
  });

  test('processMainGridCellForCsvExport uses formatValue for strings when provided', () => {
    const out = processMainGridCellForCsvExport({
      value: 'hello',
      formatValue: (v) => `|${v}|`,
      column: { getColDef: () => ({}) },
    });
    expect(out).toBe('|hello|');
  });

  test('processDrillGridCellForCsvExport exports full raw JSON for the value column', () => {
    const column = { getColDef: () => ({ field: 'valueLabel' }) };
    const node = { data: { field: 'x', valueLabel: 'Object', raw: { a: 1 } } };
    const out = processDrillGridCellForCsvExport({
      value: 'Object',
      node,
      column,
      formatValue: (v) => String(v),
    });
    expect(out).toBe('{"a":1}');
  });

  test('processDrillGridCellForCsvExport leaves field column as usual', () => {
    const column = { getColDef: () => ({ field: 'field' }) };
    const out = processDrillGridCellForCsvExport({
      value: 'myKey',
      node: { data: {} },
      column,
      formatValue: (v) => v,
    });
    expect(out).toBe('myKey');
  });

  test('resolveValueForDataWorkspaceClipboard uses row.raw on drill value column', () => {
    const arr = [{ id: 1 }];
    const column = { getColDef: () => ({ field: 'valueLabel' }) };
    const resolved = resolveValueForDataWorkspaceClipboard({
      api: null,
      column,
      node: { data: { field: 'x', valueLabel: 'Array(1)', raw: arr } },
      value: 'Array(1)',
    });
    expect(resolved).toBe(arr);
    expect(serializeCellValueForExport(resolved)).toBe('[{"id":1}]');
  });

  test('resolveValueForDataWorkspaceClipboard falls back to cell value elsewhere', () => {
    const column = { getColDef: () => ({ field: 'name' }) };
    const resolved = resolveValueForDataWorkspaceClipboard({
      api: null,
      column,
      node: { data: { name: 'N' } },
      value: 'N',
    });
    expect(resolved).toBe('N');
  });
});
