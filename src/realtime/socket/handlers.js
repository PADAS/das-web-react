import store from '../../store';

import { displayTitleForEvent, eventWasRecentlyCreatedByCurrentUser } from '../../utils/events';
import { showErrorToast } from '../../utils/toast';

export const showFilterMismatchToastForHiddenReports = (msg) => {
  const { event_data, matches_current_filter } = msg;
  const { data: { user } } = store.getState();

  if (
    eventWasRecentlyCreatedByCurrentUser(event_data, user)
    && !matches_current_filter
  ) {

    const eventTypes = store.getState().data.eventTypes;
    const displayTitle = displayTitleForEvent(event_data, eventTypes);

    showErrorToast({
      message: `${event_data.serial_number} "${displayTitle}" has been created but does not match the current filter`,
      variant: 'warning',
    });
  }
};