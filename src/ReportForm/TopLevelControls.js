import React, { memo, useEffect, useMemo } from 'react';
import { useDispatch } from 'react-redux';

import { ReactComponent as ClockIcon } from '../common/images/icons/clock-icon.svg';
import { ReactComponent as PersonIcon } from '../common/images/icons/person-icon.svg';

import { DATEPICKER_DEFAULT_CONFIG } from '../constants';
import { setMapLocationSelectionEvent } from '../ducks/map-ui';

import DatePicker from '../DatePicker';
import LocationSelectorInput from '../EditableItem/LocationSelectorInput';
import ReportedBySelect from '../ReportedBySelect';

import styles from './styles.module.scss';

const ReportFormTopLevelControls = ({
  readonly,
  onReportDateChange,
  menuContainerRef,
  onReportedByChange,
  onReportLocationChange,
  report,
}) => {
  const dispatch = useDispatch();

  const reportLocation = useMemo(() => !!report.location ? [report.location.longitude, report.location.latitude] : null, [report.location]);
  const canShowReportedBy = useMemo(() => report.provenance !== 'analyzer', [report.provenance]);

  useEffect(() => {
    dispatch(setMapLocationSelectionEvent(report));
  }, [dispatch, report]);

  return <div className={`${styles.reportControls} ${readonly ? styles.readonly : ''}`}>
    {canShowReportedBy && <label>
      <PersonIcon className={`${styles.icon} ${styles.iconFill}`} />
      <span>Reported by:</span>
      <ReportedBySelect value={report.reported_by} onChange={onReportedByChange} menuRef={menuContainerRef} />
    </label>}

    <label>
      <ClockIcon className={styles.icon} />
      <span>Report time:</span>
      <DatePicker
        {...DATEPICKER_DEFAULT_CONFIG}
        showTimeInput
        value={report.time ? new Date(report.time) : null}
        placement='bottom'
        className={styles.datePopoverInput}
        popperClassName={styles.datePopover}
        required={true}
        maxDate={new Date()}
        onChange={onReportDateChange}
        disableCustomInput={true}
      />
    </label>

    <LocationSelectorInput location={reportLocation} onLocationChange={onReportLocationChange} />
  </div>;
};

export default memo(ReportFormTopLevelControls);
