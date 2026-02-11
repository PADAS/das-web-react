import evaluateContainsCondition from './evaluateContainsCondition';
import evaluateIsContainedByCondition from './evaluateIsContainedByCondition';
import evaluateIsEmptyCondition from './evaluateIsEmptyCondition';
import evaluateIsExactlyCondition from './evaluateIsExactlyCondition';
import evaluateIsNotContainedByCondition from './evaluateIsNotContainedByCondition';
import evaluateIsNotEmptyCondition from './evaluateIsNotEmptyCondition';
import { FORM_ELEMENT_LOGIC_CONDITION_OPERATORS } from '../../../../../utils/v2-event-schemas/constants';

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

describe('ReportManager - DetailsSection - SchemaForm - utils - evaluateSectionConditions', () => {
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

  test('evaluates a section with a CONTAINS condition', () => {
    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(1);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_CONTAINED_BY condition', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_CONTAINED_BY;
    sectionConditions[0].value = ['Ranger 1', 'Ranger 2', 'Ranger 3'];

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsContainedByCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_EMPTY condition', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EMPTY;

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsEmptyCondition).toHaveBeenCalledWith(formData.name);
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_EXACTLY condition', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY;

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsExactlyCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_NOT_CONTAINED_BY condition', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_CONTAINED_BY;
    sectionConditions[0].value = ['Ranger 4', 'Ranger 5', 'Ranger 6'];

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsNotContainedByCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_NOT_EMPTY condition', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_EMPTY;

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsNotEmptyCondition).toHaveBeenCalledWith(formData.name);
  });

  test('passes the evaluate of a section with multiple conditions if all conditions pass', () => {
    sectionConditions = [
      {
        field: 'name',
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS,
        value: 'Ranger',
      },
      {
        field: 'age',
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_EMPTY,
      },
      {
        field: 'nationality',
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY,
        value: 'Mexican',
      },
    ];

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(1);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsExactlyCondition).toHaveBeenCalledWith(formData.nationality, sectionConditions[2].value);
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsNotEmptyCondition).toHaveBeenCalledWith(formData.age);
  });

  test('fails the evaluate of a section with multiple conditions if any condition fails', () => {
    evaluateIsExactlyCondition.mockImplementation(() => false);

    sectionConditions = [
      {
        field: 'name',
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS,
        value: 'Ranger',
      },
      {
        field: 'age',
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_EMPTY,
      },
      {
        field: 'nationality',
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY,
        value: 'Mexican',
      },
    ];

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(false);
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(1);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsExactlyCondition).toHaveBeenCalledWith(formData.nationality, sectionConditions[2].value);
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsNotEmptyCondition).toHaveBeenCalledWith(formData.age);
  });

  test('evaluates a section with an invalid operator', () => {
    sectionConditions[0].operator = 'INVALID_OPERATOR';

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(false);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsEmptyCondition).not.toHaveBeenCalled();
    expect(evaluateIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotEmptyCondition).not.toHaveBeenCalled();
  });
});
