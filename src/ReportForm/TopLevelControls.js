import React, { memo, useState, useRef } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import Popover from 'react-bootstrap/Popover';
import Overlay from 'react-bootstrap/Overlay';

import DateTimePicker from 'react-datetime-picker';
import GpsInput from '../GpsInput';
import MapLocationPicker from '../MapLocationPicker';
import ReportedBySelect from '../ReportedBySelect';
import GeoLocator from '../GeoLocator';

import { setModalVisibilityState } from '../ducks/modals';
import {  updateUserPreferences } from '../ducks/user-preferences';
import { DATEPICKER_DEFAULT_CONFIG } from '../constants';
import { calcGpsDisplayString } from '../utils/location';

import { ReactComponent as LocationIcon } from '../common/images/icons/marker-feed.svg';
import { ReactComponent as PersonIcon } from '../common/images/icons/person-icon.svg';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from './styles.module.scss';

const ReportFormTopLevelControls = memo((props) => {
  const { gpsFormat, map, onReportDateChange, onReportedByChange, onReportLocationChange, report, setModalVisibilityState, updateUserPreferences } = props;
  const reportLocation = !!report.location ? [report.location.longitude, report.location.latitude] : null;

  const [gpsPopoverOpen, setGpsPopoverState] = useState(false);
  const canShowReportedBy = report.provenance !== 'analyzer';

  const gpsInputAnchorRef = useRef(null);
  const gpsInputLabelRef = useRef(null);

  const onLocationSelectFromMapStart = () => {
    setModalVisibilityState(false);
    updateUserPreferences({ sidebarOpen: false });
  };
  
  const onLocationSelectFromMapCancel = () => {
    setModalVisibilityState(true);
  };

  const onGeoLocationSuccess = (coords) => {
    onReportLocationChange([coords.longitude, coords.latitude]);
    setModalVisibilityState(true);
    setGpsPopoverState(false);
  };

  const onLocationSelectFromMap = (event) => {
    const { lngLat: { lat, lng } } = event;
    onReportLocationChange([lng, lat]);
    setModalVisibilityState(true);
    setGpsPopoverState(false);
  };

  return <div className={styles.reportControls}>
    {canShowReportedBy && <label>
      <PersonIcon className={`${styles.icon} ${styles.iconFill}`} />
      <span>Reported by:</span>
      <ReportedBySelect value={report.reported_by} onChange={onReportedByChange} />
    </label>}
    <label>
      <ClockIcon className={styles.icon} />
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
      <LocationIcon className={styles.icon} />
      <span>Location:</span>
      <Overlay shouldUpdatePosition={true} show={gpsPopoverOpen} target={gpsInputAnchorRef.current} rootClose onHide={() => setGpsPopoverState(false)} container={gpsInputLabelRef.current}>
        {() => <Popover placement='bottom' className={`${styles.popover} ${styles.gpsPopover}`}>
          <GpsInput onValidChange={onReportLocationChange} lngLat={reportLocation} />
          <div className={styles.locationButtons}>
            <MapLocationPicker map={map} onLocationSelectStart={onLocationSelectFromMapStart} onLocationSelectCancel={onLocationSelectFromMapCancel} onLocationSelect={onLocationSelectFromMap} />
            <GeoLocator className={styles.geoLocator} onSuccess={onGeoLocationSuccess} />
          </div>
        </Popover>}
      </Overlay>
      <a href="#" onClick={() => setGpsPopoverState(!gpsPopoverOpen)} className={styles.locationAnchor} ref={gpsInputAnchorRef}>
        {reportLocation ? calcGpsDisplayString(reportLocation[1], reportLocation[0], gpsFormat) : 'Click here to set location'}
      </a>
    </label>
  </div>;
});

const mapStateToProps = ({ view: { userPreferences: { gpsFormat } } }) => ({
  gpsFormat
});


export default connect(mapStateToProps, { setModalVisibilityState, updateUserPreferences })(ReportFormTopLevelControls);