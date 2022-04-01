import { useSelector } from 'react-redux';

import { displayTitleForEvent } from '../../utils/events';

const useReport = (report) => {
  const eventTypes = useSelector((state) => state.data.eventTypes);

  const title = displayTitleForEvent(report, eventTypes);

  return { title };
};

export default useReport;
