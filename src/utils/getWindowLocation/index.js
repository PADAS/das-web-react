// After updating to Jest 30, mocking of window.location is no longer possible
// https://github.com/jsdom/jsdom/issues/3492
// The intention of this file is just to provide an easy way to mock
// window.location properties in tests.
const getWindowLocation = () => window.location;

export default getWindowLocation;
