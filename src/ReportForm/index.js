import React, { memo, useState, useRef } from 'react';

import { Button, Popover, OverlayTrigger } from 'react-bootstrap';

import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Form from "react-jsonschema-form";

import draft4JsonSchema from 'ajv/lib/refs/json-schema-draft-04.json';

import PriorityPicker from '../PriorityPicker';


import { getReportFormSchemaData } from '../selectors';
import { unwrapEventDetailSelectValues } from '../utils/event-schemas';
import { displayTitleForEventByEventType } from '../utils/events';

import InlineEditable from '../InlineEditable';
import HamburgerMenuIcon from '../HamburgerMenuIcon';

import styles from './styles.module.scss';

const ReportFormMeta = memo((props) => {
  const { eventTypes, report: originalReport, schema, uiSchema } = props;
  const additionalMetaSchemas = [draft4JsonSchema];

  const formRef = useRef(null);

  const [report, updateStateReport] = useState(originalReport);
  const [headerPopoverOpen, setHeaderPopoverState] = useState(false);

  const reportTitle = displayTitleForEventByEventType(report, eventTypes);

  const calcClassNameForPriority = (priority) => {
    if (priority === 300) return 'highPriority';
    if (priority === 200) return 'mediumPriority';
    if (priority === 100) return 'lowPriority';
    return 'noPriority';
  }


  const onReportTitleChange = title => updateStateReport({
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

  const onPrioritySelect = priority => updateStateReport({
    ...report,
    priority,
  });

  const handleFormSubmit = formData => console.log('formdata', formData);

  const ReportHeaderPopover = <Popover>
    <PriorityPicker selected={report.priority} onSelect={onPrioritySelect} />
  </Popover>;

  // const formData = unwrapEventDetailSelectValues(report.event_details);

  return <div className={styles.wrapper}>
    <div className={`${styles.formHeader} ${styles[calcClassNameForPriority(report.priority)]}`}>
      <h4>
        Report: {report.serial_number} <InlineEditable value={reportTitle} onSave={onReportTitleChange} />
      </h4>
      <OverlayTrigger onExiting={() =>setHeaderPopoverState(false)} placement='bottom-start' rootClose trigger='click' overlay={ReportHeaderPopover}>
        <HamburgerMenuIcon isOpen={headerPopoverOpen} onClick={() => setHeaderPopoverState(!headerPopoverOpen)} />
      </OverlayTrigger>

    </div>
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
    >
      <div className={styles.formButtons}>
        <Button type="button" variant="secondary">Cancel</Button>
        <Button type="submit" variant="primary">Submit</Button>
      </div>
    </Form>
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