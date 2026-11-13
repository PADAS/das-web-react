import { Provider } from 'react-redux';

import { mockStore } from '../__test-helpers/MockStore';
import { render, screen } from '../test-utils';
import { selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod } from '../selectors/tracks';

import TrackLength from './';

jest.mock('../selectors/tracks', () => ({
  ...jest.requireActual('../selectors/tracks'),
  selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod: jest.fn(),
}));

const TRACK = {
  track: {
    features: [{
      geometry: { coordinates: [[0, 0], [0, 0.1]], type: 'LineString' },
      properties: { id: 'subject-id' },
      type: 'Feature',
    }],
    type: 'FeatureCollection',
  },
};

describe('TrackLength', () => {
  beforeEach(() => {
    selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod.mockReturnValue([TRACK]);
  });

  const renderTrackLength = () => <Provider store={mockStore({})}>
    <TrackLength trackId="subject-id" />
  </Provider>;

  test('shows the length of the shown track', () => {
    render(renderTrackLength());

    expect(screen.getByText('11.12 kilometers')).toBeVisible();
  });

  test('does not render when the track of the subject is not shown', () => {
    selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod.mockReturnValue([]);

    render(renderTrackLength());

    expect(screen.queryByText('Track length')).not.toBeInTheDocument();
  });

  test('stops rendering when the track of the subject is hidden', () => {
    const { rerender } = render(renderTrackLength());

    selectSubjectTracksTrimmedToTrackTimeEnvelopeWithTimeOfDayPeriod.mockReturnValue([]);
    rerender(renderTrackLength());

    expect(screen.queryByText('Track length')).not.toBeInTheDocument();
  });
});
