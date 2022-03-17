// import React from 'react';
// import { Provider } from 'react-redux';
// import { render, screen } from '@testing-library/react';
// import { BrowserRouter } from 'react-router-dom';
// import { ConnectedApp as App } from './App';

// import SocketProvider from './__test-helpers/MockSocketContext';

// import * as mapDuckExports from './ducks/maps';
// import * as systemStatusDuckExports from './ducks/system-status';
// import * as eventTypeDuckExports from './ducks/event-types';
// import * as subjectDuckExports from './ducks/subjects';
// import * as featuresetDuckExports from './ducks/features';
// import * as analyzerDuckExports from './ducks/analyzers';
// import * as patrolTypeDuckExports from './ducks/patrol-types';
// import * as eventSchemaDuckExports from './ducks/event-schemas';
// import { mockStore } from './__test-helpers/MockStore';
// import * as socketExports from './socket';
// import { mockedSocket } from './__test-helpers/MockSocketContext';

// jest.mock('./utils/zendesk', () => {
//   const real = jest.requireActual('./utils/zendesk');
//   return {
//     ...real,
//     initZenDesk: jest.fn(),
//   };
// });


// describe('The main app view', () => {

//   let store;

//   describe('fetching data on startup', () => {
//     let mapFetchSpy, systemStatusFetchSpy, eventTypeFetchSpy, subjectGroupFetchSpy, featureSetFetchSpy, analyzerFetchSpy, patrolTypeFetchSpy, eventSchemaFetchSpy;

//     beforeEach(() => {
//       store = mockStore({
//         view: {
//           drawer: {},
//           modals: {
//             canShowModals: true,
//             modals: [],
//           },
//           subjectTrackState: {
//             visible: [],
//             pinned: [],
//           },
//           patrolTrackState: {
//             visible: [],
//             pinned: [],
//           },
//           heatmapSubjectIDs: [],
//           trackLength: 12,
//           geoPermMessageTimestamps: {
//             lastSeenSplashWarning: null,
//           },
//           userPreferences: {
//             sidebarOpen: true,
//           },
//           pickingLocationOnMap: false,
//           timeSliderState: {
//             active: false,
//             virtualDate: null,
//           },
//         },
//         data: {
//           selectedUserProfile: {},
//           maps: [],
//           user: {
//             name: 'joshua',
//             id: 12345,
//             permissions: {},
//           },
//           analyzerFeatures: {
//             data: [],
//           },
//           systemStatus: {},
//           featureSets: {
//             data: [],
//           },
//           mapSubjects: {
//             subjects: [],
//           },
//         } } );
//       mapFetchSpy = jest.spyOn(mapDuckExports, 'fetchMaps').mockReturnValue({ data: [] });;
//       systemStatusFetchSpy = jest.spyOn(systemStatusDuckExports, 'fetchSystemStatus').mockReturnValue({ data: [] });;
//       eventTypeFetchSpy = jest.spyOn(eventTypeDuckExports, 'fetchEventTypes').mockReturnValue({ data: [] });;
//       subjectGroupFetchSpy = jest.spyOn(subjectDuckExports, 'fetchSubjectGroups').mockReturnValue({ data: [] });;
//       featureSetFetchSpy = jest.spyOn(featuresetDuckExports, 'fetchFeaturesets').mockReturnValue({ data: [] });
//       analyzerFetchSpy = jest.spyOn(analyzerDuckExports, 'fetchAnalyzers').mockReturnValue({ data: [] });;
//       patrolTypeFetchSpy = jest.spyOn(patrolTypeDuckExports, 'fetchPatrolTypes').mockReturnValue({ data: [] });;
//       eventSchemaFetchSpy = jest.spyOn(eventSchemaDuckExports, 'fetchEventSchema').mockReturnValue({ data: [] });;

//       jest.spyOn(socketExports, 'default').mockReturnValue(mockedSocket);

//     });
//     beforeEach(() => {
//       render(
//         <BrowserRouter>
//           <Provider store={store}>
//             <SocketProvider>
//               <App />
//             </SocketProvider>
//           </Provider>
//         </BrowserRouter>);
//     });

//     test('fetching data on startup', () => {
//       const dataFetchSpies = [mapFetchSpy, systemStatusFetchSpy, eventTypeFetchSpy, subjectGroupFetchSpy, featureSetFetchSpy, analyzerFetchSpy, patrolTypeFetchSpy, eventSchemaFetchSpy];

//       dataFetchSpies.forEach((spy) => {
//         expect(spy).toHaveBeenCalled();
//       });
//     });

//   });

//   test('adding an axios progress bar', () => {

//   });

//   test('showing a geo-permissions warning toast if necessary', () => {

//   });
// });


describe('App', () => {
  test('rendering', () => {

  });
});