import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { mockStore } from '../../__test-helpers/MockStore';
import { render, screen } from '../../test-utils';
import useRunHostAction from '../../hostActions/useRunHostAction';

import AtlasActionsPlayground from './';

jest.mock('../../hostActions/useRunHostAction', () => jest.fn());

const EVENT_ID = 'b5a2b5f4-0c46-4b8f-9e8a-0a7c1d2e3f40';

describe('SideBar - AtlasActionsPlayground', () => {
  let runHostAction, user;
  beforeEach(() => {
    runHostAction = jest.fn().mockResolvedValue({ ok: true, result: { map_centered: true } });
    useRunHostAction.mockReturnValue(runHostAction);
    user = userEvent.setup();

    render(<Provider store={mockStore({
      data: {
        eventStore: { [EVENT_ID]: { geojson: {}, id: EVENT_ID } },
        patrolStore: {},
        subjectGroups: [],
        subjectStore: {},
      },
    })}>
      <AtlasActionsPlayground />
    </Provider>);
  });

  const getFile = () => screen.getByLabelText('Action file (.action.json)');

  test('fills the file with an example of the chosen action, using an id the site has loaded', async () => {
    await user.selectOptions(screen.getByLabelText('Action'), 'show_event');

    expect(JSON.parse(getFile().value)).toEqual({ arguments: { event_id: EVENT_ID }, name: 'show_event' });
  });

  test('runs the file as an Atlas call and shows the message sent and the one sent back', async () => {
    await user.selectOptions(screen.getByLabelText('Action'), 'show_event');
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(runHostAction).toHaveBeenCalledWith('show_event', { event_id: EVENT_ID });
    expect(await screen.findByRole('status')).toHaveTextContent('show_event ran');
    expect(screen.getByText(/"type": "otus:tool-call"/)).toBeInTheDocument();
    expect(screen.getByText(/"type": "otus:tool-result"/)).toBeInTheDocument();
  });

  test('shows the error code when the action fails', async () => {
    runHostAction.mockResolvedValue({ error: { code: 'not_found', message: 'No event.' }, ok: false });

    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByRole('status')).toHaveTextContent('failed: not_found');
  });

  test('says so, without running anything, when the file is not JSON', async () => {
    await user.clear(getFile());
    await user.type(getFile(), 'not json');
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(screen.getByRole('alert')).toHaveTextContent('That file isn\'t valid JSON');
    expect(runHostAction).not.toHaveBeenCalled();
  });
});
