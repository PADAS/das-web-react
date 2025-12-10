import evaluateHasInputCondition from './';

describe('ReportManager - DetailsSection - SchemaForm - utils - evaluateSectionConditions - evaluateHasInputCondition', () => {
  test('passes the condition if the field value is a non-empty array', () => {
    expect(evaluateHasInputCondition(['Ranger 1'])).toBe(true);
    expect(evaluateHasInputCondition(['Ranger 1', 'Ranger 2'])).toBe(true);
    expect(evaluateHasInputCondition([1, 2, 3])).toBe(true);
    expect(evaluateHasInputCondition([{}])).toBe(true);
  });

  test('passes the condition if the field value is a boolean', () => {
    expect(evaluateHasInputCondition(true)).toBe(true);
    expect(evaluateHasInputCondition(false)).toBe(true);
  });

  test('passes the condition if the field value is a number', () => {
    expect(evaluateHasInputCondition(0)).toBe(true);
    expect(evaluateHasInputCondition(1)).toBe(true);
  });

  test('passes the condition if the field value is a non-empty object', () => {
    expect(evaluateHasInputCondition({ name: 'Ranger 1' })).toBe(true);
    expect(evaluateHasInputCondition({ age: 25, name: 'Ranger 1' })).toBe(true);
    expect(evaluateHasInputCondition({
      animals: [],
      location: {
        latitude: 23.435,
        longitude: -100.343,
      },
    })).toBe(true);
  });

  test('passes the condition if the field value is a non-empty string', () => {
    expect(evaluateHasInputCondition('Ranger 1')).toBe(true);
    expect(evaluateHasInputCondition('x')).toBe(true);
  });

  test('fails the condition if the field value is undefined', () => {
    expect(evaluateHasInputCondition(undefined)).toBe(false);
  });

  test('fails the condition if the field value is null', () => {
    expect(evaluateHasInputCondition(null)).toBe(false);
  });

  test('fails the condition if the field value is an empty array', () => {
    expect(evaluateHasInputCondition([])).toBe(false);
  });

  test('fails the condition if the field value is an empty object', () => {
    expect(evaluateHasInputCondition({})).toBe(false);
  });

  test('fails the condition if the field value is an empty string', () => {
    expect(evaluateHasInputCondition('')).toBe(false);
  });
});
