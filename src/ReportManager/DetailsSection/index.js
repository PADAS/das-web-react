import React, { memo, useEffect, useMemo } from 'react';
import Dropdown from 'react-bootstrap/Dropdown';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';

import ReportedBySelect from '../../ReportedBySelect';

import { ReactComponent as PencilWritingIcon } from '../../common/images/icons/pencil-writing.svg';

import { calcGeometryTypeForReport } from '../../utils/events';
import { setMapLocationSelectionEvent } from '../../ducks/map-ui';
import { EVENT_FORM_STATES, VALID_EVENT_GEOMETRY_TYPES } from '../../constants';

import AreaSelectorInput from './AreaSelectorInput';
import LocationSelectorInput from '../../EditableItem/LocationSelectorInput';

import styles from './styles.module.scss';

const DetailsSection = ({
  onReportedByChange,
  onReportGeometryChange,
  onReportLocationChange,
  onReportStateChange,
  originalReport,
  reportForm,
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

      <div>
        <Dropdown className={`${styles.stateDropdown} ${styles[reportForm.state]}`} onSelect={onReportStateChange}>
          <Dropdown.Toggle variant="success" id="dropdown-basic">
            {`${reportForm.state.charAt(0).toUpperCase()}${reportForm.state.slice(1)}`}
          </Dropdown.Toggle>

          <Dropdown.Menu className={styles.stateDropdownMenu}>
            {Object.values(EVENT_FORM_STATES)
              .map((eventState) => <Dropdown.Item
                className={styles.stateItem}
                eventKey={eventState.toLowerCase()}
                key={eventState}
              >
                {eventState}
              </Dropdown.Item>)}
          </Dropdown.Menu>
        </Dropdown>
      </div>
    </div>

    <table className={styles.fieldsTable}>
      <tbody>
        <tr>
          <th className={styles.fieldsColumn}>
            <label data-testid="reportManager-reportedBySelect" className={styles.fieldLabel}>
              Reported By
              <ReportedBySelect onChange={onReportedByChange} value={reportForm?.reported_by} />
            </label>
          </th>

          <th></th>
        </tr>

        <tr>
          <th>
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
          </th>

          <th></th>
        </tr>
      </tbody>
    </table>
  </>;
};

DetailsSection.propTypes = {
  onReportedByChange: PropTypes.func.isRequired,
  onReportGeometryChange: PropTypes.func.isRequired,
  onReportLocationChange: PropTypes.func.isRequired,
  originalReport: PropTypes.object.isRequired,
  reportForm: PropTypes.object.isRequired,
};

export default memo(DetailsSection);
