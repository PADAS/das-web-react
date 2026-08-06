import React, { memo, useCallback, useEffect, useMemo } from 'react';
import Collapse from 'react-bootstrap/Collapse';
import MoonLoader from 'react-spinners/MoonLoader';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ArrowDownSimpleIcon } from '../../../common/images/icons/arrow-down-simple.svg';
import { ReactComponent as ArrowIntoIcon } from '../../../common/images/icons/arrow-into.svg';
import { ReactComponent as ArrowUpSimpleIcon } from '../../../common/images/icons/arrow-up-simple.svg';

import { fetchEvent } from '../../../ducks/events';
import { getIsEventFullyLoaded } from '../../../utils/events';
import { TAB_KEYS } from '../../../constants';
import useNavigate from '../../../hooks/useNavigate';

import ItemActionButton from '../ItemActionButton';
import ReportFormSummary from '../../../ReportFormSummary';
import ReportListItem from '../../../ReportListItem';

import * as activitySectionStyles from '../styles.module.scss';
import * as styles from './styles.module.scss';

const LOADER_COLOR = '#006cd9'; // Bright blue
const LOADER_SIZE = 30;

const ContainedReportListItem = ({ cardsExpanded, onCollapse, onExpand, report }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useTranslation('details-view', { keyPrefix: 'containedReportListItem' });

  const reportFromEventStore = useSelector((state) => state.data.eventStore[report.id]);

  const isEventFullyLoaded = getIsEventFullyLoaded(reportFromEventStore);

  const isOpen = useMemo(() => cardsExpanded.includes(report), [cardsExpanded, report]);

  const onClickArrowIntoIcon = useCallback(() => navigate(`/${TAB_KEYS.EVENTS}/${report.id}`), [navigate, report]);

  useEffect(() => {
    if (!isEventFullyLoaded) {
      dispatch(fetchEvent(report.id));
    }
  }, [dispatch, isEventFullyLoaded, report.id]);

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
        {!!reportFromEventStore && <ItemActionButton onClick={onClickArrowIntoIcon} tooltip={t('goToReportButtonTooltip')}>
          <ArrowIntoIcon data-testid="arrow-into-icon" />
        </ItemActionButton>}
      </div>

      <div className={activitySectionStyles.itemActionButtonContainer}>
        <ItemActionButton
          aria-label={t(isOpen ? 'collapseOpenButtonLabel' : 'collapseClosedButtonLabel')}
          title={t(isOpen ? 'collapseOpenButtonTitle' : 'collapseClosedButtonTitle')}
        >
          {isOpen
            ? <ArrowUpSimpleIcon data-testid={`activitySection-arrowUp-${report.id}`} />
            : <ArrowDownSimpleIcon data-testid={`activitySection-arrowDown-${report.id}`} />}
        </ItemActionButton>
      </div>
    </div>

    <Collapse
      className={activitySectionStyles.collapse}
      data-testid={`activitySection-collapse-${report.id}`}
      in={isOpen}
    >
      <div>
        {isEventFullyLoaded
          ? <ReportFormSummary report={reportFromEventStore} />
          : <div className={styles.loaderWrapper}>
            <MoonLoader color={LOADER_COLOR} size={LOADER_SIZE} />
          </div>}
      </div>
    </Collapse>
  </li>;
};

export default memo(ContainedReportListItem);
