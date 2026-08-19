import {
  COOL_OFF_STORAGE_KEY,
  getCoolOffExpiry,
  readCoolOffEntries,
  recordCoolOffSubmission,
} from './community-cool-off';

const COMMUNITY = 'test-community';
const TYPE_A = 'jtar';
const TYPE_B = 'jenae92f';

const ONE_MINUTE_IN_MS = 60 * 1000;
const RETENTION_CEILING_MINUTES = 30 * 24 * 60;

const setEntries = (entries) => window.localStorage.setItem(COOL_OFF_STORAGE_KEY, JSON.stringify(entries));

const readStoredValue = () => window.localStorage.getItem(COOL_OFF_STORAGE_KEY);

const nowSeconds = () => Math.floor(Date.now() / 1000);

const minutesAgo = (minutes) => nowSeconds() - (minutes * 60);

const throwOnStorage = (method) => jest.spyOn(Storage.prototype, method).mockImplementation(() => {
  throw new DOMException('denied', 'SecurityError');
});

describe('community cool-off storage', () => {
  beforeEach(() => window.localStorage.clear());

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    window.localStorage.clear();
  });

  describe('readCoolOffEntries', () => {
    test('returns an empty object when nothing is stored', () => {
      expect(readCoolOffEntries()).toEqual({});
    });

    test('returns the parsed submission times when the stored data is valid', () => {
      setEntries({ [COMMUNITY]: { [TYPE_A]: minutesAgo(1) } });

      expect(readCoolOffEntries()).toEqual({ [COMMUNITY]: { [TYPE_A]: minutesAgo(1) } });
    });

    test('returns an empty object when the stored value is not valid JSON', () => {
      window.localStorage.setItem(COOL_OFF_STORAGE_KEY, 'not-json');

      expect(readCoolOffEntries()).toEqual({});
    });

    test('returns an empty object when the stored value is an array', () => {
      setEntries([{ [COMMUNITY]: { [TYPE_A]: minutesAgo(1) } }]);

      expect(readCoolOffEntries()).toEqual({});
    });

    test('drops entries whose submission time is not a number', () => {
      setEntries({ [COMMUNITY]: { [TYPE_A]: 'recently', [TYPE_B]: minutesAgo(1) } });

      expect(readCoolOffEntries()).toEqual({ [COMMUNITY]: { [TYPE_B]: minutesAgo(1) } });
    });

    test('drops entries older than the retention ceiling', () => {
      setEntries({ [COMMUNITY]: { [TYPE_A]: minutesAgo(RETENTION_CEILING_MINUTES + 1), [TYPE_B]: minutesAgo(1) } });

      expect(readCoolOffEntries()).toEqual({ [COMMUNITY]: { [TYPE_B]: minutesAgo(1) } });
    });

    test('returns an empty object when reading from storage throws', () => {
      setEntries({ [COMMUNITY]: { [TYPE_A]: minutesAgo(1) } });
      throwOnStorage('getItem');

      expect(readCoolOffEntries()).toEqual({});
    });
  });

  describe('getCoolOffExpiry', () => {
    test('resolves the window from the submission time and the period passed in', () => {
      const entries = { [COMMUNITY]: { [TYPE_A]: 1755561600 } };

      expect(getCoolOffExpiry(entries, COMMUNITY, TYPE_A, 30)).toBe((1755561600 + 1800) * 1000);
    });

    test('applies a larger period to an entry recorded under a smaller one', () => {
      const entries = { [COMMUNITY]: { [TYPE_A]: minutesAgo(30) } };

      const expiry = getCoolOffExpiry(entries, COMMUNITY, TYPE_A, 120);

      expect(expiry).toBeGreaterThan(Date.now());
    });

    test('applies a smaller period to an entry recorded under a larger one', () => {
      const entries = { [COMMUNITY]: { [TYPE_A]: minutesAgo(30) } };

      const expiry = getCoolOffExpiry(entries, COMMUNITY, TYPE_A, 10);

      expect(expiry).toBeLessThan(Date.now());
    });

    test('never reads a window length out of the stored entries themselves', () => {
      const entries = { [COMMUNITY]: { [TYPE_A]: 1755561600 } };

      expect(getCoolOffExpiry(entries, COMMUNITY, TYPE_A, 10))
        .not.toBe(getCoolOffExpiry(entries, COMMUNITY, TYPE_A, 20));
    });

    test('returns null when the period is zero', () => {
      const entries = { [COMMUNITY]: { [TYPE_A]: nowSeconds() } };

      expect(getCoolOffExpiry(entries, COMMUNITY, TYPE_A, 0)).toBeNull();
    });

    test('returns null when the period is missing', () => {
      const entries = { [COMMUNITY]: { [TYPE_A]: nowSeconds() } };

      expect(getCoolOffExpiry(entries, COMMUNITY, TYPE_A, undefined)).toBeNull();
    });

    test('returns null for an event type with no recorded submission', () => {
      expect(getCoolOffExpiry({ [COMMUNITY]: { [TYPE_A]: 1755561600 } }, COMMUNITY, TYPE_B, 30)).toBeNull();
    });

    test('returns null for a different community input', () => {
      expect(getCoolOffExpiry({ [COMMUNITY]: { [TYPE_A]: 1755561600 } }, 'other', TYPE_A, 30)).toBeNull();
    });

    test('returns null when there are no entries at all', () => {
      expect(getCoolOffExpiry({}, COMMUNITY, TYPE_A, 30)).toBeNull();
    });

    test('caps a submission time in the future at one period from now', () => {
      const entries = { [COMMUNITY]: { [TYPE_A]: nowSeconds() + (365 * 24 * 60 * 60) } };

      const expiry = getCoolOffExpiry(entries, COMMUNITY, TYPE_A, 30);

      expect(expiry).toBeLessThanOrEqual(Date.now() + (30 * ONE_MINUTE_IN_MS));
    });
  });

  describe('recordCoolOffSubmission', () => {
    test('persists the submission time rather than a resolved expiry', () => {
      const before = nowSeconds();

      const entries = recordCoolOffSubmission(COMMUNITY, TYPE_A, 30);

      expect(entries[COMMUNITY][TYPE_A]).toBeGreaterThanOrEqual(before);
      expect(entries[COMMUNITY][TYPE_A]).toBeLessThanOrEqual(Math.ceil(Date.now() / 1000));
    });

    test('stores the same value no matter what the period is', () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-19T12:00:00.000Z'));

      const shortPeriod = recordCoolOffSubmission(COMMUNITY, TYPE_A, 5);
      window.localStorage.clear();
      const longPeriod = recordCoolOffSubmission(COMMUNITY, TYPE_A, 500);

      expect(shortPeriod[COMMUNITY][TYPE_A]).toBe(longPeriod[COMMUNITY][TYPE_A]);
    });

    test('the persisted entry survives a fresh read of storage', () => {
      recordCoolOffSubmission(COMMUNITY, TYPE_A, 30);

      expect(getCoolOffExpiry(readCoolOffEntries(), COMMUNITY, TYPE_A, 30)).not.toBeNull();
    });

    test('records event types of the same community independently', () => {
      recordCoolOffSubmission(COMMUNITY, TYPE_A, 30);
      recordCoolOffSubmission(COMMUNITY, TYPE_B, 30);

      const entries = readCoolOffEntries();
      expect(entries[COMMUNITY][TYPE_A]).toBeDefined();
      expect(entries[COMMUNITY][TYPE_B]).toBeDefined();
    });

    test('writes nothing when the cool off period is zero', () => {
      recordCoolOffSubmission(COMMUNITY, TYPE_A, 0);

      expect(readStoredValue()).toBeNull();
    });

    test('writes nothing when the cool off period is missing', () => {
      recordCoolOffSubmission(COMMUNITY, TYPE_A, undefined);

      expect(readStoredValue()).toBeNull();
    });

    test('prunes entries of this community that the live period has already released', () => {
      setEntries({ [COMMUNITY]: { [TYPE_B]: minutesAgo(90) } });

      recordCoolOffSubmission(COMMUNITY, TYPE_A, 30);

      expect(readCoolOffEntries()[COMMUNITY][TYPE_B]).toBeUndefined();
    });

    test('keeps entries of this community that the live period still covers', () => {
      setEntries({ [COMMUNITY]: { [TYPE_B]: minutesAgo(90) } });

      recordCoolOffSubmission(COMMUNITY, TYPE_A, 120);

      expect(readCoolOffEntries()[COMMUNITY][TYPE_B]).toBeDefined();
    });

    test('keeps entries of other communities whose applicable period is unknown', () => {
      setEntries({ 'other-community': { [TYPE_B]: minutesAgo(90) } });

      recordCoolOffSubmission(COMMUNITY, TYPE_A, 5);

      expect(readCoolOffEntries()['other-community'][TYPE_B]).toBeDefined();
    });

    test('drops entries of other communities once past the retention ceiling', () => {
      setEntries({ 'other-community': { [TYPE_B]: minutesAgo(RETENTION_CEILING_MINUTES + 1) } });

      recordCoolOffSubmission(COMMUNITY, TYPE_A, 30);

      expect(readCoolOffEntries()['other-community']).toBeUndefined();
    });

    test('returns the recorded entries even when writing to storage throws', () => {
      throwOnStorage('setItem');

      expect(recordCoolOffSubmission(COMMUNITY, TYPE_A, 30)[COMMUNITY][TYPE_A]).toBeDefined();
    });
  });
});
