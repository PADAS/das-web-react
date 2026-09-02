# AGENTS.md

## Maintaining This File

- Edit it only when a change makes something written here wrong, or when the new fact is one that every agent needs. Most changes need no edit at all.
- Write for tokens: high level, clear, concise. No file-by-file detail, no prop or option lists, no changelog, nothing the code or a lint rule already states.
- Prefer rewriting an existing line over adding one, and delete whatever stopped being true.

## Business

**Project:** EarthRanger Web Client
**Organization:** EarthRanger
**Domain:** Wildlife Conservation Technology

### Core Concepts

- **EarthRanger:** Real-time operational platform for monitoring wildlife, assets, and field activities within protected areas.
- **DAS (Domain Awareness System):** Legacy product name. EarthRanger is the official name today. The repository (`das-web-react`) and some API references still use the `das` prefix.
- **Tenant:** Each deployment serves a single conservation site or organization. The web client talks to exactly one tenant's backend.
- **Companion products:**
  - **Ecoscope:** advanced analytics layer.
  - **Gundi:** middleware aggregation layer connecting external data sources to EarthRanger.

#### Events

**Events** are time-stamped incident reports. Each event has a **state**, a **priority**, a **reporter**, optional **notes** and **files**, and an `event_details` object holding what the user entered in the event's detail form. Geometry is a Point (`location`) or a Polygon (`geometry`).

States are `active`, `new` (legacy alias for active), `review` (community submissions awaiting moderation), and `resolved`. Priorities are `300` high / `200` medium / `100` low / `0` none; code and styles key off the color names `red` / `amber` / `green` / `none`.

> The codebase historically called events "reports". "Event" is the preferred term.

**Event Types** are the templates events belong to (e.g., "Injured Animal", "Snare"). They define the display name, icon, default priority, default state, geometry type, and a **form schema**, which is a JSON object that drives the event's detail form. Event types come in two versions: **v1** (legacy, rendered with `@rjsf/react-bootstrap`) and **v2** (current, rendered with a custom `SchemaForm`).

**Event Type Categories** group event types into a taxonomy (e.g., "Monitoring", "Security", "Logistics").

**Incident Collections** are events with `is_collection: true` that group multiple child events through a `contains` relationship (e.g., a snare, carcass, and arrest under one incident).

**UI**
- **Events Sidebar** (`/events`): text search, filters (state, priority, event type, reporter, date range), and sorting.
- **Event Detail View** (`/events/:id` or `/events/new`): **Details** section (state, reported-by, priority, location, date/time, and schema-driven form fields), **Activity** section (notes, files, and contained events for incident collections), **Links** section (linked events and patrols), and **History** section (audit trail from `updates`).
- **Map:** Fetched from a vector tile endpoint and updated in realtime through a socket using a GeoJSON overlay. Point events render as clustered icon markers; polygon events as priority-colored fills. A heatmap overlay can be toggled from Map Layers → Events.
- **Community input** (`/community/:value/*`): The public page reuses the event stack, letting unauthenticated users submit events.

#### Subjects, Observations, and Tracks

**Subjects** are monitored entities: collared animals, vehicles, aircraft, personnel, and fixed sensors. Each subject has a `subject_type` (e.g., `wildlife`, `person`, `vehicle`, `static_sensor`) and a `subject_subtype` that further classifies it (e.g., `ranger`, `dugong`, `stationary-radio`). Key fields include `is_active`, `tracks_available`, `last_position` (a GeoJSON Point Feature), and `device_status_properties`, an array of telemetry readings (`label`/`units`/`value`). Real-time position updates arrive via WebSocket.

Subjects are organized into **subject groups**, a named hierarchy with nested subgroups.

A **source** is a telemetry device (GPS collar, radio, acoustic sensor). Sources generate **observations**, discrete timestamped position records that each carry a `source` UUID and their own `device_status_properties`. The backend assigns sources to subjects for defined time windows, but the client always queries by subject ID.

**Tracks** are a subject's ordered positions:
- `track`: `FeatureCollection` of `LineString` features with `coordinateProperties.times` (one timestamp per coordinate)
- `points`: `FeatureCollection` of `Point` features derived from the line, each with a computed `bearing` for directional arrows
- `fetchedDateRange`: the `{ since, until }` window already loaded

Tracks are lazy-loaded and cached, socket status updates prepend new positions onto them. Track history depth is user-configurable (default 21 days) and can be locked to the active event filter's date range. When time-of-day coloring is enabled, a `trackSegments` `FeatureCollection` is added that segments the line into time-range buckets, each with a distinct color.

**Track visibility** cycles through three states: **hidden** (default), **visible** (line at lower opacity), and **pinned** (full opacity, higher render priority). Subjects can be included to the **subject heatmap**, a density surface overlay on the map.

**UI**
- **Map Subjects Layer:** renders subject icon markers from `last_position`, clustered at lower zoom levels.
- **Map Tracks Layer:** draws the line string as a colored line plus a symbol layer of rotated arrows at each timepoint. Color comes from the track's server-supplied `stroke`, falling back to a deterministic color seeded by subject ID; with time-of-day coloring, each segment uses a period-specific color.
- **Map Layers Sidebar Tab** (`/layers`): searchable, sortable subject list (grouped hierarchy or flat). Controls: toggle map visibility, cycle track state (hidden → visible → pinned), toggle heatmap membership, jump to location, view history, and open messages (if available).

#### Patrols

**Patrols** are timed field activities (foot, vehicle, aerial, etc.) carried out by a team. A patrol has a ticker number, a title, an optional priority, notes and files, and is made up of one or more **legs**.

**Patrol Legs** hold the actual plan and data: a patrol type, scheduled and actual start/end times, start/end locations, the team and tracking assignments, and the values entered for the universal and patrol type fields. Creating a patrol means creating its first leg; a running patrol is continued with a new leg, which ends the previous one. Legs may differ in type.

> The API and older code call legs "patrol segments". "Leg" is the preferred term.

**Patrol Types** are the templates legs belong to (e.g., "Vehicle Patrol", "Foot Patrol"). They define the display name, icon, default priority, and a **form schema** that drives the leg's type-specific fields, fetched on demand per type.

**Universal Patrol Fields** are the fields every leg renders on top of its patrol type's own, whatever the type. A site defines a single admin-configured schema for them, fetched once at startup.

> "Universal Patrol Fields" is the admin UI's wording. The API models them as the schema of a segment type whose value is `default`, and the code follows the API.

**Team & Tracking** are the leg fields for who is on it and what reports its position: a team, a team lead, team members, and assets (vehicles, radios, GPS devices), each chosen from its own site-level list — a team carries no members of its own, it is only a choice. The team lead is stored as the leg's `leader`, which the API and older UI call "tracked by"; the tracked subjects' observations are what produce the patrol track.

**UI states** are derived client-side; the API only knows `open`, `done`, and `cancelled`:

| UI state | Condition |
|---|---|
| `scheduled` | scheduled start is more than an hour away |
| `ready_to_start` | scheduled start is within the next hour |
| `start_overdue` | scheduled start passed 30+ min ago and the patrol has not started |
| `active` | a leg has begun and the last leg has not ended |
| `paused` | paused and not yet resumed |
| `done` | ended |
| `cancelled` | cancelled |
| `invalid` | no legs, or a first leg with no start of any kind |

**Tracks.** The patrol track is the track of the leg's tracked subjects, trimmed to the leg's time range. Only patrols that have started can display tracks. Visibility follows the same three-state cycle as subjects (hidden → visible → pinned).

**Provenance.** A patrol's `provenance` records where it was created. An active patrol with `provenance: 'mobile'` can't be fully managed from the web client: it can't take new legs, and ending the patrol is the only status change offered.

**Two patrol detail UIs ship side by side**, switched by the `PATROL_SCHEMAS` preview feature: the legacy `PatrolDetailView` and the current `SideBar/PatrolsManager`. The feed is shared. New work goes in `PatrolsManager`, which is what the routes below describe.

**UI**
- **Patrols Feed** (`/patrols`): the patrol list, ordered start_overdue → ready_to_start → paused → active → scheduled → done → cancelled, with inline actions per row (start, resume, restore). Filters: text search, date range, patrol type, tracked-by, and status.
- **New Patrol** (`/patrols/new?patrol-type=:id`): the leg form. Creating a patrol means creating its first leg, so this is the same form the leg routes use, with the patrol's title and type set here; the query parameter seeds the type.
- **Patrol Overview** (`/patrols/:patrolId`): header (editable title, track and location actions, kebab menu, status select), an **Overview** tab (the leg table and the activity timeline) and a **History** tab (audit trail from `updates`), and footer actions to add notes, attachments and events.
- **New Leg** (`/patrols/:patrolId/legs/new`): the leg form, adding a leg to an existing patrol. Saving it ends the current leg and starts this one.
- **Leg Overview** (`/patrols/:patrolId/legs/:legId`): header (title, status, actions), the leg's saved plan (times, locations, team and tracking, and its universal and patrol type fields), its activity timeline, and footer actions to add notes, attachments and events, or edit the leg.
- **Edit Leg** (`/patrols/:patrolId/legs/:legId/edit`): the leg form, pre-filled with the leg's current values.
- **Map**: started patrols with visible or pinned tracks draw the route as a colored line with start and stop markers. Patrol symbols are labeled with the ticker.

#### Gear

**Gear** is ropeless fishing equipment: buoy gearsets whose acoustic release devices report their position instead of being marked by a surface line. Each gear item has a manufacturer and one or more **devices**, each with its own hardware id and status readings (serial number, battery, depth).

Gear with a single device draws as one point on the map. Gear with several devices is a **trawl**, drawn as a line between its device positions with a marker at each end. The same equipment also appears as a subject (`subject_subtype: ropeless_buoy_gearset`) when it reports telemetry, so a gearset can show up both in the gear list and on the subjects layer.

**UI**
- **Gear Sidebar** (`/gear`): searchable list, grouped by manufacturer or flat, with map visibility toggles per item and per group. Paginated on first load, then refreshed by a background poll.
- Clicking gear on the map opens a popup with its details and one entry per device.

#### Spatial Features

**Spatial features** are static geographic data layers displayed on the map alongside live operational data: zones, boundaries, infrastructure, habitat areas, and reference cartography. They are organized into **featuresets**, named collections grouped by **feature type**.

Feature geometry can be Point, LineString, or Polygon. Per-feature styling properties (`fill`, `stroke`, `fill_opacity`, `stroke_opacity`) are stored on the feature and applied via vector tiles (`GET /spatialfeatures/tiles/{z}/{x}/{y}.pbf`). Features may carry an `analyzer_type` (`geofence` or `proximity`) linking them to an analyzer definition.

**UI**
- **Map Layers Sidebar - Features tab**: featuresets listed hierarchically (featureset → type → individual feature), with visibility toggles at every level and jump-to-bounds per feature.
- Clicking a feature on the map opens a popup with its name, its coordinates, and a button to report an event at that location.

#### Analyzers and Alerts

**Analyzers** are server-side algorithms that evaluate streaming or recent data against configured rules, such as a **geofence** (polygon boundary, triggers on entry or exit) or a **proximity** (point with a radius, triggers when a subject comes within range).

Some analyzers have one or more **spatial groups**, named GeoJSON feature collections. The web client renders these as dashed polygon and line overlays on the map (yellow for warning severity, red for critical); proximity analyzers are drawn as a circle buffered to their threshold radius. Only active analyzers are fetched. The client does not execute analyzers; it only displays their geographic boundaries.

**Alerts**, the notifications raised when an analyzer fires, are managed entirely server-side. The client only embeds the tenant's alert management page in an iframe.

**UI**
- **Map Layers Sidebar — Analyzers tab**: list of analyzers with visibility toggles. Selecting an analyzer zooms the map to its bounds and shows a popup linking to its admin configuration page.

#### Time Slider

The **time slider** is a map control that sets a virtual date, a specific historical moment, shifting the map's display to reflect subject positions and event states at that time.

#### Coordinate Systems

EarthRanger works in **WGS84** but the client supports multiple display and input formats (DEG, DMS, DDM, UTM, MGRS). Users can add custom **CRS** definitions by EPSG code. DEG is always included as the baseline.

**UI**
- **Settings → Map**: manage stored CRS definitions and configure a bounding-box overlay for the active CRS.
- All fields or UI widgets that capture or display coordinates render values in the currently selected format.

#### Map Settings

**Settings → Map** organizes display controls in three groups:

- **General**: Lock map, enable 3D terrain, simplify map data at low zoom, and open **Coordinate System Settings**.
- **Display**: Show track timepoints along subject lines, show inactive radios, per-class **clustering** toggles with an optional cluster footprint polygon overlay.
- **Map Markers**: Show/hide name labels independently for subjects, stationary sensors, events, and patrols; toggle the user's own GPS location marker.

#### Messaging

**Messaging** lets authorized users send and receive **two-way messages** with subjects that carry messaging-capable devices (e.g., inReach satellite communicators, supported radio integrations).

Messages are grouped by date and sender, support infinite-scroll pagination, and track read/unread status. Real-time updates arrive via WebSocket. The messaging UI is accessible from subject map popups and the nav.

#### Authentication

A tenant's system config decides how users sign in: local credentials or Auth0, never both. Either path ends with an access token, kept in a cookie and in Redux and sent as a `Bearer` header.

- **Username and password** (`require_idp` off): posted to the DAS OAuth token endpoint.
- **Auth0 redirect** (`require_idp` on): to the organization's identity provider when `idp_org_id` is set, otherwise to EarthRanger Identity. The latter sites are mid-migration, so accounts that aren't linked yet are sent to the server's account linker.

On the Auth0 path a site may also offer a **managed user** button — an account that exists only in that site's Auth0 database, with a username and no self-service reset. It redirects with `connection` set to the site slug, and appears only where `support_managed_users` and `site_slug` are both present and the site is not org-scoped. Failures returning from Auth0 are attributed by a stored attempt marker, never by reading Auth0's error text. If the account-linking gate finds no ER account for one, the user is signed out of Auth0 — the session, not just the cached token — and told so on the login page, rather than sent to the linker, whose password form cannot serve them.

Two guards wrap the app: one redirects to `/login` without a token, preserving the intended route across the Auth0 round trip; the other, only where the `EULA` flag is on, redirects to `/eula` until the user accepts it.

A 401 first tries a silent token renewal and replays the request, or restarts the Auth0 redirect for MFA if the response carries a step-up challenge. Only when that fails is the session cleared. Signing out drops the token cookies, the selected profile, and all Redux state.

**Profiles.** A user account can have profiles: alternate identities the signed-in user can operate as, listed beside the main user in the top-bar user menu and PIN-protected when the profile has one. While a profile is active, requests carry a `User-Profile` header so data is scoped to it.

#### Sidebar and Settings

The sidebar is a vertical panel with tabs shown conditionally by system config flags and user permissions:

| Tab | Condition |
|---|---|
| **Events** | `EVENTS` flag |
| **Patrols** | `PATROL_MANAGEMENT` flag + patrol read permission |
| **Gear** | Gear data available |
| **Map Layers** | `ANALYZERS`, `SPATIAL_FEATURES`, `SUBJECTS`, or `EVENTS` flag |
| **Settings** | Always |

**Map Layers** has four sub-tabs — Subjects, Features, Analyzers, Events — each shown only when its flag is on.

**Settings** has three sub-tabs:

- **General**: which UI state survives a page reload, UI language, sound notification toggles, and per-user overrides for the development feature flags (shown only when flags are present in the store or query string).
- **Map**: lock map, 3D terrain, low-zoom simplification, coordinate system settings, track timepoints, inactive radios, per-class clustering, and per-class map marker labels.
- **Alerts**: the server-side alerts page in an iframe.

#### Global Menu

The hamburger drawer, every item gated by system config flags and permissions: the sidebar tabs (on small layouts, where the icon rail is hidden), an alerts iframe modal, Contact Support through the embedded JIRA widget, external links (Help Center, Community, Users Guide), export modals (daily report, master KML, subject information and reports, field reports), Ecoscope links, and a footer with the server and client versions, copyright and the EULA / privacy links.

## Development

### Technical Stack

- **Runtime:** Node.js 24
- **Package manager:** Yarn 4
- **UI:** React 19, `react-dom`; component library via `react-bootstrap` (Bootstrap 5)
- **Routing:** React Router 8 declarative mode; SPA with `BrowserRouter`
- **Build:** Vite 8
- **State:** Redux 5 + `redux-thunk`, `redux-promise`; persistence via `redux-persist`
- **Map:** Mapbox GL
- **HTTP:** Axios
- **Real-time:** Socket.IO
- **Auth:** Auth0 + DAS token exchange
- **Geo / utilities:** `@turf/turf`, `proj4`, `geodesy`, `date-fns`, `lodash-es`, `@dnd-kit`
- **Analytics:** `react-ga4`; cookie consent via Osano
- **i18n:** `i18next` (chained localStorage + HTTP backend)
- **Lint / style:** ESLint, Stylelint
- **PWA:** Workbox service worker
- **Deployment:** Docker and GitHub Actions

### Project Structure

- `src/index.js`: bootstrap
- `src/App.js`: authenticated shell
- `src/config.js`: deployment config; production defaults are hard-coded, other environments override via `window.__APP_CONFIG__` from `/config.js`
- `src/store.js`: Redux store: `thunk` + `promiseMiddleware` + Redux DevTools extension hook
- `src/{ComponentName}/`: component folders, nested under their parent once they belong to one
- `src/common/`: shared assets and global SCSS partials
- `src/ducks/`: Redux logic per domain
- `src/reducers/index.js`: `combineReducers` root; wires `persistReducer` per slice
- `src/selectors/`: reselect selectors
- `src/hooks/`: shared hooks
- `src/views/`: full-page views rendered outside the app shell
- `src/withSocketConnection/`: Socket.IO context provider and real-time event binding
- `src/constants/`: shared constants and all Vite env exports
- `src/utils/`: general utilities
- `src/__test-helpers/`: fixtures and mocks
- `jest-config/`: Jest transformers and asset mocks
- `public/locales/{locale}/{namespace}.json`: translation files

### Application Patterns

#### Routing and URL shape

- **Prefix:** `REACT_APP_ROUTE_PREFIX`
- **Top-level routes:** `login`, `eula`, `community/:value/*`, `*` → main `App`
- **In-app navigation:** Path segments drive UI state via `getCurrentTabFromURL` / `getCurrentIdFromURL` in `utils/navigation.js`. Patterns `/:tab/*` and `/:tab/:id/*`.
  - **Sidebar tabs:** `events`, `patrols`, `gear`, `layers`, `settings`

#### Redux and data loading

- Prefer function components with `useDispatch` / `useSelector`
- All Redux logic lives in single files under `src/ducks/`
- State structure: `state.data` - API data, `state.view` - UI state
- Add derived state in `selectors/` with reselect

#### Map

Central `map` instance shared via `MapContext`.

#### API layer

`API_URL` and `API_V2_URL` are assembled from `DAS_HOST` + path env vars in `src/constants/index.js` and imported directly in duck files. `RequestConfigManager` installs Axios interceptors that attach the auth `Bearer` token, add a `USER-PROFILE` header when a profile is active, attach a cancellation token, and run the 401 recovery described under **Authentication**. Requests can opt out of auth with `skipAuth`.

#### Styling

Component-specific styles use co-located `styles.module.scss`. Global partials live in `src/common/styles/`. SVGs are imported as React components via `{ ReactComponent as XIcon } from '*.svg'`.

#### Internationalization

Translation files live under `public/locales/{locale}/`. Each locale directory contains one JSON file per UI namespace. Within a namespace file, give each top-level component its own key, named after the component, and nest a child component's key under its parent's when that child is a subcomponent with its own file below the parent folder.

#### Form schemas

The server stores a canonical **JSON Schema** per type. Client-side editing and rendering use a flat **formElements** structure derived from it; transformation utilities live in `utils/form-schemas/`. `SchemaForm` renders that structure.

#### Feature flags

Two separate systems.

- **Preview features** are server-driven — they arrive in the system config and are read with `usePreviewFeature(PREVIEW_FEATURES.X)`.
- **Development feature flags** are client-side defaults in `DEVELOPMENT_FEATURE_FLAGS`, read with `useFeatureFlag`, and overridable per user from Settings → General → Experimental Features.

### Key Commands

- `yarn start`: Vite dev server
- `yarn build`: production bundle to `build/`, then service worker (`build-sw`)
- `yarn build-sw`: Workbox / SW generation only
- `yarn test`: Jest
- `yarn test-ci`: CI-oriented Jest flags
- `yarn lint`: ESLint
- `yarn stylelint`: SCSS modules

### Development Preferences

The repository favors code that reads the same everywhere: a reviewer should not be able to tell which file a snippet came from. ESLint and Stylelint own a small part of that; everything below is convention they do not enforce, and it is expected in new code and in code you touch.

#### Workflow

After making code changes:

- Run `yarn lint`, and `yarn stylelint` if you touched SCSS. Fix every problem you introduced.
- Run `yarn test <path-or-pattern>` over the areas you changed and make sure they pass.
- If you changed anything under `public/locales/`, bump `I18N_FILES_VERSION` in `src/i18n.js`. Verify with `yarn check-i18n-files-version`.
- Update `AGENTS.md` only under the terms in **Maintaining This File**.

#### File and Folder Layout

- Every module is a folder with an `index.js`, co-located with its `index.test.js` and, for components, its `styles.module.scss`.
- Subcomponents live in a nested folder under their parent.
- Helpers used by a component (or by its subtree) live in a sibling `utils/` folder, one function or hook per subfolder with its own `index.js` and `index.test.js`; shared literals go in `utils/constants.js`.
- **Rule of three:** a helper earns that folder once three call sites need it. At one or two, keep the logic inline or as a module-level helper in the file that uses it.
- Error classes get their own folder and a default-exported class.

#### Imports

Group imports into blocks separated by a blank line, in this order:

1. External packages, `React` first.
2. SVG icons: `import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';`
3. Internal non-components: constants, ducks, selectors, hooks, utils, and the module's own `./utils` helpers.
4. Components: app components, subcomponents, and lazily imported ones.
5. `import * as styles from './styles.module.scss';`

Sort each block alphabetically by the first imported binding, not by path.

#### Declarations and Naming

- Arrow functions everywhere.
- Module-level constants in `SCREAMING_SNAKE_CASE` above the component; analytics trackers built once at module level (`const mapInteractionTracker = trackEventFactory(MAP_INTERACTION_CATEGORY);`). Anything a test needs to reach is exported inline; there is exactly one default export, at the bottom of the file.
- Names are verbose and explicit over short and obscure.
- Booleans start with `is`/`has`/`can`/`should`; handlers and handler props with `on`; refs end in `Ref`; setters start with `set`; selectors start with `select`.
- Avoid a variable read only once. Prefer the readable one-liner, and introduce the variable only when its name is what makes the code readable.
- Avoid destructuring in a function body: `leg.startTime` keeps the origin of the value visible, `const { startTime } = leg;` hides it. Props destructured in a component signature are the exception.

#### Alphabetical Ordering

Sort alphabetically, so diffs stay small and merge conflicts stay rare:

- object literal keys — action objects (`{ payload, type }`), reducer state, option objects, configuration, fixtures;
- JSX props, with `{...otherProps}` last;
- destructured props in a component signature, and named import bindings;
- `useSelector` and `useState` declarations within their group;
- translation JSON keys, nested and flat interleaved;
- CSS declarations within a rule.

Function parameters follow the call's own logic, not the alphabet.

#### Component Structure

- Functional components with hooks. No PropTypes.
- Props destructured in the signature with defaults inline, alphabetically. `ref` is a plain prop. A component that wraps a DOM element collects the rest into `...otherProps` and spreads it last onto the root element.
- Body order, each group sorted alphabetically and separated by a blank line: library hooks (`useDispatch`, `useTranslation`, router hooks), app hooks, `useSelector` calls, `useContext`, `useRef`, `useId`, `useState`, derived variables, `useMemo`, handlers, `useEffect`, then the returned JSX.
- Memoize only when it pays: for a dependency array, for a genuinely expensive computation, or for the props of a `memo` boundary you checked actually bails — one unmemoized sibling prop wastes every other one. Never to spare a field or two a re-render. `memo()` only where a parent re-renders often with the child's props unchanged; a memoized parent already spares its whole subtree.
- JSX: a blank line between sibling elements at the same indentation level, one-line inline arrows for trivial handlers, a local `render*` helper for JSX rendered in more than one place, and `type="button"` on every button.
- `data-testid` only where no accessible query can reach the element, named `<componentName>-<element>` (`timeSlider-wrapper`).

#### Styling

- Class names in camelCase.
- Nest selectors to mirror the component's own DOM structure; keep media queries at the end of the block they modify.
- Pull colors, layout breakpoints and mixins from the partials in `src/common/styles/` with `@use`; never hard-code a hex value that already exists as a variable.

#### Redux

- One duck per domain in `src/ducks/{domain}/index.js`, laid out in this order under `// Actions`, `// Action creators` and `// Reducer` banner comments: URL and tuning constants, action type constants, action creators, `INITIAL_STATE`, the reducer, default export.
- Action types are namespaced strings in `SCREAMING_SNAKE_CASE` (`'USER_CONTENT.SET_CHUNKED_UPLOAD_STATUS'`) and are exported, as are the API URL constants and `INITIAL_STATE`, so tests can mock and assert against them.
- Action creators return `{ payload, type }`; thunks are `(args) => (dispatch, getState) => …`.
- Reducers are a `switch` returning new state; wrap the default export in `globallyResettableReducer(reducer, INITIAL_STATE)` when the slice must be cleared on sign-out.
- Selectors live in `src/selectors/{domain}/index.js`: unexported input selectors at the top, then exported `createSelector` selectors named `select*`. Parametrized selectors take the parameter as a second input, `(_, eventTypeId) => eventTypeId`.

#### Internationalization

- Read strings with `useTranslation('<namespace>', { keyPrefix: '<path>' })`, where the key prefix mirrors the component's position in the folder tree (`sideBar.settingsPane.mapTab.mainMapSettingsView.generalFieldSet`). Outside components, use `i18next.getFixedT(null, '<namespace>', '<keyPrefix>')`.
- Key names describe the element and its role: `closeButtonLabel`, `resultsTableCaption`, `speedMenuOptionLabel`.
- Every user-facing string, including `aria-label` and `title` text, goes through i18n and is added to **every** locale under `public/locales/`, properly translated — never copied from English.

#### Comments

Comment only what the code cannot say — a non-obvious *why*, a caveat, an external reference. If naming and structure can carry it, no comment is written. Anything that restates what the code does is noise.

- Hard limits: `//` only, at most two lines, each at most 80 columns — wider code nearby is no licence. Past two lines, cut it rather than wrap again.
- Directly above the code they explain, full sentences ending in a period.
- An `eslint-disable` line always carries the reason it is there.
- Never leave working notes behind: no narrating the change (`// now using X instead of Y`, `// this fixes the bug`), no ticket numbers, no references to plans or conversations that exist only on your machine. The diff and the commit message are for that.
- None at all in `styles.module.scss` or test files — no exception for the subtle case. Test intent goes in the `describe` / `test` names: rename or split instead. Why production code is surprising belongs in the production file, not in its tests.

#### Accessibility

- **WCAG 2.1 AA** compliance.
- Prefer **semantic HTML** over custom abstractions.
- Ensure **full keyboard operability** and visible focus states.
- Use **ARIA only when native semantics are insufficient**.
- All interactive elements must be **screen reader compatible** and expose correct roles, names, and states.

## Testing

### Stack

**Test Runner:** Jest with `jest-fixed-jsdom`
**Component Testing:** React Testing Library with `@testing-library/jest-dom`
**API Mocking:** MSW (Mock Service Worker)
**Real-time Mocking:** `socket.io-mock`

### Configuration

- `package.json`: Jest configuration.
- `src/setupTests.js`: global mocks, polyfills, env vars.
- `src/test-utils.jsx`: custom `render` that wraps app providers (i18n, memory router, navigation).
- `src/i18nForTests.js`: i18n config, all namespaces loaded.
- `src/__test-helpers/`: map mock, store mock, fixtures.

### Testing Patterns

- Co-located `index.test.js` beside the module it covers. Imports follow the app's block order, with the module under test imported last in its own block as `from './'`, followed by the file's `jest.mock` calls.
- `describe('<path>')`, where the path mirrors the folder chain joined by ` - `. Top-level components use just their name. Nest a `describe` per exported function when a module exports several.
- `test('<third person present tense>')`: "shows the…", "does not render…", "updates the lock map setting when the user interacts with its checkbox". The name states the behavior, so the body needs no comment.
- Set mutable fixtures (`store`, `schema`) in `beforeEach`; declare shared `jest.fn()` handler mocks above it. Then declare a local render helper — `renderGeneralFieldSet`, `renderTimeSlider` — that wraps the component in whatever providers it needs and accepts prop and store overrides.
- `render` and `screen` come from `src/test-utils`; pass `initialEntries` when the component reads the URL. Supply Redux state with `mockStore` from `src/__test-helpers/MockStore` and reuse fixtures from `src/__test-helpers/fixtures`.
- Drive interactions with `userEvent`. Query with `getByRole` and the accessible name; fall back to `getByTestId` only for non-semantic wrappers. Assert on visibility, ARIA attributes and dispatched actions.
- Mock a duck by spreading `jest.requireActual` and replacing only the action creators used, and give thunks `mockImplementation(() => () => {})`.
- Mock HTTP with MSW: build the `setupServer` handlers from the duck's exported URL constants, and wire `beforeAll(() => server.listen())`, `afterEach(() => server.resetHandlers())`, `afterAll(() => server.close())`.
- Provide the map with `createMapMock` from `src/__test-helpers/mocks` through `MapContext.Provider`.
