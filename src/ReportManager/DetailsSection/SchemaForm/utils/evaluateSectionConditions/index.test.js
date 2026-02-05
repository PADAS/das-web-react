import evaluateContainsCondition from './evaluateContainsCondition';
import evaluateDoesNotHaveInputCondition from './evaluateDoesNotHaveInputCondition';
import evaluateHasInputCondition from './evaluateHasInputCondition';
import evaluateInputIsExactlyCondition from './evaluateInputIsExactlyCondition';
import evaluateIsContainedByCondition from './evaluateIsContainedByCondition';
import evaluateIsNotContainedByCondition from './evaluateIsNotContainedByCondition';
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

jest.mock('./evaluateDoesNotHaveInputCondition', () => {
  const actual = jest.requireActual('./evaluateDoesNotHaveInputCondition');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./evaluateHasInputCondition', () => {
  const actual = jest.requireActual('./evaluateHasInputCondition');
  return {
    ...actual,
    __esModule: true,
    default: jest.fn(),
  };
});

jest.mock('./evaluateInputIsExactlyCondition', () => {
  const actual = jest.requireActual('./evaluateInputIsExactlyCondition');
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

jest.mock('./evaluateIsNotContainedByCondition', () => {
  const actual = jest.requireActual('./evaluateIsNotContainedByCondition');
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
    evaluateDoesNotHaveInputCondition.mockImplementation(() => true);
    evaluateHasInputCondition.mockImplementation(() => true);
    evaluateInputIsExactlyCondition.mockImplementation(() => true);
    evaluateIsContainedByCondition.mockImplementation(() => true);
    evaluateIsNotContainedByCondition.mockImplementation(() => true);

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
    expect(evaluateDoesNotHaveInputCondition).not.toHaveBeenCalled();
    expect(evaluateHasInputCondition).not.toHaveBeenCalled();
    expect(evaluateInputIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a DOES_NOT_HAVE_INPUT condition', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.DOES_NOT_HAVE_INPUT;

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateDoesNotHaveInputCondition).toHaveBeenCalledTimes(1);
    expect(evaluateDoesNotHaveInputCondition).toHaveBeenCalledWith(formData.name);
    expect(evaluateHasInputCondition).not.toHaveBeenCalled();
    expect(evaluateInputIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a HAS_INPUT condition', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.HAS_INPUT;

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateDoesNotHaveInputCondition).not.toHaveBeenCalled();
    expect(evaluateHasInputCondition).toHaveBeenCalledTimes(1);
    expect(evaluateHasInputCondition).toHaveBeenCalledWith(formData.name);
    expect(evaluateInputIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a INPUT_IS_EXACTLY condition', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.INPUT_IS_EXACTLY;

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateDoesNotHaveInputCondition).not.toHaveBeenCalled();
    expect(evaluateHasInputCondition).not.toHaveBeenCalled();
    expect(evaluateInputIsExactlyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateInputIsExactlyCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_CONTAINED_BY condition', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_CONTAINED_BY;
    sectionConditions[0].value = ['Ranger 1', 'Ranger 2', 'Ranger 3'];

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateDoesNotHaveInputCondition).not.toHaveBeenCalled();
    expect(evaluateHasInputCondition).not.toHaveBeenCalled();
    expect(evaluateInputIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsContainedByCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with a IS_NOT_CONTAINED_BY condition', () => {
    sectionConditions[0].operator = FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_CONTAINED_BY;
    sectionConditions[0].value = ['Ranger 4', 'Ranger 5', 'Ranger 6'];

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateDoesNotHaveInputCondition).not.toHaveBeenCalled();
    expect(evaluateHasInputCondition).not.toHaveBeenCalled();
    expect(evaluateInputIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).toHaveBeenCalledTimes(1);
    expect(evaluateIsNotContainedByCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
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
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.HAS_INPUT,
      },
      {
        field: 'nationality',
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.INPUT_IS_EXACTLY,
        value: 'Mexican',
      },
    ];

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(true);
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(1);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateDoesNotHaveInputCondition).not.toHaveBeenCalled();
    expect(evaluateHasInputCondition).toHaveBeenCalledTimes(1);
    expect(evaluateHasInputCondition).toHaveBeenCalledWith(formData.age);
    expect(evaluateInputIsExactlyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateInputIsExactlyCondition).toHaveBeenCalledWith(formData.nationality, sectionConditions[2].value);
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
  });

  test('fails the evaluate of a section with multiple conditions if any condition fails', () => {
    evaluateInputIsExactlyCondition.mockImplementation(() => false);

    sectionConditions = [
      {
        field: 'name',
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS,
        value: 'Ranger',
      },
      {
        field: 'age',
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.HAS_INPUT,
      },
      {
        field: 'nationality',
        operator: FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.INPUT_IS_EXACTLY,
        value: 'Mexican',
      },
    ];

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(false);
    expect(evaluateContainsCondition).toHaveBeenCalledTimes(1);
    expect(evaluateContainsCondition).toHaveBeenCalledWith(formData.name, sectionConditions[0].value);
    expect(evaluateDoesNotHaveInputCondition).not.toHaveBeenCalled();
    expect(evaluateHasInputCondition).toHaveBeenCalledTimes(1);
    expect(evaluateHasInputCondition).toHaveBeenCalledWith(formData.age);
    expect(evaluateInputIsExactlyCondition).toHaveBeenCalledTimes(1);
    expect(evaluateInputIsExactlyCondition).toHaveBeenCalledWith(formData.nationality, sectionConditions[2].value);
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
  });

  test('evaluates a section with an invalid operator', () => {
    sectionConditions[0].operator = 'INVALID_OPERATOR';

    expect(evaluateSectionConditions(sectionConditions, formData)).toBe(false);
    expect(evaluateContainsCondition).not.toHaveBeenCalled();
    expect(evaluateDoesNotHaveInputCondition).not.toHaveBeenCalled();
    expect(evaluateHasInputCondition).not.toHaveBeenCalled();
    expect(evaluateInputIsExactlyCondition).not.toHaveBeenCalled();
    expect(evaluateIsContainedByCondition).not.toHaveBeenCalled();
    expect(evaluateIsNotContainedByCondition).not.toHaveBeenCalled();
  });
});
