import getDisplayableChoiceListOptions from '.';

describe('getDisplayableChoiceListOptions', () => {
  test('leaves only the descriptions for options whose displays are repeated, preserving the original order', () => {
    const options = [
      { value: 'v-zebra', display: 'Zebra', description: 'animal' },
      { value: 'v-ant-1', display: 'Ant', description: 'insect' },
      { value: 'v-mango', display: 'Mango', description: 'fruit' },
      { value: 'v-ant-2', display: 'Ant', description: 'insect colony' },
      { value: 'v-fig-1', display: 'Fig', description: 'fruit' },
      { value: 'v-banana', display: 'Banana' },
      { value: 'v-fig-2', display: 'Fig' },
    ];

    expect(getDisplayableChoiceListOptions(options)).toEqual([
      { value: 'v-zebra', display: 'Zebra', description: '' },
      { value: 'v-ant-1', display: 'Ant', description: 'insect' },
      { value: 'v-mango', display: 'Mango', description: '' },
      { value: 'v-ant-2', display: 'Ant', description: 'insect colony' },
      { value: 'v-fig-1', display: 'Fig', description: 'fruit' },
      { value: 'v-banana', display: 'Banana', description: '' },
      { value: 'v-fig-2', display: 'Fig', description: undefined },
    ]);

    expect(options).toEqual([
      { value: 'v-zebra', display: 'Zebra', description: 'animal' },
      { value: 'v-ant-1', display: 'Ant', description: 'insect' },
      { value: 'v-mango', display: 'Mango', description: 'fruit' },
      { value: 'v-ant-2', display: 'Ant', description: 'insect colony' },
      { value: 'v-fig-1', display: 'Fig', description: 'fruit' },
      { value: 'v-banana', display: 'Banana' },
      { value: 'v-fig-2', display: 'Fig' },
    ]);
  });
});
