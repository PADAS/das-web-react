import { subMonths, startOfDay } from 'date-fns';

export const STANDARD_DATE_FORMAT = 'D MMM YYYY hh:mm';
export const generateOneMonthAgoDate = () => new Date(
  startOfDay(
    subMonths(new Date(), 1)
  )
);