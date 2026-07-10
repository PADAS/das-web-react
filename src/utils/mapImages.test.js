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

describe('calcSvgImageIconId round-trip', () => {
  // Mirrors the reverse-parse the styleimagemissing handler performs on the id.
  const parse = (id) => {
    const [, icon_id, priority, width, height] = id.split('|');
    const parseSlot = (value) => (value === undefined || value === '' ? undefined : Number(value));
    return { icon_id, priority: parseSlot(priority), width: parseSlot(width), height: parseSlot(height) };
  };

  const shapes = [
    { icon_id: 'fire', priority: undefined, width: undefined, height: undefined },
    { icon_id: 'fire', priority: 200, width: undefined, height: undefined },
    { icon_id: 'fire', priority: 0, width: undefined, height: undefined },
    { icon_id: 'custom-marker', priority: 300, width: undefined, height: undefined },
    { icon_id: 'x', priority: 200, width: 24, height: 32 },
  ];

  it.each(shapes)('parse(build(%o)) recovers the icon_id and numeric slots', (shape) => {
    expect(parse(calcSvgImageIconId(shape))).toEqual(shape);
  });
});
