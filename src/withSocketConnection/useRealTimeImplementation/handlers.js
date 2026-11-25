import i18next from 'i18next';

import { displayTitleForEvent, eventWasRecentlyEditedByCurrentUser } from '../../utils/events';
import { selectActiveUser } from '../../selectors/user';
import { showToast } from '../../utils/toast';
import store from '../../store';

export const showFilterMismatchToastForHiddenReports = (message) => {
  const t = i18next.getFixedT(null, 'utils', 'showFilterMismatchToastForHiddenReports');

  const { event_data, matches_current_filter } = message;

  if (eventWasRecentlyEditedByCurrentUser(event_data, selectActiveUser(store.getState())) && !matches_current_filter) {
    const eventTypes = store.getState().data.eventTypes;
    const displayTitle = displayTitleForEvent(event_data, eventTypes);

    showToast({
      message: t('eventCreatedDoesNotMatchFilterToast', { displayTitle, serialNumber: event_data.serial_number }),
      toastConfig: { type: 'info' },
    });
  }
};
