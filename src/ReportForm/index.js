import React, { memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Form from "react-jsonschema-form";

import draft4JsonSchema from 'ajv/lib/refs/json-schema-draft-04.json';


import { getReportFormSchemaData } from '../selectors';
import { unwrapEventDetailSelectValues } from '../utils/event-schemas';
import { displayTitleForEventByEventType } from '../utils/events';

import InlineEditable from '../InlineEditable';
import FormContent from './FormContent';

import styles from './styles.module.scss';

const ReportFormMeta = memo((props) => {
  const { eventTypes, report: originalReport, schema, uiSchema } = props;
  const additionalMetaSchemas = [draft4JsonSchema];
  
  const formRef = useRef(null);

  const [report, updateStateReport] = useState(originalReport);

  const reportTitle = displayTitleForEventByEventType(report, eventTypes);


  const onReportTitleChange = (title) => updateStateReport({
    ...report,
    title,
  });

  const onDetailChange = ({ formData }) => updateStateReport({
    ...report,
    event_details: {
      ...report.event_details,
      ...formData,
    },
  });

  const handleFormSubmit = formData => console.log('formdata', formData);

  // const formData = unwrapEventDetailSelectValues(report.event_details);

  return <div>
    <InlineEditable value={reportTitle} onSave={onReportTitleChange} />
    <Form
      additionalMetaSchemas={additionalMetaSchemas}
      className={styles.form}
      formData={unwrapEventDetailSelectValues(report.event_details)}
      ref={formRef}
      schema={schema}
      uiSchema={uiSchema}
      onChange={onDetailChange}
      onSubmit={handleFormSubmit}
      safeRenderCompletion={true}
    />
  </div>;
});

const mapStateToProps = (state, props) => ({
  eventTypes: state.data.eventTypes,
  ...getReportFormSchemaData(state, props),
})

export default connect(mapStateToProps, null)(ReportFormMeta);

ReportFormMeta.propTypes = {
  report: PropTypes.object.isRequired,
};

ReportFormMeta.whyDidYouRender = true;