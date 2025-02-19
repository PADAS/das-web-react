import React from 'react';
import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { render, screen } from '../../test-utils';
import { mockStore } from '../../__test-helpers/MockStore';

import SubjectTracksList from '.';

describe('SubjectTrackLegend - SubjectTracksList', () => {
  const onClose = jest.fn();
  const onRemoveSubjectTracks = jest.fn();

  let store;
  beforeEach(() => {
    store = {
      data: {
        subjectStore: {
          1234: {
            last_position: {
              properties: {
                image: 'https://root.dev.pamdas.org/static/elk-male.svg',
              },
            },
          },
          5678: {
            last_position: {
              properties: {
                image: 'https://root.dev.pamdas.org/static/bison-male.svg',
              },
            },
          },
        },
      },
    };
  });

  const renderSubjectTracksList = (props, overrideStore) => render(
    <Provider store={mockStore({ ...store, ...overrideStore })}>
      <SubjectTracksList
        onClose={onClose}
        onRemoveSubjectTracks={onRemoveSubjectTracks}
        subjectTracks={[{
          track: {
            features: [{
              geometry: {
                coordinates: [
                  [10, -15],
                ],
              },
              properties: {
                id: '1234',
                image: 'https://root.dev.pamdas.org/static/elk-male.svg',
                title: 'Ludwig',
              },
            }],
          },
        }, {
          track: {
            features: [{
              geometry: {
                coordinates: [
                  [12, 8],
                ],
              },
              properties: {
                id: '5678',
                image: 'https://root.dev.pamdas.org/static/bison-male.svg',
                title: 'Gabo',
              },
            }],
          },
        }]}
        {...props}
      />
    </Provider>
  );

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('closes the subject track list', () => {
    renderSubjectTracksList();

    expect(onClose).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Close the list of subjects'));

    expect(onClose).toHaveBeenCalledTimes(1);
  });

  test('lists all the subjects', () => {
    renderSubjectTracksList();

    expect(screen.getAllByRole('listitem')).toHaveLength(2);
  });

  test('shows the subject image', () => {
    renderSubjectTracksList();

    expect(screen.getByAltText('Icon for Ludwig'))
      .toHaveAttribute('src', 'https://root.dev.pamdas.org/static/elk-male.svg');
  });

  test('shows the subject title', () => {
    renderSubjectTracksList();

    expect(screen.getByText('Ludwig')).toBeVisible();
  });

  test('shows the point count of the subject tracks', () => {
    renderSubjectTracksList();

    expect(screen.getAllByText('1 point')).toHaveLength(2);
  });

  test('removes a subject from the tracks list', () => {
    renderSubjectTracksList();

    expect(onRemoveSubjectTracks).not.toHaveBeenCalled();

    userEvent.click(screen.getByLabelText('Remove Ludwig'));

    expect(onRemoveSubjectTracks).toHaveBeenCalledTimes(1);
    expect(onRemoveSubjectTracks).toHaveBeenCalledWith('1234');
  });
});
