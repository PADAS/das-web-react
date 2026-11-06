import { memo, useEffect, useId } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowIntoIcon } from '../../../common/images/icons/arrow-into.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';

import { EVENT_FORM_STATES, EVENT_LINK_TARGET_TYPES, TAB_KEYS } from '../../../constants';
import { fetchEvent } from '../../../ducks/events';
import { format, STANDARD_DATE_FORMAT } from '../../../utils/datetime';
import { getIsEventFullyLoaded } from '../../../utils/events';
import { PRIORITY_COLOR_MAP } from '../../../utils/colors';
import { selectEventLinkPermissions } from '../../../selectors/event-links';
import useReport from '../../../hooks/useReport';

import EventIcon from '../../../EventIcon';
import Link from '../../../Link';
import ReportFormSummary from '../../../ReportFormSummary';

import * as activitySectionStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const LOADER_COLOR = 'var(--er-ui-cta-primary)';
const LOADER_SIZE = 30;
const REMOVE_LOADER_SIZE = 14;

const CAN_REMOVE_PERMISSION_BY_LINK_TARGET_TYPE = {
  [EVENT_LINK_TARGET_TYPES.INCIDENT]: 'canRemoveFromIncident',
  [EVENT_LINK_TARGET_TYPES.PATROL]: 'canRemoveFromPatrol',
};

const REMOVE_BUTTON_LABEL_KEY_BY_LINK_TARGET_TYPE = {
  [EVENT_LINK_TARGET_TYPES.INCIDENT]: 'removeFromIncidentButtonLabel',
  [EVENT_LINK_TARGET_TYPES.PATROL]: 'removeFromPatrolButtonLabel',
};

const CONTAINED_REPORT_ANALYTICS_LABEL = 'contained report';

const STATE_LABEL_KEYS = {
  [EVENT_FORM_STATES.ACTIVE]: 'activeStateLabel',
  [EVENT_FORM_STATES.NEW_LEGACY]: 'activeStateLabel',
  [EVENT_FORM_STATES.RESOLVED]: 'resolvedStateLabel',
  [EVENT_FORM_STATES.REVIEW]: 'reviewStateLabel',
};

const ContainedReportListItem = ({
  isOpen = false,
  isRemoving = false,
  onCollapse,
  onExpand,
  onRemove = null,
  removeFrom = null,
  report,
}) => {
  const dispatch = useDispatch();
  const { t } = useTranslation('details-view', { keyPrefix: 'containedReportListItem' });

  const { displayPriority, displayTitle } = useReport(report);

  const eventFromEventStore = useSelector((state) => state.data.eventStore[report.id]);
  const canRemove = useSelector((state) => !!onRemove && selectEventLinkPermissions(
    state,
    eventFromEventStore ?? report
  )[CAN_REMOVE_PERMISSION_BY_LINK_TARGET_TYPE[removeFrom]]);

  const titleId = useId();

  const { key: priorityKey } = PRIORITY_COLOR_MAP[displayPriority] || PRIORITY_COLOR_MAP['0'];

  const isEventFullyLoaded = getIsEventFullyLoaded(eventFromEventStore);

  const reportedTime = report.time || report.updated_at;
  const reportedDate = reportedTime ? new Date(reportedTime) : null;

  // The store copy is the fresh one: the collection's own snapshot goes stale
  // when a child is resolved elsewhere. The prop covers the first paint.
  const reportState = eventFromEventStore?.state ?? report.state;
  const stateLabelKey = STATE_LABEL_KEYS[reportState] ?? STATE_LABEL_KEYS[EVENT_FORM_STATES.ACTIVE];

  const onToggleCollapseRow = () => (isOpen ? onCollapse : onExpand)(report, CONTAINED_REPORT_ANALYTICS_LABEL);

  const onClickCollapseToggleButton = (event) => {
    event.preventDefault();
    event.stopPropagation();

    onToggleCollapseRow();
  };

  // The button stays focusable while the removal runs, so presses are ignored
  // here: disabling the focused button would drop the keyboard focus.
  const onClickRemove = () => {
    if (!isRemoving) {
      onRemove(eventFromEventStore);
    }
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
      <div className={activitySectionStyles.itemIcon} style={{ color: 'var(--er-ui-text-primary-text-reversed)' }}>
        <EventIcon color="var(--er-ui-text-primary-text-reversed)" report={report} />
      </div>

      <div className={activitySectionStyles.itemDetails}>
        <div className={styles.titleGroup}>
          {!!report.serial_number && <span className={styles.serialNumber}>
            <span className="sr-only">{t('serialNumberLabel')} </span>

            {report.serial_number}
          </span>}

          <p className={activitySectionStyles.itemTitle} id={titleId}>{displayTitle}</p>
        </div>

        <div className={styles.metaGroup}>
          <span className={`${activitySectionStyles.itemMeta} ${styles.stateLabel}`}>
            <span className="sr-only">{t('stateLabel')} </span>

            {t(stateLabelKey)}
          </span>

          {reportedDate && <time
            className={activitySectionStyles.itemDate}
            data-testid={`activitySection-dateTime-${report.id}`}
            dateTime={reportedDate.toISOString()}
          >
            {format(reportedDate, STANDARD_DATE_FORMAT)}
          </time>}
        </div>
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

        {isEventFullyLoaded && canRemove && <div className={styles.footer}>
          <button
            aria-busy={isRemoving}
            aria-describedby={titleId}
            aria-disabled={isRemoving}
            className={styles.removeButton}
            onClick={onClickRemove}
            type="button"
          >
            <span className={styles.removeButtonLabel}>
              {t(REMOVE_BUTTON_LABEL_KEY_BY_LINK_TARGET_TYPE[removeFrom])}
            </span>

            {isRemoving && <MoonLoader aria-hidden color="currentColor" size={REMOVE_LOADER_SIZE} />}
          </button>
        </div>}
      </div>
    </Collapse>
  </li>;
};

export default memo(ContainedReportListItem);
