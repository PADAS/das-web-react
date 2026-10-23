import { isSameMinute } from 'date-fns';

// The form reads and writes whole minutes, so a time it hands back on the same
// minute the leg was stamped on is that stamp, and goes back with its seconds.
const timeKeepingItsSeconds = (time, storedTime) => {
  const isStillTheStoredTime = !!time && !!storedTime && isSameMinute(new Date(time), new Date(storedTime));

  return isStillTheStoredTime ? storedTime : time;
};

export default timeKeepingItsSeconds;
