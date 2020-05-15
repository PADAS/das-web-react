import React, { memo, useCallback, useEffect, useState, useRef } from 'react';
import { connect } from 'react-redux';
import Overlay from 'react-bootstrap/Overlay';
import Popover from 'react-bootstrap/Popover';

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
import { trackEvent } from '../utils/analytics';

const ReportFormTopLevelControls = (props) => {
  const { gpsFormat, showUserLocation, map, onReportDateChange, menuContainerRef, onReportedByChange, onReportLocationChange, report, setModalVisibilityState, updateUserPreferences } = props;
  const reportLocation = !!report.location ? [report.location.longitude, report.location.latitude] : null;

  const [gpsPopoverOpen, setGpsPopoverState] = useState(false);
  const [temporaryCalendarProps, setTemporaryCalendarProps] = useState({});
  const canShowReportedBy = report.provenance !== 'analyzer';
  
  const gpsInputAnchorRef = useRef(null);
  const gpsInputLabelRef = useRef(null);
  const testRef = useRef(null);

  const handleCalendarOpen = useCallback(() => {
    setTemporaryCalendarProps({
      isCalendarOpen: true,
      onBlur() {
        setTemporaryCalendarProps({
        });
      },
    });
  }, []);
  

  const handleGpsInputKeydown = (event) => {
    const { key } = event;
    if (key === 'Enter') {
      setGpsPopoverState(false);
    }
  };

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (testRef.current && !testRef.current.contains(e.target)) {
        setGpsPopoverState(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []); 

  const onLocationSelectFromMapStart = () => {
    setModalVisibilityState(false);
    updateUserPreferences({ sidebarOpen: false });
  };
  
  const onLocationSelectFromMapCancel = () => {
    setModalVisibilityState(true);
  };

  const onGeoLocationStart = () => {
    trackEvent('Event Report', 'Click \'Use My Location\'');
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

  const handleEscapePress = (event) => {
    const { key } = event;
    if (key === 'Escape' 
    && (gpsPopoverOpen || temporaryCalendarProps.isCalendarOpen)) {
      event.preventDefault();
      event.stopPropagation();
      setGpsPopoverState(false);
      setTemporaryCalendarProps({});
    }
  };

  return <div className={styles.reportControls} onKeyDown={handleEscapePress}>
    {canShowReportedBy && <label>
      <PersonIcon className={`${styles.icon} ${styles.iconFill}`} />
      <span>Reported by:</span>
      <ReportedBySelect value={report.reported_by} onChange={onReportedByChange} menuRef={menuContainerRef} />
    </label>}
    <label>
      <ClockIcon className={styles.icon} />
      <span>Report time:</span>
      <DateTimePicker
        {...DATEPICKER_DEFAULT_CONFIG}
        onCalendarOpen={handleCalendarOpen}
        clearIcon={null}
        required={true}
        value={report.time ? new Date(report.time) : null}
        maxDate={new Date()}
        onChange={onReportDateChange} 
        {...temporaryCalendarProps} />
    </label>
    <label ref={gpsInputLabelRef}>
      <LocationIcon className={styles.icon} />
      <span>Location:</span>
      <Overlay shouldUpdatePosition={true} show={gpsPopoverOpen} target={gpsInputAnchorRef.current} rootClose onHide={() => setGpsPopoverState(false)} container={gpsInputLabelRef.current}>
        {() => <Popover placement='bottom' className={`${styles.popover} ${styles.gpsPopover}`}>
          <div ref={testRef}>
            <GpsInput onValidChange={onReportLocationChange} lngLat={reportLocation} onKeyDown={handleGpsInputKeydown} />
            <div className={styles.locationButtons}>
              <MapLocationPicker map={map} onLocationSelectStart={onLocationSelectFromMapStart} onLocationSelectCancel={onLocationSelectFromMapCancel} onLocationSelect={onLocationSelectFromMap} />
              {!!showUserLocation && <GeoLocator className={styles.geoLocator} onStart={onGeoLocationStart} onSuccess={onGeoLocationSuccess} />}
            </div>
          </div>
        </Popover>}
      </Overlay>
      <a href="#" onClick={() => setGpsPopoverState(!gpsPopoverOpen)} className={styles.locationAnchor} ref={gpsInputAnchorRef}> {/* eslint-disable-line */}
        {reportLocation ? calcGpsDisplayString(reportLocation[1], reportLocation[0], gpsFormat) : 'Click here to set location'}
      </a>
    </label>
  </div>;
};

const mapStateToProps = ({ view: { showUserLocation, userPreferences: { gpsFormat } } }) => ({
  gpsFormat,
  showUserLocation,
});


export default connect(mapStateToProps, { setModalVisibilityState, updateUserPreferences })(memo(ReportFormTopLevelControls));