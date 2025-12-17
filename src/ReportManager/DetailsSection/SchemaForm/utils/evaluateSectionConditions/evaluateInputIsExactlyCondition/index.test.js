import evaluateInputIsExactlyCondition from './';

describe('ReportManager - DetailsSection - SchemaForm - utils - evaluateSectionConditions - evaluateInputIsExactlyCondition', () => {
  test('passes the condition if the field value is a number that is exactly the condition value', () => {
    expect(evaluateInputIsExactlyCondition(0, '0')).toBe(true);
    expect(evaluateInputIsExactlyCondition(1, '1')).toBe(true);
  });

  test('passes the condition if the field value is a string that is exactly the condition value', () => {
    expect(evaluateInputIsExactlyCondition('Ranger 1', 'Ranger 1')).toBe(true);
    expect(evaluateInputIsExactlyCondition('x', 'x')).toBe(true);
  });

  test('fails the condition if the field value is a number that is not exactly the condition value', () => {
    expect(evaluateInputIsExactlyCondition(0, '1')).toBe(false);
    expect(evaluateInputIsExactlyCondition(1, '0')).toBe(false);
  });

  test('fails the condition if the field value is a string that is not exactly the condition value', () => {
    expect(evaluateInputIsExactlyCondition('Ranger 1', 'Ranger')).toBe(false);
    expect(evaluateInputIsExactlyCondition('x', 'y')).toBe(false);
  });

  test('fails the condition if the field value is anything else', () => {
    expect(evaluateInputIsExactlyCondition(undefined, 'Ranger 1')).toBe(false);
    expect(evaluateInputIsExactlyCondition(null, 'Ranger 1')).toBe(false);
    expect(evaluateInputIsExactlyCondition(true, 'Ranger 1')).toBe(false);
    expect(evaluateInputIsExactlyCondition([], 'Ranger 1')).toBe(false);
    expect(evaluateInputIsExactlyCondition({}, 'Ranger 1')).toBe(false);
  });
});
