import userEvent from '@testing-library/user-event';

import { act, render, screen } from '../../test-utils';
import useNavigate from '../../hooks/useNavigate';
import useRunHostAction from '../../hostActions/useRunHostAction';
import useSources from './useSources';

import AtlasActionsPlayground, { SWITCH_DELAY_MS } from './';

jest.mock('../../hooks/useNavigate', () => jest.fn());
jest.mock('../../hostActions/useRunHostAction', () => jest.fn());
jest.mock('./useSources', () => jest.fn());

const SNARE_ID = 'b5a2b5f4-0c46-4b8f-9e8a-0a7c1d2e3f40';
const CARCASS_ID = 'c6b3c6a5-1d57-4c9a-8f9b-1b8d2e3f4a51';
const RANGERS_ID = 'a1a1a1a1-0000-4000-8000-000000000001';
const DOGS_ID = 'a1a1a1a1-0000-4000-8000-000000000002';
const SIGHTING_TYPE_ID = '7d1b0a4e-6f3c-4c55-9a7e-2f1c3b4d5e6f';

const loaded = (options) => ({ error: false, isLoading: false, options });

const SOURCES = {
  analyzers: loaded([]),
  event_types: loaded([{ id: 'snare-type', label: 'Snare' }]),
  feature_sets: loaded([]),
  features: loaded([]),
  patrol_leaders: loaded([]),
  patrol_types: loaded([]),
  recent_events: loaded([{ id: SNARE_ID, label: '#4471 · Snare · active' }, { id: CARCASS_ID, label: '#4472 · Carcass · active' }]),
  recent_patrols: loaded([]),
  reporters: loaded([]),
  subject_groups: loaded([{ id: RANGERS_ID, label: 'Rangers' }, { id: DOGS_ID, label: 'Dogs' }]),
  subjects: loaded([]),
  trackable_subjects: loaded([
    { id: 'ranger-1', label: 'Amani', parents: { subject_groups: [RANGERS_ID] } },
    { id: 'dog-1', label: 'Rex', parents: { subject_groups: [DOGS_ID] } },
  ]),
  v2_event_types: loaded([{ id: SIGHTING_TYPE_ID, label: 'Wildlife sighting' }]),
};

describe('SideBar - AtlasActionsPlayground', () => {
  let navigate, runHostAction, user;
  beforeEach(() => {
    jest.useFakeTimers();
    navigate = jest.fn();
    runHostAction = jest.fn().mockResolvedValue({ ok: true, result: { map_centered: true } });
    useNavigate.mockReturnValue(navigate);
    useRunHostAction.mockReturnValue(runHostAction);
    useSources.mockReturnValue(SOURCES);
    user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    render(<AtlasActionsPlayground isActive />);
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  const getFile = () => JSON.parse(screen.getByLabelText('Action file (.action.json)').value);

  const chooseAction = (name) => user.selectOptions(screen.getByLabelText('Action'), name);

  const next = () => user.click(screen.getByRole('button', { name: 'Next' }));

  const goToReview = () => user.click(screen.getByRole('button', { name: /Review and run$/ }));

  test('builds the steps from the spec: one per data source, then options, then review', async () => {
    await chooseAction('set_event_filter');

    expect(screen.getAllByRole('listitem').map((item) => item.textContent).slice(0, 5)).toEqual([
      '1. Action',
      '2. Event types',
      '3. Reporters',
      '4. Options',
      '5. Review and run',
    ]);
  });

  test('narrows subjects to the groups picked in the step before', async () => {
    await chooseAction('pin_subject_tracks');
    await next();
    expect(screen.getByRole('heading', { name: 'Step 2 of 4: Subject groups' })).toBeInTheDocument();
    await user.click(screen.getByLabelText('Rangers'));

    await next();
    expect(screen.getByLabelText('Amani')).toBeInTheDocument();
    expect(screen.queryByLabelText('Rex')).not.toBeInTheDocument();

    await user.click(screen.getByLabelText(/Only those in the 1 subject groups you picked/));
    expect(screen.getByLabelText('Rex')).toBeInTheDocument();

    await user.click(screen.getByLabelText('Amani'));
    await goToReview();

    expect(getFile()).toEqual({
      arguments: { subject_group_ids: [RANGERS_ID], subject_ids: ['ranger-1'] },
      name: 'pin_subject_tracks',
    });
  });

  test('says why a list is empty when the site has none', async () => {
    useSources.mockReturnValue({ ...SOURCES, v2_event_types: loaded([]) });
    await chooseAction('draft_new_event');
    await next();

    expect(screen.getByText(/This site has no v2 event types/)).toBeInTheDocument();
  });

  test('keeps a required flag in the file even when it is off', async () => {
    await chooseAction('set_map_layer_visibility');
    await goToReview();

    expect(getFile()).toEqual({ arguments: { visible: false }, name: 'set_map_layer_visibility' });
  });

  test('runs the file, confirms, then opens the event once the delay is over', async () => {
    await chooseAction('show_event');
    await next();
    await user.selectOptions(screen.getByLabelText('Event *'), CARCASS_ID);
    await goToReview();
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByRole('status')).toHaveTextContent('show_event ran Opening the event…');
    expect(runHostAction).toHaveBeenCalledWith('show_event', { event_id: CARCASS_ID });
    expect(screen.getByText(/"type": "otus:tool-result"/)).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();

    act(() => jest.advanceTimersByTime(SWITCH_DELAY_MS));

    expect(navigate).toHaveBeenCalledWith(`/events/${CARCASS_ID}`, undefined);
  });

  test('opens the events tab with its filter showing after a filter change', async () => {
    await chooseAction('set_event_filter');
    await next();
    await user.click(screen.getByLabelText('Snare'));
    await goToReview();

    expect(getFile()).toEqual({ arguments: { event_type_ids: ['snare-type'] }, name: 'set_event_filter' });

    await user.click(screen.getByRole('button', { name: 'Run' }));
    await screen.findByRole('status');
    act(() => jest.advanceTimersByTime(SWITCH_DELAY_MS));

    expect(navigate).toHaveBeenCalledWith('/events', { state: { openPopover: 'filters' } });
  });

  test('stays put when the action fails, and shows why', async () => {
    runHostAction.mockResolvedValue({ error: { code: 'not_found', message: 'No event with id x.' }, ok: false });

    await chooseAction('show_event');
    await goToReview();
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(await screen.findByRole('status')).toHaveTextContent('show_event failed: not_found');
    act(() => jest.advanceTimersByTime(SWITCH_DELAY_MS));

    expect(screen.getByText('No event with id x.')).toBeInTheDocument();
    expect(navigate).not.toHaveBeenCalled();
  });

  test('stays put when "Show me the result" is unchecked', async () => {
    await chooseAction('show_event');
    await goToReview();
    await user.click(screen.getByLabelText('Show me the result'));
    await user.click(screen.getByRole('button', { name: 'Run' }));
    await screen.findByRole('status');
    act(() => jest.advanceTimersByTime(SWITCH_DELAY_MS));

    expect(navigate).not.toHaveBeenCalled();
  });

  test('says so, without running anything, when the edited file is not JSON', async () => {
    await goToReview();
    const file = screen.getByLabelText('Action file (.action.json)');
    await user.clear(file);
    await user.type(file, 'not json');
    await user.click(screen.getByRole('button', { name: 'Run' }));

    expect(screen.getByRole('alert')).toHaveTextContent('That file isn\'t valid JSON');
    expect(runHostAction).not.toHaveBeenCalled();
  });
});
