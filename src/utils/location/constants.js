// The Permissions API's own vocabulary, plus "unknown" for the browsers that can't be asked. A read probe
// only ever reports "denied", "granted" or "unknown", since reading a position answers the prompt rather
// than observing it.
export const GEOLOCATION_PERMISSION_STATES = {
  DENIED: 'denied',
  GRANTED: 'granted',
  PROMPT: 'prompt',
  UNKNOWN: 'unknown',
};
