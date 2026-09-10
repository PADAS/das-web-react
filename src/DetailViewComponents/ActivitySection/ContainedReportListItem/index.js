import React, { memo, useEffect } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowIntoIcon } from '../../../common/images/icons/arrow-into.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';

import { fetchEvent } from '../../../ducks/events';
import { format, STANDARD_DATE_FORMAT } from '../../../utils/datetime';
import { getIsEventFullyLoaded, PRIORITY_COLOR_MAP } from '../../../utils/events';
import { TAB_KEYS } from '../../../constants';
import useReport from '../../../hooks/useReport';

import EventIcon from '../../../EventIcon';
import Link from '../../../Link';
import ReportFormSummary from '../../../ReportFormSummary';

import * as activitySectionStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const LOADER_COLOR = '#006cd9'; // Bright blue
const LOADER_SIZE = 30;

const CONTAINED_REPORT_ANALYTICS_LABEL = 'contained report';

const ContainedReportListItem = ({ isOpen = false, onCollapse, onExpand, report }) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('details-view', { keyPrefix: 'containedReportListItem' });

  const { displayPriority, displayTitle } = useReport(report);

  const eventFromEventStore = useSelector((state) => state.data.eventStore[report.id]);

  const { key: priorityKey } = PRIORITY_COLOR_MAP[displayPriority] || PRIORITY_COLOR_MAP['0'];

  const isEventFullyLoaded = getIsEventFullyLoaded(eventFromEventStore);

  const reportedTime = report.time || report.updated_at;
  const reportedDate = reportedTime ? new Date(reportedTime) : null;

  const onToggleCollapseRow = () => (isOpen ? onCollapse : onExpand)(report, CONTAINED_REPORT_ANALYTICS_LABEL);

  const onClickCollapseToggleButton = (event) => {
    event.preventDefault();
    event.stopPropagation();

    onToggleCollapseRow();
  };

  useEffect(() => {
    if (!isEventFullyLoaded) {
      dispatch(fetchEvent(report.id)).catch(() => {});
    }
  }, [dispatch, isEventFullyLoaded, report.id]);

  return <li className={activitySectionStyles.listItem}>
    <div
      className={`${activitySectionStyles.itemRow} ${activitySectionStyles.collapseRow} ${styles[priorityKey]}`}
      onClick={onToggleCollapseRow}
    >
      <div className={activitySectionStyles.itemIcon} style={{ color: 'white' }}>
        <EventIcon color="white" report={report} />
      </div>

      <div className={activitySectionStyles.itemDetails}>
        <p className={activitySectionStyles.itemTitle}>{displayTitle}</p>

        {reportedDate && <time
          className={activitySectionStyles.itemDate}
          data-testid={`activitySection-dateTime-${report.id}`}
          dateTime={reportedDate.toISOString()}
        >
          {format(reportedDate, STANDARD_DATE_FORMAT)}
        </time>}
      </div>

      <div className={activitySectionStyles.itemActionButtonContainer} onClick={(event) => event.stopPropagation()}>
        {!!eventFromEventStore && <Link
          aria-label={t('viewReportButtonLabel', { title: displayTitle })}
          className={`${activitySectionStyles.actionButton} ${styles.viewReportIcon}`}
          title={t('viewReportButtonLabel', { title: displayTitle })}
          to={`/${TAB_KEYS.EVENTS}/${report.id}`}
        >
          <ArrowIntoIcon aria-hidden="true" data-testid="arrow-into-icon" />
        </Link>}
      </div>

      <div className={activitySectionStyles.itemActionButtonContainer}>
        <button
          aria-expanded={isOpen}
          aria-label={t(
            isOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel',
            { title: displayTitle }
          )}
          className={`${activitySectionStyles.actionButton} ${activitySectionStyles.collapseToggleButton}`}
          onClick={onClickCollapseToggleButton}
          title={t(
            isOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel',
            { title: displayTitle }
          )}
          type="button"
        >
          {isOpen
            ? <ArrowUpSimpleIcon aria-hidden="true" data-testid={`activitySection-arrowUp-${report.id}`} />
            : <ArrowDownSimpleIcon aria-hidden="true" data-testid={`activitySection-arrowDown-${report.id}`} />}
        </button>
      </div>
    </div>

    <Collapse
      className={activitySectionStyles.collapse}
      data-testid={`activitySection-collapse-${report.id}`}
      in={isOpen}
    >
      <div>
        <div className={activitySectionStyles.collapseContent}>
          {isEventFullyLoaded
            ? <ReportFormSummary report={eventFromEventStore} />
            : <div
              aria-label={t('loadingLabel', { title: displayTitle })}
              className={styles.loaderWrapper}
              role="status"
            >
              <MoonLoader color={LOADER_COLOR} size={LOADER_SIZE} />
            </div>}
        </div>
      </div>
    </Collapse>
  </li>;
};

export default memo(ContainedReportListItem);
