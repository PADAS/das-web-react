import { Provider } from 'react-redux';
import userEvent from '@testing-library/user-event';

import { addModal } from '../ducks/modals';
import { createQuerySelectorMockImplementationWithHelpButtonReference } from '../__test-helpers/jiraSupportWidget';
import { DAS_HOST, PERMISSION_KEYS, PERMISSIONS, SYSTEM_CONFIG_FLAGS } from '../constants';
import { eventTypes } from '../__test-helpers/fixtures/event-types';
import { fetchTableauDashboard } from '../ducks/external-reporting';
import { hideDrawer } from '../ducks/drawer';
import { INITIAL_GEAR_STATE } from '../ducks/gear';
import { mockStore } from '../__test-helpers/MockStore';
import { render, screen, within } from '../test-utils';
import { useMatchMedia } from '../hooks';
import useNavigate from '../hooks/useNavigate';

import GlobalMenuDrawer, {
  COMMUNITY_SITE_URL,
  CONTACT_US_URL,
  ECOSCOPE_ANALYSIS_URL,
  GUNDI_PORTAL_URL,
  HELP_CENTER_SITE_URL,
  MOBILE_APP_STORE_URL,
  MOBILE_GOOGLE_PLAY_URL,
  RELEASE_NOTES_URL,
  SYSTEM_STATUS_URL,
  TRAINING_URL,
  USERS_GUIDE_SITE_URL,
} from './';

jest.mock('../ducks/modals', () => ({
  ...jest.requireActual('../ducks/modals'),
  addModal: jest.fn(),
}));
jest.mock('../ducks/external-reporting', () => ({
  ...jest.requireActual('../ducks/external-reporting'),
  fetchTableauDashboard: jest.fn(),
}));
jest.mock('../ducks/drawer', () => ({
  ...jest.requireActual('../ducks/drawer'),
  hideDrawer: jest.fn(),
}));
jest.mock('../hooks', () => ({
  ...jest.requireActual('../hooks'),
  useMatchMedia: jest.fn(),
}));
jest.mock('../hooks/useNavigate', () => jest.fn());
const mockTrack = jest.fn();
jest.mock('../utils/analytics', () => ({
  ...jest.requireActual('../utils/analytics'),
  trackEventFactory: () => ({ track: (...args) => mockTrack(...args) }),
}));

const ANDROID_USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) '
  + 'Chrome/130.0.0.0 Mobile Safari/537.36';
const ANDROID_TABLET_USER_AGENT = 'Mozilla/5.0 (Linux; Android 14; SM-X910) AppleWebKit/537.36 (KHTML, like Gecko) '
  + 'Chrome/130.0.0.0 Safari/537.36';
const IPHONE_USER_AGENT = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 '
  + '(KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1';

describe('GlobalMenuDrawer', () => {
  let addModalMock, fetchTableauDashboardMock, hideDrawerMock, navigate, store, useMatchMediaMock, useNavigateMock;
  beforeEach(() => {
    addModalMock = jest.fn(() => () => { });
    addModal.mockImplementation(addModalMock);
    fetchTableauDashboardMock = jest.fn(() => () => Promise.resolve({ display_url: 'tableau url ' }));
    fetchTableauDashboard.mockImplementation(fetchTableauDashboardMock);
    hideDrawerMock = jest.fn(() => () => { });
    hideDrawer.mockImplementation(hideDrawerMock);
    useMatchMediaMock = jest.fn(() => true);
    useMatchMedia.mockImplementation(useMatchMediaMock);
    navigate = jest.fn();
    useNavigateMock = jest.fn(() => navigate);
    useNavigate.mockImplementation(useNavigateMock);

    store = {
      data: {
        eventFilter: {},
        eventTypes,
        gear: { ...INITIAL_GEAR_STATE },
        selectedUserProfile: null,
        systemStatus: {
          server: { version: '' },
        },
        token: { access_token: '' },
        user: {
          permissions: {
            [PERMISSION_KEYS.EVENTS]: [PERMISSIONS.EXPORT],
            [PERMISSION_KEYS.PATROLS]: [PERMISSIONS.READ],
            [PERMISSION_KEYS.OBSERVATIONS]: [PERMISSIONS.EXPORT],
            alertrule: [PERMISSIONS.READ],
          }
        },
      },
      view: {
        drawer: {},
        systemConfig: {
          [SYSTEM_CONFIG_FLAGS.ALERTS]: true,
          [SYSTEM_CONFIG_FLAGS.EVENTS]: true,
          [SYSTEM_CONFIG_FLAGS.DAILY_REPORT]: true,
          [SYSTEM_CONFIG_FLAGS.KML_EXPORT]: true,
          [SYSTEM_CONFIG_FLAGS.PATROL_MANAGEMENT]: true,
          [SYSTEM_CONFIG_FLAGS.SUBJECTS]: true,
          [SYSTEM_CONFIG_FLAGS.TABLEAU]: true,
        },
      },
    };
  });

  const mockUserAgent = (userAgent) => jest.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);

  const renderGlobalMenuDrawer = () => render(<Provider store={mockStore(store)}>
    <GlobalMenuDrawer />
  </Provider>);

  test('hides the drawer when clicking the cross icon', async () => {
    renderGlobalMenuDrawer();

    expect(hideDrawer).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Close main menu' }));

    expect(hideDrawer).toHaveBeenCalledTimes(1);
  });

  test('does not render the navigation buttons in desktop screens', async () => {
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('navigation')).toBeNull();
  });

  test('renders the navigation buttons in small screens', async () => {
    useMatchMedia.mockImplementation(() => false);
    renderGlobalMenuDrawer();

    const navigation = screen.getByRole('navigation');

    expect(within(navigation).getByRole('link', { name: 'Events' })).toBeDefined();
    expect(within(navigation).getByRole('link', { name: 'Patrols' })).toBeDefined();
    expect(within(navigation).getByRole('link', { name: 'Map Layers' })).toBeDefined();
    expect(within(navigation).getByRole('link', { name: 'Settings' })).toBeDefined();
  });

  test('does not show the Patrols link if user does not have permissions', async () => {
    useMatchMedia.mockImplementation(() => false);
    store.data.user.permissions = {};
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('link', { name: 'Patrols' })).toBeNull();
  });

  test('shows the Atlas link in small screens when an Atlas URL is configured', async () => {
    useMatchMedia.mockImplementation(() => false);
    store.view.systemConfig.atlasUrl = 'https://atlas.example.com';
    renderGlobalMenuDrawer();

    expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Atlas' })).toBeVisible();
  });

  test('does not show the Atlas link in small screens when there is no Atlas URL', async () => {
    useMatchMedia.mockImplementation(() => false);
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('link', { name: 'Atlas' })).not.toBeInTheDocument();
  });

  test('does not show the Events link if events are not enabled', async () => {
    useMatchMedia.mockImplementation(() => false);
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
    renderGlobalMenuDrawer();

    expect(within(screen.getByRole('navigation')).queryByRole('link', { name: 'Events' })).toBeNull();
  });

  test('shows the Gear link if the site has gear', async () => {
    useMatchMedia.mockImplementation(() => false);
    store.data.gear.hasGear = true;
    renderGlobalMenuDrawer();

    expect(within(screen.getByRole('navigation')).getByRole('link', { name: 'Gear' })).toHaveAttribute('href', '/gear');
  });

  test('does not show the Gear link if the site has no gear', async () => {
    useMatchMedia.mockImplementation(() => false);
    renderGlobalMenuDrawer();

    expect(within(screen.getByRole('navigation')).queryByRole('link', { name: 'Gear' })).toBeNull();
  });

  test('does not show the Map Layers link if all layers are disabled', async () => {
    useMatchMedia.mockImplementation(() => false);
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.SUBJECTS] = false;
    renderGlobalMenuDrawer();

    expect(within(screen.getByRole('navigation')).queryByRole('link', { name: 'Map Layers' })).toBeNull();
  });

  test('does not show the Tableau button if it is not enabled', async () => {
    store.view.systemConfig.tableau_enabled = false;
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Tableau' })).toBeNull();
  });

  test('leaves no empty list items when Tableau and Alerts are off', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.TABLEAU] = false;
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.ALERTS] = false;
    renderGlobalMenuDrawer();

    screen.getAllByRole('listitem').forEach((listItem) => {
      expect(listItem).not.toBeEmptyDOMElement();
    });
  });

  test('opens a window to the tableau dashboard when clicking the Tableau button', async () => {
    global.open = jest.fn();
    renderGlobalMenuDrawer();

    expect(fetchTableauDashboard).toHaveBeenCalledTimes(0);
    expect(global.open).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Tableau' }));

    expect(fetchTableauDashboard).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledTimes(1);
    expect(global.open).toHaveBeenCalledWith('tableau url ', '_blank', 'noopener,noreferrer');
  });

  test('does not show the Alerts button if it is not enabled', async () => {
    store.view.systemConfig.alerts_enabled = false;
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Alerts' })).toBeNull();
  });

  test('opens the alerts modal when clicking the Alerts button', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Alerts' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Alerts');
  });

  test('forwards the click to the Jira Support Management widget Help button when clicking Contact Support', async () => {
    const [mockQuerySelector, mockHelpButton] = createQuerySelectorMockImplementationWithHelpButtonReference();
    jest.spyOn(global.document, 'querySelector').mockImplementation(mockQuerySelector);

    renderGlobalMenuDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Contact Support' }));

    expect(mockHelpButton.click).toHaveBeenCalled();
  });

  test('links Contact Support to the Help Center contact page when the Jira Help button is not available', async () => {
    renderGlobalMenuDrawer();

    const contactSupportLink = screen.getByRole('link', { name: 'Contact Support' });

    expect(contactSupportLink).toHaveAttribute('href', CONTACT_US_URL);
    expect(contactSupportLink).toHaveAttribute('target', '_blank');
  });

  test('opens the daily report modal when clicking the Daily Report button', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Daily Report' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Daily Report');
  });

  test('does not show the Master KML button if KML export is not enabled', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.KML_EXPORT] = false;
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Subject KML' })).toBeNull();
  });

  test('does not show the Master KML button if subjects are not enabled', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.SUBJECTS] = false;
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Subject KML' })).toBeNull();
  });

  test('opens the kml export modal when clicking the Master KML button', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Subject KML' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Subject KML');
  });

  test('does not show the subject Summary button if a user does not have export observation data permissions', async () => {
    delete store.data.user.permissions[PERMISSION_KEYS.OBSERVATIONS];
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Subject Summary' })).toBeNull();
  });

  test('does not show the subject Summary button if subjects are not enabled', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.SUBJECTS] = false;
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Subject Summary' })).toBeNull();
  });

  test('opens the subject information modal when clicking the Subject Summary button', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Subject Summary' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Subject Summary');
  });

  test('does not show the Observations button if a user does not have export observation data permissions', async () => {
    delete store.data.user.permissions[PERMISSION_KEYS.OBSERVATIONS];
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Observations' })).toBeNull();
  });

  test('opens the subject reports modal when clicking the Observations button', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Observations' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Observations');
  });

  test('does not show the Field Events button if events are not enabled', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('button', { name: 'Field Events' })).toBeNull();
  });

  test('opens the field reports modal when clicking the Field Events button', async () => {
    renderGlobalMenuDrawer();

    expect(addModal).toHaveBeenCalledTimes(0);

    await userEvent.click(screen.getByRole('button', { name: 'Field Events' }));

    expect(addModal).toHaveBeenCalledTimes(1);
    expect(addModal.mock.calls[0][0].title).toBe('Field Events');
  });

  test('shows the Ecoscope Analysis link and no longer shows the retired Ecoscope Downloader link', async () => {
    renderGlobalMenuDrawer();

    expect(screen.getByRole('link', { name: 'Ecoscope Analysis' })).toHaveAttribute('href', ECOSCOPE_ANALYSIS_URL);
    expect(screen.queryByRole('link', { name: 'Ecoscope Downloader' })).toBeNull();
  });

  test('does not show the Admin and Gundi links if the user is not staff', async () => {
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Gundi Integrations' })).toBeNull();
  });

  test('shows the Admin and Gundi links if the user is staff', async () => {
    store.data.user.is_staff = true;
    renderGlobalMenuDrawer();

    expect(screen.getByRole('link', { name: 'Admin' })).toHaveAttribute('href', `${DAS_HOST}/admin`);
    expect(screen.getByRole('link', { name: 'Gundi Integrations' })).toHaveAttribute('href', GUNDI_PORTAL_URL);
  });

  test('hides the Admin and Gundi links from a staff user acting as a non-staff profile', async () => {
    store.data.user.is_staff = true;
    store.data.selectedUserProfile = { id: 'profile-id', is_staff: false, username: 'ranger' };
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('link', { name: 'Admin' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Gundi Integrations' })).toBeNull();
  });

  test('shows the Admin and Gundi links to a non-staff user acting as a staff profile', async () => {
    store.data.selectedUserProfile = { id: 'profile-id', is_staff: true, username: 'admin' };
    renderGlobalMenuDrawer();

    expect(screen.getByRole('link', { name: 'Admin' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Gundi Integrations' })).toBeInTheDocument();
  });

  test('links Community, Help Center and User\'s Guide to their sites', async () => {
    renderGlobalMenuDrawer();

    expect(screen.getByRole('link', { name: 'Community' })).toHaveAttribute('href', COMMUNITY_SITE_URL);
    expect(screen.getByRole('link', { name: 'Help Center' })).toHaveAttribute('href', HELP_CENTER_SITE_URL);
    expect(screen.getByRole('link', { name: 'User\'s Guide' })).toHaveAttribute('href', USERS_GUIDE_SITE_URL);
  });

  test('tracks a click on each external link', async () => {
    store.data.user.is_staff = true;
    renderGlobalMenuDrawer();

    const links = [
      ['Community', 'Community'],
      ['Help Center', 'Help Center'],
      ['User\'s Guide', 'Users Guide'],
      ['Admin', 'Admin'],
      ['Gundi Integrations', 'Gundi'],
      ['Ecoscope Analysis', 'Ecoscope Analysis'],
      ['App Store (iPhone)', 'Mobile App Store'],
      ['Google Play (Android)', 'Mobile Google Play'],
      ['What\'s New', 'What\'s New'],
      ['Training', 'Training'],
      ['System Status', 'System Status'],
    ];
    for (const [name] of links) {
      await userEvent.click(screen.getByRole('link', { name }));
    }

    links.forEach(([, analyticsLabel]) => {
      expect(mockTrack).toHaveBeenCalledWith(`Click '${analyticsLabel}' menu item`);
    });
  });

  test('tracks the store link at the top of the menu on a phone as a top link', async () => {
    mockUserAgent(IPHONE_USER_AGENT);
    renderGlobalMenuDrawer();

    await userEvent.click(screen.getByRole('link', { name: 'App Store (iPhone)' }));

    expect(mockTrack).toHaveBeenCalledWith('Click \'Mobile App Store\' top link');
  });

  test('names the Gundi and Ecoscope links with their visible label followed by their tag', async () => {
    store.data.user.is_staff = true;
    renderGlobalMenuDrawer();

    expect(screen.getByRole('link', { name: 'Gundi Integrations' })).toHaveTextContent('Gundi Integrations');
    expect(screen.getByRole('link', { name: 'Ecoscope Analysis' })).toHaveTextContent('Ecoscope Analysis');
  });

  test('lists Ecoscope Analysis under EarthRanger Apps, not under Exports, for non-staff users too', async () => {
    renderGlobalMenuDrawer();

    const ecoscopeLink = screen.getByRole('link', { name: 'Ecoscope Analysis' });

    expect(screen.getByRole('heading', { name: 'EarthRanger apps' }).compareDocumentPosition(ecoscopeLink))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(ecoscopeLink).toHaveTextContent('Ecoscope');
    expect(ecoscopeLink).toHaveTextContent('Analysis');
  });

  test('lists Gundi Integrations right after Admin, above the EarthRanger Mobile links', async () => {
    store.data.user.is_staff = true;
    renderGlobalMenuDrawer();

    const gundiLink = screen.getByRole('link', { name: 'Gundi Integrations' });

    expect(screen.getByRole('link', { name: 'Admin' }).compareDocumentPosition(gundiLink))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(gundiLink.compareDocumentPosition(screen.getByRole('link', { name: 'App Store (iPhone)' })))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('shows both EarthRanger Mobile store links on a device that is not a phone', async () => {
    renderGlobalMenuDrawer();

    expect(screen.getByRole('link', { name: 'App Store (iPhone)' })).toHaveAttribute('href', MOBILE_APP_STORE_URL);
    expect(screen.getByRole('link', { name: 'Google Play (Android)' }))
      .toHaveAttribute('href', MOBILE_GOOGLE_PLAY_URL);
  });

  test('shows only the App Store link, above the rest of the menu, on an iPhone', async () => {
    mockUserAgent(IPHONE_USER_AGENT);
    renderGlobalMenuDrawer();

    const appStoreLink = screen.getByRole('link', { name: 'App Store (iPhone)' });

    expect(appStoreLink).toHaveAttribute('href', MOBILE_APP_STORE_URL);
    expect(appStoreLink.compareDocumentPosition(screen.getByRole('button', { name: 'Tableau' })))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.queryByRole('link', { name: 'Google Play (Android)' })).toBeNull();
  });

  test('shows both EarthRanger Mobile store links in the apps section on an Android tablet', async () => {
    mockUserAgent(ANDROID_TABLET_USER_AGENT);
    renderGlobalMenuDrawer();

    expect(screen.getByRole('link', { name: 'App Store (iPhone)' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Google Play (Android)' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: 'EarthRanger Mobile' })).toBeInTheDocument();
  });

  test('shows only the Google Play link, above the rest of the menu, on an Android phone', async () => {
    mockUserAgent(ANDROID_USER_AGENT);
    renderGlobalMenuDrawer();

    const googlePlayLink = screen.getByRole('link', { name: 'Google Play (Android)' });

    expect(googlePlayLink).toHaveAttribute('href', MOBILE_GOOGLE_PLAY_URL);
    expect(googlePlayLink.compareDocumentPosition(screen.getByRole('button', { name: 'Tableau' })))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(screen.queryByRole('link', { name: 'App Store (iPhone)' })).toBeNull();
  });

  test('shows the EarthRanger Apps heading with Ecoscope to a non-staff user on a phone', async () => {
    mockUserAgent(ANDROID_USER_AGENT);
    renderGlobalMenuDrawer();

    expect(screen.getByRole('heading', { name: 'EarthRanger apps' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Ecoscope Analysis' })).toBeInTheDocument();
  });

  test('lists Admin and Gundi under the EarthRanger Apps heading for a staff user on a phone', async () => {
    mockUserAgent(IPHONE_USER_AGENT);
    store.data.user.is_staff = true;
    renderGlobalMenuDrawer();

    const appsHeading = screen.getByRole('heading', { name: 'EarthRanger apps' });

    expect(appsHeading.compareDocumentPosition(screen.getByRole('link', { name: 'Admin' })))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(appsHeading.compareDocumentPosition(screen.getByRole('link', { name: 'Gundi Integrations' })))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('does not show the Exports heading when no export is available', async () => {
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.DAILY_REPORT] = false;
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.EVENTS] = false;
    store.view.systemConfig[SYSTEM_CONFIG_FLAGS.KML_EXPORT] = false;
    store.data.user.permissions[PERMISSION_KEYS.OBSERVATIONS] = [];
    renderGlobalMenuDrawer();

    expect(screen.queryByRole('heading', { name: 'Exports' })).toBeNull();
  });

  test('shows the EarthRanger Mobile heading of the top store link one level below the menu heading', async () => {
    mockUserAgent(IPHONE_USER_AGENT);
    renderGlobalMenuDrawer();

    expect(screen.getByRole('heading', { level: 3, name: 'EarthRanger Mobile' })).toBeInTheDocument();
  });

  test('lists Learn, with Help Center and User\'s Guide, above the exports', async () => {
    renderGlobalMenuDrawer();

    const learnHeading = screen.getByRole('heading', { name: 'Learn' });

    expect(learnHeading.compareDocumentPosition(screen.getByRole('heading', { name: 'Exports' })))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);

    expect(learnHeading.compareDocumentPosition(screen.getByRole('link', { name: 'Help Center' })))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
    expect(learnHeading.compareDocumentPosition(screen.getByRole('link', { name: 'User\'s Guide' })))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('shows the What\'s New, Training and System Status links', async () => {
    renderGlobalMenuDrawer();

    expect(screen.getByRole('link', { name: 'What\'s New' })).toHaveAttribute('href', RELEASE_NOTES_URL);
    expect(screen.getByRole('link', { name: 'Training' })).toHaveAttribute('href', TRAINING_URL);
    expect(screen.getByRole('link', { name: 'System Status' })).toHaveAttribute('href', SYSTEM_STATUS_URL);
  });

  test('lists the footer links above the versions and copyright', async () => {
    renderGlobalMenuDrawer();

    expect(screen.getByRole('link', { name: 'Data Privacy Policy' })
      .compareDocumentPosition(screen.getByText(/Server version/)))
      .toBe(Node.DOCUMENT_POSITION_FOLLOWING);
  });

  test('when the global menu drawer is open the close button gets focused and there is a focus trap', async () => {
    const { rerender } = renderGlobalMenuDrawer();

    const closeButton = screen.getByRole('button', { name: 'Close main menu' });

    expect(closeButton).not.toBe(document.activeElement);

    store.view.drawer = { drawerId: 'global-menu', isOpen: true };
    rerender(<Provider store={mockStore(store)}>
      <GlobalMenuDrawer />
    </Provider>);

    expect(closeButton).toBe(document.activeElement);

    await userEvent.keyboard('[Tab]');

    expect(screen.getByRole('button', { name: 'Tableau' })).toBe(document.activeElement);

    await userEvent.keyboard('{Shift>}[Tab]{/Shift}');

    expect(closeButton).toBe(document.activeElement);

    await userEvent.keyboard('{Shift>}[Tab]{/Shift}');
    const dataPrivacyPolicyLink = screen.getByRole('link', { name: 'Data Privacy Policy' });

    expect(dataPrivacyPolicyLink).toBe(document.activeElement);

    await userEvent.keyboard('{Shift>}[Tab]{/Shift}');

    expect(screen.getByRole('link', { name: 'Website Privacy Policy' })).toBe(document.activeElement);

    await userEvent.keyboard('[Tab]');

    expect(dataPrivacyPolicyLink).toBe(document.activeElement);

    await userEvent.keyboard('[Tab]');

    expect(closeButton).toBe(document.activeElement);
  });

  test('names the close button after the menu it closes, in its title too', () => {
    renderGlobalMenuDrawer();

    expect(screen.getByRole('button', { name: 'Close main menu' })).toHaveAttribute('title', 'Close main menu');
  });

  test('returns focus to the element that opened it when it closes', () => {
    const renderWithOpener = () => <Provider store={mockStore(store)}>
      <button type="button">Opener</button>

      <GlobalMenuDrawer />
    </Provider>;

    const { rerender } = render(renderWithOpener());

    screen.getByRole('button', { name: 'Opener' }).focus();

    store.view.drawer = { drawerId: 'global-menu', isOpen: true };
    rerender(renderWithOpener());

    expect(screen.getByRole('button', { name: 'Close main menu' })).toHaveFocus();

    store.view.drawer = { drawerId: 'global-menu', isOpen: false };
    rerender(renderWithOpener());

    expect(screen.getByRole('button', { name: 'Opener' })).toHaveFocus();
  });

  test('names its section headings in plain case for assistive technology', () => {
    renderGlobalMenuDrawer();

    expect(screen.getByRole('heading', { name: 'Learn' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Exports' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'EarthRanger apps' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'EarthRanger Mobile' })).toBeInTheDocument();
  });
});
