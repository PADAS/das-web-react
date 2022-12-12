import React, { memo, useCallback, useEffect, useMemo } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import { customizeValidator } from '@rjsf/validator-ajv6';
import Form from '@rjsf/bootstrap-4';
import metaSchemaDraft04 from 'ajv/lib/refs/json-schema-draft-04.json';
import PropTypes from 'prop-types';
import { ResizeSpinLoader } from 'react-css-loaders';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowIntoIcon } from '../../../common/images/icons/arrow-into.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';

import { fetchEvent } from '../../../ducks/events';
import { getSchemasForEventTypeByEventId } from '../../../utils/event-schemas';
import { TAB_KEYS } from '../../../constants';
import useNavigate from '../../../hooks/useNavigate';
import useReport from '../../../hooks/useReport';

import DateTime from '../../../DateTime';
import EventIcon from '../../../EventIcon';
import ItemActionButton from '../ItemActionButton';

import styles from '../styles.module.scss';

const formValidator = customizeValidator({ additionalMetaSchemas: [metaSchemaDraft04] });

const LOADER_COLOR = '#006cd9'; // Bright blue
const LOADER_SIZE = 4;

const ReportListItem = ({ cardsExpanded, onCollapse, onExpand, report }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { displayPriority, displayTitle, eventTypeTitle } = useReport(report);

  const eventSchemas = useSelector((state) => state.data.eventSchemas);
  const reportFromEventStore = useSelector((state) => state.data.eventStore[report.id]);

  const isOpen = useMemo(() => cardsExpanded.includes(report), [cardsExpanded, report]);

  // TODO: This is undefined, eventSchemas is always empty
  const reportSchemas = reportFromEventStore
    ? getSchemasForEventTypeByEventId(eventSchemas, reportFromEventStore.event_type, reportFromEventStore.id)
    : null;

  const onClickArrowIntoIcon = useCallback(() => navigate(`/${TAB_KEYS.REPORTS}/${report.id}`), [navigate, report]);

  useEffect(() => {
    if (!reportFromEventStore) {
      dispatch(fetchEvent(report.id));
    }
  }, [dispatch, report.id, reportFromEventStore]);

  console.log(reportSchemas?.schema);

  return <li>
    <div className={`${styles.itemRow} ${styles.collapseRow}`} onClick={isOpen ? onCollapse: onExpand}>
      <div className={`${styles.itemIcon} ${styles[`priority-${displayPriority}`]}`}>
        <EventIcon report={report} />
      </div>

      <div className={styles.itemDetails}>
        <div className={styles.reportDetail}>
          <p className={styles.serialNumber}>{report.serial_number}</p>

          <p
            className={styles.itemTitle}
            data-testid={`reportManager-activitySection-noteTitle-${report.id}`}
          >
            {displayTitle}
          </p>
        </div>

        <DateTime
          className={styles.itemDate}
          data-testid={`reportManager-activitySection-dateTime-${report.id}`}
          date={report.time}
          showElapsed={false}
        />
      </div>

      <div className={styles.itemActionButtonContainer}>
        {!!reportFromEventStore && <ItemActionButton onClick={onClickArrowIntoIcon} tooltip="Go to report">
          <ArrowIntoIcon data-testid={`reportManager-activitySection-arrowIntoIcon-${report.id}`} />
        </ItemActionButton>}
      </div>

      <div className={styles.itemActionButtonContainer}>
        <ItemActionButton>
          {isOpen
            ? <ArrowUpSimpleIcon />
            : <ArrowDownSimpleIcon />}
        </ItemActionButton>
      </div>
    </div>

    <Collapse
      className={styles.collapse}
      data-testid={`reportManager-activitySection-collapse-${report.id}`}
      in={isOpen}
    >
      {!!reportFromEventStore
        ? <div>
          <label>
            Report Type
            {eventTypeTitle}
          </label>

          <label>
            Reported By
            {reportFromEventStore.reported_by.name}
          </label>

          {reportSchemas?.schema && <Form
            className={styles.form}
            disabled
            formData={report.event_details}
            schema={reportSchemas?.schema}
            showErrorList={false}
            uiSchema={reportSchemas?.uiSchema}
            validator={formValidator}
          />}
        </div>
        : <ResizeSpinLoader color={LOADER_COLOR} size={LOADER_SIZE} />}
    </Collapse>
  </li>;
};

ReportListItem.defaultProps = {};

ReportListItem.propTypes = {};

export default memo(ReportListItem);
