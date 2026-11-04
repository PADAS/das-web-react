// GA4 drops events whose name is longer than this.
export const GA4_MAX_ACTION_LENGTH = 40;

export const expectActionWithinGa4Limit = (action) => {
  expect(action.length).toBeLessThanOrEqual(GA4_MAX_ACTION_LENGTH);
};

// A mock given to trackEventFactory also receives the category, first.
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
