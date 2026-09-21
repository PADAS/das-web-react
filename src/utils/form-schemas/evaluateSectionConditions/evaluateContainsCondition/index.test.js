import evaluateContainsCondition from './';

describe('SchemaForm - utils - evaluateSectionConditions - evaluateContainsCondition', () => {
  test('if the field value is an array and the condition value is an array, the condition is fulfilled if the field value contains all the condition value items', () => {
    const fieldValue = ['elephant', 'lion', 'giraffe'];

    expect(evaluateContainsCondition(fieldValue, ['elephant'])).toBe(true);
    expect(evaluateContainsCondition(fieldValue, ['giraffe', 'lion', 'elephant'])).toBe(true);
    expect(evaluateContainsCondition(fieldValue, ['rhino'])).toBe(false);
    expect(evaluateContainsCondition(fieldValue, ['elephant', 'rhino'])).toBe(false);
    expect(evaluateContainsCondition(fieldValue, ['elephant', 'lion', 'giraffe', 'rhino'])).toBe(false);
  });

  test('if the field value is an array and the condition value is a string, the condition is fulfilled if the field value contains the condition value', () => {
    const fieldValue = ['elephant', 'lion', 'giraffe'];

    expect(evaluateContainsCondition(fieldValue, 'elephant')).toBe(true);
    expect(evaluateContainsCondition(fieldValue, 'giraffe')).toBe(true);
    expect(evaluateContainsCondition(fieldValue, 'rhino')).toBe(false);
  });

  test('if the field value is an object and the condition value is an array, the condition is fulfilled if the field value has all the condition value items as keys', () => {
    const fieldValue = { elephant: true, lion: true, giraffe: true };

    expect(evaluateContainsCondition(fieldValue, ['elephant'])).toBe(true);
    expect(evaluateContainsCondition(fieldValue, ['giraffe', 'lion', 'elephant'])).toBe(true);
    expect(evaluateContainsCondition(fieldValue, ['rhino'])).toBe(false);
    expect(evaluateContainsCondition(fieldValue, ['elephant', 'rhino'])).toBe(false);
    expect(evaluateContainsCondition(fieldValue, ['elephant', 'lion', 'giraffe', 'rhino'])).toBe(false);
  });

  test('if the field value is an object and the condition value is a string, the condition is fulfilled if the field value has the condition value as a key', () => {
    const fieldValue = { elephant: true, lion: true, giraffe: true };

    expect(evaluateContainsCondition(fieldValue, 'elephant')).toBe(true);
    expect(evaluateContainsCondition(fieldValue, 'giraffe')).toBe(true);
    expect(evaluateContainsCondition(fieldValue, 'rhino')).toBe(false);
  });

  test('if the field value is a string and the condition value is an array, the condition is not fulfilled', () => {
    const fieldValue = 'african bush elephant';

    expect(evaluateContainsCondition(fieldValue, [])).toBe(false);
    expect(evaluateContainsCondition(fieldValue, ['elephant'])).toBe(false);
    expect(evaluateContainsCondition(fieldValue, ['african bush elephant'])).toBe(false);
    expect(evaluateContainsCondition(fieldValue, ['african', 'bush', 'elephant'])).toBe(false);
  });

  test('if the field value is a string and the condition value is a string, the condition is fulfilled if the field value contains the condition value as a substring', () => {
    const fieldValue = 'african bush elephant';

    expect(evaluateContainsCondition(fieldValue, 'elephant')).toBe(true);
    expect(evaluateContainsCondition(fieldValue, 'african bush elephant')).toBe(true);
    expect(evaluateContainsCondition(fieldValue, 'rhino')).toBe(false);
  });

  test('else, the condition is not fulfilled', () => {
    expect(evaluateContainsCondition(true, 'elephant')).toBe(false);
    expect(evaluateContainsCondition(false, ['elephant'])).toBe(false);
    expect(evaluateContainsCondition(0, 'elephant')).toBe(false);
    expect(evaluateContainsCondition(3, ['elephant'])).toBe(false);
    expect(evaluateContainsCondition(null, 'elephant')).toBe(false);
    expect(evaluateContainsCondition(null, ['elephant'])).toBe(false);
    expect(evaluateContainsCondition(undefined, 'elephant')).toBe(false);
    expect(evaluateContainsCondition(undefined, ['elephant'])).toBe(false);
  });
});
