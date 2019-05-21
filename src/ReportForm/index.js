import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Form from "react-jsonschema-form";

const ReportForm = memo((props) => {
  const { globalSchema, schema: { schema, definition }, formData } = props;

  const formSchema = { ...globalSchema, schema };


  if (!schema) return null;

  return <Form schema={formSchema} registry={{ definitions: definition }} formData={formData} />;

});

const mapStateToProps = ({ data: { eventSchemas } }, ownProps) => ({ schema: eventSchemas[ownProps.eventType], globalSchema: eventSchemas.globalSchema });

export default connect(mapStateToProps, null)(ReportForm);

ReportForm.defaultProps = {
  formData: {},
};

ReportForm.propTypes = {
  eventType: PropTypes.string.isRequired,
  formData: PropTypes.object,
};