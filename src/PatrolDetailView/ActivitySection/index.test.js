import React from 'react';
import { cleanup, render, screen, waitFor, within } from '@testing-library/react';
import ActivitySection from './index';
import { Provider } from 'react-redux';
import { mockStore } from '../../__test-helpers/MockStore';
import patrols from '../../__test-helpers/fixtures/patrols';
import { files, notes, report } from '../../__test-helpers/fixtures/reports';
import userEvent from '@testing-library/user-event';
import NavigationWrapper from '../../__test-helpers/navigationWrapper';
import { TrackerContext } from '../../utils/analytics';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { EVENT_API_URL } from '../../ducks/events';
import { EVENT_TYPE_SCHEMA_API_URL } from '../../ducks/event-schemas';

jest.mock('../../utils/file', () => ({
  ...jest.requireActual('../../utils/file'),
  fetchImageAsBase64FromUrl: jest.fn(),
}));

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

  const [mockedPatrol, event] = patrols;
  const { patrol_segments } = mockedPatrol;
  const [segment] = patrol_segments;
  const patrol = {
    ...mockedPatrol,
    patrol_segments: [
      {
        ...segment,
        events: [event],
        time_range: {
          start_time: '2023-03-01T11:50:15.348000-07:00',
          end_time: '2023-20-01T00:00:00'
        }
      },
    ]
  };

  const initialProps = {
    patrol,
    patrolNotes: notes,
    containedReports: [],
    notesToAdd: [{
      creationDate: new Date().toISOString(),
      text: 'note2',
    }],
    onSaveNote: null,
    patrolAttachments: files
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
          <TrackerContext.Provider value={{ track: jest.fn() }}>
            <ActivitySection
                patrol={patrol}
                patrolNotes={patrolNotes}
                containedReports={containedReports}
                notesToAdd={notesToAdd}
                onSaveNote={onSaveNote}
                patrolAttachments={patrolAttachments}
            />
          </TrackerContext.Provider>
        </NavigationWrapper>
      </Provider>
    );
  };

  beforeEach(() => renderActivitySection());

  test('expands a contained report when clicking the down arrow', async () => {
    const { id } = event;
    const reportCollapse = await screen.findByTestId(`reportManager-activitySection-collapse-${id}`);

    expect(reportCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`reportManager-activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(reportCollapse).toHaveClass('show');
    });
  });

  test('collapses a contained report when clicking the up arrow', async () => {
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

  test('expands an existing image attachment when clicking the down arrow', async () => {
    const [, imageAttachment ] = files;
    const { id } = imageAttachment;
    const imageCollapse = await screen.findByTestId(`reportManager-activitySection-collapse-${id}`);

    expect(imageCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`reportManager-activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(imageCollapse).toHaveClass('show');
    });
  });

  test('collapses an existing image attachment when clicking the up arrow', async () => {
    const [, imageAttachment ] = files;
    const { id } = imageAttachment;

    const expandButton = await screen.findByTestId(`reportManager-activitySection-arrowDown-${id}`);
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`reportManager-activitySection-arrowUp-${id}`);
    userEvent.click(collapseButton);

    const imageCollapse = await screen.findByTestId(`reportManager-activitySection-collapse-${id}`);

    await waitFor(() => {
      expect(imageCollapse).toHaveClass('collapse');
    });
  });

  test('expands an existing note when clicking the down arrow', async () => {
    const [ note ] = notes;
    const { id: noteId } = note;
    const noteCollapse = await screen.findByTestId(`reportManager-activitySection-collapse-${noteId}`);

    expect(noteCollapse).toHaveClass('collapse');

    const expandButton = await screen.findByTestId(`reportManager-activitySection-arrowDown-${noteId}`);
    userEvent.click(expandButton);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('show');
    });
  });

  test('collapses an existing note when clicking the up arrow', async () => {
    const [ note ] = notes;
    const { id: noteId } = note;
    const expandButton = await screen.findByTestId(`reportManager-activitySection-arrowDown-${noteId}`);
    userEvent.click(expandButton);
    const collapseButton = await screen.findByTestId(`reportManager-activitySection-arrowUp-${noteId}`);
    userEvent.click(collapseButton);

    const noteCollapse = await screen.findByTestId(`reportManager-activitySection-collapse-${noteId}`);

    await waitFor(() => {
      expect(noteCollapse).toHaveClass('collapse');
    });
  });

  test('sorts items by date', async () => {
    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findAllByText('Ended'))).toBeDefined();
    expect((await within(items[1]).findAllByText('Started'))).toBeDefined();
    expect((await within(items[4]).findAllByText('note4'))).toBeDefined();
    expect((await within(items[5]).findAllByText('note3'))).toBeDefined();
    expect((await within(items[6]).findAllByText('file1.png'))).toBeDefined();
  });

  test('inverts the sort direction when clicking the time sort button', async () => {
    const timeSortButton = await screen.findByTestId('time-sort-btn');
    userEvent.click(timeSortButton);

    const items = await screen.findAllByRole('listitem');

    expect((await within(items[0]).findAllByText('Ended'))).toBeDefined();
    expect((await within(items[3]).findAllByText('note4'))).toBeDefined();
    expect((await within(items[4]).findAllByText('note3'))).toBeDefined();
    expect((await within(items[7]).findAllByText('file1.png'))).toBeDefined();
    expect((await within(items[8]).findAllByText('Started'))).toBeDefined();
  });

  test('shows activity action buttons if there are items', async () => {
    expect((await screen.findByText('Expand All'))).toBeDefined();
    expect((await screen.findByTestId('time-sort-btn'))).toBeDefined();
  });

  test('hides activity action buttons if items list is empty', async () => {
    cleanup();
    renderActivitySection({
      ...initialProps,
      patrolNotes: [],
      containedReports: [],
      notesToAdd: [],
      patrolAttachments: []
    });

    expect((await screen.queryByText('Expand All'))).toBeNull();
    expect((await screen.queryByText('time-sort-btn'))).toBeNull();
  });

  test.only('expands all expandable items when clicking the button Expand All', async () => {
    const id = 'patrolDetailView-activitySection-expandCollapseButton';
    const expandCollapseButton = await screen.findByTestId(id);
    userEvent.click(expandCollapseButton);

    const collapses = await screen.findAllByTestId((content) => content.startsWith('reportManager-activitySection-collapse'));

    await waitFor(() => {
      collapses.forEach((collapse, index) => {
        console.log(index);
        expect(collapse).toHaveClass('show');
      });
    });
  });

  test('collapses all expandable items when clicking the button Collapse All', async () => {
    const id = 'patrolDetailView-activitySection-expandCollapseButton';
    const expandCollapseButton = await screen.findByTestId(id);
    userEvent.click(expandCollapseButton);

    const collapses = await screen.findAllByTestId((content) => content.startsWith('reportManager-activitySection-collapse'));

    await waitFor(() => {
      collapses.forEach((collapse) => expect(collapse).toHaveClass('show'));
    });

    userEvent.click(expandCollapseButton);

    await waitFor(() => {
      collapses.forEach((collapse) => expect(collapse).toHaveClass('collapse'));
    });
  });


});
