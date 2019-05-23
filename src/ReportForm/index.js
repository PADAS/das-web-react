import React, { memo, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Form from "react-jsonschema-form";

import additionalMetaSchemas from 'ajv/lib/refs/json-schema-draft-04.json';

import { unwrapEventDetailSelectValues } from '../utils/event-schemas';

const ReportForm = memo((props) => {
  const { schema, uiSchema, formData } = props;

  if (!schema) return null;

  const formRef = useRef(null);
  const data = unwrapEventDetailSelectValues(formData);

  return <Form uiSchema={uiSchema} ref={formRef} additionalMetaSchemas={[additionalMetaSchemas]} schema={schema} formData={data}>
  </Form>;

});

const mapStateToProps = ({ data: { eventSchemas } }, ownProps) => ({
  schema: eventSchemas[ownProps.eventType].schema,
  uiSchema: eventSchemas[ownProps.eventType].uiSchema,
  globalSchema: eventSchemas.globalSchema,
});

export default connect(mapStateToProps, null)(ReportForm);

ReportForm.defaultProps = {
  formData: {},
};

ReportForm.propTypes = {
  eventType: PropTypes.string.isRequired,
  formData: PropTypes.object,
};