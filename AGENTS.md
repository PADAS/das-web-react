# AGENTS.md

## Maintaining This File

- Edit it only when a change makes something written here wrong, or when the new fact is one that every agent needs. Most changes need no edit at all.
- Write for tokens: high level, clear, concise. No file-by-file detail, no prop or option lists, no changelog, nothing the code or a lint rule already states.
- Prefer rewriting an existing line over adding one, and delete whatever stopped being true.

## Product

**Project:** EarthRanger Web Client
**Organization:** EarthRanger
**Domain:** Wildlife Conservation Technology

### Core Concepts

- **EarthRanger:** Real-time operational platform for monitoring wildlife, assets, and field activities within protected areas.
- **DAS (Domain Awareness System):** Legacy product name. EarthRanger is the official name today. The repository (`das-web-react`) and some API references still use the `das` prefix.
- **Tenant:** Each deployment serves a single conservation site or organization. The web client talks to exactly one tenant's backend.
- **Companion products:** **Ecoscope**, the advanced analytics layer, and **Gundi**, the middleware that connects external data sources to EarthRanger.

### Events

**Events** are time-stamped incident reports. Each event has a **state**, a **priority**, a **reporter**, optional **notes** and **files**, and an `event_details` object holding what the user entered in the event's detail form. Geometry is a Point (`location`) or a Polygon (`geometry`).

States are `active`, `new` (legacy alias for active), `review` (community submissions awaiting moderation), and `resolved`. Priorities are `300` high / `200` medium / `100` low / `0` none; code and styles key off the color names `red` / `amber` / `green` / `none`.

> The codebase historically called events "reports". "Event" is the preferred term.

**Event Types** are the templates events belong to (e.g., "Injured Animal", "Snare"). They define the display name, icon, default priority, default state, geometry type, and a **form schema**, which is a JSON object that drives the event's detail form. Event types come in two versions: **v1** (legacy, rendered with `@rjsf/react-bootstrap`) and **v2** (current, rendered with a custom `SchemaForm`). **Event type categories** group them into a taxonomy.

**Incident Collections** are events with `is_collection: true` that group multiple child events through a `contains` relationship (e.g., a snare, carcass, and arrest under one incident).

**UI**
- **Events Feed** (`/events`): text search, filters (state, priority, event type, reporter, date range), and sorting.
- **Event Detail View** (`/events/:id` or `/events/new`): **Details** (state, reported-by, priority, location, date/time, and the schema-driven fields), **Activity** (notes, files, and contained events), **Links** (linked events and patrols), and **History** (audit trail from `updates`).
- **Map**: points render as clustered icon markers, polygons as priority-colored fills. Events are fetched as vector tiles and kept current by a socket-fed GeoJSON overlay. A heatmap overlay can be toggled from Map Layers → Events.
- **Community input** (`/community/:value/*`): a public page that reuses the event stack, letting unauthenticated users submit events.

### Subjects, Observations, and Tracks

**Subjects** are monitored entities: collared animals, vehicles, aircraft, personnel, and fixed sensors. Each has a `subject_type` (e.g., `wildlife`, `person`, `vehicle`, `static_sensor`) and a `subject_subtype` that classifies it further (e.g., `ranger`, `dugong`, `stationary-radio`). Key fields are `is_active`, `tracks_available`, `last_position` (a GeoJSON Point Feature), and `device_status_properties`, an array of telemetry readings. Subjects are organized into **subject groups**, a named hierarchy with nested subgroups.

A **source** is a telemetry device (GPS collar, radio, acoustic sensor). Sources generate **observations**, timestamped position records. The backend assigns sources to subjects for defined time windows, but the client always queries by subject ID.

**Tracks** are a subject's ordered positions: `track`, a FeatureCollection of LineStrings carrying `coordinateProperties.times`, one timestamp per coordinate; `points`, derived from it with a computed `bearing` per point; and `fetchedDateRange`, the `{ since, until }` window already loaded. With time-of-day coloring on, a `trackSegments` collection splits the line into time-range buckets, each with its own color.

Tracks are lazy-loaded and cached, and socket updates prepend new positions. Track history depth is user-configurable and can be locked to the active event filter's date range.

**Track visibility** cycles through three states: **hidden** (default), **visible** (lower opacity), and **pinned** (full opacity, higher render priority). Subjects can also join the **subject heatmap**, a density surface overlay.

**UI**
- **Map Subjects Layer**: icon markers from `last_position`, clustered at lower zoom levels.
- **Map Tracks Layer**: the line plus a symbol layer of rotated arrows at each timepoint. Color comes from the track's server-supplied `stroke`, falling back to a color seeded by subject ID.
- **Map Layers → Subjects** (`/layers`): searchable, sortable subject list, grouped or flat. Toggle map visibility, cycle track state, toggle heatmap membership, jump to location, view history, open messages.

### Patrols

**Patrols** are timed field activities (foot, vehicle, aerial, etc.) carried out by a team. A patrol has a ticker number, a title, an optional priority, notes and files, and is made up of one or more **legs**.

**Patrol Legs** hold the actual plan and data: a patrol type, scheduled and actual start/end times, start/end locations, the team and tracking assignments, and the values entered for the universal and patrol type fields. Creating a patrol means creating its first leg; a running patrol is continued with a new leg, which ends the previous one. Legs may differ in type.

> The API calls legs "patrol segments" — the two are the same thing. UI copy says "leg"; code names often follow the API.

**Patrol Types** are the templates legs belong to (e.g., "Vehicle Patrol", "Foot Patrol"). They define the display name, icon, default priority, and a **form schema** that drives the leg's type-specific fields, fetched on demand per type.

**Universal Patrol Fields** are the fields every leg renders on top of its patrol type's own, whatever the type. A site defines a single admin-configured schema for them, fetched once at startup.

> "Universal Patrol Fields" is the admin UI's wording. The API models them as the schema of a segment type whose value is `default`.

**Team & Tracking** are the leg fields for who is on it and what reports its position: a team, a team lead, team members, and assets (vehicles, radios, GPS devices), each chosen from its own site-level list. The team lead is stored as the leg's `leader`, which the API and older UI call "tracked by"; the tracked subjects' observations are what produce the patrol track.

**UI states** are derived client-side; the API only knows `open`, `done`, and `cancelled`:

| UI state | Condition |
|---|---|
| `scheduled` | scheduled start is more than an hour away |
| `ready_to_start` | scheduled start is within the next hour |
| `start_overdue` | scheduled start passed 30+ min ago and the patrol has not started |
| `active` | the first leg has begun and some leg has not ended |
| `paused` | paused and not yet resumed |
| `done` | every leg has ended |
| `cancelled` | cancelled |
| `invalid` | no legs, or a first leg with no start of any kind |

**Tracks.** The patrol track is the track of the leg's tracked subjects, trimmed to the leg's time range. Any patrol with a leg that has begun can display tracks, whatever state it went on to reach. Visibility follows the same three-state cycle as subjects.

**Provenance.** A patrol's `provenance` records where it was created, and its legs inherit it. An active patrol with `provenance: 'mobile'` can't be fully managed from the web client: it can't take new legs, and ending the patrol is the only status change offered.

**Two patrol UIs ship side by side**, switched by the `PATROL_SCHEMAS` preview feature: the legacy `SideBar/PatrolsFeed` and `PatrolDetailView`, and the current `SideBar/PatrolsManager`. New work goes in `PatrolsManager`, which is what the routes below describe.

**UI**
- **Patrols Feed** (`/patrols`): the patrol list, ordered ready_to_start → start_overdue → active → paused → scheduled → done → cancelled, then by most recent leg update. Inline actions per row (start, resume, restore). Filters: text search, date range, patrol type, tracked-by, and status.
- **New Patrol** (`/patrols/new?patrol-type=:id`): the leg form. Creating a patrol means creating its first leg, so this is the same form the leg routes use, with the patrol's title and type set here; the query parameter seeds the type.
- **Patrol Overview** (`/patrols/:patrolId`): header (editable title, track and location actions, kebab menu, status select), an **Overview** tab (the leg table, the summary stats, and the activity timeline) and a **History** tab, and footer actions to add notes, attachments and events.
- **New Leg** (`/patrols/:patrolId/legs/new`): the leg form, adding a leg to an existing patrol. Saving it ends the current leg and starts this one.
- **Leg Overview** (`/patrols/:patrolId/legs/:legId`): header, the leg's saved plan (times, locations, team and tracking, and its universal and patrol type fields), its activity timeline, and footer actions.
- **Edit Leg** (`/patrols/:patrolId/legs/:legId/edit`): the leg form, pre-filled with the leg's current values.
- **Map**: started patrols with visible or pinned tracks draw the route as a colored line with start, stop, leg and pause markers. Patrol symbols are labeled with the ticker.

### Gear

**Gear** is ropeless fishing equipment: buoy gearsets whose acoustic release devices report their position instead of being marked by a surface line. Each gear item has a manufacturer and one or more **devices**, each with its own hardware id and status readings.

Gear with a single device draws as one point. Gear with several devices is a **trawl**, drawn as a line between its device positions with a marker at each end. The same equipment also appears as a subject (`subject_subtype: ropeless_buoy_gearset`) when it reports telemetry, so a gearset can show up both in the gear list and on the subjects layer.

**UI**
- **Gear Feed** (`/gear`): searchable list, grouped by manufacturer or flat, with map visibility toggles per item and per group. Paginated on first load, then refreshed by a background poll.
- **Map**: clicking gear opens a popup with its details and one entry per device.

### Spatial Features

**Spatial features** are static geographic data layers displayed alongside live operational data: zones, boundaries, infrastructure, habitat areas, and reference cartography. They are organized into **featuresets**, named collections grouped by **feature type**.

Geometry can be Point, LineString, or Polygon. Per-feature styling (`fill`, `stroke` and their opacities) is stored on the feature and applied through vector tiles. A feature may carry an `analyzer_type` linking it to an analyzer definition.

**UI**
- **Map Layers → Features**: featuresets listed hierarchically (featureset → type → feature), with visibility toggles at every level and jump-to-bounds per feature.
- **Map**: clicking a feature opens a popup with its name and coordinates, and a button to report an event there.

### Analyzers and Alerts

**Analyzers** are server-side algorithms that evaluate streaming or recent data against configured rules: a **geofence** (polygon, triggers on entry or exit) or a **proximity** (point with a radius, triggers when a subject comes within range). The client never executes them; it only draws their geographic boundaries.

Some analyzers carry **spatial groups**, named GeoJSON feature collections, rendered as dashed overlays colored by severity; proximity analyzers are drawn as a circle buffered to their threshold radius. Only active analyzers are fetched. **Alerts**, the notifications raised when an analyzer fires, are managed entirely server-side.

**UI**
- **Map Layers → Analyzers**: list with visibility toggles. Selecting one zooms to its bounds and shows a popup linking to its admin configuration page.
- **Alerts**: the tenant's alert management page, embedded in an iframe from Settings and from the global menu.

### Messaging

**Messaging** lets authorized users exchange **two-way messages** with subjects carrying messaging-capable devices (e.g., inReach satellite communicators, supported radio integrations). Messages are grouped by date and sender, paginate on infinite scroll, track read/unread status, and update in real time.

**UI**
- **Messages**: reachable from the top bar and from subject map popups.

### Time Slider

The **time slider** sets a virtual date, a specific historical moment, shifting the map to reflect subject positions and event states at that time.

**UI**
- **Map**: a control that opens the slider and, once a date is set, keeps the map pinned to it until cleared.

### Coordinate Systems

EarthRanger works in **WGS84**, but the client displays and accepts coordinates in several formats (DEG, DMS, DDM, UTM, MGRS). Users can add custom **CRS** definitions by EPSG code; DEG is always the baseline.

**UI**
- **Settings → Map → Coordinate System Settings**: manage stored CRS definitions and configure a bounding-box overlay for the active one.
- Every field or widget that captures or displays coordinates renders in the currently selected format.

### Accounts and Access

A tenant's system config decides how users sign in: local credentials or Auth0, never both. Either path ends with an access token, kept in a cookie and in Redux and sent as a `Bearer` header.

- **Username and password** (`require_idp` off): posted to the DAS OAuth token endpoint.
- **Auth0 redirect** (`require_idp` on): to the organization's identity provider, or to EarthRanger Identity where the site has none. Those sites are mid-migration, so an account that is not linked yet is sent to the server's account linker. A site may also offer a **managed user** button, for accounts local to its own Auth0 database.

Two guards wrap the app: one redirects to the login route without a token, the other, where the EULA flag is on, to the EULA route until the user accepts it. A 401 tries a silent recovery — renewing the token, answering a step-up challenge, or restarting the redirect — and clears the session only when that fails. Signing out drops the token cookies, the selected profile, and all Redux state.

**Profiles.** An account can have profiles: alternate identities the user can operate as, PIN-protected when the profile has one. While a profile is active, requests carry a profile header and permissions come from the profile rather than the user.

**Permissions** are granted per domain (patrols, patrol types, events, messages, observations) as a set of actions (create, read, update, delete, export). A UI element that acts on a domain checks the matching permission, usually alongside the system config flag that enables the feature at all.

**UI**
- **Top bar → User Settings**: switch profile, sign out.

### App Chrome

The **top bar** carries the global menu button, the logo, map quick links, the system status indicator, messages, and the user menu.

The **sidebar** is a vertical panel whose tabs appear conditionally:

| Tab | Condition |
|---|---|
| **Events** | `EVENTS` flag |
| **Patrols** | `PATROL_MANAGEMENT` flag + patrol read permission |
| **Gear** | gear data available |
| **Map Layers** | `ANALYZERS`, `SPATIAL_FEATURES`, `SUBJECTS` or `EVENTS` flag |
| **Settings** | always |

**Map Layers** has four sub-tabs — Subjects, Features, Analyzers, Events — each shown only when its flag is on.

**Settings** has three sub-tabs:

- **General**: which UI state survives a page reload, UI language, sound notification toggles, and per-user overrides for the development feature flags.
- **Map**: lock map, 3D terrain, low-zoom simplification, coordinate system settings, track timepoints, inactive radios, per-class clustering, and per-class map marker labels.
- **Alerts**: the server-side alerts page in an iframe, shown only when the `ALERTS` flag is on.

The **global menu** is a drawer, every item gated by flags and permissions: the sidebar tabs (on small layouts, where the icon rail is hidden), the alerts modal, Contact Support, external links, export modals (daily report, master KML, subject information and reports, field reports), Ecoscope and Tableau links, and a footer with the server and client versions, copyright and the EULA and privacy links.

## Architecture

### Technical Stack

- **Runtime and tooling:** Node 24, Yarn 4, Vite 8, ESLint, Stylelint
- **UI:** React 19; `react-bootstrap` (Bootstrap 5); Sass modules
- **Routing:** React Router 8 declarative mode; SPA with `BrowserRouter`
- **State:** Redux 5 + `redux-thunk`, `redux-promise`, `reselect`; persistence via `redux-persist`
- **Map:** Mapbox GL
- **HTTP and real-time:** Axios, Socket.IO
- **Auth:** Auth0 + DAS token exchange
- **Geo and utilities:** `@turf/turf`, `proj4`, `geodesy`, `date-fns`, `lodash`, `@dnd-kit`
- **Forms:** `@rjsf/*` for v1 event schemas; a custom `SchemaForm` for everything current
- **i18n:** `i18next`, chained localStorage + HTTP backend
- **Testing:** Jest with `jest-fixed-jsdom`, React Testing Library, MSW, `socket.io-mock`
- **Analytics:** `react-ga4`; cookie consent via Osano
- **Delivery:** Workbox service worker; Docker and GitHub Actions

All application source is `.js`, including JSX — Vite compiles every source `.js` as JSX. Environment variables are exposed under the `REACT_APP_` prefix.

### Project Structure

- `src/index.js`: bootstrap and top-level routes
- `src/App.js`: authenticated shell; dispatches the site-wide reference-data fetches on startup
- `src/config.js`: deployment config; production defaults are hard-coded, other environments override at runtime via `window.__APP_CONFIG__`
- `src/store.js`, `src/reducers/`: store wiring, the `combineReducers` root, per-slice persistence, and the global reset used on sign-out
- `src/{ComponentName}/`: component folders, nested under their parent once they belong to one
- `src/common/`: shared assets and global SCSS partials
- `src/ducks/`, `src/selectors/`, `src/hooks/`, `src/utils/`: Redux logic per domain, reselect selectors, shared hooks, general utilities
- `src/views/`: full-page views rendered outside the app shell
- `src/withSocketConnection/`: Socket.IO context provider and real-time event binding
- `src/constants/`: shared constants, route patterns, and all Vite env exports
- `src/setupTests.js`, `src/test-utils.jsx`, `src/i18nForTests.js`, `src/__test-helpers/`, `jest-config/`: test setup, the provider-wrapping `render`, fixtures and mocks
- `public/locales/{locale}/{namespace}.json`: translation files

### Routing

Routes come from `constants/routes.js`, never from inline strings, and the whole app is mounted under `REACT_APP_ROUTE_PREFIX`. Above the shell sit the login, EULA and community routes; everything else falls through to the authenticated app. Inside it, path segments drive UI state through `getCurrentTabFromURL` / `getCurrentIdFromURL` in `utils/navigation.js`, on the patterns `/:tab/*` and `/:tab/:id/*`. The sidebar tabs are `events`, `patrols`, `gear`, `layers` and `settings`.

### State and Data Loading

- `state.data` holds API data; `state.view` holds UI state.
- All Redux logic for a domain lives in its duck. Derived state belongs in a reselect selector, not in a component.
- Slices that must survive a reload are wrapped in `persistReducer` at the root; slices that must be cleared on sign-out are wrapped in `globallyResettableReducer`.
- Reference data every screen depends on — schemas, types, categories, featuresets, maps, team and tracking options — is fetched once when the authenticated shell mounts.

### API Layer

`API_URL` and `API_V2_URL` are assembled from `DAS_HOST` plus path env vars in `src/constants/`, and imported directly by ducks. `RequestConfigManager` installs the Axios interceptors: they attach the auth `Bearer` token, add a `USER-PROFILE` header when a profile is active, attach the master cancellation token, and run the 401 recovery. A request opts out of auth with `skipAuth`.

### Real Time

`withSocketConnection` provides the Socket.IO connection through `SocketContext` and binds it to the ducks: server pushes update the stores and decide whether the changed object still belongs in the current feed. Feeds therefore stay live without refetching.

### Map

One Mapbox instance is created by the shell and shared through `MapContext`. Layers and sources are registered with `useMapLayers` / `useMapSources` so they are added and torn down consistently, and their ids live in `LAYER_IDS` / `SOURCE_IDS`.

### Form Schemas

The server stores a canonical **JSON Schema** per type. Client-side editing and rendering use a flat **formElements** structure derived from it; the transformation utilities live in `utils/form-schemas/`. `SchemaForm` renders that structure. Legacy v1 event schemas still render through `@rjsf`.

### Feature Flags and Permissions

Three separate gates, often combined on one element:

- **System config flags** (`SYSTEM_CONFIG_FLAGS`) are tenant settings that say whether a feature exists at all.
- **Preview features** (`PREVIEW_FEATURES`, read with `usePreviewFeature`) are server-driven opt-ins that select between two implementations of a feature.
- **Development feature flags** (`DEVELOPMENT_FEATURE_FLAGS`, read with `useFeatureFlag`) are client-side defaults, overridable per user from Settings → General.

Permissions are read through the `use<Domain>Permissions` hooks, which resolve against the selected profile when there is one.

### Analytics

Current UIs put a category-scoped tracker on `TrackerContext` at the top of a feature and call `tracker.track(...)` from descendants, so a component never names its own category. Older code builds a module-level `trackEventFactory(SOME_CATEGORY)` per file instead. Either way, an action is a readable sentence describing what the user did.

## Conventions

The repository favors code that reads the same everywhere. ESLint and Stylelint own a small part of that; everything below is convention they do not enforce, and it is expected in new code and in code you touch. Keep lines under about 120 columns.

### File and Folder Layout

- Every module is a folder with an `index.js`, co-located with its `index.test.js` and, for components, its `styles.module.scss`. Subcomponents live in a nested folder under their parent.
- Helpers used by a component or its subtree live in a sibling `utils/` folder, one function or hook per subfolder with its own `index.js` and `index.test.js`; shared literals go in `utils/constants.js`. That `index.js` default-exports a single function named exactly like its folder.
- **Rule of three:** a helper earns that folder once three call sites need it. At one or two, keep the logic inline or as a module-level helper in the file that uses it. The exception is a component grown large enough that a block of involved logic is worth encapsulating behind a good name and testing on its own — extract it then, deliberately, not by default.
- Utilities shared across the app are flat, domain-named files directly under `src/utils/`.
- Error classes get their own folder and a default-exported class.

### Imports

Group imports into blocks separated by a blank line, in this order:

1. External packages, `React` first.
2. SVG icons: `import { ReactComponent as CalendarIcon } from '../common/images/icons/calendar.svg';`
3. Internal non-components: constants, ducks, selectors, hooks, utils, and the module's own `./utils` helpers.
4. Components: app components, subcomponents, and lazily imported ones.
5. `import * as styles from './styles.module.scss';`

Sort each block alphabetically by the first imported binding, not by path. Reach into a package for a single export rather than pulling its barrel: `react-bootstrap/Overlay`, `lodash/omit`.

### Declarations and Naming

- Arrow functions everywhere.
- Module-level constants in `SCREAMING_SNAKE_CASE` above the component. Anything a test needs to reach is exported inline; there is exactly one default export, at the bottom of the file.
- An empty array, object or set used as a default or a fallback is a module-level `EMPTY_*` constant, so selectors and hooks keep referential equality across calls.
- Names are verbose and explicit over short and obscure.
- Collections are plural, and iterating one names its parameter that same word in the singular: `events.some((event) => event.id === eventId)`. A second parameter of the same kind takes an `other` prefix (`(timeRange, otherTimeRange)`).
- Booleans start with `is`/`has`/`can`/`should`; handlers and handler props with `on`; refs end in `Ref`; setters start with `set`.
- Selectors start with `select`, and whatever takes their value drops it: `selectPatrolTypes` gives `patrolTypes`, in `useSelector` reads and `createSelector` result functions alike.
- Avoid a variable read only once. Prefer the readable one-liner, and introduce the variable only when its name is what makes the code readable.
- Avoid destructuring anywhere but a component signature: `leg.startTime` keeps the origin of the value visible, while `const { startTime } = leg;` and `.map(({ id }) => id)` hide it. The one exception is unpacking a constants object at module level, where the origin is already in the line: `const { ACTIVE, DONE } = PATROL_UI_STATES;`.
- Reach for `?.` and `??` when a value may be absent. `||` is for a genuine falsy check, not a stand-in for them.
- Mapping a domain value to a result is a `SCREAMING_SNAKE_CASE` lookup object, not a chain of `if`s: `STATES_BY_PATROL_STATE`, `PRIORITY_COLOR_MAP`. Name it `X_BY_Y` when keyed by a domain value, `X_MAP` otherwise. Reducers keep their `switch`.
- Conditions read positively. A single branch wraps its logic rather than guarding with a bare `return;`; an early return that yields a value is fine.

### Alphabetical Ordering

Sort alphabetically, so diffs stay small and merge conflicts stay rare:

- object literal keys — action objects (`{ payload, type }`), reducer state, option objects, configuration, fixtures;
- JSX props, `aria-*` included, with `{...otherProps}` last;
- destructured props in a component signature, and named import bindings;
- `useSelector` and `useState` declarations within their group, by the name they bind;
- translation JSON keys, case-insensitively, nested and flat interleaved;
- CSS declarations within a rule.

Function parameters follow the call's own logic, not the alphabet.

### Component Structure

- Functional components with hooks. No PropTypes.
- Props destructured in the signature with defaults inline, alphabetically. `ref` is a plain prop. A component that wraps a DOM element collects the rest into `...otherProps` and spreads it last onto the root element.
- Body order, each group sorted alphabetically and separated by a blank line: library hooks (`useDispatch`, `useTranslation`, router hooks), app hooks, `useSelector` calls, `useContext`, `useRef`, `useId`, `useState`, derived variables, `useMemo`, handlers, `useEffect`, then the returned JSX.
- Memoize only when it pays: for a dependency array, for a genuinely expensive computation, or for the props of a `memo` boundary you checked actually bails. Never to spare a field or two a re-render. In practice that makes the presentational children of a stateful container good `memo` candidates, and the container itself a poor one.
- Return JSX bare — `return <Popover …>;`, never wrapped in parentheses. A component with nothing to show returns `null` from an early return.
- Render conditionally with `&&`; a ternary only when both branches render something.
- Compose a className as a template literal with the module's own class first and each modifier as `condition ? styles.modifier : ''`.
- A local function that handles an event is named `onX` after the event; a local function that performs an action keeps its verb (`closeMenu`).
- JSX: a blank line between sibling elements at the same indentation level, one-line inline arrows for trivial handlers, a local `render*` helper for JSX rendered in more than one place, and `type="button"` on every button.
- `data-testid` only where no accessible query can reach the element, named `<componentName>-<element>` (`timeSlider-wrapper`).

### Redux

- One duck per domain under `src/ducks/`, laid out in this order under `// Actions`, `// Action creators` and `// Reducer` banner comments: URL and tuning constants, action type constants, action creators, `INITIAL_STATE`, the reducer, default export. A domain holding several slices exports its reducers named instead, one `INITIAL_*_STATE` and reducer pair each.
- Action types are namespaced strings in `SCREAMING_SNAKE_CASE` (`'USER_CONTENT.SET_CHUNKED_UPLOAD_STATUS'`) and are exported, as are the API URL constants and `INITIAL_STATE`, so tests can mock and assert against them.
- Action creators return `{ payload, type }`; thunks are `(args) => (dispatch, getState) => …` and use `async`/`await` rather than promise chains.
- An action creator's name is the verb it performs: `fetch*`, `create*`, `update*`, `set*`, `add*`, `remove*`, `clear*`, `toggle*`, `show*`/`hide*`. A handler for a server push is `socket*`.
- A failed request is caught and logged with `console.warn` and a message naming the operation. Never `console.error` or `console.log`.
- Reducers are a `switch` returning new state; wrap one in `globallyResettableReducer(reducer, INITIAL_STATE)` when the slice must be cleared on sign-out.
- Selectors live under `src/selectors/{domain}/`: unexported input selectors and plain helpers at the top, then exported `createSelector` selectors. Parametrized selectors take the parameter as a second input, `(_, eventTypeId) => eventTypeId`.
- `createSelector` takes its inputs as an array on its own line and the result function last, whose parameters carry the same names as the inputs that feed them.

### Styling

- Component-specific styles go in a co-located `styles.module.scss`; global partials live in `src/common/styles/`; a subtree that repeats a pattern across its components keeps its own `_shared.scss` of mixins at its root.
- Pull colors, layout breakpoints and mixins from those partials with `@use`; never hard-code a value that already exists as a variable.
- Class names in camelCase, naming the element's role inside the component rather than how it looks: `.menuItemOption`, `.legTableWrapper`, `.titleBarMain`.
- Nest selectors to mirror the component's own DOM structure; keep media queries at the end of the block they modify.
- Sizes, spacing and radii in `rem`. `px` is for hairlines only — borders, outlines and shadows.
- Derive a hover, active or disabled shade from the variable with `color.adjust`; never introduce a second hex for it.
- Anything interactive styles `:focus-visible`, not only `:hover`.
- SVGs are imported as React components: `{ ReactComponent as XIcon } from '*.svg'`.

### Internationalization

- Translation files live under `public/locales/{locale}/`, one JSON file per UI namespace. Within a namespace, give each top-level component its own key, named after the component, and nest a child's key under its parent's when that child is a subcomponent below the parent folder.
- Read strings with `useTranslation('<namespace>', { keyPrefix: '<path>' })`, where the key prefix mirrors the component's position in the folder tree. Outside components, use `i18next.getFixedT(null, '<namespace>', '<keyPrefix>')`. A second prefix in the same component is aliased (`{ t: tStatusPill }`).
- Key names describe the element and its role, ending in the role noun — `Label`, `Title`, `Message`, `Placeholder`, `Tooltip`: `closeButtonLabel`, `resultsTableCaption`, `speedMenuOptionLabel`.
- Interpolate with `{{name}}`, and let i18next pluralize through `_one` / `_other` keys rather than branching on a count in the component.
- Call `t` inline where the string is used rather than holding its result in a variable, even when that repeats the call.
- Every user-facing string, including `aria-label` and `title` text, goes through i18n and is added to **every** locale, properly translated — never copied from English.
- Match the wording a locale already carries: one term per domain noun across a namespace, one regional variant and one level of formality per locale, and the same value for a message that already exists under another key.

### Comments

Comment only what the code cannot say — a non-obvious *why*, a caveat, an external reference. If naming and structure can carry it, no comment is written. Anything that restates what the code does is noise, and most code needs none at all.

- **One line.** Two is a ceiling, not a target: take the second only when the first genuinely cannot carry the reason, and cut rather than wrap a third time. `//` only, each line at most 80 columns — wider code nearby is no licence.
- **One reason.** A second sentence arguing the same point is cut, not kept.
- **Directly above the line it explains**, as a full sentence ending in a period. A comment above a function is for a caveat that governs the whole of it, never a summary of what it does — if a function needs that summary, its name is wrong or it is doing too much.
- An `eslint-disable` line always carries the reason it is there.
- A `TODO` is only for a blocker outside this repository, and says what it is waiting on. Otherwise, never leave working notes behind: no narrating the change (`// now using X instead of Y`, `// this fixes the bug`), no ticket numbers, no references to plans or conversations that exist only on your machine. The diff and the commit message are for that.
- None at all in `styles.module.scss` or test files — no exception for the subtle case. Test intent goes in the `describe` / `test` names: rename or split instead. Why production code is surprising belongs in the production file, not in its tests.

### Accessibility

- **WCAG 2.1 AA** compliance.
- Prefer **semantic HTML** over custom abstractions, and use **ARIA only when native semantics are insufficient**.
- Every interactive element is reachable and operable by keyboard, with a visible focus state and correct roles, names and states.
- A custom menu or listbox owns its keyboard model (arrows, Home/End, Escape, Tab) and returns focus to its trigger when it closes.
- Generate element ids with `useId`; mark decorative icons `aria-hidden`.

### Testing

- Co-located `index.test.js` beside the module it covers. Imports follow the app's block order, with the module under test imported last in its own block as `from './'`, followed by the file's `jest.mock` calls.
- `describe('<path>')`, where the path mirrors the folder chain joined by ` - `. Top-level components use just their name. Nest a `describe` per exported function when a module exports several.
- `test('<third person present tense>')`: "shows the…", "does not render…", "updates the lock map setting when the user interacts with its checkbox". The name states the behavior, so the body needs no comment.
- Set mutable fixtures and handler mocks in `beforeEach`. Then declare a local render helper — `renderGeneralFieldSet`, `renderStatusSelect` — that wraps the component in whatever providers it needs and accepts prop and store overrides, plus small query helpers where a query repeats.
- `render` and `screen` come from `src/test-utils`; pass `initialEntries` when the component reads the URL. Supply Redux state with `mockStore` from `src/__test-helpers/MockStore` and reuse the fixtures in `src/__test-helpers/`.
- Drive interactions with `userEvent`, and `await` every call. Query with `getByRole` and the accessible name; fall back to `getByTestId` only for non-semantic wrappers.
- Assert through the `jest-dom` matchers — `toBeVisible`, `toBeInTheDocument`, `toHaveAttribute`, `toHaveTextContent`, `toHaveClass` — and on dispatched actions, rather than reading DOM properties by hand.
- Mock a duck by spreading `jest.requireActual` and replacing only the action creators used, and give thunks `mockImplementation(() => () => {})`.
- Mock HTTP with MSW: build the `setupServer` handlers from the duck's exported URL constants and wire `server.listen` / `resetHandlers` / `close`. Provide the map with `createMapMock` through `MapContext.Provider`, and analytics with a `TrackerContext` value whose `track` is a `jest.fn()`.
- A test that would have passed before your change is not a regression guard. Check that each new test fails against the old behavior.

## Workflow

### Commands

- `yarn start`: Vite dev server on port 9000
- `yarn build`: production bundle, then the service worker
- `yarn test <path-or-pattern>`: Jest. It pins `TZ=UTC`; a bare `jest` invocation will fail datetime tests on any other machine timezone.
- `yarn lint`: ESLint over all of `src`, which carries pre-existing problems. To see only yours, run `npx eslint` on the files you touched.
- `yarn stylelint`: Stylelint over the SCSS modules
- `yarn check-i18n-files-version`: verifies the translation cache version was bumped

### Scope

Follow the boy scout rule: leave a file you touch better than you found it. That rule has a boundary — improvements stay inside the files the task already takes you to. Do not open a neighboring file to tidy it, and do not widen a fix into a refactor.

Older code does not follow these conventions. That is expected: do not migrate it, and do not copy it either. Match this file, not the file you are reading.

### The Polish Pass

Before you call the work done, reread what you wrote — every changed hunk, not from memory — and improve it. This is not a lint step; the linter has already run. Go through these in order, and fix what you find:

1. **Correctness.** What input makes this wrong? Empty collections, absent dates, a patrol with no legs, a subject with no position.
2. **Readability.** Would a reviewer understand this without asking? Better names beat more code, and more code beats a comment explaining a bad name.
3. **Conventions.** Reread against the sections above — ordering, imports, component body order, naming. Drift here is the most common review comment.
4. **Cost.** Work repeated per render or per item, a selector that rebuilds an array each call, a `useMemo` that guards nothing, a memo boundary that never bails, a listener never removed.
5. **Semantics and accessibility.** Native element over a div, keyboard path, focus after the interaction, roles and names a screen reader will announce.
6. **Translations.** Every new string in every locale, genuinely translated, and matching the wording those locales already use.
7. **Comments.** Delete each one that says what the code says, and shorten every two-line comment that one line would carry. Keep only the *why*.
8. **Tests.** Cover the behavior you changed, at the level the change lives at.

### Before You Commit

- Run `yarn lint`, and `yarn stylelint` if you touched SCSS. Fix every problem you introduced.
- Run `yarn test` over the areas you changed and make sure they pass.
- If you changed anything under `public/locales/`, bump `I18N_FILES_VERSION` in `src/i18n.js` and verify with `yarn check-i18n-files-version`.
- Update this file only under the terms in **Maintaining This File**.
