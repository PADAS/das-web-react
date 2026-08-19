export const COOL_OFF_STORAGE_KEY = 'er-community-cooloff';

// Community forms are anonymous, so the cool-off record has to live on the device.
//
// Entries are pruned by age against the longest period they could still be measured against. The
// applicable period is only known for the community input whose payload is currently loaded, so
// every other community — and every read, which knows no period at all — falls back to this
// deliberately long ceiling. Raising `cool_off_period_minutes` server-side can then never unblock
// someone via pruning.
const RETENTION_CEILING_MINUTES = 30 * 24 * 60;

const ONE_MINUTE_IN_SECONDS = 60;

const nowInSeconds = () => Math.floor(Date.now() / 1000);

const isWithinRetention = (submittedAt, retentionMinutes) =>
  submittedAt + (retentionMinutes * ONE_MINUTE_IN_SECONDS) > nowInSeconds();

// Storage access itself throws in sandboxed iframes, on opaque origins and in Safari private mode.
// The public form has to render and submit without it, so every call fails open.
const readRawStorage = () => {
  try {
    return window.localStorage.getItem(COOL_OFF_STORAGE_KEY);
  } catch (_) {
    return null;
  }
};

const writeRawStorage = (value) => {
  try {
    window.localStorage.setItem(COOL_OFF_STORAGE_KEY, value);
  } catch (_) {
    // Nothing is persisted, so the next load simply won't block. Better than a broken form.
  }
};

/**
 * Cool-off entries, shaped `{ [communityValue]: { [eventTypeValue]: submittedAtEpochSeconds } }`.
 *
 * Only the submission time is persisted, never a resolved expiry: the length of the window is
 * whatever `cool_off_period_minutes` says on the load that evaluates it, so a changed setting
 * takes effect on the next page load. Anything malformed reads back as empty so corrupt storage
 * can never block a submission.
 */
export const readCoolOffEntries = () => {
  const raw = readRawStorage();
  if (!raw) return {};

  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};

    return Object.entries(parsed).reduce((entries, [communityValue, eventTypes]) => {
      if (!eventTypes || typeof eventTypes !== 'object' || Array.isArray(eventTypes)) return entries;

      const validSubmissions = Object.entries(eventTypes).filter(([, submittedAt]) =>
        Number.isFinite(submittedAt) && isWithinRetention(submittedAt, RETENTION_CEILING_MINUTES));

      if (validSubmissions.length) entries[communityValue] = Object.fromEntries(validSubmissions);

      return entries;
    }, {});
  } catch (_) {
    return {};
  }
};

/**
 * When the cool-off window for this event type ends, in epoch milliseconds, or null if it is not
 * cooling off. `coolOffPeriodMinutes` must be the live value from the community payload — it is
 * the only thing that decides the length of the window.
 */
export const getCoolOffExpiry = (entries, communityValue, eventTypeValue, coolOffPeriodMinutes) => {
  if (!(coolOffPeriodMinutes > 0)) return null;

  const submittedAt = entries?.[communityValue]?.[eventTypeValue];
  if (!Number.isFinite(submittedAt)) return null;

  // Never let a submission time sit ahead of the clock, whether from a device clock change, a
  // hand-edited store or sub-second rounding. This is what bounds the remaining time to at most
  // one whole period, so the countdown cannot render "30 minutes 1 second" for a 30 minute period.
  const effectiveSubmittedAt = Math.min(submittedAt, nowInSeconds());

  return (effectiveSubmittedAt + (coolOffPeriodMinutes * ONE_MINUTE_IN_SECONDS)) * 1000;
};

const pruneEntries = (entries, communityValue, coolOffPeriodMinutes) =>
  Object.entries(entries).reduce((pruned, [community, eventTypes]) => {
    // Invariant: pruning is bookkeeping only and must never decide whether someone is blocked.
    // It may drop an entry solely on a period it knows is authoritative — the live one for the
    // community being written, the long ceiling for any other.
    const retentionMinutes = community === communityValue
      ? coolOffPeriodMinutes
      : RETENTION_CEILING_MINUTES;

    const retained = Object.entries(eventTypes)
      .filter(([, submittedAt]) => isWithinRetention(submittedAt, retentionMinutes));

    if (retained.length) pruned[community] = Object.fromEntries(retained);

    return pruned;
  }, {});

/**
 * Starts the cool-off window for one event type of one community input and returns the entries as
 * persisted. A falsy or non-positive `coolOffPeriodMinutes` means the feature is off: nothing is
 * written and the existing entries are returned untouched.
 */
export const recordCoolOffSubmission = (communityValue, eventTypeValue, coolOffPeriodMinutes) => {
  const entries = readCoolOffEntries();

  if (!communityValue || !eventTypeValue || !(coolOffPeriodMinutes > 0)) return entries;

  const nextEntries = pruneEntries(entries, communityValue, coolOffPeriodMinutes);

  nextEntries[communityValue] = {
    ...nextEntries[communityValue],
    // Floored to whole seconds so a submission is never recorded as happening in the future.
    [eventTypeValue]: nowInSeconds(),
  };

  writeRawStorage(JSON.stringify(nextEntries));

  return nextEntries;
};
