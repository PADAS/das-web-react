import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import {
  calcDisplayPriorityForReport,
  displayTitleForEvent,
  eventTypeTitleForEvent,
  getCoordinatesForCollection,
  getCoordinatesForEvent,
} from '../../utils/events';
import { REPORT_PRIORITY_NONE } from '../../constants';

const useReport = (report) => {
  const eventTypes = useSelector((state) => state.data.eventTypes);

  const coordinates = useMemo(
    () => report.is_collection ? getCoordinatesForCollection(report) : getCoordinatesForEvent(report),
    [report]
  );
  const displayTitle = useMemo(() => displayTitleForEvent(report, eventTypes), [eventTypes, report]);
  const eventTypeTitle = useMemo(() => eventTypeTitleForEvent(report, eventTypes), [eventTypes, report]);
  const displayPriority = useMemo(
    () => calcDisplayPriorityForReport(report, eventTypes) || REPORT_PRIORITY_NONE.value,
    [eventTypes, report]
  );

  return { coordinates, displayPriority, displayTitle, eventTypeTitle };
};

export default useReport;
