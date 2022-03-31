import { injectStylesToElement } from './styles';

describe('Styles utils', () => {
  describe('injectStylesToElement', () => {
    test('injects an object of styles to a dom node', () => {
      const element = document.createElement('div');
      const styles = { fontSize: '14px', padding: '4px', margin: '10px' };
      injectStylesToElement(element, styles);

      expect(element.style.fontSize).toBe('14px');
      expect(element.style.padding).toBe('4px');
      expect(element.style.margin).toBe('10px');
    });
  });
});
