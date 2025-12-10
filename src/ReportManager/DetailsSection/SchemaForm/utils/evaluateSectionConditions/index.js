import evaluateContainsCondition from './evaluateContainsCondition';
import evaluateDoesNotHaveInputCondition from './evaluateDoesNotHaveInputCondition';
import evaluateHasInputCondition from './evaluateHasInputCondition';
import evaluateInputIsExactlyCondition from './evaluateInputIsExactlyCondition';
import { FORM_ELEMENT_LOGIC_CONDITION_OPERATORS } from '../../../../../utils/v2-event-schemas/constants';

const evaluateSectionConditions = (sectionConditions, formData) =>
  sectionConditions.every((sectionCondition) => {
    const conditionFieldValue = formData[sectionCondition.field];

    switch (sectionCondition.operator) {
    case FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.CONTAINS:
      return evaluateContainsCondition(conditionFieldValue, sectionCondition.value);

    case FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.DOES_NOT_HAVE_INPUT:
      return evaluateDoesNotHaveInputCondition(conditionFieldValue);

    case FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.HAS_INPUT:
      return evaluateHasInputCondition(conditionFieldValue);

    case FORM_ELEMENT_LOGIC_CONDITION_OPERATORS.INPUT_IS_EXACTLY:
      return evaluateInputIsExactlyCondition(conditionFieldValue, sectionCondition.value);

    default:
      return false;
    }
  });

export default evaluateSectionConditions;
