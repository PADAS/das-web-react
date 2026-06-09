# AGENTS.md

## Business

**Project:** EarthRanger Web Client (`das-web-react`)
**Domain:** Conservation field operations management

### Core Concepts

- **EarthRanger:** Real-time operational platform for monitoring wildlife, assets, and field activities within protected areas.
- **DAS (Domain Awareness System):** Legacy product name. EarthRanger is the official name today. The repository (`das-web-react`) and some API references still use the `das` prefix.
- **Tenant:** Each EarthRanger deployment serves a single conservation site or organization. The web client connects to exactly one tenant's backend. Multi-tenancy is server-side.
- **Companion products:**
  - **Ecoscope:** advanced analytics layer.
  - **Gundi:** middleware aggregation layer connecting external data sources to EarthRanger.

### Events

**Events** are time-stamped incident reports. Each event has a **state** (`active` / `resolved`), a **priority** (`0` - none / `100` - low / `200` - medium / `300` - high), a **reporter**, optional **notes** and **files**, and an `event_details` object that holds the data the user entered in the event's detail form. They can be Points or Polygons on the map.

> The codebase historically called events "reports". "Event" is the preferred term.

**Event Types** are the templates events belong to (e.g., "Injured Animal", "Snare"). They define the display name, icon, default priority, default state, geometry type, and a **form schema**, which is a JSON object that drives the event's detail form. Event types come in two versions: **v1** (legacy, rendered with `@rjsf/react-bootstrap`) and **v2** (current, rendered with a custom `SchemaForm`).

**Event Type Categories** group event types into a taxonomy (e.g., "Monitoring", "Security", "Logistics").

**Incident Collections** are events with `is_collection: true` that group multiple child events through a `contains` relationship (e.g., a snare, carcass, and arrest under one incident).

**UI**
- **Events Sidebar** (`/events`): text search, filters (state, priority, event type, reporter, date range), and sorting.
- **Event Detail View** (`/events/:id` or `/events/new`): **Details** section (state, reported-by, priority, location, date/time, and schema-driven form fields), **Activity** section (notes, files, and contained events for incident collections), **Links** section (linked events and patrols), and **History** section (audit trail from `updates`).
- **Map:** Point events render as clustered icon markers; polygon events as priority-colored fills.
- A heatmap overlay can be toggled from Map Layers → Events.

### Subjects, Observations, and Tracks

**Subjects** are monitored entities: collared animals, vehicles, aircraft, personnel, and fixed sensors. Each subject has a `subject_type` (e.g., `wildlife`, `person`, `vehicle`, `static_sensor`) and a `subject_subtype` that further classifies it (e.g., `ranger`, `dugong`, `stationary-radio`). Key fields include `is_active`, `tracks_available`, `last_position` (a GeoJSON Point Feature), and `device_status_properties`, an array of telemetry readings (`label`/`units`/`value`). Real-time position updates arrive via WebSocket.

Subjects are organized into **subject groups**, a named hierarchy with nested subgroups.

A **source** is a telemetry device (GPS collar, radio, acoustic sensor). Sources generate **observations**, discrete timestamped position records that each carry a `source` UUID and their own `device_status_properties`. The backend assigns sources to subjects for defined time windows, but the client always queries by subject ID.

**Tracks** are the ordered sequence of a subject's positions as a GeoJSON `LineString`:
- `track`: `FeatureCollection` of `LineString` features with `coordinateProperties.times` (one timestamp per coordinate)
- `points`: `FeatureCollection` of `Point` features derived from the line, each with a computed `bearing` for directional arrows
- `fetchedDateRange`: the `{ since, until }` window already loaded

Tracks are lazy-loaded and cached. Track history depth is user-configurable (default 7 days) and can be locked to the active event filter's date range. When time-of-day coloring is enabled, a `trackSegments` `FeatureCollection` is added that segments the line into time-range buckets, each with a distinct color.

**Track visibility** cycles through three states: **hidden** (default), **visible** (line at lower opacity), and **pinned** (full opacity, higher render priority). Subjects can be included to the **subject heatmap**, a density surface overlay on the map.

**UI**
- **Map Subjects Layer:** renders subject icon markers from `last_position`, clustered at lower zoom levels.
- **Map Tracks Layer:** draws the line string as a colored line plus a symbol layer of rotated arrows at each timepoint. Default color is deterministic and seeded by subject ID; with time-of-day coloring, each segment uses a period-specific color.
- **Map Layers Sidebar Tab** (`/layers`): searchable, sortable subject list (grouped hierarchy or flat). Controls: toggle map visibility, cycle track state (hidden → visible → pinned), toggle heatmap membership, jump to location, view history.

### Patrols

Patrols are timed field activities (foot, vehicle, aerial, etc.). **Patrol types** define the activity category and supply a default icon and priority.A patrol has a top-level `state` (API: `open` / `done` / `cancelled`), and optional `objective`, `title`, `priority`, `notes`, and `files`. It always contains a **patrol segment**, which holds:

- `patrol_type`: type identifier referencing a patrol type object
- `leader`: a subject reference (ranger, vehicle, aircraft) whose observation track becomes the patrol track
- `time_range`: `{ start_time, end_time }`, actual start/end timestamps
- `scheduled_start` / `scheduled_end`: planned times before the patrol is started
- `start_location` / `end_location`: explicit `{ latitude, longitude }` overrides for start/stop map markers
- `events`: events linked to this segment

**UI states** are derived client-side from the API state and segment times, the API only knows `open`, `done`, `cancelled`:

| UI state | Condition |
|---|---|
| `scheduled` | `scheduled_start` is more than 1 hour in the future |
| `ready_to_start` | `scheduled_start` is within the next hour |
| `start_overdue` | `scheduled_start` is 30+ min past but patrol not yet started |
| `active` | `start_time` set and in the past, no `end_time` |
| `done` | `end_time` is in the past, or API `state: 'done'` |
| `cancelled` | API `state: 'cancelled'` |
| `invalid` | No `patrol_segments`, or no pending segment matches any known state |

**Tracks.** The patrol track is the leader subject's track, trimmed to the segment's `time_range`. Only `active` and `done` patrols can display tracks. Track visibility follows the same three-state cycle as subjects (hidden → visible → pinned).

**UI**
- **Patrols Sidebar** (`/patrols`): Feed sorted ready_to_start → start_overdue → active → scheduled → done → cancelled. Filters: text search, date range, patrol type, tracked-by, and status.
- **Patrol Detail View** (`/patrols/:id` or `/patrols/new`): **Plan** section (leader/tracked-by, objective, start/end datetime and location, with auto-start/auto-end scheduling toggles), **Activity** section (linked events, notes, files), and **History** section (audit trail from `updates`).
- **Map**: Active and done patrols with visible/pinned tracks show the leader's route as a colored line with start and stop icon markers at each endpoint. Patrol symbols are labeled with a ticker.

### Spatial Features

**Spatial features** are static geographic data layers displayed on the map alongside live operational data: zones, boundaries, infrastructure, habitat areas, and reference cartography. They are organized into **featuresets**, named collections grouped by **feature type**.

Feature geometry can be Point, LineString, or Polygon. Per-feature styling properties (`fill`, `stroke`, `fill_opacity`, `stroke_opacity`) are stored on the feature and applied via vector tiles (`GET /spatialfeatures/tiles/{z}/{x}/{y}.pbf`). Features may carry an `analyzer_type` (`geofence` or `proximity`) linking them to an analyzer definition.

**UI**
- **Map Layers Sidebar - Features tab**: featuresets listed hierarchically (featureset → type → individual feature). Per-feature visibility toggle and jump-to-bounds.
- Clicking a feature on the map opens a popup with its name and type.

### Analyzers and Alerts

**Analyzers** are server-side algorithms that evaluate streaming or recent data against configured rules. For example:
- **Geofence**: polygon boundary, triggers when a subject enters or exits.
- **Proximity**: point with a radius, triggers when a subject comes within range.

Some analyzers have one or more **spatial groups**, named GeoJSON feature collections. The web client renders these as dashed polygon and line overlays on the map (yellow for warning severity, red for critical). The client does not execute analyzers; it only displays their geographic boundaries.

**Alerts:** the notifications raised when an analyzer fires, are managed entirely server-side. The client provides a modal iframe in global the menu modal and in Settings → Alerts.

**UI**
- **Map Layers Sidebar — Analyzers tab**: list of analyzers with visibility toggles. Selecting an analyzer zooms the map to its bounds and shows a popup linking to its admin configuration page.
- **Alerts modal**: opened from the global menu; embeds the tenant's alert management page in an iframe.

### Time Slider

The **time slider** is a map control that sets a virtual date, a specific historical moment, shifting the map's display to reflect subject positions and event states at that time.

### Coordinate Systems

EarthRanger works in **WGS84** but the client supports multiple display and input formats (DEG, DMS, DDM, UTM, MGRS).

Users can add custom **CRS** definitions by EPSG code. DEG is always included as the baseline.

**UI**
- **Settings → Map**: manage stored CRS definitions and configure a bounding-box overlay for the active CRS.
- All fields or UI widgets that capture or display coordinates render values in the currently selected format.

### Map Settings

**Settings → Map** organizes display controls in three groups:

- **General**: Lock map, enable 3D terrain, simplify map data at low zoom, and open **Coordinate System Settings**.
- **Display**: Show track timepoints along subject lines, show inactive radios, per-class **clustering** toggles with an optional cluster footprint polygon overlay.
- **Map Markers**: Show/hide name labels independently for subjects, stationary sensors, events, and patrols; toggle the user's own GPS location marker.

### Messaging

**Messaging** lets authorized users send and receive **two-way messages** with subjects that carry messaging-capable devices (e.g., inReach satellite communicators, supported radio integrations).

Messages are grouped by date and sender, support infinite-scroll pagination, and track read/unread status. Real-time updates arrive via WebSocket. The messaging UI is accessible from subject map popups and the nav.

Sound notifications for new inReach messages are configurable in Settings → General.

### Sidebar and Settings

The sidebar is a vertical panel with tabs shown conditionally by system config flags and user permissions:

| Tab | Condition |
|---|---|
| **Events** | `EVENTS` flag |
| **Patrols** | `PATROL_MANAGEMENT` flag + patrol read permission |
| **Gear** | Gear data available |
| **Map Layers** | `ANALYZERS`, `SPATIAL_FEATURES`, `SUBJECTS`, or `EVENTS` flag |
| **Settings** | Always |

**Settings** has three sub-tabs:

- **General**
  - **App Refresh**: Which UI state survives a page reload.
  - **Language**: UI language.
  - **Sounds**: Independent toggles for new event sounds, new inReach message sounds, and radio red-state transition sounds.
  - **Experimental Features**: Toggles for in-development feature flags (only shown when flags are present in the store or query string).
- **Map**
- **Alerts**

### Global Menu

The hamburger menu opens a left-side drawer. Items are visibility-gated by system config flags and user permissions:

- **Alerts:** modal iframe of the tenant's alerts page.
- **Contact Support:** uses the embedded JIRA help widget when available.
- **Help Center, Community, Users Guide:** external links opening in a new tab.
- **Exports:** each opens a modal; all are permission- or flag-gated:
  - Daily Report
  - Master KML
  - Subject Information and Subject Reports
  - Field Reports
- **Ecoscope:** sub-menu with links to Ecoscope Downloader and Ecoscope Analysis.
- **Footer:** server version, client build version, copyright, and EULA / privacy policy links.

## Development

### Technical Stack

- **Runtime:** Node.js 24
- **Package manager:** Yarn 4
- **UI:** React 19, `react-dom`; component library via `react-bootstrap` (Bootstrap 5)
- **Routing:** React Router 7 (client-only SPA with `BrowserRouter`)
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
- `src/config.js`: runtime auth config
- `src/store.js`: Redux store: `thunk` + `promiseMiddleware` + Redux DevTools extension hook
- `src/{ComponentName}/`: mostly flat component folders; component-specific styles in co-located `styles.module.scss`
- `src/common/`: shared assets and global SCSS partials
- `src/ducks/`: Redux logic per domain
- `src/reducers/index.js`: `combineReducers` root; wires `persistReducer` per slice
- `src/selectors/`: reselect selectors
- `src/hooks/`: shared hooks
- `src/withSocketConnection/`: Socket.IO context provider and real-time event binding
- `src/constants/index.js`: shared constants and all Vite env exports
- `src/utils/`: general utilities
- `src/__test-helpers/`: fixtures and mocks
- `jest-config/`: Jest transformers and asset mocks
- `public/locales/{locale}/{namespace}.json`: translation files

### Application Patterns

#### Routing and URL shape

- **Prefix:** `REACT_APP_ROUTE_PREFIX`
- **Top-level routes:** `login`, `eula`, `*` → main `App`
- **In-app navigation:** Path segments drive UI state via `getCurrentTabFromURL` / `getCurrentIdFromURL` in `utils/navigation.js`. Patterns `/:tab/*` and `/:tab/:id/*`.
  - **Sidebar tabs:** `events`, `layers`, `patrols`, `settings`

#### Redux and data loading

- Prefer function components with `useDispatch` / `useSelector`
- All Redux logic lives in single files under `src/ducks/`
- State structure: `state.data` - API data, `state.view` - UI state
- Add derived state in `selectors/` with reselect

#### Map

Central `map` instance shared via `MapContext`.

#### API layer

`API_URL` and `API_V2_URL` are assembled from `DAS_HOST` + path env vars in `src/constants/index.js` and imported directly in duck files. `RequestConfigManager` installs Axios interceptors that attach the auth `Bearer` token, add a `USER-PROFILE` header when a profile is active, attach a cancellation token, and redirect to login on 401.

#### Styling

Component-specific styles use co-located `styles.module.scss`. Global partials in `src/common/styles/` are imported where needed. SVGs are imported as React components via `{ ReactComponent as XIcon } from '*.svg'`.

#### Internationalization

Translation files live under `public/locales/{locale}/`. Each locale directory contains one JSON file per UI namespace. All new user-facing strings must be added to every locale file, properly translated into each locale's language.

#### Event form schema

The server stores a canonical **JSON Schema** per event type. Client-side editing and rendering use a flat **formElements** structure derived from it. Transformation utilities live in `utils/v2-event-schemas/`.

### Key Commands

- `yarn start`: Vite dev server
- `yarn build`: production bundle to `build/`, then service worker (`build-sw`)
- `yarn build-sw`: Workbox / SW generation only
- `yarn test`: Jest
- `yarn test-ci`: CI-oriented Jest flags
- `yarn lint`: ESLint
- `yarn stylelint`: SCSS modules

### Development Preferences

#### Component Structure

- Functional components with hooks; props destructured in function signature.
- No PropTypes.

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

- Co-located `*.test.*` files.
- Use a local `renderComponent` helper; prefer `getByRole` queries.
