import React, { useContext } from 'react';
import { SchemaFormContext } from '../../SchemaFormContext';
import Header from '../Header';
import Text from '../Text';
import { FORM_FIELDS_TYPES } from '../../../../constants';
import useFieldDetails from '../../useFieldDetails';

const SECTION_ITEM_TYPES = {
  HEADER: 'header',
  FIELD: 'field'
};

const FORM_FIELDS = {
  [FORM_FIELDS_TYPES.TEXT]: Text
};

const Section = ({ sectionName }) => {
  const { getFieldUIType } = useContext(SchemaFormContext);
  const sectionDetails = useFieldDetails(sectionName);

  const renderColumnSectionItems = (column) => column.map(({ name, type }) => {
    const SectionItem = type === SECTION_ITEM_TYPES.FIELD
      ? FORM_FIELDS[getFieldUIType(name)]
      : Header;

    return <SectionItem fieldName={name} key={name} />;
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
