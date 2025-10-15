# EarthRanger Web - AI Agent Instructions

## Project Overview
EarthRanger Web is a conservation management React application for tracking wildlife, rangers, and events. Built with React, Redux, and Mapbox GL for rendering interactive conservation maps and data visualization.

## Architecture Patterns

### Redux "Ducks" Pattern
- **Pattern**: All Redux logic (actions, reducers, selectors) lives in single files under `src/ducks/`
- **Key insight**: Import from ducks like `import { fetchEvents } from '../ducks/events'`
- **State structure**: `state.data` (API data), `state.view` (UI state)
- **Persistence**: Uses `redux-persist` with `localforage` for browser storage

### React Context Architecture
- **MapContext**: Central map instance shared via `import { MapContext } from '../App'`
- **Pattern**: Components use `const map = useContext(MapContext)` to access Mapbox map
- **SocketContext**: Real-time data via WebSocket connection for live updates
- **Custom contexts**: `MapDrawingToolsContext`, `SidebarScrollContext`, `NavigationContext`, `FormDataContext`

### Component Composition Patterns
- **EditableItem**: Uses compound component pattern with `EditableItem.Header`, `EditableItem.Body`, etc.
- **Context providers**: Wrap components with multiple providers (Map, Socket, Navigation)
- **HOC pattern**: `withFormDataContext` and `withSocketConnection` for enhanced components

### Testing Infrastructure
- **Custom render**: Always use `import { render } from '../test-utils'` (includes i18n, router, navigation providers)
- **Map mocking**: Use `createMapMock()` from `__test-helpers/mocks`
- **Context wrapping**: Tests require `<MapContext.Provider value={map}>` for map-dependent components
- **Socket mocking**: `MockSocketContext` provides test-safe WebSocket simulation
- **Reuse fixtures**: Use existing test fixtures and mocks from `__test-helpers/` rather than creating new ones

## Development Workflows

### Local Development
```bash
# Both Docker and direct development are first-class options
docker compose up --build  # Docker approach
yarn start                  # Direct development

# Testing
yarn test        # Watch mode
yarn test-ci     # CI mode with coverage
yarn lint        # ESLint
yarn stylelint   # SCSS linting
```

### Key Environment Variables
- `REACT_APP_DAS_API_URL`: Backend API endpoint
- `REACT_APP_MAPBOX_TOKEN`: Required Mapbox GL token
- `REACT_APP_DAS_HOST`: Host configuration for API calls

## Mapbox Integration Patterns

### Layer Management
- **Vector tiles**: Use `${API_URL}spatialfeatures/tiles/{z}/{x}/{y}.pbf` pattern
- **Authentication**: Add Bearer token via `transformRequest` in source config
- **Layer lifecycle**: Always check `if (!map.getLayer(LAYER_ID))` before adding layers
- **Cleanup**: Remove layers and sources in useEffect cleanup functions (prevent memory leaks)

### Map Event Handling
- **Click handlers**: Use `map.queryRenderedFeatures(event.point, { layers: [LAYER_ID] })`
- **Context menus**: Right-click events for feature interactions
- **Drawing tools**: Custom polygon/line drawing with real-time updates

## Data Flow Patterns

### API Integration
- **Base URLs**: `API_URL` (api/v1.0) for legacy, `API_V2_URL` (api/v2.0) for newer endpoints
- **Authentication**: Bearer tokens from Redux state (`state.data.token`)
- **Error handling**: Use `generateErrorMessageForRequest` utility
- **Parallel requests**: `parallelPaginatedQuery` for large datasets

### Real-time Updates
- **WebSocket**: Connect via `SocketContext` for live data updates
- **Event handling**: Components subscribe to socket events for real-time features
- **State synchronization**: Socket updates trigger Redux actions

### Filtering and Selection
- **Event filters**: Use `calcEventFilterForRequest` for API queries
- **Map filters**: Mapbox expressions like `['!', ['in', ['get', 'id'], ['literal', hiddenIDs]]]`
- **User permissions**: `userIsGeoPermissionRestricted` for location-based access

## File Organization
- `src/ducks/`: Redux modules (actions, reducers, selectors)
- `src/hooks/`: Custom React hooks (`useNavigate`, `useMapLayers`)
- `src/utils/`: Pure utility functions (analytics, formatting, geo calculations)
- `src/__test-helpers/`: Testing utilities and mocks
- `react-app-config/`: Custom webpack and build configuration

## Common Integration Points
- **i18n**: Use `useTranslation` hook, organized by component namespace
- **Navigation**: Custom `useNavigate` hook handles blocked navigation states
- **Analytics**: `trackEventFactory` for user interaction tracking
- **Notifications**: `showToast` for user feedback
- **Geo utilities**: Coordinate transformations, distance calculations with `geodesy`

## Testing Conventions
- **Component tests**: Always wrap with required providers via test-utils
- **Map tests**: Mock map instance with `createMapMock()`
- **Redux tests**: Use `mockStore()` from test helpers
- **Async operations**: Use `waitFor()` for async state updates
- **Socket tests**: Use `MockSocketContext` for WebSocket simulation

## Error Handling & Performance
- **Error boundaries**: Wrap route-level components with ErrorBoundary
- **Request lifecycle**: Ensure requests resolve properly, never leave hanging/obfuscated state
- **Memory management**: Watch for memory leaks in map layers and event handlers
- **Code style**: Extensive ESLint and stylelint rules configured - follow existing patterns