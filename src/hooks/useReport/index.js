import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';

import {
  calcDisplayPriorityForReport,
  displayTitleForEvent,
  eventTypeTitleForEvent,
  getCoordinatesForCollection,
  getCoordinatesForEvent,
} from '../../utils/events';
import { REPORT_PRIORITY_NONE } from '../../constants';

const useReport = (report) => {
  const { t } = useTranslation('reports');

  const eventTypes = useSelector((state) => state.data.eventTypes);

  const coordinates = useMemo(
    () => report.is_collection ? getCoordinatesForCollection(report) : getCoordinatesForEvent(report),
    [report]
  );
  const displayTitle = useMemo(() => {
    const displayTitle = displayTitleForEvent(report, eventTypes);

    return displayTitle ?? t('unknownEventTitle');
  }, [eventTypes, report, t]);
  const eventTypeTitle = useMemo(() => {
    const eventTypeTitle = eventTypeTitleForEvent(report, eventTypes);

    return eventTypeTitle ?? t('unknownEventType');
  }, [eventTypes, report, t]);
  const displayPriority = useMemo(
    () => calcDisplayPriorityForReport(report, eventTypes) || REPORT_PRIORITY_NONE.value,
    [eventTypes, report]
  );

  return { coordinates, displayPriority, displayTitle, eventTypeTitle };
};

export default useReport;
