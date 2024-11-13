import React, { useContext } from 'react';

import Header from '../Header';
import Text from '../Text';

import { FORM_FIELDS_TYPES } from '../../../../constants';
import { SchemaFormContext } from '../../SchemaFormContext';
import useFieldDetails from '../../SchemaFormContext/useFieldDetails';

const SECTION_ITEM_TYPES = {
  HEADER: 'header',
  FIELD: 'field'
};

const FORM_FIELDS = {
  [FORM_FIELDS_TYPES.TEXT]: Text
};

const Section = ({ sectionName }) => {
  const { getFieldUIType, isFieldActive } = useContext(SchemaFormContext);
  const sectionDetails = useFieldDetails(sectionName);

  const renderColumnSectionItems = (column) => column.map(({ name, type }) => {
    if ( type === SECTION_ITEM_TYPES.FIELD && isFieldActive(name) ){
      const Field = FORM_FIELDS[getFieldUIType(name)];
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
