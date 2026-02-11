# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EarthRanger Web is a conservation management React application for tracking wildlife, rangers, and events. Built with React 19, Redux, and Mapbox GL for rendering interactive conservation maps and real-time data visualization.

## Development Commands

### Local Development
```bash
# Docker development (first-class option)
docker compose up --build

# Direct development (requires Node & Yarn)
yarn start                  # Dev server at http://localhost:9000

# Testing
yarn test                   # Watch mode
yarn test-ci                # CI mode with coverage

# Linting
yarn lint                   # ESLint (2-space indent, single quotes, semicolons required)
yarn stylelint              # SCSS linting

# Building
yarn build                  # Production build with service worker
```

### Running Single Tests
```bash
# Run specific test file
yarn test EventFeed/index.test.js

# Run tests matching pattern
yarn test --testNamePattern="should render correctly"
```

## Architecture Overview

### Redux "Ducks" Pattern (50+ modules in `src/ducks/`)
- **Single-file modules**: All Redux logic (actions, reducers, selectors) lives together
- **State structure**: `state.data` (server data) + `state.view` (UI state)
- **Persistence**: Uses `redux-persist` with `localforage` for selective browser storage
- **Higher-order reducers**:
  - `globallyResettableReducer` - Global state reset capability
  - `namedFeedReducer` - Reusable feed reducers with shared logic
- **Key ducks**: `events.js`, `subjects.js`, `patrols.js`, `map-location-selection.js`

### React Context Architecture
Core contexts that components frequently consume:
- **MapContext** (`App.js`): Mapbox GL map instance - `const map = useContext(MapContext)`
- **SocketContext**: WebSocket connection for real-time updates
- **NavigationContext**: Navigation blocking/confirmation dialogs
- **SidebarScrollContext**: Sidebar scroll position management
- **MapDrawingToolsContext**: Drawing tools state

### Component Organization Pattern
- **One component per directory** at `src/` root (~200 components)
- **Structure**: `ComponentName/index.js` + `ComponentName/styles.module.scss` + `ComponentName/index.test.js`
- **CSS Modules**: 172 `.module.scss` files - scoped styling throughout
- **Deep nesting**: Feature components contain subcomponents (e.g., `SideBar/MapLayersTab/SubjectsTab/`)

### Map Layer Architecture
Map layers are React components that manage Mapbox GL layers:
- **Layer components**: `SubjectsLayer/`, `EventsLayer/`, `TracksLayer/`, `PatrolsLayer/`
- **Layer lifecycle**: Always check `if (!map.getLayer(LAYER_ID))` before adding
- **Cleanup pattern**: Remove layers/sources in useEffect cleanup to prevent memory leaks
- **Layer IDs**: Constants in `src/constants/` to prevent typos
- **Authentication**: Vector tiles use Bearer tokens via `transformRequest` in source config

## Testing Infrastructure

### Custom Test Utilities (`src/__test-helpers/`)
**ALWAYS use these instead of creating new mocks:**
- **`import { render } from '../test-utils'`**: Custom render with i18n, router, navigation providers
- **`createMapMock()`**: Mock Mapbox map instance with proper event handlers
- **`MockStore.js`**: Redux store mocking with middleware
- **`MockSocketContext`**: WebSocket simulation for tests
- **`fixtures/`**: 18 fixture files - reuse existing mock data (events, subjects, patrols, clusters)
- **`mocks.js`**: Map events, interaction events, component mocks

### Test Patterns
```javascript
// Always wrap map-dependent components
import { MapContext } from '../App';
import { createMapMock } from '../__test-helpers/mocks';

const map = createMapMock();
render(
  <MapContext.Provider value={map}>
    <YourComponent />
  </MapContext.Provider>
);

// Use custom render from test-utils for most components
import { render } from '../test-utils';
render(<YourComponent />);
```

## Data Flow Patterns

### API Integration
- **Base URLs**: `API_URL` (api/v1.0) for legacy, `API_V2_URL` (api/v2.0) for newer endpoints
- **Authentication**: Bearer tokens from `state.data.token`
- **Error handling**: Use `generateErrorMessageForRequest()` utility
- **Parallel requests**: `parallelPaginatedQuery()` for large datasets
- **Request cancellation**: Cancel tokens managed in duck files

### Real-Time Updates
- **Dual Socket.io**: Legacy v2 (`legacy-socket.io-client`) + current v4
- **Pattern**: Socket events trigger Redux actions → state updates → component re-renders
- **Optimistic updates**: UI updates before server confirmation
- **Event validation**: Real-time events filtered against current Redux filters

### Mapbox Integration
```javascript
// Vector tile pattern with authentication
source: {
  type: 'vector',
  tiles: [`${API_URL}spatialfeatures/tiles/{z}/{x}/{y}.pbf`],
  transformRequest: (url) => ({
    url,
    headers: { Authorization: `Bearer ${token}` }
  })
}

// Click handlers
map.on('click', LAYER_ID, (event) => {
  const features = map.queryRenderedFeatures(event.point, {
    layers: [LAYER_ID]
  });
});

// Map filters using Mapbox expressions
['!', ['in', ['get', 'id'], ['literal', hiddenIDs]]]
```

## Key Environment Variables
```bash
REACT_APP_DAS_API_URL      # Backend API endpoint
REACT_APP_MAPBOX_TOKEN     # Required Mapbox GL token
REACT_APP_DAS_HOST         # Host for API calls
REACT_APP_SOCKET_URL       # WebSocket endpoint
```

## File Organization Guide

### Core Directories
- **`src/ducks/`**: Redux modules (actions, reducers, selectors)
- **`src/hooks/`**: Custom React hooks (20+ hooks)
- **`src/utils/`**: Pure utility functions (analytics, auth, events, geometry, map)
- **`src/selectors/`**: Reselect selectors for derived state
- **`src/constants/`**: Global constants (API URLs, layer IDs, statuses)
- **`src/__test-helpers/`**: Testing utilities and fixtures
- **`react-app-config/`**: Custom webpack and Jest configuration

### Component Directories
Each top-level component directory may contain:
- `index.js` - Main component export
- `styles.module.scss` - CSS Module
- `index.test.js` - Jest tests
- Subdirectories for nested components
- `utils/` - Component-specific utilities

## Common Integration Points

### Internationalization
```javascript
import { useTranslation } from 'react-i18next';

const { t } = useTranslation('namespace-name');
t('key.path');
```
- **20+ namespaces** organized by feature
- Lazy loading of translation files
- LocalStorage caching with version-based busting

### Navigation
```javascript
import { useNavigate } from '../hooks';

const navigate = useNavigate();
navigate('/path', { state: { ... } });
```
- Custom hook handles blocked navigation states
- Navigation confirmation dialogs via NavigationContext

### Analytics
```javascript
import { trackEventFactory } from '../utils/analytics';

const trackEvent = trackEventFactory('Component Name');
trackEvent('action', 'label', value);
```

### Notifications
```javascript
import { showToast } from '../utils/toast';

showToast({ message: 'Success', type: 'success' });
```

### User Permissions
```javascript
import { userIsGeoPermissionRestricted } from '../utils/permissions';

if (userIsGeoPermissionRestricted(user)) {
  // Handle geo-restricted user
}
```

## Important Conventions

### Redux Duck Structure
```javascript
// Action types as constants
const FETCH_EVENTS = 'FETCH_EVENTS';
const FETCH_EVENTS_SUCCESS = 'FETCH_EVENTS_SUCCESS';

// Action creators
export const fetchEvents = (params) => (dispatch, getState) => {
  // Thunk with axios, cancel tokens, error handling
};

// Multiple reducers exported
export const eventsStore = (state = {}, action) => { /* ... */ };
export const eventsFeed = namedFeedReducer('events');

// Default export combines reducers
export default combineReducers({
  store: eventsStore,
  feed: eventsFeed,
  ui: eventsUI,
});
```

### Map Component Cleanup
```javascript
useEffect(() => {
  if (!map) return;

  // Add layers/sources
  map.addLayer(layerConfig);

  // Cleanup function is REQUIRED
  return () => {
    if (map.getLayer(LAYER_ID)) map.removeLayer(LAYER_ID);
    if (map.getSource(SOURCE_ID)) map.removeSource(SOURCE_ID);
  };
}, [map, dependencies]);
```

### CSS Module Naming
```scss
// styles.module.scss
.componentName { }
.componentName-element { }
.componentName-modifier { }

// Usage in JS
import styles from './styles.module.scss';
<div className={styles.componentName} />
```

## Error Handling & Performance

- **Error boundaries**: Route-level components wrapped with ErrorBoundary
- **Request lifecycle**: Always resolve/reject promises properly
- **Memory management**: Watch for leaks in map layers and event handlers
- **Code style**: Follow ESLint rules strictly - 2-space indent, single quotes, semicolons

## Authentication Flow

The app uses Auth0 for authentication:
- Auth0React provider wraps the application
- Token stored in Redux state (`state.data.token`)
- Logout links to IDP logout for proper session clearing
- Token included in API requests via axios interceptors

## Build System Notes

- **Custom react-scripts**: Modified CRA configuration in `react-app-config/`
- **Service worker**: Custom build script (`src/sw-build.js`)
- **Source maps**: Disabled in production (`GENERATE_SOURCEMAP=false`)
- **Tailwind CSS**: v4.1.13 integrated alongside SCSS
- **Module transforms**: Special handling for geodesy, lodash-es, nanoid in Jest
