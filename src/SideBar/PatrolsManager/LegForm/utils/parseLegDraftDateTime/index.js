import { isValid, parseISO } from 'date-fns';

import { isValidTime } from '../../../../../TimePicker';

const MIDNIGHT_TIME = '00:00';

const parseLegDraftDateTime = (date, time) => {
  const dateTime = parseISO(`${date}T${isValidTime(time) ? time : MIDNIGHT_TIME}`);

  return isValid(dateTime) ? dateTime : null;
};

export default parseLegDraftDateTime;
