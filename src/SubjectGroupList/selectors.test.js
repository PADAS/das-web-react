import {
  TRACKING_CONTROL_STATES,
  groupTracksFullyPinned,
  groupTracksPartiallyPinned,
  groupTracksFullyVisible,
  groupTracksPartiallyVisible,
  subjectGroupTrackingControlsState
} from './selectors';

import { getSubjectsWithViewableTrackingDataFromGroups } from '../utils/subjects';

jest.mock('../utils/subjects', () => ({
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

  describe('subjectGroupTrackingControlsState', () => {
    it('returns correct state for pinned tracks', () => {
      mockState.view.subjectTrackState.pinned = ['subject1', 'subject2', 'subject3'];
      mockState.data.tracks = {
        subject1: { track: {} },
        subject2: { track: {} },
        subject3: { track: {} }
      };

      const result = subjectGroupTrackingControlsState(mockState, mockProps);

      expect(result).toEqual({
        showTrackingControls: true,
        subjectIDsWithTrackingData: ['subject1', 'subject2', 'subject3'],
        groupTrackingDataState: {
          heatmap: null,
          track: TRACKING_CONTROL_STATES.FULLY_PINNED
        },
        unloadedSubjectTrackIDs: []
      });
    });

    it('returns correct state for visible tracks', () => {
      mockState.view.subjectTrackState.visible = ['subject1', 'subject2', 'subject3'];
      mockState.data.tracks = {
        subject1: { track: {} },
        subject2: { track: {} },
        subject3: { track: {} }
      };

      const result = subjectGroupTrackingControlsState(mockState, mockProps);

      expect(result).toEqual({
        showTrackingControls: true,
        subjectIDsWithTrackingData: ['subject1', 'subject2', 'subject3'],
        groupTrackingDataState: {
          heatmap: null,
          track: TRACKING_CONTROL_STATES.FULLY_VISIBLE
        },
        unloadedSubjectTrackIDs: []
      });
    });

    it('returns correct state for heatmap subjects', () => {
      mockState.view.heatmapSubjectIDs = ['subject1', 'subject2', 'subject3'];
      mockState.data.tracks = {
        subject1: { track: {} },
        subject2: { track: {} },
        subject3: { track: {} }
      };

      const result = subjectGroupTrackingControlsState(mockState, mockProps);

      expect(result).toEqual({
        showTrackingControls: true,
        subjectIDsWithTrackingData: ['subject1', 'subject2', 'subject3'],
        groupTrackingDataState: {
          heatmap: TRACKING_CONTROL_STATES.FULLY_HEATMAPPED,
          track: null
        },
        unloadedSubjectTrackIDs: []
      });
    });

    it('identifies unloaded tracks', () => {
      mockState.data.tracks = {
        subject1: { track: {} }
      };

      const result = subjectGroupTrackingControlsState(mockState, mockProps);

      expect(result.unloadedSubjectTrackIDs).toEqual(['subject2', 'subject3']);
    });
  });
});