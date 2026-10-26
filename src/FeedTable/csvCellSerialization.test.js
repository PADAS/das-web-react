import { processCellForCsvExport, serializeCellValueForExport } from './csvCellSerialization';

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

  test('processCellForCsvExport JSON-stringifies object cell values', () => {
    expect(processCellForCsvExport({ value: { nested: true }, formatValue: (v) => `fmt:${v}` })).toBe('{"nested":true}');
  });

  test('processCellForCsvExport uses formatValue for strings when provided', () => {
    expect(processCellForCsvExport({ value: 'hello', formatValue: (v) => `|${v}|` })).toBe('|hello|');
  });

  test('processCellForCsvExport exports empty cells as blanks', () => {
    expect(processCellForCsvExport({ value: null })).toBe('');
  });
});
