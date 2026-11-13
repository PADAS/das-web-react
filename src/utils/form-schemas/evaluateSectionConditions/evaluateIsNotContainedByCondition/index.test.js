import evaluateIsNotContainedByCondition from './';

describe('SchemaForm - utils - evaluateSectionConditions - evaluateIsNotContainedByCondition', () => {
  test('if the field value is an array and the condition value is an array, the condition is fulfilled if the field value has at least one item that is not contained by the condition value', () => {
    const fieldValue = ['elephant', 'lion', 'giraffe'];

    expect(evaluateIsNotContainedByCondition(fieldValue, ['elephant', 'lion'])).toBe(true);
    expect(evaluateIsNotContainedByCondition(fieldValue, ['rhino'])).toBe(true);
    expect(evaluateIsNotContainedByCondition(fieldValue, ['elephant', 'lion', 'giraffe'])).toBe(false);
    expect(evaluateIsNotContainedByCondition(fieldValue, ['giraffe', 'lion', 'elephant'])).toBe(false);
    expect(evaluateIsNotContainedByCondition(fieldValue, ['rhino', 'elephant', 'lion', 'giraffe', 'leopard'])).toBe(false);
  });

  test('if the field value is an array and the condition value is a string, the condition is fulfilled if the field value has at least one item that is not the condition value', () => {
    expect(evaluateIsNotContainedByCondition(['elephant', 'lion'], 'elephant')).toBe(true);
    expect(evaluateIsNotContainedByCondition(['lion'], 'elephant')).toBe(true);
    expect(evaluateIsNotContainedByCondition(['elephant'], 'elephant')).toBe(false);
  });

  test('if the field value is an empty array, the condition is not fulfilled', () => {
    expect(evaluateIsNotContainedByCondition([], ['elephant'])).toBe(false);
    expect(evaluateIsNotContainedByCondition([], 'elephant')).toBe(false);
  });

  test('if the field value is an object and the condition value is an array, the condition is fulfilled if the field value has at least one key that is not contained by the condition value', () => {
    const fieldValue = { elephant: true, lion: true, giraffe: true };

    expect(evaluateIsNotContainedByCondition(fieldValue, ['elephant', 'lion'])).toBe(true);
    expect(evaluateIsNotContainedByCondition(fieldValue, ['rhino'])).toBe(true);
    expect(evaluateIsNotContainedByCondition(fieldValue, ['elephant', 'lion', 'giraffe'])).toBe(false);
    expect(evaluateIsNotContainedByCondition(fieldValue, ['giraffe', 'lion', 'elephant'])).toBe(false);
    expect(evaluateIsNotContainedByCondition(fieldValue, ['rhino', 'elephant', 'lion', 'giraffe', 'leopard'])).toBe(false);
  });

  test('if the field value is an object and the condition value is a string, the condition is fulfilled if the field value has at least one key that is not the condition value', () => {
    expect(evaluateIsNotContainedByCondition({ elephant: true, lion: true }, 'elephant')).toBe(true);
    expect(evaluateIsNotContainedByCondition({ lion: true }, 'elephant')).toBe(true);
    expect(evaluateIsNotContainedByCondition({ elephant: true }, 'elephant')).toBe(false);
  });

  test('if the field value is an empty object, the condition is not fulfilled', () => {
    expect(evaluateIsNotContainedByCondition({}, ['elephant'])).toBe(false);
    expect(evaluateIsNotContainedByCondition({}, 'elephant')).toBe(false);
  });

  test('if the field value is a string and the condition value is an array, the condition is fulfilled if the field value is not contained by the condition value', () => {
    const fieldValue = 'elephant';

    expect(evaluateIsNotContainedByCondition(fieldValue, ['rhino'])).toBe(true);
    expect(evaluateIsNotContainedByCondition(fieldValue, ['elephant'])).toBe(false);
    expect(evaluateIsNotContainedByCondition(fieldValue, ['elephant', 'lion', 'giraffe'])).toBe(false);
  });

  test('if the field value is a string and the condition value is a string, the condition is fulfilled if the field value is not the condition value', () => {
    const fieldValue = 'elephant';

    expect(evaluateIsNotContainedByCondition(fieldValue, 'lion')).toBe(true);
    expect(evaluateIsNotContainedByCondition(fieldValue, 'elephant')).toBe(false);
  });

  test('else, the condition is not fulfilled', () => {
    expect(evaluateIsNotContainedByCondition(true, 'elephant')).toBe(false);
    expect(evaluateIsNotContainedByCondition(false, ['elephant'])).toBe(false);
    expect(evaluateIsNotContainedByCondition(0, 'elephant')).toBe(false);
    expect(evaluateIsNotContainedByCondition(3, ['elephant'])).toBe(false);
    expect(evaluateIsNotContainedByCondition(null, 'elephant')).toBe(false);
    expect(evaluateIsNotContainedByCondition(null, ['elephant'])).toBe(false);
    expect(evaluateIsNotContainedByCondition(undefined, 'elephant')).toBe(false);
    expect(evaluateIsNotContainedByCondition(undefined, ['elephant'])).toBe(false);
  });
});
