import React from 'react';
import { useTranslation } from 'react-i18next';

import { EVENT_FORM_STATES } from '../../../../../../constants';

const NotificationDetails = ({ failedEvents, newState, processedEvents }) => {
  const { t } = useTranslation('reports', { keyPrefix: 'eventsManager.eventsFeed.eventRow.actions.notificationDetails' });

  return <div>
    {processedEvents.length > 0 && <div>
      <p>
        {t('processedEvents.title', {
          newState: t(`processedEvents.${newState === EVENT_FORM_STATES.ACTIVE ? 'activated' : newState}`),
        })}
      </p>

      <ul>{processedEvents.map((event) => <li key={event.serial_number}>#{event.serial_number}</li>)}</ul>
    </div>}

    {failedEvents.length > 0 && <div>
      <p>{t('failedEvents', { state: t(`states.${newState}`) })}</p>

      <ul>{failedEvents.map((event) => <li key={event.serial_number}>#{event.serial_number}</li>)}</ul>
    </div>}
  </div>;
};

export default NotificationDetails;
