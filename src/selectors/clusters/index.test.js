import { selectShouldEventsBeClustered, selectShouldSubjectsBeClustered } from './';

describe('Selectors - Clusters', () => {
  let state;
  beforeEach(() => {
    state = {
      data: {
        mapLayerFilter: {
          showReportsOnMap: true,
        },
      },
      view: {
        mapClusterConfig: {
          data: {
            events: true,
            subjects: true,
          },
        },
        timeSliderState: {
          active: false,
        },
      },
    };
  });

  describe('selectShouldEventsBeClustered', () => {
    test('clusters events if the events map clustering is enabled, the reports are shown on the map, and the time slider is not active', () => {
      expect(selectShouldEventsBeClustered(state)).toEqual(true);
    });

    test('does not cluster events if the events map clustering is not enabled', () => {
      state.view.mapClusterConfig.data.events = false;

      expect(selectShouldEventsBeClustered(state)).toEqual(false);
    });

    test('does not cluster events if the reports are not shown on the map', () => {
      state.data.mapLayerFilter.showReportsOnMap = false;

      expect(selectShouldEventsBeClustered(state)).toEqual(false);
    });

    test('does not cluster events if the time slider is active', () => {
      state.view.timeSliderState.active = true;

      expect(selectShouldEventsBeClustered(state)).toEqual(false);
    });
  });

  describe('selectShouldSubjectsBeClustered', () => {
    test('clusters subjects if the subjects map clustering is enabled and the time slider is not active', () => {
      expect(selectShouldSubjectsBeClustered(state)).toEqual(true);
    });

    test('does not cluster subjects if the subjects map clustering is not enabled', () => {
      state.view.mapClusterConfig.data.subjects = false;

      expect(selectShouldSubjectsBeClustered(state)).toEqual(false);
    });

    test('does not cluster subjects if the time slider is active', () => {
      state.view.timeSliderState.active = true;

      expect(selectShouldSubjectsBeClustered(state)).toEqual(false);
    });
  });
});
