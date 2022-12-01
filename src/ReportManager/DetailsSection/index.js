import React, { memo, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import ReportedBySelect from '../../ReportedBySelect';

import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import { calcGeometryTypeForReport } from '../../utils/events';
import { setMapLocationSelectionEvent } from '../../ducks/map-ui';
import { VALID_EVENT_GEOMETRY_TYPES } from '../../constants';

import AreaSelectorInput from './AreaSelectorInput';
import LocationSelectorInput from '../../EditableItem/LocationSelectorInput';
import PrioritySelect from '../../PrioritySelect';

import styles from './styles.module.scss';

const DetailsSection = ({
  onReportedByChange,
  onReportGeometryChange,
  onReportLocationChange,
  originalReport,
  reportForm,
  onPriorityChange
}) => {
  const dispatch = useDispatch();

  const eventTypes = useSelector((state) => state.data.eventTypes);

  const geometryType = useMemo(() => calcGeometryTypeForReport(reportForm, eventTypes), [eventTypes, reportForm]);

  const reportLocation = useMemo(
    () => !!reportForm.location ? [reportForm.location.longitude, reportForm.location.latitude] : null,
    [reportForm.location]
  );

  useEffect(() => {
    dispatch(setMapLocationSelectionEvent(reportForm));
  }, [dispatch, reportForm]);

  return <>
    <div className={styles.sectionHeader}>
      <div className={styles.title}>
        <PencilWritingIcon />

        <h2>Details</h2>
      </div>
    </div>

    <div className={styles.container}>
      <div className={styles.row}>
        <label data-testid="reportManager-reportedBySelect" className={styles.fieldLabel}>
          Reported By
          <ReportedBySelect onChange={onReportedByChange} value={reportForm?.reported_by} />
        </label>
        <label data-testid="reportManager-prioritySelector" className={styles.fieldLabel}>
          Priority
          <PrioritySelect onChange={onPriorityChange} priority={reportForm?.priority} />
        </label>
      </div>

      <div className={styles.row}>
        <label data-testid="reportManager-reportLocationSelect" className={styles.fieldLabel}>
          Report location
          {geometryType === VALID_EVENT_GEOMETRY_TYPES.POLYGON
              ? <AreaSelectorInput
                  event={reportForm}
                  originalEvent={originalReport}
                  onGeometryChange={onReportGeometryChange}
              />
              : <LocationSelectorInput
                  label={null}
                  location={reportLocation}
                  onLocationChange={onReportLocationChange}
              />
          }
        </label>
      </div>
    </div>
  </>;
};

DetailsSection.propTypes = {
  onPriorityChange: PropTypes.func.isRequired,
  onReportedByChange: PropTypes.func.isRequired,
  onReportGeometryChange: PropTypes.func.isRequired,
  onReportLocationChange: PropTypes.func.isRequired,
  originalReport: PropTypes.object.isRequired,
  reportForm: PropTypes.object.isRequired
};

export default memo(DetailsSection);
