import { calcSvgImageIconId, EVENT_ICON_ID_PREFIX } from './mapImages';

describe('calcSvgImageIconId', () => {
  it('prefixes every key with the event-icon literal so it can be reverse-parsed', () => {
    expect(calcSvgImageIconId({ icon_id: 'fire' })).toBe(`${EVENT_ICON_ID_PREFIX}fire`);
  });

  it('returns the prefixed base icon_id when no priority, height, or width are provided', () => {
    expect(calcSvgImageIconId({ icon_id: 'fire' })).toBe('event-icon|fire');
  });

  it('appends priority to the base icon_id, pipe-separated', () => {
    expect(calcSvgImageIconId({ icon_id: 'fire', priority: 200 })).toBe('event-icon|fire|200');
  });

  it('treats a priority of 0 as a meaningful value rather than omitting it', () => {
    expect(calcSvgImageIconId({ icon_id: 'fire', priority: 0 })).toBe('event-icon|fire|0');
  });

  it('appends width and height when provided, alongside priority, matching the icon-image expression order', () => {
    expect(calcSvgImageIconId({ icon_id: 'fire', priority: 200, height: 32, width: 24 }))
      .toBe('event-icon|fire|200|24|32');
  });

  it('keeps hyphenated icon_ids intact (the reason for the pipe separator)', () => {
    expect(calcSvgImageIconId({ icon_id: 'custom-marker', priority: 300 })).toBe('event-icon|custom-marker|300');
  });
});
