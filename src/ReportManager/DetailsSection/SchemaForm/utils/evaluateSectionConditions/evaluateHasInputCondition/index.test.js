import evaluateHasInputCondition from './';

describe('ReportManager - DetailsSection - SchemaForm - utils - evaluateSectionConditions - evaluateHasInputCondition', () => {
  test('if the field value is null, the condition is not fulfilled', () => {
    expect(evaluateHasInputCondition(null)).toBe(false);
  });

  test('if the field value is an array, the condition is fulfilled if the field value has at least one item', () => {
    expect(evaluateHasInputCondition(['elephant'])).toBe(true);
    expect(evaluateHasInputCondition(['elephant', 'lion', 'giraffe'])).toBe(true);
    expect(evaluateHasInputCondition([])).toBe(false);
  });

  test('if the field value is a boolean, the condition is fulfilled', () => {
    expect(evaluateHasInputCondition(true)).toBe(true);
    expect(evaluateHasInputCondition(false)).toBe(true);
  });

  test('if the field value is a number, the condition is fulfilled', () => {
    expect(evaluateHasInputCondition(0)).toBe(true);
    expect(evaluateHasInputCondition(3)).toBe(true);
  });

  test('if the field value is an object, the condition is fulfilled if the field value has at least one property', () => {
    expect(evaluateHasInputCondition({ elephant: true })).toBe(true);
    expect(evaluateHasInputCondition({ elephant: true, lion: true, giraffe: true })).toBe(true);
    expect(evaluateHasInputCondition({})).toBe(false);
  });

  test('if the field value is a string, the condition is fulfilled if the field value has at least one character', () => {
    expect(evaluateHasInputCondition('elephant')).toBe(true);
    expect(evaluateHasInputCondition('')).toBe(false);
  });

  test('else, the condition is not fulfilled', () => {
    expect(evaluateHasInputCondition(undefined)).toBe(false);
  });
});
