import userEvent from '@testing-library/user-event';

import { act, render, screen } from '../../test-utils';
import useNavigate from '../../hooks/useNavigate';
import useRunHostAction from '../../hostActions/useRunHostAction';
import useTargetOptions from './useTargetOptions';

import AtlasActionsPlayground, { SWITCH_DELAY_MS } from './';

jest.mock('../../hooks/useNavigate', () => jest.fn());
jest.mock('../../hostActions/useRunHostAction', () => jest.fn());
jest.mock('./useTargetOptions', () => jest.fn());

const SNARE_ID = 'b5a2b5f4-0c46-4b8f-9e8a-0a7c1d2e3f40';
const CARCASS_ID = 'c6b3c6a5-1d57-4c9a-8f9b-1b8d2e3f4a51';

const SIGHTING_TYPE_ID = '7d1b0a4e-6f3c-4c55-9a7e-2f1c3b4d5e6f';

const recent = (options) => ({ error: false, isLoading: false, options, results: [] });

const OPTIONS = {
  analyzers: [],
  events: recent([{ id: SNARE_ID, label: '#4471 · Snare · active' }, { id: CARCASS_ID, label: '#4472 · Carcass · active' }]),
  eventTypes: [{ id: 'snare-type', label: 'Snare' }],
  featureSets: [],
  patrols: recent([]),
  patrolTypes: [],
  subjectGroups: [],
  subjects: [],
  trackableSubjects: [],
  v2EventTypes: recent([{ id: SIGHTING_TYPE_ID, label: 'Wildlife sighting' }]),
};

describe('SideBar - AtlasActionsPlayground', () => {
  let navigate, runHostAction, user;
  beforeEach(() => {
    jest.useFakeTimers();
    navigate = jest.fn();
    runHostAction = jest.fn().mockResolvedValue({ ok: true, result: { map_centered: true } });
    useNavigate.mockReturnValue(navigate);
    useRunHostAction.mockReturnValue(runHostAction);
    useTargetOptions.mockReturnValue(OPTIONS);
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<AtlasActionsPlayground isActive />);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const getFile = () => JSON.parse(screen.getByLabelText('Action file (.action.json)').value);

  const chooseAction = (name) => user.selectOptions(screen.getByLabelText('Action'), name);

  test('writes the picked event into the file', async () => {
    await chooseAction('show_event');
    await user.selectOptions(screen.getByLabelText('Event'), CARCASS_ID);

    expect(getFile()).toEqual({ arguments: { event_id: CARCASS_ID }, name: 'show_event' });
  });

  test('runs the file, confirms, then opens the event once the delay is over', async () => {
    await chooseAction('show_event');
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByRole('status')).toHaveTextContent('show_event ran Opening the event…');
    expect(runHostAction).toHaveBeenCalledWith('show_event', { event_id: SNARE_ID });
    expect(screen.getByText(/"type": "otus:tool-result"/)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(SWITCH_DELAY_MS));

    expect(navigate).toHaveBeenCalledWith(`/events/${SNARE_ID}`, undefined);
  });

  test('opens the events tab with its filter showing after a filter change', async () => {
    await chooseAction('set_event_filter');
    await user.click(screen.getByLabelText('Snare'));

    expect(getFile()).toEqual({
      arguments: { event_type_ids: ['snare-type'], priorities: ['red'] },
      name: 'set_event_filter',
    });

    await user.click(screen.getByRole('button', { name: 'Run' }));
    await screen.findByRole('status');
    act(() => jest.advanceTimersByTime(SWITCH_DELAY_MS));

    expect(navigate).toHaveBeenCalledWith('/events', { state: { openPopover: 'filters' } });
  });

  test('stays put when the action fails, and shows why', async () => {
    runHostAction.mockResolvedValue({ error: { code: 'not_found', message: 'No event with id x.' }, ok: false });

    await chooseAction('show_event');
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByRole('status')).toHaveTextContent('show_event failed: not_found');
    act(() => jest.advanceTimersByTime(SWITCH_DELAY_MS));

    expect(screen.getByText('No event with id x.')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('stays put when "Show me the result" is unchecked', async () => {
    await chooseAction('show_event');
    await user.click(screen.getByLabelText('Show me the result'));
    await user.click(screen.getByRole('button', { name: 'Run' }));
    await screen.findByRole('status');
    act(() => jest.advanceTimersByTime(SWITCH_DELAY_MS));

    expect(navigate).not.toHaveBeenCalled();
  });

  test('says so, without running anything, when the edited file is not JSON', async () => {
    const file = screen.getByLabelText('Action file (.action.json)');
    await user.clear(file);
    await user.type(file, 'not json');
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(screen.getByRole('alert')).toHaveTextContent('That file isn\'t valid JSON');
    expect(runHostAction).not.toHaveBeenCalled();
  });
});
