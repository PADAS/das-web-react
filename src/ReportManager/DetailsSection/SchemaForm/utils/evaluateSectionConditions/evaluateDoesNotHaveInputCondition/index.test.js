import evaluateDoesNotHaveInputCondition from './';

describe('ReportManager - DetailsSection - SchemaForm - utils - evaluateSectionConditions - evaluateDoesNotHaveInputCondition', () => {
  test('passes the condition if the field value is undefined', () => {
    expect(evaluateDoesNotHaveInputCondition(undefined)).toBe(true);
  });

  test('passes the condition if the field value is an empty array', () => {
    expect(evaluateDoesNotHaveInputCondition([])).toBe(true);
  });

  test('passes the condition if the field value is an empty object', () => {
    expect(evaluateDoesNotHaveInputCondition({})).toBe(true);
  });

  test('passes the condition if the field value is an empty string', () => {
    expect(evaluateDoesNotHaveInputCondition('')).toBe(true);
  });

  test('fails the condition if the field value is a non-empty array', () => {
    expect(evaluateDoesNotHaveInputCondition(['Ranger 1'])).toBe(false);
    expect(evaluateDoesNotHaveInputCondition(['Ranger 1', 'Ranger 2'])).toBe(false);
    expect(evaluateDoesNotHaveInputCondition([1, 2, 3])).toBe(false);
    expect(evaluateDoesNotHaveInputCondition([{}])).toBe(false);
  });

  test('fails the condition if the field value is a non-empty object', () => {
    expect(evaluateDoesNotHaveInputCondition({ name: 'Ranger 1' })).toBe(false);
    expect(evaluateDoesNotHaveInputCondition({ age: 25, name: 'Ranger 1' })).toBe(false);
    expect(evaluateDoesNotHaveInputCondition({
      animals: [],
      location: {
        latitude: 23.435,
        longitude: -100.343,
      },
    })).toBe(false);
  });

  test('fails the condition if the field value is null', () => {
    expect(evaluateDoesNotHaveInputCondition(null)).toBe(false);
  });

  test('fails the condition if the field value is a non-empty string', () => {
    expect(evaluateDoesNotHaveInputCondition('Ranger 1')).toBe(false);
    expect(evaluateDoesNotHaveInputCondition('x')).toBe(false);
  });

  test('fails the condition if the field value is anything else', () => {
    expect(evaluateDoesNotHaveInputCondition(0)).toBe(false);
    expect(evaluateDoesNotHaveInputCondition(1)).toBe(false);
    expect(evaluateDoesNotHaveInputCondition(false)).toBe(false);
    expect(evaluateDoesNotHaveInputCondition(true)).toBe(false);
  });
});
