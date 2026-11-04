// GA4 drops events whose name is longer than this.
export const GA4_MAX_ACTION_LENGTH = 40;

export const expectActionWithinGa4Limit = (action) => {
  expect(action.length).toBeLessThanOrEqual(GA4_MAX_ACTION_LENGTH);
};

// Pass a category for a mock given to trackEventFactory, which receives (category, action, label); leave it out for
// a tracker's own track mock, which receives (action, label).
expect.extend({
  toHaveTrackedAction(trackMock, action, label, { category } = {}) {
    const expectedCall = [...(category === undefined ? [] : [category]), action, label];
    const wasCalled = trackMock.mock.calls.some((call) => this.equals(call, expectedCall));
    const isWithinLimit = action.length <= GA4_MAX_ACTION_LENGTH;

    return {
      message: () => !isWithinLimit
        ? `expected the action "${action}" to be ${GA4_MAX_ACTION_LENGTH} characters or fewer, it has ${action.length}`
        : `expected the tracker ${this.isNot ? 'not ' : ''}to be called with ${this.utils.printExpected(expectedCall)}`
          + `\nReceived calls: ${this.utils.printReceived(trackMock.mock.calls)}`,
      pass: wasCalled && isWithinLimit,
    };
  },
});
