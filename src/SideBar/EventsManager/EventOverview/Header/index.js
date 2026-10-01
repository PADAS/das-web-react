import React, { memo, useContext } from 'react';
import { useTranslation } from 'react-i18next';

import { ReactComponent as MarkerFeedIcon } from '../../../../common/images/icons/marker-feed.svg';

import { collectionHasMultipleValidLocations, PRIORITY_COLOR_MAP } from '../../../../utils/events';
import { TrackerContext } from '../../../../utils/analytics';
import useJumpToLocation from '../../../../hooks/useJumpToLocation';
import useReport from '../../../../hooks/useReport';

import DetailViewHeader from '../../../DetailViewHeader';
import EventIcon from '../../../../EventIcon';
import ReportMenu from './ReportMenu';
import StatusSelect from './StatusSelect';
import TitleInput from '../../../TitleInput';

import * as styles from './styles.module.scss';

const Header = ({
  isCommunity = false,
  isReadOnly = false,
  isStateDirty = false,
  isTitleDirty = false,
  onChangeState,
  onChangeTitle,
  onSaveReport,
  parentCrumbs,
  printableContentRef,
  report,
  savedState,
  setRedirectTo,
  ...otherProps
}) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventOverview.header' });

  const jumpToLocation = useJumpToLocation();
  const { coordinates, displayPriority, displaySubtitle, displayTitle, eventTypeTitle } = useReport(report);

  const tracker = useContext(TrackerContext);

  const title = report.title ?? displayTitle;

  const crumbs = [...parentCrumbs, { label: displayTitle }];

  const priorityKey = (PRIORITY_COLOR_MAP[displayPriority] ?? PRIORITY_COLOR_MAP[0]).key;

  const hasLocation = !!coordinates?.length;
  const hasMultipleLocations = collectionHasMultipleValidLocations(report);

  const onJumpToLocation = () => {
    jumpToLocation(coordinates);

    tracker.track('Click header "jump to location" button', `Report Type:${report.event_type}`);
  };

  // An event always has a title, so one left empty falls back to its type.
  const onTitleBlur = () => {
    if (isTitleDirty) {
      tracker.track('Change report title');
    }

    if (report.title !== null && !report.title?.trim()) {
      onChangeTitle(eventTypeTitle);
    }
  };

  const renderActions = () => <>
    <div className={styles.desktopActions}>
      <button
        aria-label={t('jumpToLocationButtonLabel')}
        className={styles.iconButton}
        disabled={!hasLocation}
        onClick={onJumpToLocation}
        title={t('jumpToLocationButtonLabel')}
        type="button"
      >
        {hasMultipleLocations
          ? <span aria-hidden="true" className={styles.multiLocationIcon}>
            <MarkerFeedIcon />

            <MarkerFeedIcon />
          </span>
          : <MarkerFeedIcon aria-hidden="true" />}
      </button>
    </div>

    <ReportMenu
      hasLocation={hasLocation}
      onJumpToLocation={onJumpToLocation}
      onSaveReport={onSaveReport}
      printableContentRef={printableContentRef}
      report={report}
      setRedirectTo={setRedirectTo}
      title={displayTitle}
    />
  </>;

  const renderTitleBar = () => <>
    <h2 className="sr-only">{displayTitle}</h2>

    <div className={styles.titleBarMain}>
      <div className={`${styles.icon} ${styles[priorityKey]}`} data-testid="eventOverviewHeader-icon">
        <EventIcon report={report} />

        {!!report.patrols?.length && <span aria-hidden="true" className={styles.patrolIndicator}>
          {t('patrolIndicator')}
        </span>}
      </div>

      {!!report.serial_number && <p className={styles.serialNumber}>{report.serial_number}</p>}

      <div className={styles.titleStack}>
        <TitleInput
          aria-label={t('titleInputLabel')}
          isDirty={isTitleDirty}
          isReadOnly={isReadOnly}
          onBlur={onTitleBlur}
          onChange={onChangeTitle}
          value={title}
        />

        {!!displaySubtitle && <p className={styles.subtitle}>{displaySubtitle}</p>}
      </div>
    </div>

    {!isCommunity && <div className={styles.pills}>
      <StatusSelect
        isDirty={isStateDirty}
        onSelect={onChangeState}
        savedState={savedState}
        state={report.state}
      />
    </div>}
  </>;

  return <DetailViewHeader
    breadcrumbLabel={t('breadcrumbNavLabel')}
    crumbs={crumbs}
    hasTopBar={!isCommunity}
    renderActions={renderActions}
    renderTitleBar={renderTitleBar}
    {...otherProps}
  />;
};

export default memo(Header);
