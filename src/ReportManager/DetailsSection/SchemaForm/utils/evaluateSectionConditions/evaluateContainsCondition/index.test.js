import evaluateContainsCondition from './';

describe('ReportManager - DetailsSection - SchemaForm - utils - evaluateSectionConditions - evaluateContainsCondition', () => {
  test('passes the condition if the field value is a string that contains the condition value', () => {
    expect(evaluateContainsCondition('Ranger 1', 'Ranger 1')).toBe(true);
    expect(evaluateContainsCondition('Ranger 1', 'Ranger')).toBe(true);
    expect(evaluateContainsCondition('Ranger 1', '1')).toBe(true);
    expect(evaluateContainsCondition('Ranger 1', 'ang')).toBe(true);
  });

  test('fails the condition if the field value is a string that does not contain the condition value', () => {
    expect(evaluateContainsCondition('Ranger 1', 'Ranger 2')).toBe(false);
    expect(evaluateContainsCondition('Ranger 1', 'Animal')).toBe(false);
    expect(evaluateContainsCondition('Ranger 1', '2')).toBe(false);
    expect(evaluateContainsCondition('Ranger 1', 'x')).toBe(false);
  });

  test('fails the condition if the field value is anything else', () => {
    expect(evaluateContainsCondition(undefined, 'Ranger 1')).toBe(false);
    expect(evaluateContainsCondition(null, 'Ranger 1')).toBe(false);
    expect(evaluateContainsCondition(1, 'Ranger 1')).toBe(false);
    expect(evaluateContainsCondition(true, 'Ranger 1')).toBe(false);
    expect(evaluateContainsCondition([], 'Ranger 1')).toBe(false);
    expect(evaluateContainsCondition({}, 'Ranger 1')).toBe(false);
  });
});
