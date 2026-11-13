import { BREAKPOINTS, TOP_BAR_POPOVER_POPPER_CONFIG } from './';

describe('constants', () => {
  describe('TOP_BAR_POPOVER_POPPER_CONFIG', () => {
    let state;

    beforeEach(() => {
      Object.defineProperty(document.documentElement, 'clientWidth', { configurable: true, value: 400 });

      state = { modifiersData: { popperOffsets: { x: 5, y: 60 } }, rects: { popper: { height: 300, width: 300 } } };
    });

    afterEach(() => {
      BREAKPOINTS.screenIsMediumLayoutOrLarger.matches = true;
    });

    const runCenterOnSmallScreensModifier = () => TOP_BAR_POPOVER_POPPER_CONFIG.modifiers
      .find((modifier) => modifier.name === 'centerOnSmallScreens')
      .fn({ state });

    test('centers the popover horizontally on small screens', () => {
      BREAKPOINTS.screenIsMediumLayoutOrLarger.matches = false;

      runCenterOnSmallScreensModifier();

      expect(state.modifiersData.popperOffsets).toEqual({ x: 50, y: 60 });
    });

    test('leaves the popover hanging from its toggle on medium screens and up', () => {
      runCenterOnSmallScreensModifier();

      expect(state.modifiersData.popperOffsets).toEqual({ x: 5, y: 60 });
    });

    test('keeps the popover from being transformed', () => {
      expect(TOP_BAR_POPOVER_POPPER_CONFIG.modifiers).toContainEqual({
        name: 'computeStyles',
        options: { gpuAcceleration: false },
      });
    });
  });
});
