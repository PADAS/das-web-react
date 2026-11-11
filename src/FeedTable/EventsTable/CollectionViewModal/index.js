import { useMemo } from 'react';
import Modal from 'react-bootstrap/Modal';
import omit from 'lodash/omit';

import SchemaForm from '../../../SchemaForm';

const SECTION_ID = 'collectionViewModalSection';

// The event type's schema cut down to one field, so the form shows only it.
const schemaWithOnlyField = (schema, fieldName) => {
  const property = schema.json.properties?.[fieldName]
    ?? schema.json.allOf?.find((subschema) => subschema.then?.properties?.[fieldName])?.then.properties[fieldName];

  return {
    json: { ...omit(schema.json, 'allOf'), properties: { [fieldName]: property }, required: [] },
    ui: {
      ...schema.ui,
      order: [SECTION_ID],
      sections: {
        [SECTION_ID]: {
          columns: 1,
          isActive: true,
          label: '',
          leftColumn: [{ name: fieldName, type: 'field' }],
          rightColumn: [],
        },
      },
    },
  };
};

const CollectionViewModal = ({ fieldName, schema, title, value }) => {
  const fieldSchema = useMemo(() => schemaWithOnlyField(schema, fieldName), [fieldName, schema]);

  return <>
    <Modal.Header closeButton>
      <Modal.Title>{title}</Modal.Title>
    </Modal.Header>

    <Modal.Body>
      <SchemaForm as="div" formData={{ [fieldName]: value }} hideMapLocationMarkers readOnly schema={fieldSchema} />
    </Modal.Body>
  </>;
};

export default CollectionViewModal;
