import { calcTitleAndSubtitle } from './titles';

describe('calcTitleAndSubtitle', () => {
  test('goes by the type of an item without a title, without repeating it below', () => {
    expect(calcTitleAndSubtitle(null, 'Snare')).toEqual({ subtitle: null, title: 'Snare' });
    expect(calcTitleAndSubtitle(undefined, 'Snare')).toEqual({ subtitle: null, title: 'Snare' });
  });

  test('reads a blank title as no title', () => {
    expect(calcTitleAndSubtitle('', 'Snare')).toEqual({ subtitle: null, title: 'Snare' });
    expect(calcTitleAndSubtitle('   ', 'Snare')).toEqual({ subtitle: null, title: 'Snare' });
  });

  test('does not repeat the type below a title that is the type', () => {
    expect(calcTitleAndSubtitle('Snare', 'Snare')).toEqual({ subtitle: null, title: 'Snare' });
    expect(calcTitleAndSubtitle(' Snare ', 'Snare')).toEqual({ subtitle: null, title: ' Snare ' });
  });

  test('shows the type below a title of its own', () => {
    expect(calcTitleAndSubtitle('Broken fence snare', 'Snare'))
      .toEqual({ subtitle: 'Snare', title: 'Broken fence snare' });
  });

  test('keeps the title of an item without a type and shows nothing below it', () => {
    expect(calcTitleAndSubtitle('Broken fence snare', null)).toEqual({ subtitle: null, title: 'Broken fence snare' });
    expect(calcTitleAndSubtitle('', null)).toEqual({ subtitle: null, title: '' });
    expect(calcTitleAndSubtitle(null, null)).toEqual({ subtitle: null, title: '' });
  });

  test('gives an empty title to an item with a blank title and no type', () => {
    expect(calcTitleAndSubtitle('   ', null)).toEqual({ subtitle: null, title: '' });
  });
});
