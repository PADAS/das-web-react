import React, { memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { Popover, Overlay } from 'react-bootstrap';

import DateTimePicker from 'react-datetime-picker';
import GpsInput from '../GpsInput';
import MapLocationPicker from '../MapLocationPicker';
import ReportedBySelect from '../ReportedBySelect';

import { setModalVisibilityState } from '../ducks/modals';
import {  updateUserPreferences } from '../ducks/user-preferences';
import { DATEPICKER_DEFAULT_CONFIG } from '../constants';
import { calcGpsDisplayString } from '../utils/location';

import styles from './styles.module.scss';

const ReportFormTopLevelControls = memo((props) => {
  const { gpsFormat, map, onReportDateChange, onReportedByChange, onReportLocationChange, report, setModalVisibilityState, updateUserPreferences } = props;
  const reportLocation = !!report.location ? [report.location.longitude, report.location.latitude] : null;
  
  const [gpsPopoverOpen, setGpsPopoverState] = useState(false);

  const gpsInputAnchorRef = useRef(null);
  const gpsInputLabelRef = useRef(null);

  const onLocationSelectFromMapStart = () => {
    setModalVisibilityState(false);
    updateUserPreferences({ sidebarOpen: false });
  };
  
  const onLocationSelectFromMapCancel = () => {
    setModalVisibilityState(true);
  };

  const onLocationSelectFromMap = (event) => {
    const { lngLat: { lat, lng } } = event;
    onReportLocationChange([lng, lat]);
    setModalVisibilityState(true);
    setGpsPopoverState(false);
  };

  return <div className={styles.reportControls}>
    <label>
      <span>Reported by:</span>
      <ReportedBySelect value={report.reported_by} onChange={onReportedByChange} />
    </label>
    <label>
      <span>Report time:</span>
      <DateTimePicker
        {...DATEPICKER_DEFAULT_CONFIG}
        clearIcon={null}
        required={true}
        value={report.time ? new Date(report.time) : null}
        maxDate={new Date()}
        onChange={onReportDateChange} />
    </label>
    <label ref={gpsInputLabelRef}>
      <span>Location:</span>
      <Overlay shouldUpdatePosition={true} show={gpsPopoverOpen} target={gpsInputAnchorRef.current} rootClose onHide={() => setGpsPopoverState(false)} container={gpsInputLabelRef.current}>
        {() => <Popover placement='bottom' className={`${styles.popover} ${styles.gpsPopover}`}>
          <GpsInput onValidChange={onReportLocationChange} lngLat={reportLocation} />
          <MapLocationPicker map={map} onLocationSelectStart={onLocationSelectFromMapStart} onLocationSelectCancel={onLocationSelectFromMapCancel} onLocationSelect={onLocationSelectFromMap} />
        </Popover>}
      </Overlay>
      <a href="#" onClick={() => setGpsPopoverState(!gpsPopoverOpen)} className={styles.locationAnchor} ref={gpsInputAnchorRef}>
        {reportLocation ? calcGpsDisplayString(reportLocation[1], reportLocation[0], gpsFormat) : 'Click here to set location'}
      </a>
    </label>
  </div>;
});

const mapStateToProps = ({ view: { userPreferences: { gpsFormat } } }, props) => ({
  gpsFormat
});


export default connect(mapStateToProps, { setModalVisibilityState, updateUserPreferences })(ReportFormTopLevelControls);