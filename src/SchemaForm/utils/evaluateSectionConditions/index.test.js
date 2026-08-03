import evaluateContainsCondition from './evaluateContainsCondition';
import evaluateIsContainedByCondition from './evaluateIsContainedByCondition';
import evaluateIsEmptyCondition from './evaluateIsEmptyCondition';
import evaluateIsExactlyCondition from './evaluateIsExactlyCondition';
import evaluateIsNotContainedByCondition from './evaluateIsNotContainedByCondition';
import evaluateIsNotEmptyCondition from './evaluateIsNotEmptyCondition';
import {
  FORM_ELEMENT_LOGIC_CONDITION_OPERATORS,
  SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS,
} from '../../../utils/form-schemas/constants';

import evaluateSectionConditions from './';

jest.mock('./evaluateContainsCondition', () => {
  const actual = jest.requireActual('./evaluateContainsCondition');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./evaluateIsContainedByCondition', () => {
  const actual = jest.requireActual('./evaluateIsContainedByCondition');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./evaluateIsEmptyCondition', () => {
  const actual = jest.requireActual('./evaluateIsEmptyCondition');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./evaluateIsExactlyCondition', () => {
  const actual = jest.requireActual('./evaluateIsExactlyCondition');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./evaluateIsNotContainedByCondition', () => {
  const actual = jest.requireActual('./evaluateIsNotContainedByCondition');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./evaluateIsNotEmptyCondition', () => {
  const actual = jest.requireActual('./evaluateIsNotEmptyCondition');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

describe('SchemaForm - utils - evaluateSectionConditions', () => {
  const formData = { age: 25, name: 'Ranger 1', nationality: 'Mexican' };
  let sectionConditions;
  beforeEach(() => {
    evaluateContainsCondition.mockImplementation(() => true);
    evaluateIsContainedByCondition.mockImplementation(() => true);
    evaluateIsEmptyCondition.mockImplementation(() => true);
    evaluateIsExactlyCondition.mockImplementation(() => true);
    evaluateIsNotContainedByCondition.mockImplementation(() => true);
    evaluateIsNotEmptyCondition.mockImplementation(() => true);

    sectionConditions = [
      {
        field: 'name',
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS,
        value: 'Ranger',
      },
    ];
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  test('passes the evaluation of a section if there are no conditions', () => {
    expect(evaluateSectionConditions([], SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.AND, formData)).toBe(true);
    expect(evaluateSectionConditions([], SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.OR, formData)).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a CONTAINS condition operator', () => {
    expect(
      evaluateSectionConditions(sectionConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.AND, formData)
    ).toBe(true);
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(1);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_CONTAINED_BY condition operator', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_CONTAINED_BY;
    sectionConditions[0].value = ['Ranger 1', 'Ranger 2', 'Ranger 3'];

    expect(
      evaluateSectionConditions(sectionConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.AND, formData)
    ).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsContainedByCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_EMPTY condition operator', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EMPTY;

    expect(
      evaluateSectionConditions(sectionConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.AND, formData)
    ).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsEmptyCondition).toHaveBeenCalledWith(formData.name);
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_EXACTLY condition operator', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY;

    expect(
      evaluateSectionConditions(sectionConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.AND, formData)
    ).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsExactlyCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_NOT_CONTAINED_BY condition operator', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_CONTAINED_BY;
    sectionConditions[0].value = ['Ranger 4', 'Ranger 5', 'Ranger 6'];

    expect(
      evaluateSectionConditions(sectionConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.AND, formData)
    ).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsNotContainedByCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_NOT_EMPTY condition operator', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_EMPTY;

    expect(
      evaluateSectionConditions(sectionConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.AND, formData)
    ).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsNotEmptyCondition).toHaveBeenCalledWith(formData.name);
  });

  it('evaluates a section with an invalid condition operator', () => {
    sectionConditions[0].operator = 'INVALID_OPERATOR';

    expect(
      evaluateSectionConditions(sectionConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.AND, formData)
    ).toBe(false);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('passes the evaluation of a section with multiple conditions and AND operator if all conditions pass', () => {
    const multipleConditions = [
      { field: 'name', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS, value: 'Ranger' },
      { field: 'nationality', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS, value: 'Mexican' },
    ];

    expect(
      evaluateSectionConditions(multipleConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.AND, formData)
    ).toBe(true);
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(2);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, multipleConditions[0].value);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.nationality, multipleConditions[1].value);
  });

  test('fails the evaluation of a section with multiple conditions and AND operator if some conditions fail and some pass', () => {
    evaluateIsExactlyCondition.mockImplementation(() => false);
    const multipleConditions = [
      { field: 'name', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS, value: 'Ranger' },
      { field: 'age', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY, value: 99 },
    ];

    expect(
      evaluateSectionConditions(multipleConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.AND, formData)
    ).toBe(false);
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(1);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, multipleConditions[0].value);
    expect(evaluateIsExactlyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsExactlyCondition).toHaveBeenCalledWith(formData.age, multipleConditions[1].value);
  });

  test('fails the evaluation of a section with multiple conditions and AND operator if all conditions fail', () => {
    evaluateContainsCondition.mockImplementation(() => false);
    const multipleConditions = [
      { field: 'name', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS, value: 'something' },
      { field: 'nationality', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS, value: 'else' },
    ];

    expect(
      evaluateSectionConditions(multipleConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.AND, formData)
    ).toBe(false);
    // Array.every short-circuits on first false
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(1);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, multipleConditions[0].value);
  });

  test('passes the evaluation of a section with multiple conditions and OR operator if all conditions pass', () => {
    const multipleConditions = [
      { field: 'name', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS, value: 'Ranger' },
      { field: 'nationality', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS, value: 'Mexican' },
    ];

    expect(
      evaluateSectionConditions(multipleConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.OR, formData)
    ).toBe(true);
    // Array.some short-circuits on first true
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(1);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, multipleConditions[0].value);
  });

  test('passes the evaluation of a section with multiple conditions and OR operator if some conditions fail and some pass', () => {
    evaluateIsExactlyCondition.mockImplementation(() => false);
    const multipleConditions = [
      { field: 'age', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY, value: 99 },
      { field: 'name', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS, value: 'Ranger' },
    ];

    expect(
      evaluateSectionConditions(multipleConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.OR, formData)
    ).toBe(true);
    expect(evaluateIsExactlyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsExactlyCondition).toHaveBeenCalledWith(formData.age, multipleConditions[0].value);
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(1);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, multipleConditions[1].value);
  });

  test('fails the evaluation of a section with multiple conditions and OR operator if all conditions fail', () => {
    evaluateContainsCondition.mockImplementation(() => false);
    const multipleConditions = [
      { field: 'name', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS, value: 'something' },
      { field: 'nationality', operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS, value: 'else' },
    ];

    expect(
      evaluateSectionConditions(multipleConditions, SECTION_ELEMENT_CONDITIONS_LOGICAL_OPERATORS.OR, formData)
    ).toBe(false);
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(2);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, multipleConditions[0].value);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.nationality, multipleConditions[1].value);
  });

  test('passes the evaluation of a section if the conditions logical operator is not valid', () => {
    expect(evaluateSectionConditions(sectionConditions, 'INVALID_LOGICAL_OPERATOR', formData)).toBe(false);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });
});
