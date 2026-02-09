import evaluateInputIsExactlyCondition from './';

describe('ReportManager - DetailsSection - SchemaForm - utils - evaluateSectionConditions - evaluateInputIsExactlyCondition', () => {
  test('if the field value is an array and the condition value is an array, the condition is fulfilled if the field value contains exactly the condition value items', () => {
    const fieldValue = ['elephant', 'lion', 'giraffe'];

    expect(evaluateInputIsExactlyCondition(fieldValue, ['elephant', 'lion', 'giraffe'])).toBe(true);
    expect(evaluateInputIsExactlyCondition(fieldValue, ['giraffe', 'lion', 'elephant'])).toBe(true);
    expect(evaluateInputIsExactlyCondition(fieldValue, ['elephant'])).toBe(false);
    expect(evaluateInputIsExactlyCondition(fieldValue, ['elephant', 'lion'])).toBe(false);
    expect(evaluateInputIsExactlyCondition(fieldValue, ['elephant', 'lion', 'giraffe', 'rhino'])).toBe(false);
    expect(evaluateInputIsExactlyCondition(fieldValue, ['rhino'])).toBe(false);
  });

  test('if the field value is an array and the condition value is a string, the condition is fulfilled if the field value contains only the condition value', () => {
    const fieldValue = ['elephant'];

    expect(evaluateInputIsExactlyCondition(fieldValue, 'elephant')).toBe(true);
    expect(evaluateInputIsExactlyCondition(fieldValue, 'rhino')).toBe(false);
  });

  test('if the field value is a boolean and the condition value is "true", the condition is fulfilled if the field value is true', () => {
    expect(evaluateInputIsExactlyCondition(true, 'true')).toBe(true);
    expect(evaluateInputIsExactlyCondition(false, 'true')).toBe(false);
  });

  test('if the field value is a boolean and the condition value is "false", the condition is fulfilled if the field value is false', () => {
    expect(evaluateInputIsExactlyCondition(false, 'false')).toBe(true);
    expect(evaluateInputIsExactlyCondition(true, 'false')).toBe(false);
  });

  test('if the field value is a boolean and the condition value is anything else, the condition is not fulfilled', () => {
    expect(evaluateInputIsExactlyCondition(true, 'yes')).toBe(false);
    expect(evaluateInputIsExactlyCondition(false, 'no')).toBe(false);
    expect(evaluateInputIsExactlyCondition(true, ['true'])).toBe(false);
  });

  test('if the field value is a number and the condition value is a string that can be parsed as a number, the condition is fulfilled if the field value is that number', () => {
    expect(evaluateInputIsExactlyCondition(0, '0')).toBe(true);
    expect(evaluateInputIsExactlyCondition(3, '3')).toBe(true);
  });

  test('if the field value is a number and the condition value is an array or cannot be parsed as a number, the condition is not fulfilled', () => {
    expect(evaluateInputIsExactlyCondition(3, ['3'])).toBe(false);
    expect(evaluateInputIsExactlyCondition(3, 'three')).toBe(false);
  });

  test('if the field value is an object and the condition value is an array, the condition is fulfilled if the field has exactly the condition value items as keys', () => {
    const fieldValue = { elephant: true, lion: true, giraffe: true };

    expect(evaluateInputIsExactlyCondition(fieldValue, ['elephant', 'lion', 'giraffe'])).toBe(true);
    expect(evaluateInputIsExactlyCondition(fieldValue, ['giraffe', 'lion', 'elephant'])).toBe(true);
    expect(evaluateInputIsExactlyCondition(fieldValue, ['elephant'])).toBe(false);
    expect(evaluateInputIsExactlyCondition(fieldValue, ['elephant', 'lion'])).toBe(false);
    expect(evaluateInputIsExactlyCondition(fieldValue, ['elephant', 'lion', 'giraffe', 'rhino'])).toBe(false);
    expect(evaluateInputIsExactlyCondition(fieldValue, ['rhino'])).toBe(false);
  });

  test('if the field value is an object and the condition value is a string, the condition is fulfilled if the field has the value as its only key', () => {
    const fieldValue = { elephant: true };

    expect(evaluateInputIsExactlyCondition(fieldValue, 'elephant')).toBe(true);
    expect(evaluateInputIsExactlyCondition(fieldValue, 'rhino')).toBe(false);
  });

  test('if the field value is a string and the condition value is a string, the condition is fulfilled if the field value is exactly the condition value', () => {
    expect(evaluateInputIsExactlyCondition('elephant', 'elephant')).toBe(true);

    expect(evaluateInputIsExactlyCondition('african elephant', 'elephant')).toBe(false);
    expect(evaluateInputIsExactlyCondition('elephant', 'african elephant')).toBe(false);
  });

  test('if the field value is a string and the condition value is an array, the condition is not fulfilled', () => {
    expect(evaluateInputIsExactlyCondition('elephant', [])).toBe(false);
    expect(evaluateInputIsExactlyCondition('elephant', ['elephant'])).toBe(false);
    expect(evaluateInputIsExactlyCondition('elephant', ['e', 'l', 'e', 'p', 'h', 'a', 'n', 't'])).toBe(false);
  });

  test('else, the condition is not fulfilled', () => {
    expect(evaluateInputIsExactlyCondition(null, 'elephant')).toBe(false);
    expect(evaluateInputIsExactlyCondition(null, ['elephant'])).toBe(false);
    expect(evaluateInputIsExactlyCondition(undefined, 'elephant')).toBe(false);
    expect(evaluateInputIsExactlyCondition(undefined, ['elephant'])).toBe(false);
  });
});
