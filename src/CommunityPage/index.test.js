import { Provider } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import { act, render, screen, waitFor } from '../test-utils';
import CommunityPage from './';
import ReportManager from '../ReportManager';
import { fetchCommunityInfo } from '../ducks/community';
import { fetchEventTypes } from '../ducks/event-types';
import { fetchEventsSchema } from '../ducks/event-schemas';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../ReportManager', () => jest.fn());

jest.mock('../ducks/community', () => ({
  ...jest.requireActual('../ducks/community'),
  fetchCommunityInfo: jest.fn(),
}));

jest.mock('../ducks/event-types', () => ({
  ...jest.requireActual('../ducks/event-types'),
  fetchEventTypes: jest.fn(),
}));

jest.mock('../ducks/event-schemas', () => ({
  ...jest.requireActual('../ducks/event-schemas'),
  fetchEventsSchema: jest.fn(),
}));

// Fixtures - two distinct creatable types used throughout
const COMMUNITY_VALUE = 'test-community';
const TYPE_A = {
  id: 'd0884b8c-4ecb-45da-841d-f2f8d6246abf',
  value: 'jtar',
  display: 'Jenae Test Auto Resolve',
  is_collection: false,
  readonly: false,
};
const TYPE_B = {
  id: '60b4bcb2-655e-4526-abdc-3ed7fb83d360',
  value: 'jenae92f',
  display: 'Jenae Field Event DO NOT CHANGE',
  is_collection: false,
  readonly: false,
};
const READONLY_TYPE = eventTypes.find((t) => t.readonly);
const COLLECTION_TYPE = {
  id: 'collection-type-id',
  value: 'incident_collection',
  display: 'Incident',
  is_collection: true,
  readonly: false,
};

const extraCreatableTypes = (count) => Array.from({ length: count }, (_, index) => ({
  id: `extra-type-${index}`,
  value: `extra_type_${index}`,
  display: `Extra Type ${index}`,
  is_collection: false,
  readonly: false,
}));

const COOL_OFF_STORAGE_KEY = 'er-community-cooloff';

const setCoolOffEntries = (entries) =>
  window.localStorage.setItem(COOL_OFF_STORAGE_KEY, JSON.stringify(entries));

const submittedMinutesAgo = (minutes) => Math.floor(Date.now() / 1000) - (minutes * 60);

const throwOnStorage = (method) => jest.spyOn(Storage.prototype, method).mockImplementation(() => {
  throw new DOMException('denied', 'SecurityError');
});

describe('CommunityPage', () => {
  let navigate;

  const buildStore = (types = [TYPE_A, TYPE_B], community = { name: 'Test Community' }) =>
    mockStore({ data: { community, eventTypes: types } });

  const renderPage = (types, community) =>
    render(
      <Provider store={buildStore(types, community)}>
        <CommunityPage />
      </Provider>
    );

  beforeEach(() => {
    window.localStorage.clear();

    fetchCommunityInfo.mockReturnValue(() => Promise.resolve({ name: 'Test Community' }));
    fetchEventTypes.mockReturnValue(() => Promise.resolve());
    fetchEventsSchema.mockReturnValue(() => Promise.resolve());

    navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': '' });
    ReportManager.mockImplementation(() => null);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    jest.useRealTimers();
    window.localStorage.clear();
  });

  describe('type selection view', () => {
    test('renders the community name as the page heading', async () => {
      renderPage();
      expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent('Test Community');
    });

    test('renders a button for each creatable event type', async () => {
      renderPage();
      expect(await screen.findByTestId(`categoryList-button-${TYPE_A.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`categoryList-button-${TYPE_B.id}`)).toBeInTheDocument();
    });

    test('does not render readonly event types', async () => {
      renderPage([TYPE_A, TYPE_B, READONLY_TYPE]);
      await screen.findByTestId(`categoryList-button-${TYPE_A.id}`);
      expect(screen.queryByTestId(`categoryList-button-${READONLY_TYPE.id}`)).not.toBeInTheDocument();
    });

    test('does not render collection event types', async () => {
      renderPage([TYPE_A, TYPE_B, COLLECTION_TYPE]);
      await screen.findByTestId(`categoryList-button-${TYPE_A.id}`);
      expect(screen.queryByTestId(`categoryList-button-${COLLECTION_TYPE.id}`)).not.toBeInTheDocument();
    });

    test('renders an empty list when there are no creatable types', async () => {
      renderPage([]);
      await screen.findByRole('heading', { level: 2 });
      expect(screen.queryByTestId(`categoryList-button-${TYPE_A.id}`)).not.toBeInTheDocument();
    });
  });

  describe('data fetching', () => {
    test('dispatches fetchEventTypes with the community value on mount', () => {
      renderPage();
      expect(fetchEventTypes).toHaveBeenCalledWith(COMMUNITY_VALUE);
    });

    test('dispatches fetchEventsSchema with the community value on mount', () => {
      renderPage();
      expect(fetchEventsSchema).toHaveBeenCalledWith(COMMUNITY_VALUE);
    });

    test('re-fetches event types when the community value changes', () => {
      const { rerender } = renderPage();

      useParams.mockReturnValue({ value: 'other-community', '*': '' });
      rerender(
        <Provider store={buildStore()}>
          <CommunityPage />
        </Provider>
      );

      expect(fetchEventTypes).toHaveBeenCalledWith('other-community');
    });
  });

  describe('search', () => {
    const typesAboveSearchThreshold = [TYPE_A, TYPE_B, ...extraCreatableTypes(6)];

    test('filters types by display name as the user types', async () => {
      renderPage(typesAboveSearchThreshold);
      const searchInput = await screen.findByPlaceholderText('Search event types...');

      await userEvent.type(searchInput, 'Auto Resolve');

      expect(screen.getByTestId(`categoryList-button-${TYPE_A.id}`)).toBeInTheDocument();
      expect(screen.queryByTestId(`categoryList-button-${TYPE_B.id}`)).not.toBeInTheDocument();
    });

    test('restores the full list after clearing the search', async () => {
      renderPage(typesAboveSearchThreshold);
      const searchInput = await screen.findByPlaceholderText('Search event types...');

      await userEvent.type(searchInput, 'Auto Resolve');
      expect(screen.queryByTestId(`categoryList-button-${TYPE_B.id}`)).not.toBeInTheDocument();

      await userEvent.clear(searchInput);

      expect(screen.getByTestId(`categoryList-button-${TYPE_A.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`categoryList-button-${TYPE_B.id}`)).toBeInTheDocument();
    });

    test('shows no types when the search term matches nothing', async () => {
      renderPage(typesAboveSearchThreshold);
      const searchInput = await screen.findByPlaceholderText('Search event types...');

      await userEvent.type(searchInput, 'zzznomatch');

      expect(screen.queryByTestId(`categoryList-button-${TYPE_A.id}`)).not.toBeInTheDocument();
      expect(screen.queryByTestId(`categoryList-button-${TYPE_B.id}`)).not.toBeInTheDocument();
    });

    test('search is case-insensitive', async () => {
      renderPage(typesAboveSearchThreshold);
      const searchInput = await screen.findByPlaceholderText('Search event types...');

      await userEvent.type(searchInput, 'auto resolve');

      expect(screen.getByTestId(`categoryList-button-${TYPE_A.id}`)).toBeInTheDocument();
    });
  });

  describe('search bar visibility', () => {
    const SEARCH_PLACEHOLDER = 'Search event types...';

    test('hides the search bar when there are fewer than eight creatable types', async () => {
      renderPage(extraCreatableTypes(7));

      await screen.findByTestId('categoryList-button-extra-type-0');
      expect(screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
    });

    test('shows the search bar at eight creatable types', async () => {
      renderPage(extraCreatableTypes(8));

      expect(await screen.findByPlaceholderText(SEARCH_PLACEHOLDER)).toBeInTheDocument();
    });

    test('shows a working search bar well above the threshold', async () => {
      renderPage([TYPE_A, ...extraCreatableTypes(20)]);
      const searchInput = await screen.findByPlaceholderText(SEARCH_PLACEHOLDER);

      await userEvent.type(searchInput, 'Auto Resolve');

      expect(screen.getByTestId(`categoryList-button-${TYPE_A.id}`)).toBeInTheDocument();
      expect(screen.queryByTestId('categoryList-button-extra-type-0')).not.toBeInTheDocument();
    });

    test('does not count collection or readonly types toward the threshold', async () => {
      const readonlyTypes = eventTypes.filter((type) => type.readonly).slice(0, 3);
      renderPage([...extraCreatableTypes(7), COLLECTION_TYPE, ...readonlyTypes]);

      await screen.findByTestId('categoryList-button-extra-type-0');
      expect(screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
      expect(screen.getAllByTestId(/^categoryList-button-/)).toHaveLength(7);
    });

    test('drops an active filter and shows every remaining type when the list falls below the threshold', async () => {
      const { rerender } = renderPage([TYPE_A, ...extraCreatableTypes(7)]);
      const searchInput = await screen.findByPlaceholderText(SEARCH_PLACEHOLDER);

      await userEvent.type(searchInput, 'Auto Resolve');
      expect(screen.queryByTestId('categoryList-button-extra-type-0')).not.toBeInTheDocument();

      rerender(
        <Provider store={buildStore(extraCreatableTypes(7))}>
          <CommunityPage />
        </Provider>
      );

      expect(await screen.findAllByTestId(/^categoryList-button-/)).toHaveLength(7);
      expect(screen.queryByPlaceholderText(SEARCH_PLACEHOLDER)).not.toBeInTheDocument();
    });
  });

  describe('type selection navigation', () => {
    test('navigates to /community/:value/:typeValue when an event type is clicked', async () => {
      renderPage();
      await userEvent.click(await screen.findByTestId(`categoryList-button-${TYPE_A.id}`));
      expect(navigate).toHaveBeenCalledWith(`/community/${COMMUNITY_VALUE}/${TYPE_A.value}`);
    });

    test('navigates to the correct type URL for each type clicked', async () => {
      renderPage();
      await userEvent.click(await screen.findByTestId(`categoryList-button-${TYPE_B.id}`));
      expect(navigate).toHaveBeenCalledWith(`/community/${COMMUNITY_VALUE}/${TYPE_B.value}`);
    });
  });

  describe('URL-driven type selection', () => {
    test('renders ReportManager when the URL contains a valid event type value', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      renderPage();
      await waitFor(() => expect(ReportManager).toHaveBeenCalled());
    });

    test('passes isCommunity to ReportManager', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      renderPage();
      await waitFor(() => expect(ReportManager).toHaveBeenCalledWith(
        expect.objectContaining({
          isCommunity: true,
        }),
        undefined
      ));
    });

    test('passes the matching event type id to ReportManager', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      renderPage();
      await waitFor(() => expect(ReportManager).toHaveBeenCalledWith(
        expect.objectContaining({ newReportTypeId: TYPE_A.id }),
        undefined
      ));
    });

    test('passes communityInputValue to ReportManager', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      renderPage();
      await waitFor(() => expect(ReportManager).toHaveBeenCalledWith(
        expect.objectContaining({
          communityInputValue: COMMUNITY_VALUE,
        }),
        undefined
      ));
    });

    test('passes a stable reportId across re-renders for the same event type', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      const { rerender } = renderPage();
      await waitFor(() => expect(ReportManager).toHaveBeenCalled());
      const firstCallId = ReportManager.mock.calls[0][0].reportId;

      rerender(
        <Provider store={buildStore()}>
          <CommunityPage />
        </Provider>
      );
      const secondCallId = ReportManager.mock.calls.at(-1)[0].reportId;

      expect(firstCallId).toBe(secondCallId);
    });

    test('generates a new reportId when switching to a different event type', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      const { rerender } = renderPage();
      await waitFor(() => expect(ReportManager).toHaveBeenCalled());
      const firstCallId = ReportManager.mock.calls[0][0].reportId;

      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_B.value });
      rerender(
        <Provider store={buildStore()}>
          <CommunityPage />
        </Provider>
      );
      const secondCallId = ReportManager.mock.calls.at(-1)[0].reportId;

      expect(firstCallId).not.toBe(secondCallId);
    });

    test('shows the type list instead of ReportManager when URL type value does not match any type', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': 'no-such-type' });
      renderPage();
      await screen.findByTestId(`categoryList-button-${TYPE_A.id}`);
      expect(ReportManager).not.toHaveBeenCalled();
    });

    test('shows the type list when there is no event type in the URL', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': '' });
      renderPage();
      await screen.findByRole('heading', { level: 2 });
      expect(ReportManager).not.toHaveBeenCalled();
    });
  });

  describe('form submission (onBack)', () => {
    let captureOnBack;

    beforeEach(() => {
      captureOnBack = undefined;
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      ReportManager.mockImplementation(({ onBack }) => {
        captureOnBack = onBack;
        return null;
      });
    });

    test('navigates back to the community type selection on form submission', async () => {
      renderPage();
      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());
      expect(navigate).toHaveBeenCalledWith(`/community/${COMMUNITY_VALUE}`);
    });

    test('shows the "Successfully Submitted" modal on form submission', async () => {
      renderPage();
      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());
      expect(await screen.findByText('Successfully Submitted')).toBeInTheDocument();
    });

    test('hides the "Successfully Submitted" modal after 3 seconds', async () => {
      jest.useFakeTimers();
      renderPage();

      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());
      expect(await screen.findByText('Successfully Submitted')).toBeInTheDocument();

      await act(async () => jest.advanceTimersByTime(3000));
      await act(async () => jest.runAllTimers());
      expect(screen.queryByText('Successfully Submitted')).not.toBeInTheDocument();
    });

    test('modal remains visible before the 3-second timeout elapses', async () => {
      jest.useFakeTimers();
      renderPage();

      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());

      await act(async () => jest.advanceTimersByTime(2999));
      expect(await screen.findByText('Successfully Submitted')).toBeInTheDocument();
    });

    test('modal can be dismissed early by closing it', async () => {
      renderPage();
      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());
      expect(await screen.findByText('Successfully Submitted')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(closeButton);

      await waitFor(() =>
        expect(screen.queryByText('Successfully Submitted')).not.toBeInTheDocument()
      );
    });
  });

  describe('single creatable type', () => {
    test('auto-redirects to the only creatable type when none is selected in the URL', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': '' });
      renderPage([TYPE_A]);
      await waitFor(() => expect(navigate).toHaveBeenCalledWith(
        `/community/${COMMUNITY_VALUE}/${TYPE_A.value}`,
        { replace: true }
      ));
    });

    test('refreshes the form in place (new reportId) instead of navigating on form submission', async () => {
      let captureOnBack;
      ReportManager.mockImplementation(({ onBack }) => {
        captureOnBack = onBack;
        return null;
      });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      renderPage([TYPE_A]);

      await waitFor(() => expect(captureOnBack).toBeDefined());
      const firstCallId = ReportManager.mock.calls.at(-1)[0].reportId;

      await act(async () => captureOnBack());

      const secondCallId = ReportManager.mock.calls.at(-1)[0].reportId;
      expect(secondCallId).not.toBe(firstCallId);
      expect(navigate).not.toHaveBeenCalledWith(`/community/${COMMUNITY_VALUE}`);
    });
  });

  describe('back-button navigation', () => {
    test('shows the type list when navigating back clears the event type from the URL', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      const { rerender } = renderPage();
      await waitFor(() => expect(ReportManager).toHaveBeenCalled());

      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': '' });
      rerender(
        <Provider store={buildStore()}>
          <CommunityPage />
        </Provider>
      );

      expect(await screen.findByTestId(`categoryList-button-${TYPE_A.id}`)).toBeInTheDocument();
    });
  });

  describe('cool off period', () => {
    const COMMUNITY_WITH_COOL_OFF = { name: 'Test Community', cool_off_period_minutes: 30 };

    const submitOnce = async (types, community) => {
      let captureOnBack;
      ReportManager.mockImplementation(({ onBack }) => {
        captureOnBack = onBack;
        return null;
      });

      const view = renderPage(types, community);
      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());
      view.unmount();

      ReportManager.mockClear();
      ReportManager.mockImplementation(() => null);
    };

    test('does not block submission when the community has no cool off period configured', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      await submitOnce();

      renderPage();

      await waitFor(() => expect(ReportManager).toHaveBeenCalled());
      expect(screen.queryByText('Please wait before submitting again')).not.toBeInTheDocument();
    });

    test('does not block submission when the cool off period is zero', async () => {
      const community = { name: 'Test Community', cool_off_period_minutes: 0 };
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      await submitOnce(undefined, community);

      renderPage(undefined, community);

      await waitFor(() => expect(ReportManager).toHaveBeenCalled());
      expect(screen.queryByText('Please wait before submitting again')).not.toBeInTheDocument();
    });

    test('blocks the event type that was just submitted', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      await submitOnce(undefined, COMMUNITY_WITH_COOL_OFF);

      renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

      expect(await screen.findByText('Please wait before submitting again')).toBeInTheDocument();
      expect(ReportManager).not.toHaveBeenCalled();
    });

    test('tells the user which event type is blocked and how long is left', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-19T12:00:00.000Z'));
      setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(0) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

      expect(await screen.findByText(
        `You recently submitted a ${TYPE_A.display} form. You can submit another one in 30 minutes.`
      )).toBeInTheDocument();
    });

    test('replaces the form with the blocked state as soon as the submission completes', async () => {
      let captureOnBack;
      ReportManager.mockImplementation(({ onBack }) => {
        captureOnBack = onBack;
        return null;
      });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());

      expect(await screen.findByText('Please wait before submitting again')).toBeInTheDocument();
    });

    test('counts a whole period down from a real submission made off a second boundary', async () => {
      jest.useFakeTimers();
      // Deliberately not on a whole second: the stored submission time is floored, so rounding the
      // countdown up must not add a second on top and read "30 minutes 1 second".
      jest.setSystemTime(new Date('2026-08-19T12:00:00.500Z'));

      let captureOnBack;
      ReportManager.mockImplementation(({ onBack }) => {
        captureOnBack = onBack;
        return null;
      });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());

      expect(await screen.findByText(
        `You recently submitted a ${TYPE_A.display} form. You can submit another one in 30 minutes.`
      )).toBeInTheDocument();
    });

    test('leaves a different event type submittable while another is cooling off', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      await submitOnce(undefined, COMMUNITY_WITH_COOL_OFF);

      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_B.value });
      renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

      await waitFor(() => expect(ReportManager).toHaveBeenCalledWith(
        expect.objectContaining({ newReportTypeId: TYPE_B.id }),
        undefined
      ));
      expect(screen.queryByText('Please wait before submitting again')).not.toBeInTheDocument();
    });

    test('does not block a cool off recorded for a different community input', async () => {
      setCoolOffEntries({ 'other-community': { [TYPE_A.value]: submittedMinutesAgo(0) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

      await waitFor(() => expect(ReportManager).toHaveBeenCalled());
    });

    test('does not block once the recorded cool off window has already elapsed', async () => {
      setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(31) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

      await waitFor(() => expect(ReportManager).toHaveBeenCalled());
      expect(screen.queryByText('Please wait before submitting again')).not.toBeInTheDocument();
    });

    test('lifts the block and restores the form when the window elapses while the page is open', async () => {
      jest.useFakeTimers();
      setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(29) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage(undefined, COMMUNITY_WITH_COOL_OFF);
      expect(await screen.findByText('Please wait before submitting again')).toBeInTheDocument();

      await act(async () => jest.advanceTimersByTime(61 * 1000));

      expect(screen.queryByText('Please wait before submitting again')).not.toBeInTheDocument();
      expect(ReportManager).toHaveBeenCalled();
    });

    test('still blocks when the period was raised after the submission was recorded', async () => {
      setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(30) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage(undefined, { name: 'Test Community', cool_off_period_minutes: 120 });

      expect(await screen.findByText('Please wait before submitting again')).toBeInTheDocument();
      expect(ReportManager).not.toHaveBeenCalled();
    });

    test('is already free when the period was lowered after the submission was recorded', async () => {
      setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(30) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage(undefined, { name: 'Test Community', cool_off_period_minutes: 10 });

      await waitFor(() => expect(ReportManager).toHaveBeenCalled());
      expect(screen.queryByText('Please wait before submitting again')).not.toBeInTheDocument();
    });

    test('counts down against the live period, not the one in force at submission time', async () => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2026-08-19T12:00:00.000Z'));
      setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(30) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage(undefined, { name: 'Test Community', cool_off_period_minutes: 120 });

      expect(await screen.findByText(
        `You recently submitted a ${TYPE_A.display} form. You can submit another one in 1 hour 30 minutes.`
      )).toBeInTheDocument();
    });

    test('turning the feature off releases an entry that is still inside its window', async () => {
      setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(0) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage(undefined, { name: 'Test Community', cool_off_period_minutes: 0 });

      await waitFor(() => expect(ReportManager).toHaveBeenCalled());
    });

    test('does not block while the community payload has not loaded yet', async () => {
      setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(0) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage(undefined, null);

      await waitFor(() => expect(ReportManager).toHaveBeenCalled());
    });

    test('offers a way back to the type list when there is more than one creatable type', async () => {
      setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(0) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

      await userEvent.click(await screen.findByRole('button', { name: 'Choose a different event type' }));

      expect(navigate).toHaveBeenCalledWith(`/community/${COMMUNITY_VALUE}`);
    });

    test('renders the blocked state on the auto-redirect path for a single creatable type', async () => {
      setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(0) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage([TYPE_A], COMMUNITY_WITH_COOL_OFF);

      expect(await screen.findByText('Please wait before submitting again')).toBeInTheDocument();
      expect(ReportManager).not.toHaveBeenCalled();
    });

    test('hides the type list link when there is only one creatable type', async () => {
      setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(0) } });
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

      renderPage([TYPE_A], COMMUNITY_WITH_COOL_OFF);

      await screen.findByText('Please wait before submitting again');
      expect(screen.queryByRole('button', { name: 'Choose a different event type' })).not.toBeInTheDocument();
    });

    describe('accessibility of the blocked state', () => {
      const renderBlockedPage = () => {
        setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(0) } });
        useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

        return renderPage(undefined, COMMUNITY_WITH_COOL_OFF);
      };

      test('keeps the ticking countdown out of a live region', async () => {
        renderBlockedPage();

        await screen.findByText('Please wait before submitting again');
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
      });

      test('announces the time remaining rounded to the minute', async () => {
        renderBlockedPage();

        await screen.findByText('Please wait before submitting again');
        expect(document.querySelector('[aria-live="polite"]')).toHaveTextContent('Time remaining: 30 minutes');
      });

      test('moves focus to the notice heading when the block engages', async () => {
        useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
        renderPage(undefined, COMMUNITY_WITH_COOL_OFF);
        await waitFor(() => expect(ReportManager).toHaveBeenCalled());

        setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(0) } });
        await act(async () => {
          window.dispatchEvent(new StorageEvent('storage', { key: COOL_OFF_STORAGE_KEY }));
        });

        expect(await screen.findByRole('heading', { name: 'Please wait before submitting again' }))
          .toHaveFocus();
      });
    });

    describe('storage unavailable', () => {
      beforeEach(() => useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value }));

      test('renders the form when reading from storage throws', async () => {
        throwOnStorage('getItem');

        renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

        await waitFor(() => expect(ReportManager).toHaveBeenCalled());
        expect(screen.queryByText('Please wait before submitting again')).not.toBeInTheDocument();
      });

      test('still submits and blocks for the session when writing to storage throws', async () => {
        throwOnStorage('setItem');
        let captureOnBack;
        ReportManager.mockImplementation(({ onBack }) => {
          captureOnBack = onBack;
          return null;
        });

        renderPage(undefined, COMMUNITY_WITH_COOL_OFF);
        await waitFor(() => expect(captureOnBack).toBeDefined());
        await act(async () => captureOnBack());

        expect(await screen.findByText('Successfully Submitted')).toBeInTheDocument();
        expect(await screen.findByText('Please wait before submitting again')).toBeInTheDocument();
      });
    });

    describe('another tab', () => {
      const renderThenRecordElsewhere = async () => {
        useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
        renderPage(undefined, COMMUNITY_WITH_COOL_OFF);
        await waitFor(() => expect(ReportManager).toHaveBeenCalled());

        setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(0) } });
      };

      test('blocks on the storage event raised by the other tab', async () => {
        await renderThenRecordElsewhere();

        await act(async () => {
          window.dispatchEvent(new StorageEvent('storage', { key: COOL_OFF_STORAGE_KEY }));
        });

        expect(await screen.findByText('Please wait before submitting again')).toBeInTheDocument();
      });

      test('blocks when this tab regains focus', async () => {
        await renderThenRecordElsewhere();

        await act(async () => {
          window.dispatchEvent(new Event('focus'));
        });

        expect(await screen.findByText('Please wait before submitting again')).toBeInTheDocument();
      });
    });

    describe('when the window elapses', () => {
      test('re-fetches the community payload exactly once', async () => {
        jest.useFakeTimers();
        setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(29) } });
        useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

        renderPage(undefined, COMMUNITY_WITH_COOL_OFF);
        await screen.findByText('Please wait before submitting again');
        fetchCommunityInfo.mockClear();

        await act(async () => jest.advanceTimersByTime(61 * 1000));
        await act(async () => jest.advanceTimersByTime(5 * 60 * 1000));

        expect(fetchCommunityInfo).toHaveBeenCalledTimes(1);
        expect(fetchCommunityInfo).toHaveBeenCalledWith(COMMUNITY_VALUE);
      });

      test('restores the form with a clean reportId', async () => {
        jest.useFakeTimers();
        useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });

        renderPage(undefined, COMMUNITY_WITH_COOL_OFF);
        await waitFor(() => expect(ReportManager).toHaveBeenCalled());
        const reportIdBeforeBlock = ReportManager.mock.calls.at(-1)[0].reportId;

        setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(29) } });
        await act(async () => {
          window.dispatchEvent(new StorageEvent('storage', { key: COOL_OFF_STORAGE_KEY }));
        });
        await screen.findByText('Please wait before submitting again');

        await act(async () => jest.advanceTimersByTime(61 * 1000));

        expect(ReportManager.mock.calls.at(-1)[0].reportId).not.toBe(reportIdBeforeBlock);
      });
    });

    describe('type list annotations', () => {
      beforeEach(() => {
        setCoolOffEntries({ [COMMUNITY_VALUE]: { [TYPE_A.value]: submittedMinutesAgo(0) } });
        useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': '' });
      });

      test('marks a cooling off event type as unavailable and says when it returns', async () => {
        renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

        const typeButton = await screen.findByTestId(`categoryList-button-${TYPE_A.id}`);
        expect(typeButton).toHaveAttribute('aria-disabled', 'true');
        expect(typeButton).toHaveAccessibleDescription('Available in 30 minutes');
      });

      test('leaves an event type that is not cooling off available', async () => {
        renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

        const typeButton = await screen.findByTestId(`categoryList-button-${TYPE_B.id}`);
        expect(typeButton).not.toHaveAttribute('aria-disabled');
        expect(typeButton).not.toHaveAccessibleDescription();
      });

      test('does not navigate when a cooling off event type is clicked', async () => {
        renderPage(undefined, COMMUNITY_WITH_COOL_OFF);

        await userEvent.click(await screen.findByTestId(`categoryList-button-${TYPE_A.id}`));

        expect(navigate).not.toHaveBeenCalled();
      });
    });
  });
});
