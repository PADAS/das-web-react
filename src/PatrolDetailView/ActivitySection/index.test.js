import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ActivitySection from './index';
import { Provider } from 'react-redux';
import { mockStore } from '../../__test-helpers/MockStore';
import patrols from '../../__test-helpers/fixtures/patrols';
import { notes, report } from '../../__test-helpers/fixtures/reports';
import userEvent from '@testing-library/user-event';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import { TrackerContext } from '../../utils/analytics';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { EVENT_API_URL } from '../../ducks/events';
import { EVENT_TYPE_SCHEMA_API_URL } from '../../ducks/event-schemas';


const server = setupServer(
  rest.get(
        `${EVENT_API_URL}:eventId`,
        (req, res, ctx) => res(ctx.json( { data: { ...report } }))
  ),
    rest.get(
        `${EVENT_TYPE_SCHEMA_API_URL}:name`,
        (req, res, ctx) => res(ctx.json( { data: { results: {} } }))
    )
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('PatrolDetailView - ActivitySection', () => {

  const patrol = patrols[0];
  const event = patrols[1];
  patrol.patrol_segments[0].events = [event];

  const initialProps = {
    patrol,
    patrolNotes: notes,
    containedReports: [],
    notesToAdd: [{
      creationDate: new Date().toISOString(),
      text: 'note2',
    }],
    onSaveNote: null,
    patrolAttachments: [{
      id: 'newAttachment',
      creationDate: new Date().toISOString(),
      file: { name: 'newFile2.pdf' },
    }]
  };

  const initialStore = {
    data: {
      eventSchemas: {},
      eventStore: {},
      eventTypes: [],
      patrolTypes: [],
    },
    view: {}
  };

  const renderActivitySection = ({
    patrol,
    patrolNotes,
    containedReports,
    notesToAdd,
    onSaveNote,
    patrolAttachments
  } = initialProps) => {
    return render(
      <Provider store={mockStore(initialStore)}>
        <NavigationWrapper>
          <ActivitySection
              patrol={patrol}
              patrolNotes={patrolNotes}
              containedReports={containedReports}
              notesToAdd={notesToAdd}
              onSaveNote={onSaveNote}
              patrolAttachments={patrolAttachments}
          />
        </NavigationWrapper>
      </Provider>
    );
  };

  test('expands a contained report when clicking the down arrow', async () => {
    renderActivitySection();
    const [ note ] = notes;
    const { id } = note;
    const reportCollapse = await screen.findByTestId(`reportManager-activitySection-collapse-${id}`);

    expect(reportCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`reportManager-activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(reportCollapse).toHaveClass('show');
    });
  });

  test('collapses a contained report when clicking the up arrow', async () => {
    renderActivitySection();
    const { id } = event;

    const expandButton = await screen.findByTestId(`reportManager-activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`reportManager-activitySection-arrowUp-${id}`);
    userEvent.click(collapseButton);

    const reportCollapse = await screen.findByTestId(`reportManager-activitySection-collapse-${id}`);

    await waitFor(() => {
      expect(reportCollapse).toHaveClass('collapse');
    });
  });


});
