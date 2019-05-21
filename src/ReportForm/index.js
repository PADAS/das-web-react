import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Form from "react-jsonschema-form";

import { unwrapFormDataSelectValues } from '../utils/event-schemas';

const ReportForm = memo((props) => {
  const { schema, formData } = props;

  if (!schema) return null;

  const data = unwrapFormDataSelectValues(formData);

  return <Form schema={schema} formData={data} />;

});

const mapStateToProps = ({ data: { eventSchemas } }, ownProps) => {
  console.log('event schemas are', eventSchemas);
  return {
    schema: eventSchemas[ownProps.eventType],
    globalSchema: eventSchemas.globalSchema };
};

export default connect(mapStateToProps, null)(ReportForm);

ReportForm.defaultProps = {
  formData: {},
};

ReportForm.propTypes = {
  eventType: PropTypes.string.isRequired,
  formData: PropTypes.object,
};