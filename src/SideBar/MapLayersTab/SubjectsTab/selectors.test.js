import {
  groupTracksFullyPinned,
  groupTracksPartiallyPinned,
  groupTracksFullyVisible,
  groupTracksPartiallyVisible,
} from './selectors';

import { getSubjectsWithViewableTrackingDataFromGroups } from '../../../utils/subjects';

jest.mock('../../../utils/subjects', () => ({
  getSubjectsWithViewableTrackingDataFromGroups: jest.fn()
}));


describe('SubjectGroupList selectors', () => {
  let mockState, mockProps;

  beforeEach(() => {
    mockState = {
      view: {
        heatmapSubjectIDs: [],
        subjectTrackState: {
          pinned: [],
          visible: []
        }
      },
      data: {
        tracks: {}
      }
    };

    mockProps = { subjects: [] };

    getSubjectsWithViewableTrackingDataFromGroups.mockReturnValue([
      { id: 'subject1' },
      { id: 'subject2' },
      { id: 'subject3' }
    ]);
  });

  describe('groupTracksFullyPinned', () => {
    it('returns true when all eligible subjects are pinned', () => {
      mockState.view.subjectTrackState.pinned = ['subject1', 'subject2', 'subject3'];

      const result = groupTracksFullyPinned(mockState, mockProps);

      expect(result).toBe(true);
    });

    it('returns false when only some subjects are pinned', () => {
      mockState.view.subjectTrackState.pinned = ['subject1'];

      const result = groupTracksFullyPinned(mockState, mockProps);

      expect(result).toBe(false);
    });
  });

  describe('groupTracksPartiallyPinned', () => {
    it('returns true when some but not all subjects are pinned', () => {
      mockState.view.subjectTrackState.pinned = ['subject1'];

      const result = groupTracksPartiallyPinned(mockState, mockProps);

      expect(result).toBe(true);
    });

    it('returns false when all subjects are pinned', () => {
      mockState.view.subjectTrackState.pinned = ['subject1', 'subject2', 'subject3'];

      const result = groupTracksPartiallyPinned(mockState, mockProps);

      expect(result).toBe(false);
    });
  });

  describe('groupTracksFullyVisible', () => {
    it('returns true when all eligible subjects are visible', () => {
      mockState.view.subjectTrackState.visible = ['subject1', 'subject2', 'subject3'];

      const result = groupTracksFullyVisible(mockState, mockProps);

      expect(result).toBe(true);
    });

    it('returns false when only some subjects are visible', () => {
      mockState.view.subjectTrackState.visible = ['subject1'];

      const result = groupTracksFullyVisible(mockState, mockProps);

      expect(result).toBe(false);
    });
  });

  describe('groupTracksPartiallyVisible', () => {
    it('returns intersection length when some but not all subjects are visible', () => {
      mockState.view.subjectTrackState.visible = ['subject1'];

      const result = groupTracksPartiallyVisible(mockState, mockProps);

      expect(result).toBe(1);
    });

    it('returns false when all subjects are visible', () => {
      mockState.view.subjectTrackState.visible = ['subject1', 'subject2', 'subject3'];

      const result = groupTracksPartiallyVisible(mockState, mockProps);

      expect(result).toBe(false);
    });
  });

});