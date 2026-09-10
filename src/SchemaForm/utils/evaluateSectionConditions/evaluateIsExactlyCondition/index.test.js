import evaluateIsExactlyCondition from './';

describe('SchemaForm - utils - evaluateSectionConditions - evaluateIsExactlyCondition', () => {
  test('if the field value is an array and the condition value is an array, the condition is fulfilled if the field value contains exactly the condition value items', () => {
    const fieldValue = ['elephant', 'lion', 'giraffe'];

    expect(evaluateIsExactlyCondition(fieldValue, ['elephant', 'lion', 'giraffe'])).toBe(true);
    expect(evaluateIsExactlyCondition(fieldValue, ['giraffe', 'lion', 'elephant'])).toBe(true);
    expect(evaluateIsExactlyCondition(fieldValue, ['elephant'])).toBe(false);
    expect(evaluateIsExactlyCondition(fieldValue, ['elephant', 'lion'])).toBe(false);
    expect(evaluateIsExactlyCondition(fieldValue, ['elephant', 'lion', 'giraffe', 'rhino'])).toBe(false);
    expect(evaluateIsExactlyCondition(fieldValue, ['rhino'])).toBe(false);
  });

  test('if the field value is an array and the condition value is a string, the condition is fulfilled if the field value contains only the condition value', () => {
    const fieldValue = ['elephant'];

    expect(evaluateIsExactlyCondition(fieldValue, 'elephant')).toBe(true);
    expect(evaluateIsExactlyCondition(fieldValue, 'rhino')).toBe(false);
  });

  test('if the field value is a boolean and the condition value is "true", the condition is fulfilled if the field value is true', () => {
    expect(evaluateIsExactlyCondition(true, 'true')).toBe(true);
    expect(evaluateIsExactlyCondition(false, 'true')).toBe(false);
  });

  test('if the field value is a boolean and the condition value is "false", the condition is fulfilled if the field value is false', () => {
    expect(evaluateIsExactlyCondition(false, 'false')).toBe(true);
    expect(evaluateIsExactlyCondition(true, 'false')).toBe(false);
  });

  test('if the field value is a boolean and the condition value is anything else, the condition is not fulfilled', () => {
    expect(evaluateIsExactlyCondition(true, 'yes')).toBe(false);
    expect(evaluateIsExactlyCondition(false, 'no')).toBe(false);
    expect(evaluateIsExactlyCondition(true, ['true'])).toBe(false);
  });

  test('if the field value is a number and the condition value is a string that can be parsed as a number, the condition is fulfilled if the field value is that number', () => {
    expect(evaluateIsExactlyCondition(0, '0')).toBe(true);
    expect(evaluateIsExactlyCondition(3, '3')).toBe(true);
  });

  test('if the field value is a number and the condition value is an array or cannot be parsed as a number, the condition is not fulfilled', () => {
    expect(evaluateIsExactlyCondition(3, ['3'])).toBe(false);
    expect(evaluateIsExactlyCondition(3, 'three')).toBe(false);
  });

  test('if the field value is an object and the condition value is an array, the condition is fulfilled if the field has exactly the condition value items as keys', () => {
    const fieldValue = { elephant: true, lion: true, giraffe: true };

    expect(evaluateIsExactlyCondition(fieldValue, ['elephant', 'lion', 'giraffe'])).toBe(true);
    expect(evaluateIsExactlyCondition(fieldValue, ['giraffe', 'lion', 'elephant'])).toBe(true);
    expect(evaluateIsExactlyCondition(fieldValue, ['elephant'])).toBe(false);
    expect(evaluateIsExactlyCondition(fieldValue, ['elephant', 'lion'])).toBe(false);
    expect(evaluateIsExactlyCondition(fieldValue, ['elephant', 'lion', 'giraffe', 'rhino'])).toBe(false);
    expect(evaluateIsExactlyCondition(fieldValue, ['rhino'])).toBe(false);
  });

  test('if the field value is an object and the condition value is a string, the condition is fulfilled if the field has the value as its only key', () => {
    const fieldValue = { elephant: true };

    expect(evaluateIsExactlyCondition(fieldValue, 'elephant')).toBe(true);
    expect(evaluateIsExactlyCondition(fieldValue, 'rhino')).toBe(false);
  });

  test('if the field value is a string and the condition value is a string, the condition is fulfilled if the field value is exactly the condition value', () => {
    expect(evaluateIsExactlyCondition('elephant', 'elephant')).toBe(true);

    expect(evaluateIsExactlyCondition('african elephant', 'elephant')).toBe(false);
    expect(evaluateIsExactlyCondition('elephant', 'african elephant')).toBe(false);
  });

  test('if the field value is a string and the condition value is an array, the condition is not fulfilled', () => {
    expect(evaluateIsExactlyCondition('elephant', [])).toBe(false);
    expect(evaluateIsExactlyCondition('elephant', ['elephant'])).toBe(false);
    expect(evaluateIsExactlyCondition('elephant', ['e', 'l', 'e', 'p', 'h', 'a', 'n', 't'])).toBe(false);
  });

  test('else, the condition is not fulfilled', () => {
    expect(evaluateIsExactlyCondition(null, 'elephant')).toBe(false);
    expect(evaluateIsExactlyCondition(null, ['elephant'])).toBe(false);
    expect(evaluateIsExactlyCondition(undefined, 'elephant')).toBe(false);
    expect(evaluateIsExactlyCondition(undefined, ['elephant'])).toBe(false);
  });
});
