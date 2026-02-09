import evaluateDoesNotHaveInputCondition from './';

describe('ReportManager - DetailsSection - SchemaForm - utils - evaluateSectionConditions - evaluateDoesNotHaveInputCondition', () => {
  test('if the field value is not present, the condition is fulfilled', () => {
    expect(evaluateDoesNotHaveInputCondition(undefined)).toBe(true);
  });

  test('if the field value is an array, the condition is fulfilled if the field value is empty', () => {
    expect(evaluateDoesNotHaveInputCondition([])).toBe(true);
    expect(evaluateDoesNotHaveInputCondition(['elephant'])).toBe(false);
    expect(evaluateDoesNotHaveInputCondition(['elephant', 'lion', 'giraffe'])).toBe(false);
  });

  test('if the field value is null, the condition is fulfilled', () => {
    expect(evaluateDoesNotHaveInputCondition(null)).toBe(true);
  });

  test('if the field value is an object, the condition is fulfilled if the field value is empty', () => {
    expect(evaluateDoesNotHaveInputCondition({})).toBe(true);
    expect(evaluateDoesNotHaveInputCondition({ elephant: true })).toBe(false);
    expect(evaluateDoesNotHaveInputCondition({ elephant: true, lion: true, giraffe: true })).toBe(false);
  });

  test('if the field value is a string, the condition is fulfilled if the field value is empty', () => {
    expect(evaluateDoesNotHaveInputCondition('')).toBe(true);
    expect(evaluateDoesNotHaveInputCondition('elephant')).toBe(false);
  });

  test('else, the condition is not fulfilled', () => {
    expect(evaluateDoesNotHaveInputCondition(true)).toBe(false);
    expect(evaluateDoesNotHaveInputCondition(false)).toBe(false);
    expect(evaluateDoesNotHaveInputCondition(0)).toBe(false);
    expect(evaluateDoesNotHaveInputCondition(1)).toBe(false);
  });
});
