import evaluateIsContainedByCondition from './';

describe('SchemaForm - utils - evaluateSectionConditions - evaluateIsContainedByCondition', () => {
  test('if the field value is an array and the condition value is an array, the condition is fulfilled if all the field value items are contained by the condition value', () => {
    const fieldValue = ['elephant', 'lion', 'giraffe'];

    expect(evaluateIsContainedByCondition(fieldValue, ['elephant', 'lion', 'giraffe'])).toBe(true);
    expect(evaluateIsContainedByCondition(fieldValue, ['giraffe', 'lion', 'elephant'])).toBe(true);
    expect(evaluateIsContainedByCondition(fieldValue, ['rhino', 'elephant', 'lion', 'giraffe', 'leopard'])).toBe(true);
    expect(evaluateIsContainedByCondition(fieldValue, ['elephant', 'lion'])).toBe(false);
    expect(evaluateIsContainedByCondition(fieldValue, ['rhino'])).toBe(false);
  });

  test('if the field value is an array and the condition value is a string, the condition is fulfilled if the field value has the conditionvalue as its only item', () => {
    expect(evaluateIsContainedByCondition(['elephant'], 'elephant')).toBe(true);
    expect(evaluateIsContainedByCondition(['elephant'], 'rhino')).toBe(false);
    expect(evaluateIsContainedByCondition(['elephant', 'lion'], 'elephant')).toBe(false);
  });

  test('if the field value is an empty array, the condition is not fulfilled', () => {
    expect(evaluateIsContainedByCondition([], ['elephant'])).toBe(false);
    expect(evaluateIsContainedByCondition([], 'elephant')).toBe(false);
  });

  test('if the field value is an object and the condition value is an array, the condition is fulfilled if all the field value keys are contained by the condition value', () => {
    const fieldValue = { elephant: true, lion: true, giraffe: true };

    expect(evaluateIsContainedByCondition(fieldValue, ['elephant', 'lion', 'giraffe'])).toBe(true);
    expect(evaluateIsContainedByCondition(fieldValue, ['giraffe', 'lion', 'elephant'])).toBe(true);
    expect(evaluateIsContainedByCondition(fieldValue, ['rhino', 'elephant', 'lion', 'giraffe', 'leopard'])).toBe(true);
    expect(evaluateIsContainedByCondition(fieldValue, ['elephant', 'lion'])).toBe(false);
    expect(evaluateIsContainedByCondition(fieldValue, ['rhino'])).toBe(false);
  });

  test('if the field value is an object and the condition value is a string, the condition is fulfilled if the field value has the condition value as its only key', () => {
    expect(evaluateIsContainedByCondition({ elephant: true }, 'elephant')).toBe(true);
    expect(evaluateIsContainedByCondition({ elephant: true }, 'rhino')).toBe(false);
    expect(evaluateIsContainedByCondition({ elephant: true, lion: true }, 'elephant')).toBe(false);
  });

  test('if the field value is an empty object, the condition is not fulfilled', () => {
    expect(evaluateIsContainedByCondition({}, ['elephant'])).toBe(false);
    expect(evaluateIsContainedByCondition({}, 'elephant')).toBe(false);
  });

  test('if the field value is a string and the condition value is an array, the condition is fulfilled if the field value is contained by the condition value', () => {
    const fieldValue = 'elephant';

    expect(evaluateIsContainedByCondition(fieldValue, ['elephant'])).toBe(true);
    expect(evaluateIsContainedByCondition(fieldValue, ['elephant', 'lion', 'giraffe'])).toBe(true);
    expect(evaluateIsContainedByCondition(fieldValue, ['rhino'])).toBe(false);
  });

  test('if the field value is a string and the condition value is a string, the condition is fulfilled if the field value is the condition value', () => {
    const fieldValue = 'elephant';

    expect(evaluateIsContainedByCondition(fieldValue, 'elephant')).toBe(true);
    expect(evaluateIsContainedByCondition(fieldValue, 'lion')).toBe(false);
  });

  test('else, the condition is not fulfilled', () => {
    expect(evaluateIsContainedByCondition(true, 'elephant')).toBe(false);
    expect(evaluateIsContainedByCondition(false, ['elephant'])).toBe(false);
    expect(evaluateIsContainedByCondition(0, 'elephant')).toBe(false);
    expect(evaluateIsContainedByCondition(3, ['elephant'])).toBe(false);
    expect(evaluateIsContainedByCondition(null, 'elephant')).toBe(false);
    expect(evaluateIsContainedByCondition(null, ['elephant'])).toBe(false);
    expect(evaluateIsContainedByCondition(undefined, 'elephant')).toBe(false);
    expect(evaluateIsContainedByCondition(undefined, ['elephant'])).toBe(false);
  });
});
