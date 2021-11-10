import React, { memo, useMemo } from 'react';
import { connect } from 'react-redux';

import DateTimePickerPopover from '../DateTimePickerPopover';
import ReportedBySelect from '../ReportedBySelect';

import LocationSelectorInput from '../EditableItem/LocationSelectorInput'; // <LocationSelectorInput map={map} location={patrolStartLocation} onLocationChange={val => console.log('i am a new man with a new value', val)} />

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';

import { ReactComponent as PersonIcon } from '../common/images/icons/person-icon.svg';
import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';

import styles from './styles.module.scss';

const ReportFormTopLevelControls = (props) => {
  const { map, readonly, onReportDateChange, menuContainerRef, onReportedByChange, onReportLocationChange, report } = props;

  const reportLocation = useMemo(() => !!report.location ? [report.location.longitude, report.location.latitude] : null, [report.location]);
  const canShowReportedBy = useMemo(() => report.provenance !== 'analyzer', [report.provenance]);


  return <div className={`${styles.reportControls} ${readonly ? styles.readonly : ''}`}>
    {canShowReportedBy && <label>
      <PersonIcon className={`${styles.icon} ${styles.iconFill}`} />
      <span>Reported by:</span>
      <ReportedBySelect value={report.reported_by} onChange={onReportedByChange} menuRef={menuContainerRef} />
    </label>}
    <label>
      <ClockIcon className={styles.icon} />
      <span>Report time:</span>
      <DateTimePickerPopover
        {...DATEPICKER_DEFAULT_CONFIG}
        clearIcon={null}
        value={report.time ? new Date(report.time) : null}
        placement='bottom'
        popoverClassName={styles.datePopover}
        required={true}
        maxDate={new Date()}
        onChange={onReportDateChange}  />
    </label>
    <LocationSelectorInput map={map} location={reportLocation} onLocationChange={onReportLocationChange} />
  </div>;
};

const mapStateToProps = ({ view: { showUserLocation, userPreferences: { gpsFormat } } }) => ({
  gpsFormat,
  showUserLocation,
});


export default connect(mapStateToProps, null)(
  memo(
    ReportFormTopLevelControls
  )
);