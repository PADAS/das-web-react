import evaluateIsEmptyCondition from './';

describe('SchemaForm - utils - evaluateSectionConditions - evaluateIsEmptyCondition', () => {
  test('if the field value is not present, the condition is fulfilled', () => {
    expect(evaluateIsEmptyCondition(undefined)).toBe(true);
  });

  test('if the field value is an array, the condition is fulfilled if the field value is empty', () => {
    expect(evaluateIsEmptyCondition([])).toBe(true);
    expect(evaluateIsEmptyCondition(['elephant'])).toBe(false);
    expect(evaluateIsEmptyCondition(['elephant', 'lion', 'giraffe'])).toBe(false);
  });

  test('if the field value is null, the condition is fulfilled', () => {
    expect(evaluateIsEmptyCondition(null)).toBe(true);
  });

  test('if the field value is an object, the condition is fulfilled if the field value is empty', () => {
    expect(evaluateIsEmptyCondition({})).toBe(true);
    expect(evaluateIsEmptyCondition({ elephant: true })).toBe(false);
    expect(evaluateIsEmptyCondition({ elephant: true, lion: true, giraffe: true })).toBe(false);
  });

  test('if the field value is a string, the condition is fulfilled if the field value is empty', () => {
    expect(evaluateIsEmptyCondition('')).toBe(true);
    expect(evaluateIsEmptyCondition('elephant')).toBe(false);
  });

  test('else, the condition is not fulfilled', () => {
    expect(evaluateIsEmptyCondition(true)).toBe(false);
    expect(evaluateIsEmptyCondition(false)).toBe(false);
    expect(evaluateIsEmptyCondition(0)).toBe(false);
    expect(evaluateIsEmptyCondition(1)).toBe(false);
  });
});
