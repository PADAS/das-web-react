import { useContext } from 'react';

import { SchemaFormContext } from '../SchemaFormContext';

const useFieldDetails = (fieldName) => {
  const { getSectionDetails, getFieldDetails, getHeaderDetails, isSection, isField } = useContext(SchemaFormContext);

  return isSection(fieldName)
    ? getSectionDetails(fieldName)
    : isField(fieldName)
      ? getFieldDetails(fieldName)
      : getHeaderDetails(fieldName);
};

export default useFieldDetails;
