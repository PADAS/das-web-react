[![NodeJS](https://img.shields.io/badge/node.js-5FA04E?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Yarn](https://img.shields.io/badge/yarn-2C8EBB?style=flat-square&logo=yarn&logoColor=white)](https://yarnpkg.com/)
[![Vite](https://img.shields.io/badge/vite-9135FF?style=flat-square&logo=vite&logoColor=white)](https://vite.dev/)
[![React](https://img.shields.io/badge/react-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![React Router](https://img.shields.io/badge/react_router-CA4245?style=flat-square&logo=react-router&logoColor=white)](https://reactrouter.com/)
[![Redux](https://img.shields.io/badge/redux-764ABC?style=flat-square&logo=redux&logoColor=white)](https://redux.js.org/)
[![Mapbox](https://img.shields.io/badge/mapbox_gl-000000?style=flat-square&logo=mapbox&logoColor=white)](https://docs.mapbox.com/mapbox-gl-js/)
[![Bootstrap](https://img.shields.io/badge/bootstrap-7952B3?style=flat-square&logo=bootstrap&logoColor=white)](https://react-bootstrap.github.io/)
[![Sass](https://img.shields.io/badge/sass-CC6699?style=flat-square&logo=sass&logoColor=white)](https://sass-lang.com/)
[![Socket.IO](https://img.shields.io/badge/socket.io-010101?style=flat-square&logo=socket.io&logoColor=white)](https://socket.io/)
[![i18next](https://img.shields.io/badge/i18next-26A69A?style=flat-square&logo=i18next&logoColor=white)](https://www.i18next.com/)
[![ESLint](https://img.shields.io/badge/eslint-4B32C3?style=flat-square&logo=eslint&logoColor=white)](https://eslint.org/)
[![Stylelint](https://img.shields.io/badge/stylelint-263238?style=flat-square&logo=stylelint&logoColor=white)](https://stylelint.io/)
[![Jest](https://img.shields.io/badge/jest-C21325?style=flat-square&logo=jest&logoColor=white)](https://jestjs.io/)
[![Testing Library](https://img.shields.io/badge/testing_library-E33332?style=flat-square&logo=testing-library&logoColor=white)](https://testing-library.com/)
[![MSW](https://img.shields.io/badge/msw-FF6A33?style=flat-square&logo=mockserviceworker&logoColor=white)](https://mswjs.io/)

# EarthRanger Web Client

EarthRanger Web Client is the [React](https://react.dev/) single-page application that control-room operators, protected-area managers and conservation staff use to run [EarthRanger](https://www.earthranger.com/), a real-time operational platform for protected areas. It puts sensor telemetry, field reports and partner data on one live map, so teams can see what is happening across a site and respond:

- **Events:** triage and resolve what rangers, sensors and integrations report, from a snare found to a geofence breach.
- **Subjects and tracks:** follow collared animals, rangers, vehicles and fixed sensors, with their tracks and heatmaps.
- **Patrols:** plan, run and review field patrols, leg by leg.
- **Map layers:** spatial features, analyzers, basemaps and ropeless fishing gear.
- **Messaging and time slider:** text subjects in the field, and replay the map at a past moment.

Every site (tenant) serves the client from its own domain, and the client talks only to that site's [DAS](https://github.com/PADAS/das) backend, EarthRanger's server, which stores all data and configuration. Much of what the client shows is created by rangers in EarthRanger Mobile.

> [!TIP]
> **Use an AI agent to get to know the repository.** [`AGENTS.md`](AGENTS.md) holds the full project context. Open the repository with an agent such as [Claude Code](https://claude.com/claude-code), and ask it anything, from "what is an incident collection?" to "how do I set up the project locally?". See [Agents](#agents).

## Installation

#### Prerequisites

- [Git](https://git-scm.com/) for version control
- [Node.js 24](https://nodejs.org/) for JavaScript runtime
- [Yarn 4](https://yarnpkg.com/) for package management

#### Clone the repo

```bash
git clone git@github.com:PADAS/das-web-react.git
cd das-web-react
```

#### Install dependencies

```bash
yarn
```

#### Configure environment variables

[Vite](https://vite.dev/guide/env-and-mode) loads the committed `.env` files in layers: `.env` always, then `.env.development` or `.env.production` depending on the mode. Keep your local overrides in a `.env.development.local` file, which is gitignored and takes precedence. At a minimum, point the client at a DAS backend:

```bash
echo "REACT_APP_DAS_HOST='https://root.dev.pamdas.org'" > .env.development.local
```

The available variables are:

- `REACT_APP_DAS_HOST`: Origin of the DAS backend. Leave it empty in deployments, so each site talks to the origin it is served from.
- `REACT_APP_DAS_API_URL`, `REACT_APP_DAS_API_V2_URL`: Paths of the v1 and v2 APIs on that origin.
- `REACT_APP_DAS_AUTH_TOKEN_URL`: Path of the OAuth token endpoint for username and password sign-in.
- `REACT_APP_MAPBOX_TOKEN`: Mapbox access token (see [License](#license)).
- `REACT_APP_BASE_MAP_STYLES`: Mapbox style URL of the default basemap.
- `REACT_APP_ROUTE_PREFIX`: Base path the app is mounted under (`/`).
- `REACT_APP_DEFAULT_EVENT_FILTER_FROM_DAYS`, `REACT_APP_DEFAULT_PATROL_FILTER_FROM_DAYS`: How many days back the event and patrol feeds reach by default.
- `REACT_APP_GA4_TRACKING_ID`: Google Analytics 4 measurement ID.
- `PORT`: Port of the development server (defaults to 9000).

Variables prefixed with `REACT_APP_` are baked into the build, so changing them requires rebuilding the app.

#### Configure Auth0 (optional)

The Auth0 tenant is not an environment variable: it is read at runtime from `public/config.js`, so one build can serve every environment. Without that file, the app uses the production tenant from `src/config.js`. To sign in to a development site that uses Auth0, copy the development template:

```bash
cp public/config.js.example public/config.js
```

Sites without Auth0, such as `root.dev.pamdas.org`, sign in with a username and password and do not need it.

## Development

### Execution

This project is a client-only single-page application with no server of its own: [Vite](https://vite.dev/) serves it in development, and nginx serves the static build in deployments. Configuration lives in `vite.config.mjs`, which compiles every source `.js` file as JSX, imports SVGs as React components through [vite-plugin-svgr](https://github.com/pd4d10/vite-plugin-svgr), and adds the Osano cookie consent script to production builds. `index.html` at the root is the page that loads the app.

To start the Vite dev server:

```bash
yarn start
```

- The server listens on the port defined in `.env` (`.env.development` defaults to 9000), and the app is available at [http://localhost:9000](http://localhost:9000). Vite provides HMR so changes apply automatically.
- Sign in with a user of the DAS site in `REACT_APP_DAS_HOST`.

### Agents

Project context for AI coding agents is maintained in [`AGENTS.md`](AGENTS.md). `CLAUDE.md` is a symlink to it so that [Claude Code](https://claude.com/claude-code) picks it up automatically, and most other agents read `AGENTS.md` on their own.

### API

The client talks to the DAS REST API with [Axios](https://axios-http.com/). Each duck calls Axios directly, building its URLs from `API_URL` and `API_V2_URL` in `src/constants/`, which join `REACT_APP_DAS_HOST` with the v1 or v2 API path. Ducks export their URL constants, so tests can mock the same endpoints.

For example, the event categories duck:

```js
import axios from 'axios';

import { API_URL } from '../../constants';

export const EVENT_CATEGORIES_API_URL = `${API_URL}activity/events/categories`;

export const fetchEventCategories = () => async (dispatch) => {
  const response = await axios.get(EVENT_CATEGORIES_API_URL);

  // ...
};
```

`RequestConfigManager` configures the shared Axios instance for every request: authorization, profiles, cancellation, session recovery.

### Real Time

`withSocketConnection` opens one [Socket.IO](https://socket.io/) connection to the site's `/das` namespace for the authenticated app, and shares it through `SocketContext`. Once connected, the client:

1. Authorizes with the access token, and the active profile if there is one.
2. Sends the current event and patrol filters, and sends them again whenever they change. The server tags each event and patrol it pushes with whether it still matches them.
3. Pings the server every 30 seconds, and reconnects 5 seconds after any failure.

#### Store-wide handlers

`withSocketConnection/useRealTimeImplementation/config.js` maps each server message to the actions it dispatches, such as `new_patrol` to `socketCreatePatrol`. The ducks' `socket*` action creators then add, update or drop the object in the store without refetching it. Events, patrols, subjects, tracks and messages stay live this way.

#### Component subscriptions

A component that needs a message only while it is mounted reads the socket from `SocketContext`, and unsubscribes on unmount. The app wraps `socket.on` to acknowledge each message to the server, so it returns the wrapped handler, and that is the one `socket.off` needs:

```js
const socket = useContext(SocketContext);

useEffect(() => {
  if (socket) {
    const [, handlerRef] = socket.on('new_announcement', onAnnouncement);

    return () => socket.off('new_announcement', handlerRef);
  }
}, [onAnnouncement, socket]);
```

### Routes

Routes are declared with [React Router](https://reactrouter.com/) in declarative mode, inside a `BrowserRouter` mounted under `REACT_APP_ROUTE_PREFIX`:

- **Top level:** `src/index.js` declares the routes in `APP_ROUTES`, from `src/constants/routes.js`. `/login`, `/eula` and `/community/:value/*` render outside the app shell; every other path renders the authenticated app (`App.js`), behind the access token and EULA guards.
- **Sidebar tabs:** `SideBar/` routes each tab by its `TAB_KEYS` segment (`events`, `patrols`, `gear`, `layers`, `settings`), so the URL decides which tab is open, and `/` closes it.
- **Nested routes:** the Events and Patrols managers, in `SideBar/EventsManager/` and `SideBar/PatrolsManager/`, nest their own routes, such as `/events/:eventId` and `/patrols/:patrolId/legs/:legId`.

Navigate with the app's `hooks/useNavigate` rather than React Router's: it lets a form with unsaved changes prompt before the user leaves, and opens the sidebar. To read the current tab or item from a pathname, use `getCurrentTabFromURL` and `getCurrentIdFromURL` in `utils/navigation.js`.

> [!IMPORTANT]
> In deployments, nginx serves `index.html` only for the top-level paths listed in `mt-nginx.conf`. A new top-level route must be added there too, or loading it directly returns a 404.

### Components

#### React Bootstrap

[React Bootstrap](https://react-bootstrap.github.io/) (Bootstrap 5) provides the base components, such as buttons, modals, popovers, dropdowns and tabs. Import each one from its own path rather than from the package root:

```js
import Button from 'react-bootstrap/Button';
import Popover from 'react-bootstrap/Popover';
```

#### Custom components

Every component is a folder with its `index.js`, its `index.test.js` and, when it has styles, its `styles.module.scss`. Components live directly under `src/`, and move under their parent's folder once they belong to it, such as `SideBar/PatrolsManager/LegForm/`.

#### Modals

Modals open through a stack kept in Redux: dispatch `addModal` from `ducks/modals.js` with the component to show and its props, and `ModalRenderer` renders it inside a React Bootstrap `Modal`.

```js
dispatch(addModal({ content: AddToPatrolModal, onAddToPatrol }));
```

#### Hooks

Shared hooks live in `src/hooks/`, such as `useNavigate`, the map hooks, and the `use<Domain>Permissions` hooks in `hooks/usePermissions/`, which read the permissions of the user or their active profile.

### State

#### Redux

[Redux](https://redux.js.org/) holds the app's state. The root reducer in `src/reducers/index.js` splits the state in two:

- `state.data`: data from the API, such as events, patrols and subjects.
- `state.view`: UI state, such as the open modals, map settings and user preferences.

#### Ducks

All Redux logic for a domain lives in its duck under `src/ducks/`: the API URLs, action types, action creators and thunks, and the reducer.

```js
// Actions
export const FETCH_EVENT_CATEGORIES_SUCCESS = 'FETCH_EVENT_CATEGORIES_SUCCESS';

// Action creators
export const fetchEventCategories = () => async (dispatch) => {
  const response = await axios.get(EVENT_CATEGORIES_API_URL);

  // ...

  dispatch({ payload: eventCategories, type: FETCH_EVENT_CATEGORIES_SUCCESS });
};

// Reducer
export const INITIAL_STATE = {};

const eventCategoriesReducer = (state, action) => {
  switch (action.type) {
  case FETCH_EVENT_CATEGORIES_SUCCESS:
    return action.payload;

  default:
    return state;
  }
};

export default globallyResettableReducer(eventCategoriesReducer, INITIAL_STATE);
```

Reference data every screen depends on, such as event types, event categories, patrol types and map quick links, is fetched once when the app shell mounts. Screens read it from the store rather than fetching it again.

#### Selectors

Derived state belongs in a [Reselect](https://github.com/reduxjs/reselect) selector under `src/selectors/<domain>/`, not in a component. Selector names start with `select`, such as `selectEventSchema`.

#### Persistence

Slices that survive a reload are wrapped in [redux-persist](https://github.com/rt2zz/redux-persist)'s `persistReducer` in the root reducer:

- Most persist to `localStorage`; large ones, such as spatial features and analyzers, persist to IndexedDB through [localForage](https://localforage.github.io/localForage/).
- Some, such as the map position and what Map Layers hides, are restored only when the user chooses so in Settings → General.

Slices that must be cleared on sign-out are wrapped in `globallyResettableReducer`, which returns them to their initial state when signing out dispatches `resetGlobalState`.

#### Context

What is not Redux data is shared through React context, such as the map in `MapContext`, the socket in `SocketContext`, navigation blocking in `NavigationContext`, and the analytics tracker in `TrackerContext`.

### Map

The map is rendered with [Mapbox GL](https://docs.mapbox.com/mapbox-gl-js/). `EarthRangerMap/` creates its single instance: it sets `REACT_APP_MAPBOX_TOKEN`, starts from the `REACT_APP_BASE_MAP_STYLES` style, adds the access token to the tile requests made to the DAS API, and shares the instance through `MapContext`.

#### Layers

`Map/index.js` composes the map from layer components, such as `SubjectsLayer`, `TracksLayer`, `EventsLayer` and `SpatialFeaturesLayer`, each shown when its feature is enabled. A layer component renders nothing, it registers its Mapbox sources and layers.

Keep source and layer ids in `SOURCE_IDS` and `LAYER_IDS`, in `src/constants/`, so layers can reference each other, such as to draw one before another.

### Styles

#### Sass modules

Each component keeps its styles in a co-located `styles.module.scss`, written in [Sass](https://sass-lang.com/) and imported as a [CSS module](https://github.com/css-modules/css-modules):

```js
import * as styles from './styles.module.scss';

const MyComponent = ({ isActive }) => <div className={`${styles.container} ${isActive ? styles.active : ''}`}>
  ...
</div>;
```

#### Global partials

Shared styles live in `src/common/styles/`, and components pull them in with `@use`:

- `vars/`: the color palette, fonts and control sizes.
- `_layout.scss`: breakpoints, media queries and layout mixins.
- `_buttons.scss`, `_inputs.scss`, `_popovers.scss` and others: mixins for common elements.

Base element styles, such as fonts and headings, are in `src/index.scss`.

### Assets

#### Public assets

Files in `public/`, such as `favicon.ico`, `manifest.json`, the translation files and `config.js`, are served as they are from the site's root.

#### SVG icons

Icons are SVG files in `src/common/images/icons/`, imported as React components through [vite-plugin-svgr](https://github.com/pd4d10/vite-plugin-svgr), so they can be styled and sized with `className`:

```js
import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';
```

Append `?url` to import a file's URL instead, such as to load it as a map image.

#### Images and sounds

Other bundled images, such as the logo and sprites, live in `src/common/images/`, and notification sounds in `src/common/sounds/`.

#### Site icons

Event type, patrol type and subject icons are not bundled: they come from the DAS server, and `SvgIcon` renders them, sanitizing the SVGs it fetches with [DOMPurify](https://github.com/cure53/DOMPurify).

### Translations

The app is translated with [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/) into English, Spanish, French, Nepali, Portuguese and Swahili. Translations load over HTTP, and are cached in the browser's `localStorage`.

#### Location of translation files

Translation files live under `public/locales/<language>/<namespace>.json`, one file per UI namespace, such as `patrols` or `top-bar`. `en-US` is the source language. Within a namespace, each top-level component has its own key, named after it, and a subcomponent's key nests under its parent's.

#### Loading translations

Translations are read with the [t function](https://www.i18next.com/overview/api#t). How you get it depends on where the code runs:

- In components, with [useTranslation](https://react.i18next.com/latest/usetranslation-hook), whose key prefix mirrors the component's position in the folder tree:

```js
import { useTranslation } from 'react-i18next';

const SideBar = () => {
  const { t } = useTranslation('components', { keyPrefix: 'sideBar' });

  return <button aria-label={t('closeButtonLabel')} type="button">…</button>;
};
```

- Outside components, such as in utilities, with [getFixedT](https://www.i18next.com/overview/api#getfixedt):

```js
import i18next from 'i18next';

const t = i18next.getFixedT(null, 'utils', 'calcFriendlyDurationString');
```

#### Adding a new namespace

Create `public/locales/<language>/<namespace>.json` for every language, add the namespace to `preloadNamespaces` in `src/i18n.js`, and register its English file in `src/i18nForTests.js`, so tests render its real strings.

#### Cache version

Browsers cache the translation files for a week, keyed on `I18N_FILES_VERSION` in `src/i18n.js`. When you change anything under `public/locales/`, bump that version above develop's, or returning users keep the old strings. CI enforces it, and you can check it locally:

```bash
yarn check-i18n-files-version
```

### Tests

We use [Jest](https://jestjs.io/) as our test runner, with [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/) for component testing, and [MSW](https://mswjs.io/) to mock HTTP requests. Each module keeps its tests in an `index.test.js` beside it.

Test setup uses:

- `package.json`: the Jest configuration, under `jest`.
- `src/setupTests.js`: global setup and mocks, including a mocked socket connection.
- `src/test-utils.jsx`: a custom `render` that wraps components in the router, i18n and navigation providers.
- `src/__test-helpers/`: the mock Redux store, fixtures, and mocks such as the map's.
- `src/i18nForTests.js`: i18n configuration for tests, with the English strings.

#### Component tests

Import `render` and `screen` from `src/test-utils.jsx`, and pass `initialEntries` when the component reads the URL. Supply Redux state with `mockStore` from `src/__test-helpers/MockStore`, and the map with `createMapMock` from `src/__test-helpers/mocks` through `MapContext.Provider`:

```js
import { Provider } from 'react-redux';

import { createMapMock } from '../../../__test-helpers/mocks';
import { MapContext } from '../../../MapContext';
import { mockStore } from '../../../__test-helpers/MockStore';
import { render, screen } from '../../../test-utils';

import PatrolsFeed from './';

describe('SideBar - PatrolsManager - PatrolsFeed', () => {
  const map = createMapMock();

  let store;

  beforeEach(() => {
    store = { data: { /* ... */ }, view: { /* ... */ } };
  });

  const renderPatrolsFeed = () => render(
    <Provider store={mockStore(store)}>
      <MapContext.Provider value={map}>
        <PatrolsFeed />
      </MapContext.Provider>
    </Provider>,
    { initialEntries: ['/patrols'] }
  );

  test('shows an empty state when no patrol matches the filters', async () => {
    store.data.patrolsFeed = [];

    renderPatrolsFeed();

    expect(await screen.findByText('No patrols to display.')).toBeVisible();
  });
});
```

#### Mocking requests

Build the MSW handlers from the duck's exported URL constants, and start and stop the server around the tests:

```js
import { http, HttpResponse } from 'msw/http';
import { setupServer } from 'msw/node';

import { PATROLS_API_URL } from '../../../ducks/patrols';

const server = setupServer(
  http.get(PATROLS_API_URL, () => HttpResponse.json({ data: { next: null, results: [] } }))
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

#### Running tests

Run all tests, or only some by path or pattern:

```bash
yarn test
yarn test <path-or-pattern>
```

> **Note:** `yarn test` pins `TZ=UTC`. Running `jest` directly makes datetime tests fail on any machine outside UTC.

### Linting & Code Formatting

#### Tools

- **[ESLint](https://eslint.org/):** JavaScript linting, with the recommended rules of `@eslint/js`, `eslint-plugin-react`, `eslint-plugin-react-hooks` and, for tests, `eslint-plugin-jest`. Configured in `eslint.config.js`.
- **[Stylelint](https://stylelint.io/):** SCSS linting, with `stylelint-config-standard-scss` and `stylelint-config-css-modules`, and camelCase class names. Configured in `stylelint.config.mjs`.

#### Commands

- Lint the JavaScript and the SCSS:

```bash
yarn lint
yarn stylelint
```

- Lint and fix only the files you touched:

```bash
npx eslint --fix <files>
npx stylelint --fix <files>
```

### VS Code Extensions

To enhance your development experience in VS Code, consider installing these recommended extensions:

- **[ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint):** JavaScript linting and formatting integration
- **[Stylelint](https://marketplace.visualstudio.com/items?itemName=stylelint.vscode-stylelint):** SCSS linting integration

## Build

Compile for production:

```bash
yarn build
```

This runs the Vite build into `build/`, then generates the service worker (`build/sw.js`). The output is a static site: any server can host it, as long as it falls back to `index.html` for the app's routes and serves `/config.js` (see [Configure Auth0](#configure-auth0-optional)).

## Deployment

`Dockerfile.mt` builds the production image: it installs dependencies, builds the app with the env file passed as the `ENV_FILE` build argument (`.env.development` or `.env.production`), and serves the result with nginx, configured by `mt-nginx.conf`. Each environment provides its own `config.js` through a Kubernetes ConfigMap.

[GitHub Workflows](https://docs.github.com/en/actions/writing-workflows) in `.github/workflows/` test the code, build the image, and deploy it to Kubernetes through [Argo CD](https://argo-cd.readthedocs.io/):

- **Pull requests** run the tests and the i18n version check. Labeled `deploy`, they also get their own environment at `https://<branch>.dev.pamdas.org`, linked in a PR comment. Stale ones are cleaned up nightly.
- **`develop`** deploys to the development environment, and a failed run notifies the team on Slack.
- **`release-*` branches** deploy to stage and the legacy clusters, then, once approved, to each production region.

## Contributing

Contributions are welcome. Branch from `develop` and open a pull request against it, filling in the pull request template. See [`CONTRIBUTING.md`](CONTRIBUTING.md) for the full guidelines, and [open an issue](https://github.com/PADAS/das-web-react/issues/new/choose) to report a bug or propose a feature.

## License

This repository is open-sourced under the [Apache 2.0 license](LICENSE). However, [Mapbox GL](https://github.com/mapbox/mapbox-gl-js), a required dependency, is closed-source. It is provided here in a "bring your own token" capacity: you may use and modify all EarthRanger-authored code herein, but will need to provide your own Mapbox access token, tied to your own Mapbox account.
