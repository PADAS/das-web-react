import React, { memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import DateTimePicker from 'react-datetime-picker';
import { Button, Popover, OverlayTrigger, Overlay } from 'react-bootstrap';
import Form from "react-jsonschema-form";

import draft4JsonSchema from 'ajv/lib/refs/json-schema-draft-04.json';

import PriorityPicker from '../PriorityPicker';


import { getReportFormSchemaData } from '../selectors';
import { unwrapEventDetailSelectValues } from '../utils/event-schemas';
import { displayTitleForEventByEventType } from '../utils/events';
import { calcGpsDisplayString } from '../utils/location';
import { DATEPICKER_DEFAULT_CONFIG } from '../constants';
import { setModalVisibilityState } from '../ducks/modals';

import ReportedBySelect from '../ReportedBySelect';
import MapLocationPicker from '../MapLocationPicker';
import EventIcon from '../EventIcon';
import InlineEditable from '../InlineEditable';
import GpsInput from '../GpsInput';
import HamburgerMenuIcon from '../HamburgerMenuIcon';

import styles from './styles.module.scss';

const ReportForm = memo((props) => {
  const { eventTypes, gpsFormat, map, report: originalReport, schema, uiSchema, setModalVisibilityState } = props;
  const additionalMetaSchemas = [draft4JsonSchema];

  const formRef = useRef(null);
  const gpsInputAnchorRef = useRef(null);
  const gpsInputLabelRef = useRef(null);

  const [report, updateStateReport] = useState(originalReport);
  const reportLocation = !!report.location ? [report.location.longitude, report.location.latitude] : null;

  const [headerPopoverOpen, setHeaderPopoverState] = useState(false);
  const [gpsPopoverOpen, setGpsPopoverState] = useState(false);

  const { is_collection } = report;

  const reportTitle = displayTitleForEventByEventType(report, eventTypes);

  const onLocationSelectFromMapStart = () => {
    setModalVisibilityState(false);
  };

  const onLocationSelectFromMap = (event) => {
    console.log('click event', event);
    const { lngLat: { lat, lng } } = event;
    onReportLocationChange([lng, lat]);
    setModalVisibilityState(true);
    setGpsPopoverState(false);
  };

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

  const onReportLocationChange = location => updateStateReport({
    ...report,
    location: !!location
      ? {
        latitude: location[1],
        longitude: location[0],
      } : location,
  });

  /* updated report location falls outside the normal state lifecycle due to the minor mathematical drifts that occur between parsing a location in string format and in LngLat format. 
    we store the value here to prevent a recalculation loop, as the GpsInput component otherwise receives a location, parses a string, parses that string back to LngLat and erroneously detects a "change",
    updates the value here, which is updated in the model, passed back back down...rinse and repeat ad infinitum.
  */
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
      <label ref={gpsInputLabelRef}>
        Location:
        <Overlay shouldUpdatePosition={true} show={gpsPopoverOpen} target={gpsInputAnchorRef.current} rootClose onHide={() => setGpsPopoverState(false)} container={gpsInputLabelRef.current}>
          {props => <Popover placement='bottom' className={`${styles.popover} ${styles.gpsPopover}`}>
            <GpsInput onValidChange={onReportLocationChange} lngLat={reportLocation} />
            <MapLocationPicker map={map} onLocationSelectStart={onLocationSelectFromMapStart} onLocationSelect={onLocationSelectFromMap} />
          </Popover>}
        </Overlay>
        <a href="#" onClick={() => setGpsPopoverState(!gpsPopoverOpen)} className={styles.locationAnchor} ref={gpsInputAnchorRef}>
          {reportLocation ? calcGpsDisplayString(reportLocation[1], reportLocation[0], gpsFormat) : 'Click here to set location'}
        </a>
      </label>
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
  gpsFormat: state.view.userPreferences.gpsFormat,
  eventTypes: state.data.eventTypes,
  ...getReportFormSchemaData(state, props),
})

export default connect(mapStateToProps, { setModalVisibilityState })(ReportForm);

ReportForm.propTypes = {
  report: PropTypes.object.isRequired,
};

ReportForm.whyDidYouRender = true;