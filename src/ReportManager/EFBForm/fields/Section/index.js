import React, { useContext } from 'react';
import { FormSchemaContext } from '../../FormSchemaContext';
import Header from '../Header';
import Text from '../Text';

const SECTION_ITEM_TYPES = {
  HEADER: 'header',
  FIELD: 'field'
};

const FORM_FIELDS = {
  'TEXT': Text
};

const Section = ({ id }) => {
  const { getSectionProps, getFieldProps, getHeaderProps } = useContext(FormSchemaContext);
  const sectionProps = getSectionProps(id);

  const renderColumnSectionItems = (column) => column.map(({ name, type }) => {
    const isFieldType = type === SECTION_ITEM_TYPES.FIELD;
    const itemProps = isFieldType
      ? getFieldProps(name)
      : getHeaderProps(name);

    const SectionItem = isFieldType
      ? FORM_FIELDS[itemProps.ui.type]
      : Header;

    return <SectionItem {...itemProps} name={name} key={name} />;
  });

  return <div>

    <div> {/*left column*/}
      {
        renderColumnSectionItems(sectionProps.leftColumn)
      }
    </div>

  </div>;
};

export default Section;
