import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Form from "react-jsonschema-form";

import additionalMetaSchemas from 'ajv/lib/refs/json-schema-draft-04.json';

import { unwrapEventDetailSelectValues } from '../utils/event-schemas';

const ReportForm = memo((props) => {
  const { schema, formData } = props;

  if (!schema) return null;

  const data = unwrapEventDetailSelectValues(formData);

  return <Form additionalMetaSchemas={[additionalMetaSchemas]} schema={schema} formData={data}>
    {/* <h2>She's a grand old flag she's a high-flying flag</h2> */}
  </Form>;

});

const mapStateToProps = ({ data: { eventSchemas } }, ownProps) => ({
  schema: eventSchemas[ownProps.eventType],
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