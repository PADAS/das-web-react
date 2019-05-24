import React, { memo } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Form, Button } from 'react-bootstrap';

import { unwrapEventDetailSelectValues } from '../utils/event-schemas';

import FormContent from './FormContent';

const { Group, Label, Control, Text } = Form;

const ReportFormMeta = memo((props) => {
  const { schema, uiSchema, report } = props;

  const handleFormSubmit = formData => console.log('formdata', formData);

  const formData = unwrapEventDetailSelectValues(report.event_details);

  return <Form>
    <FormContent onSubmit={handleFormSubmit} schema={schema} uiSchema={uiSchema} formData={formData} />
  </Form>
});

const mapStateToProps = ({ data: { eventSchemas } }, { report }) => ({
  schema: eventSchemas[report.event_type].schema,
  uiSchema: eventSchemas[report.event_type].uiSchema,
  globalSchema: eventSchemas.globalSchema,
});

export default connect(mapStateToProps, null)(ReportFormMeta);

ReportFormMeta.propTypes = {
  report: PropTypes.object.isRequired,
};