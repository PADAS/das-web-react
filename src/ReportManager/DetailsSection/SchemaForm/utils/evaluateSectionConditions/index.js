import evaluateContainsCondition from './evaluateContainsCondition';
import evaluateIsContainedByCondition from './evaluateIsContainedByCondition';
import evaluateIsEmptyCondition from './evaluateIsEmptyCondition';
import evaluateIsExactlyCondition from './evaluateIsExactlyCondition';
import evaluateIsNotContainedByCondition from './evaluateIsNotContainedByCondition';
import evaluateIsNotEmptyCondition from './evaluateIsNotEmptyCondition';
import { FORM_ELEMENT_LOGIC_CONDITION_OPERATORS } from '../../../../../utils/v2-event-schemas/constants';

const evaluateSectionConditions = (sectionConditions, formData) =>
  sectionConditions.every((sectionCondition) => {
    const conditionFieldValue = formData[sectionCondition.field];

    switch (sectionCondition.operator) {
    case FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS:
      return evaluateContainsCondition(conditionFieldValue, sectionCondition.value);

    case FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_CONTAINED_BY:
      return evaluateIsContainedByCondition(conditionFieldValue, sectionCondition.value);

    case FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EMPTY:
      return evaluateIsEmptyCondition(conditionFieldValue);

    case FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_EXACTLY:
      return evaluateIsExactlyCondition(conditionFieldValue, sectionCondition.value);

    case FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_CONTAINED_BY:
      return evaluateIsNotContainedByCondition(conditionFieldValue, sectionCondition.value);

    case FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.IS_NOT_EMPTY:
      return evaluateIsNotEmptyCondition(conditionFieldValue);

    default:
      return false;
    }
  });

export default evaluateSectionConditions;
