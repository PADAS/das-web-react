import React, { memo, useCallback, useEffect, useMemo } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import PropTypes from 'prop-types';
import { ResizeSpinLoader } from 'react-css-loaders';
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowIntoIcon } from '../../../common/images/icons/arrow-into.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';

import { fetchEvent } from '../../../ducks/events';
import { fetchEventTypeSchema } from '../../../ducks/event-schemas';
import { getSchemasForEventTypeByEventId } from '../../../utils/event-schemas';
import { TAB_KEYS } from '../../../constants';
import useNavigate from '../../../hooks/useNavigate';

import ItemActionButton from '../ItemActionButton';
import ReportFormSummary from '../../../ReportFormSummary';
import ReportListItem from '../../../ReportListItem';

import activitySectionStyles from '../styles.module.scss';
import styles from './styles.module.scss';

const LOADER_COLOR = '#006cd9'; // Bright blue
const LOADER_SIZE = 4;

const ContainedReportListItem = ({ cardsExpanded, onCollapse, onExpand, report }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const eventSchemas = useSelector((state) => state.data.eventSchemas);
  const reportFromEventStore = useSelector((state) => state.data.eventStore[report.id]);

  const isOpen = useMemo(() => cardsExpanded.includes(report), [cardsExpanded, report]);

  const reportSchemas = reportFromEventStore
    ? getSchemasForEventTypeByEventId(eventSchemas, reportFromEventStore.event_type, reportFromEventStore.id)
    : null;

  const onClickArrowIntoIcon = useCallback(() => navigate(`/${TAB_KEYS.REPORTS}/${report.id}`), [navigate, report]);

  useEffect(() => {
    if (!reportFromEventStore) {
      dispatch(fetchEvent(report.id));
    }
  }, [dispatch, report.id, reportFromEventStore]);

  useEffect(() => {
    if (!reportSchemas) {
      dispatch(fetchEventTypeSchema(report.event_type, report.id));
    }
  }, [dispatch, report.event_type, report.id, reportSchemas]);

  return <li>
    <div
      className={`${activitySectionStyles.itemRow} ${activitySectionStyles.collapseRow}`}
      onClick={isOpen ? onCollapse: onExpand}
    >
      <ReportListItem
        className={styles.reportListItem}
        report={report}
        showElapsedTime={false}
        showJumpButton={false}
      />

      <div className={activitySectionStyles.itemActionButtonContainer}>
        {!!reportFromEventStore && <ItemActionButton onClick={onClickArrowIntoIcon} tooltip="Go to report">
          <ArrowIntoIcon />
        </ItemActionButton>}
      </div>

      <div className={activitySectionStyles.itemActionButtonContainer}>
        <ItemActionButton>
          {isOpen
            ? <ArrowUpSimpleIcon data-testid={`patrolDetailView-activitySection-arrowUp-${report.id}`} />
            : <ArrowDownSimpleIcon data-testid={`patrolDetailView-activitySection-arrowDown-${report.id}`} />}
        </ItemActionButton>
      </div>
    </div>

    <Collapse
      className={activitySectionStyles.collapse}
      data-testid={`patrolDetailView-activitySection-collapse-${report.id}`}
      in={isOpen}
    >
      <div>
        {!!reportFromEventStore && !!reportSchemas
          ? <ReportFormSummary
            className={styles.reportFormSummary}
            report={reportFromEventStore}
            schema={reportSchemas.schema}
            uiSchema={reportSchemas.uiSchema}
          />
          : <ResizeSpinLoader color={LOADER_COLOR} size={LOADER_SIZE} />}
      </div>
    </Collapse>
  </li>;
};

ContainedReportListItem.propTypes = {
  cardsExpanded: PropTypes.array.isRequired,
  onCollapse: PropTypes.func.isRequired,
  onExpand: PropTypes.func.isRequired,
  report: PropTypes.object.isRequired,
};

export default memo(ContainedReportListItem);
