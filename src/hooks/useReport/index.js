import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  calcDisplayPriorityForReport,
  eventTypeTitleForEvent,
  getCoordinatesForCollection,
  getCoordinatesForEvent,
} from '../../utils/events';
import { calcTitleAndSubtitle } from '../../utils/titles';
import { REPORT_PRIORITY_NONE } from '../../constants';

const useReport = (report) => {
  const { t } = useTranslation('reports');

  const eventTypes = useSelector((state) => state.data.eventTypes);

  const coordinates = useMemo(
    () => report.is_collection ? getCoordinatesForCollection(report) : getCoordinatesForEvent(report),
    [report]
  );
  const knownEventTypeTitle = useMemo(() => eventTypeTitleForEvent(report, eventTypes), [eventTypes, report]);
  const titles = useMemo(
    () => calcTitleAndSubtitle(report.title, knownEventTypeTitle),
    [knownEventTypeTitle, report.title]
  );
  const displayPriority = useMemo(
    () => calcDisplayPriorityForReport(report, eventTypes) || REPORT_PRIORITY_NONE.value,
    [eventTypes, report]
  );

  return {
    coordinates,
    displayPriority,
    displaySubtitle: titles.subtitle,
    displayTitle: titles.title || t('unknownEventTitle'),
    eventTypeTitle: knownEventTypeTitle ?? t('unknownEventType'),
  };
};

export default useReport;
