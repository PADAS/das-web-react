import { memo, useContext } from 'react';
import { toast } from 'react-toastify';
import { useReactToPrint } from 'react-to-print';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClipIcon } from '../../../../../common/images/icons/link.svg';
import { ReactComponent as IncidentIcon } from '../../../../../common/images/icons/incident.svg';
import { ReactComponent as MarkerFeedIcon } from '../../../../../common/images/icons/marker-feed.svg';
import { ReactComponent as PatrolIcon } from '../../../../../common/images/icons/patrol.svg';
import { ReactComponent as PrinterIcon } from '../../../../../common/images/icons/printer-outline.svg';

import { basePrintingStyles } from '../../../../../utils/styles';
import { EVENT_LINK_TARGET_TYPES } from '../../../../../constants';
import { getReportLink } from '../../../../../utils/events';
import { selectEventLinkPermissions } from '../../../../../selectors/event-links';
import { TrackerContext } from '../../../../../utils/analytics';

import KebabMenu from '../../../../../KebabMenu';

import * as styles from './styles.module.scss';

const COPY_LINK_TOAST_AUTOCLOSE = 2000;

const ReportMenu = ({
  canLinkReport = false,
  hasLocation,
  isChangingLinks = false,
  onJumpToLocation,
  onOpenLinkModal,
  onRemoveFromIncident,
  onRemoveFromPatrol,
  onSaveNewReport = null,
  printableContentRef,
  report,
  title,
}) => {
  const onPrint = useReactToPrint({
    contentRef: printableContentRef,
    documentTitle: `${report.serial_number ?? ''} ${title}`.trim(),
    pageStyle: basePrintingStyles,
  });
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventOverview.header.reportMenu' });

  const eventLinkPermissions = useSelector((state) => selectEventLinkPermissions(state, report));

  const tracker = useContext(TrackerContext);

  const onCopyLink = async () => {
    try {
      await window.navigator.clipboard.writeText(getReportLink(report));

      toast.info(t('copyLinkMessage'), {
        autoClose: COPY_LINK_TOAST_AUTOCLOSE,
        hideProgressBar: true,
      });

      tracker.track('Copy report link');
    } catch (error) {
      console.warn('Error copying report link to clipboard: ', error);
    }
  };

  return <KebabMenu
    align="end"
    aria-label={t('moreOptionsButtonLabel')}
    isLoading={isChangingLinks}
    title={t('moreOptionsButtonLabel')}
  >
    <KebabMenu.Option className={styles.mobileOnlyOption} disabled={!hasLocation} onClick={onJumpToLocation}>
      <MarkerFeedIcon aria-hidden="true" />

      {t('jumpToLocationOption')}
    </KebabMenu.Option>

    <KebabMenu.Divider className={styles.mobileOnlyOption} />

    {canLinkReport && eventLinkPermissions.canAddToIncident && <KebabMenu.Option
      onClick={() => onOpenLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT, report, onSaveNewReport)}
    >
      <IncidentIcon aria-hidden="true" />

      {t('addToIncidentOption')}
    </KebabMenu.Option>}

    {canLinkReport && eventLinkPermissions.canRemoveFromIncident && <KebabMenu.Option
      onClick={() => onRemoveFromIncident(report)}
    >
      <IncidentIcon aria-hidden="true" />

      {t('removeFromIncidentOption')}
    </KebabMenu.Option>}

    {canLinkReport && eventLinkPermissions.canAddToPatrol && <KebabMenu.Option
      onClick={() => onOpenLinkModal(EVENT_LINK_TARGET_TYPES.PATROL, report, onSaveNewReport)}
    >
      <PatrolIcon aria-hidden="true" />

      {t('addToPatrolOption')}
    </KebabMenu.Option>}

    {canLinkReport && eventLinkPermissions.canRemoveFromPatrol && <KebabMenu.Option
      onClick={() => onRemoveFromPatrol(report)}
    >
      <PatrolIcon aria-hidden="true" />

      {t('removeFromPatrolOption')}
    </KebabMenu.Option>}

    {!!report.id && <KebabMenu.Option onClick={onCopyLink}>
      <ClipIcon aria-hidden="true" />

      {t('copyLinkOption')}
    </KebabMenu.Option>}

    <KebabMenu.Option onClick={onPrint}>
      <PrinterIcon aria-hidden="true" />

      {t('printOption')}
    </KebabMenu.Option>
  </KebabMenu>;
};

export default memo(ReportMenu);
