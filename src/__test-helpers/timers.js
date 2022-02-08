const tick = () => new Promise(res => setImmediate(res));

export const advanceTimersByTime = async (time) => jest.advanceTimersByTime(time) && (await tick());

export const runOnlyPendingTimers = async () => jest.runOnlyPendingTimers() && (await tick());

export const runAllTimers = async () => jest.runAllTimers() && (await tick());