import React, { memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DateTimePicker from 'react-datetime-picker';
import { Button, Popover, OverlayTrigger } from 'react-bootstrap';
import Form from "react-jsonschema-form";

import draft4JsonSchema from 'ajv/lib/refs/json-schema-draft-04.json';

import PriorityPicker from '../PriorityPicker';


import { getReportFormSchemaData } from '../selectors';
import { unwrapEventDetailSelectValues } from '../utils/event-schemas';
import { displayTitleForEventByEventType } from '../utils/events';
import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

import ReportedBySelect from '../ReportedBySelect';
import EventIcon from '../EventIcon';
import InlineEditable from '../InlineEditable';
import GpsInput from '../GpsInput';
import HamburgerMenuIcon from '../HamburgerMenuIcon';

import styles from './styles.module.scss';

const ReportForm = memo((props) => {
  const { eventTypes, report: originalReport, schema, uiSchema } = props;
  const additionalMetaSchemas = [draft4JsonSchema];

  const formRef = useRef(null);

  const [report, updateStateReport] = useState(originalReport);
  const reportLocation = !!report.location ? [report.location.longitude, report.location.latitude] : null;

  const [newReportLocation, setNewReportLocation] = useState(reportLocation);
  const [headerPopoverOpen, setHeaderPopoverState] = useState(false);

  const { is_collection } = report;

  const reportTitle = displayTitleForEventByEventType(report, eventTypes);


  const calcClassNameForPriority = (priority) => {
    if (priority === 300) return 'highPriority';
    if (priority === 200) return 'mediumPriority';
    if (priority === 100) return 'lowPriority';
    return 'noPriority';
  };

  const onReportedByChange = (selection) => updateStateReport({
    ...report,
    reported_by: selection ? selection.id : null,
  });

  const onReportDateChange = date => updateStateReport({
    ...report,
    time: date.toISOString(),
  });


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

  /* updated report location falls outside the normal state lifecycle due to the minor mathematical drifts that occur between parsing a location in string format and in LngLat format. 
    we store the value here to prevent a recalculation loop, as the GpsInput component otherwise receives a location, parses a string, parses that string back to LngLat and erroneously detects a "change",
    updates the value here, which is updated in the model, passed back back down...rinse and repeat ad infinitum.
  */
  const updateReportLocation = location => setNewReportLocation(location);

  const handleFormSubmit = formData => console.log('formdata', formData);

  const ReportHeaderPopover = <Popover className={styles.popover}>
    <PriorityPicker selected={report.priority} onSelect={onPrioritySelect} />
  </Popover>;

  return <div className={styles.wrapper}>
    <div className={`${styles.formHeader} ${styles[calcClassNameForPriority(report.priority)]}`}>
      <h4>
        <EventIcon className={styles.icon} iconId={report.icon_id} />
        {report.serial_number}:
        <InlineEditable value={reportTitle} onSave={onReportTitleChange} />
      </h4>
      <OverlayTrigger onExiting={() => setHeaderPopoverState(false)} placement='bottom-start' rootClose trigger='click' overlay={ReportHeaderPopover}>
        <HamburgerMenuIcon isOpen={headerPopoverOpen} onClick={() => setHeaderPopoverState(!headerPopoverOpen)} />
      </OverlayTrigger>

    </div>
    {!is_collection && <div className={styles.reportControls}>
      <label>
        Reported by:
        <ReportedBySelect value={report.reported_by} onChange={onReportedByChange} />
      </label>
      <label>
        Report time:
        <DateTimePicker
          {...DATEPICKER_DEFAULT_CONFIG}
          clearIcon={null}
          required={true}
          value={report.time ? new Date(report.time) : null}
          maxDate={new Date()}
          onChange={onReportDateChange} />
      </label>
      <GpsInput onValidChange={updateReportLocation} lngLat={reportLocation} />
    </div>}
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

export default connect(mapStateToProps, null)(ReportForm);

ReportForm.propTypes = {
  report: PropTypes.object.isRequired,
};

ReportForm.whyDidYouRender = true;