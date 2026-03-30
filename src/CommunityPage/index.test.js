import { Provider } from 'react-redux';
import { useNavigate, useParams } from 'react-router';
import userEvent from '@testing-library/user-event';

import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { mockStore } from '../__test-helpers/MockStore';
import { act, render, screen, waitFor } from '../test-utils';
import CommunityPage from './';
import ReportManager from '../ReportManager';

jest.mock('react-router', () => ({
  ...jest.requireActual('react-router'),
  useNavigate: jest.fn(),
  useParams: jest.fn(),
}));

jest.mock('../ReportManager', () => jest.fn());

jest.mock('../ducks/event-types', () => ({
  ...jest.requireActual('../ducks/event-types'),
  fetchEventTypes: jest.fn(() => () => Promise.resolve()),
}));

jest.mock('../ducks/event-schemas', () => ({
  ...jest.requireActual('../ducks/event-schemas'),
  fetchEventsSchema: jest.fn(() => () => Promise.resolve()),
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

describe('CommunityPage', () => {
  let navigate;

  const buildStore = (types = [TYPE_A, TYPE_B]) =>
    mockStore({ data: { eventTypes: types } });

  const renderPage = (types) =>
    render(
      <Provider store={buildStore(types)}>
        <CommunityPage />
      </Provider>
    );

  beforeEach(() => {
    const { fetchEventTypes } = require('../ducks/event-types');
    const { fetchEventsSchema } = require('../ducks/event-schemas');
    fetchEventTypes.mockReturnValue(() => Promise.resolve());
    fetchEventsSchema.mockReturnValue(() => Promise.resolve());

    navigate = jest.fn();
    useNavigate.mockReturnValue(navigate);
    useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': '' });
    ReportManager.mockImplementation(() => null);
  });

  describe('type selection view', () => {
    test('renders the community name as the page heading', async () => {
      renderPage();
      expect(await screen.findByRole('heading', { level: 2 })).toHaveTextContent(COMMUNITY_VALUE);
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
    test('dispatches fetchEventTypes with community_input and skipAuth on mount', () => {
      const { fetchEventTypes } = require('../ducks/event-types');
      renderPage();
      expect(fetchEventTypes).toHaveBeenCalledWith(
        { community_input: COMMUNITY_VALUE },
        { skipAuth: true }
      );
    });

    test('dispatches fetchEventsSchema with community_input and skipAuth on mount', () => {
      const { fetchEventsSchema } = require('../ducks/event-schemas');
      renderPage();
      expect(fetchEventsSchema).toHaveBeenCalledWith(
        { community_input: COMMUNITY_VALUE },
        { skipAuth: true }
      );
    });

    test('re-fetches event types when the community value changes', () => {
      const { fetchEventTypes } = require('../ducks/event-types');
      const { rerender } = renderPage();

      useParams.mockReturnValue({ value: 'other-community', '*': '' });
      rerender(
        <Provider store={buildStore()}>
          <CommunityPage />
        </Provider>
      );

      expect(fetchEventTypes).toHaveBeenCalledWith(
        { community_input: 'other-community' },
        { skipAuth: true }
      );
    });
  });

  describe('search', () => {
    test('filters types by display name as the user types', async () => {
      renderPage();
      const searchInput = await screen.findByPlaceholderText('Search event types...');

      await userEvent.type(searchInput, 'Auto Resolve');

      expect(screen.getByTestId(`categoryList-button-${TYPE_A.id}`)).toBeInTheDocument();
      expect(screen.queryByTestId(`categoryList-button-${TYPE_B.id}`)).not.toBeInTheDocument();
    });

    test('restores the full list after clearing the search', async () => {
      renderPage();
      const searchInput = await screen.findByPlaceholderText('Search event types...');

      await userEvent.type(searchInput, 'Auto Resolve');
      expect(screen.queryByTestId(`categoryList-button-${TYPE_B.id}`)).not.toBeInTheDocument();

      await userEvent.clear(searchInput);

      expect(screen.getByTestId(`categoryList-button-${TYPE_A.id}`)).toBeInTheDocument();
      expect(screen.getByTestId(`categoryList-button-${TYPE_B.id}`)).toBeInTheDocument();
    });

    test('shows no types when the search term matches nothing', async () => {
      renderPage();
      const searchInput = await screen.findByPlaceholderText('Search event types...');

      await userEvent.type(searchInput, 'zzznomatch');

      expect(screen.queryByTestId(`categoryList-button-${TYPE_A.id}`)).not.toBeInTheDocument();
      expect(screen.queryByTestId(`categoryList-button-${TYPE_B.id}`)).not.toBeInTheDocument();
    });

    test('search is case-insensitive', async () => {
      renderPage();
      const searchInput = await screen.findByPlaceholderText('Search event types...');

      await userEvent.type(searchInput, 'auto resolve');

      expect(screen.getByTestId(`categoryList-button-${TYPE_A.id}`)).toBeInTheDocument();
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

    test('passes isCommunity, hidePriority and hideReportedBy to ReportManager', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      renderPage();
      await waitFor(() => expect(ReportManager).toHaveBeenCalledWith(
        expect.objectContaining({
          isCommunity: true,
          hidePriority: true,
          hideReportedBy: true,
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

    test('passes community_input in saveExtraParams to ReportManager', async () => {
      useParams.mockReturnValue({ value: COMMUNITY_VALUE, '*': TYPE_A.value });
      renderPage();
      await waitFor(() => expect(ReportManager).toHaveBeenCalledWith(
        expect.objectContaining({
          saveExtraParams: { community_input: COMMUNITY_VALUE },
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

    test('shows the "Form Submitted" modal on form submission', async () => {
      renderPage();
      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());
      expect(await screen.findByText('Form Submitted')).toBeInTheDocument();
    });

    test('hides the "Form Submitted" modal after 3 seconds', async () => {
      jest.useFakeTimers();
      renderPage();

      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());
      expect(await screen.findByText('Form Submitted')).toBeInTheDocument();

      await act(async () => jest.advanceTimersByTime(3000));
      await act(async () => jest.runAllTimers());
      expect(screen.queryByText('Form Submitted')).not.toBeInTheDocument();

      jest.useRealTimers();
    });

    test('modal remains visible before the 3-second timeout elapses', async () => {
      jest.useFakeTimers();
      renderPage();

      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());

      await act(async () => jest.advanceTimersByTime(2999));
      expect(await screen.findByText('Form Submitted')).toBeInTheDocument();

      jest.useRealTimers();
    });

    test('modal can be dismissed early by closing it', async () => {
      renderPage();
      await waitFor(() => expect(captureOnBack).toBeDefined());
      await act(async () => captureOnBack());
      expect(await screen.findByText('Form Submitted')).toBeInTheDocument();

      const closeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(closeButton);

      await waitFor(() =>
        expect(screen.queryByText('Form Submitted')).not.toBeInTheDocument()
      );
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
});
