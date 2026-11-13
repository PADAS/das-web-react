// GA4 drops events whose name is longer than this.
export const GA4_MAX_ACTION_LENGTH = 40;

// A mock given to trackEventFactory also receives the category, first.
expect.extend({
  toHaveTrackedAction(trackMock, action, label, { category } = {}) {
    if (action.length > GA4_MAX_ACTION_LENGTH) {
      throw new Error(`expected the action "${action}" to be ${GA4_MAX_ACTION_LENGTH} characters or fewer, `
        + `it has ${action.length}`);
    }

    const expectedCall = [...(category === undefined ? [] : [category]), action, label];
    const pass = trackMock.mock.calls.some((call) => this.equals(call, expectedCall));

    return {
      message: () => `expected the tracker ${this.isNot ? 'not ' : ''}to be called with `
        + `${this.utils.printExpected(expectedCall)}\n`
        + `Received calls: ${this.utils.printReceived(trackMock.mock.calls)}`,
      pass,
    };
  },
});
