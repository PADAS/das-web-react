import { memo, useContext } from 'react';
import { toast } from 'react-toastify';
import { useReactToPrint } from 'react-to-print';
import { useTranslation } from 'react-i18next';

import { ReactComponent as ClipIcon } from '../../../../../common/images/icons/link.svg';
import { ReactComponent as IncidentIcon } from '../../../../../common/images/icons/incident.svg';
import { ReactComponent as MarkerFeedIcon } from '../../../../../common/images/icons/marker-feed.svg';
import { ReactComponent as PatrolIcon } from '../../../../../common/images/icons/patrol.svg';
import { ReactComponent as PrinterIcon } from '../../../../../common/images/icons/printer-outline.svg';

import { basePrintingStyles } from '../../../../../utils/styles';
import { EVENT_LINK_TARGET_TYPES } from '../../../../../constants';
import { getReportLink } from '../../../../../utils/events';
import { TrackerContext } from '../../../../../utils/analytics';
import useEventLinking from '../../../../../hooks/useEventLinking';

import DelayedUnmount from '../../../../../DelayedUnmount';
import KebabMenu from '../../../../../KebabMenu';
import LinkEventModal from '../../../../../LinkEventModal';

import * as styles from './styles.module.scss';

const COPY_LINK_TOAST_AUTOCLOSE = 2000;

const ReportMenu = ({
  canLinkReport = false,
  hasLocation,
  onJumpToLocation,
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

  const eventLinking = useEventLinking(report, { saveEvent: onSaveNewReport });

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

  return <>
    <KebabMenu align="end" aria-label={t('moreOptionsButtonLabel')} title={t('moreOptionsButtonLabel')}>
      <KebabMenu.Option className={styles.mobileOnlyOption} disabled={!hasLocation} onClick={onJumpToLocation}>
        <MarkerFeedIcon aria-hidden="true" />

        {t('jumpToLocationOption')}
      </KebabMenu.Option>

      <KebabMenu.Divider className={styles.mobileOnlyOption} />

      {canLinkReport && eventLinking.permissions.canAddToIncident && <KebabMenu.Option
        onClick={() => eventLinking.openLinkModal(EVENT_LINK_TARGET_TYPES.INCIDENT)}
      >
        <IncidentIcon aria-hidden="true" />

        {t('addToIncidentOption')}
      </KebabMenu.Option>}

      {canLinkReport && eventLinking.permissions.canAddToPatrol && <KebabMenu.Option
        onClick={() => eventLinking.openLinkModal(EVENT_LINK_TARGET_TYPES.PATROL)}
      >
        <PatrolIcon aria-hidden="true" />

        {t('addToPatrolOption')}
      </KebabMenu.Option>}

      {!!report.id && <KebabMenu.Option onClick={onCopyLink}>
        <ClipIcon aria-hidden="true" />

        {t('copyLinkOption')}
      </KebabMenu.Option>}

      <KebabMenu.Option onClick={onPrint}>
        <PrinterIcon aria-hidden="true" />

        {t('printOption')}
      </KebabMenu.Option>
    </KebabMenu>

    <DelayedUnmount isMounted={eventLinking.isLinkModalOpen}>
      <LinkEventModal
        canCreateIncident={eventLinking.permissions.canCreateIncident}
        event={report}
        isLinking={eventLinking.isLinking}
        onAdd={eventLinking.addToLinkTarget}
        onCreateIncident={eventLinking.addToNewIncident}
        onHide={eventLinking.closeLinkModal}
        show={eventLinking.isLinkModalOpen}
        type={eventLinking.linkModalType}
      />
    </DelayedUnmount>
  </>;
};

export default memo(ReportMenu);
