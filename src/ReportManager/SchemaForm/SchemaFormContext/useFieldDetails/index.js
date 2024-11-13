import { useContext } from 'react';

import { SchemaFormContext } from '../';
import { getHeaderDetails, getSectionDetails, isField, isSection } from '../../utils';

const useFieldDetails = (fieldName) => {
  const { getFieldDetails, getSchema } = useContext(SchemaFormContext);
  const schema = getSchema();

  return isSection(fieldName, schema)
    ? getSectionDetails(fieldName, schema)
    : isField(fieldName, schema)
      ? getFieldDetails(fieldName)
      : getHeaderDetails(fieldName, schema);
};

export default useFieldDetails;
