import React, { useContext } from 'react';

import Header from '../Header';
import { SchemaFormContext } from '../../SchemaFormContext';
import useFieldDetails from '../../SchemaFormContext/useFieldDetails';
import { getFormFieldComponent, isFieldActive } from '../../utils';

const SECTION_ITEM_TYPES = {
  HEADER: 'header',
  FIELD: 'field'
};

const Section = ({ sectionName }) => {
  const sectionDetails = useFieldDetails(sectionName);
  const { getSchema } = useContext(SchemaFormContext);

  const schema = getSchema();

  const renderColumnSectionItems = (column) => column.map(({ name, type }) => {
    if ( type === SECTION_ITEM_TYPES.FIELD && isFieldActive(name, schema) ){
      const Field = getFormFieldComponent(name, schema);
      return <Field fieldName={name} key={name} />;
    } else if (type === SECTION_ITEM_TYPES.HEADER) {
      return <Header fieldName={name} key={name} />;
    }
    return null;
  });

  return <div>
    <div>
      {
        renderColumnSectionItems(sectionDetails.leftColumn)
      }
    </div>

  </div>;
};

export default Section;
