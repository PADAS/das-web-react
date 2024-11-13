import { useContext } from 'react';

import { SchemaFormContext } from '../';
import { getHeaderDetails, getSectionDetails, isField, isSection } from '../../utils';

const useFieldDetails = (fieldName) => {
  const { getFieldDetails } = useContext(SchemaFormContext);

  return isSection(fieldName)
    ? getSectionDetails(fieldName)
    : isField(fieldName)
      ? getFieldDetails(fieldName)
      : getHeaderDetails(fieldName);
};

export default useFieldDetails;
