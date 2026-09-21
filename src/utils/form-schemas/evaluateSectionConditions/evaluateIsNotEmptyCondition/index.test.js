import evaluateIsNotEmptyCondition from './';

describe('SchemaForm - utils - evaluateSectionConditions - evaluateIsNotEmptyCondition', () => {
  test('if the field value is null, the condition is not fulfilled', () => {
    expect(evaluateIsNotEmptyCondition(null)).toBe(false);
  });

  test('if the field value is an array, the condition is fulfilled if the field value has at least one item', () => {
    expect(evaluateIsNotEmptyCondition(['elephant'])).toBe(true);
    expect(evaluateIsNotEmptyCondition(['elephant', 'lion', 'giraffe'])).toBe(true);
    expect(evaluateIsNotEmptyCondition([])).toBe(false);
  });

  test('if the field value is a boolean, the condition is fulfilled', () => {
    expect(evaluateIsNotEmptyCondition(true)).toBe(true);
    expect(evaluateIsNotEmptyCondition(false)).toBe(true);
  });

  test('if the field value is a number, the condition is fulfilled', () => {
    expect(evaluateIsNotEmptyCondition(0)).toBe(true);
    expect(evaluateIsNotEmptyCondition(3)).toBe(true);
  });

  test('if the field value is an object, the condition is fulfilled if the field value has at least one property', () => {
    expect(evaluateIsNotEmptyCondition({ elephant: true })).toBe(true);
    expect(evaluateIsNotEmptyCondition({ elephant: true, lion: true, giraffe: true })).toBe(true);
    expect(evaluateIsNotEmptyCondition({})).toBe(false);
  });

  test('if the field value is a string, the condition is fulfilled if the field value has at least one character', () => {
    expect(evaluateIsNotEmptyCondition('elephant')).toBe(true);
    expect(evaluateIsNotEmptyCondition('')).toBe(false);
  });

  test('else, the condition is not fulfilled', () => {
    expect(evaluateIsNotEmptyCondition(undefined)).toBe(false);
  });
});
