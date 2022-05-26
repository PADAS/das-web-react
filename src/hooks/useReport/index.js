import { useMemo } from 'react';
import { useSelector } from 'react-redux';

import { displayTitleForEvent, eventTypeTitleForEvent } from '../../utils/events';

const useReport = (report) => {
  const eventTypes = useSelector((state) => state.data.eventTypes);

  const displayTitle = useMemo(() => displayTitleForEvent(report, eventTypes), [eventTypes, report]);
  const eventTypeTitle = useMemo(() => eventTypeTitleForEvent(report, eventTypes), [eventTypes, report]);

  return { displayTitle, eventTypeTitle };
};

export default useReport;
