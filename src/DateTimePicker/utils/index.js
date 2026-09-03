import { EMPTY_DATE_VALUE } from '../../DatePicker';
import { EMPTY_TIME_VALUE } from '../../TimePicker';

export const EMPTY_DATE_TIME_VALUE = `${EMPTY_DATE_VALUE}T${EMPTY_TIME_VALUE}`;

// A boundary only rules the time while the value sits on the boundary's own day.
export const getBoundaryDateAndTime = (boundary, value) => {
  const [dateValue] = value.split('T');
  const [boundaryDate, boundaryTime] = boundary.split('T');

  return [boundaryDate, boundaryDate && dateValue === boundaryDate ? boundaryTime : undefined];
};
