import React from 'react';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';

import { mockStore } from '../../__test-helpers/MockStore';
import {
  newPatrol,
  scheduledPatrol,
  activePatrol,
  overduePatrol,
  donePatrol,
  cancelledPatrol
} from '../../__test-helpers/fixtures/patrols';
import usePatrol from './';

describe('usePatrol', () => {
  const Component = ({ patrol }) => {
    const { patrolElapsedTime: _patrolElapsedTime, ...data } = usePatrol(patrol);

    return <p data-testid="patrol-data">{JSON.stringify(data)}</p>;
  };

  test('provides the expected data for a new patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Component patrol={newPatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('{"patrolData":{"patrol":{"icon_id":"dog-patrol-icon","is_collection":false,"priority":0,"created_at":"2022-01-18T22:34:52.494Z","patrol_segments":[{"patrol_type":"dog_patrol","priority":0,"events":[],"scheduled_start":null,"leader":null,"start_location":{"latitude":20.820635171985415,"longitude":-103.35978574394501},"time_range":{"start_time":"2022-01-18T22:34:52.494Z","end_time":null},"end_location":null}],"files":[],"notes":[],"title":null},"leader":null,"trackData":null,"startStopGeometries":null},"isPatrolActive":true,"isPatrolCancelled":false,"isPatrolDone":false,"isPatrolOverdue":false,"isPatrolScheduled":false,"actualEndTime":null,"actualStartTime":"2022-01-18T22:34:52.494Z","canShowTrack":false,"displayTitle":"Unknown patrol type","patrolBounds":null,"patrolIconId":"dog-patrol-icon","patrolState":{"title":"Active","status":"open"},"scheduledStartTime":"18 Jan 16:34","theme":{"base":"patrolActiveThemeColor","background":"patrolActiveThemeBgColor"},"dateComponentDateString":"18 Jan 16:34"}');
  });

  test('provides the expected data for a scheduled patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Component patrol={scheduledPatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('{"patrolData":{"patrol":{"id":"e9c728a6-148b-475b-9311-668813581c2a","priority":0,"state":"open","objective":null,"serial_number":1629,"title":"Future","files":[],"notes":[],"patrol_segments":[{"id":"f3160c12-344f-4357-b2ca-5c3456f5e833","patrol_type":"dog_patrol","leader":null,"scheduled_start":"2022-01-19T11:23:00-08:00","scheduled_end":null,"time_range":{"start_time":null,"end_time":null},"start_location":{"latitude":20.73511376906127,"longitude":-103.40970236937243},"end_location":null,"events":[],"image_url":"https://develop.pamdas.org/static/sprite-src/dog-patrol-icon.svg","icon_id":"dog-patrol-icon","updates":[]}],"updates":[{"message":"Patrol Added","time":"2022-01-17T19:23:47.216995+00:00","user":{"username":"lchavez","first_name":"Luis","last_name":"Chavez","id":"2cc59835-ac53-4b78-b40a-2aa4ab93fe18","content_type":"accounts.user"},"type":"add_patrol"}]},"leader":null,"trackData":null,"startStopGeometries":null},"isPatrolActive":false,"isPatrolCancelled":false,"isPatrolDone":false,"isPatrolOverdue":false,"isPatrolScheduled":true,"actualEndTime":null,"actualStartTime":null,"canShowTrack":false,"displayTitle":"Future","patrolBounds":null,"patrolIconId":"dog-patrol-icon","patrolState":{"title":"Ready to Start","status":"ready"},"scheduledStartTime":"13:23","theme":{"base":"patrolReadyThemeColor","background":"patrolReadyThemeBgColor"},"dateComponentDateString":"13:23"}');
  });

  test('provides the expected data for an active patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Component patrol={activePatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('{"patrolData":{"patrol":{"id":"05113dd3-3f41-49ef-aa7d-fbc6b7379533","priority":0,"state":"open","objective":null,"serial_number":1595,"title":"The Don Patrol Aza","files":[],"notes":[],"patrol_segments":[{"id":"0fa397c7-23ae-46ed-a811-7e33aa2190db","patrol_type":"The_Don_Patrol","leader":null,"scheduled_start":"2022-01-07T10:17:00-08:00","scheduled_end":"2022-01-08T10:17:00-08:00","time_range":{"start_time":"2022-01-18T13:42:39.502000-08:00","end_time":null},"start_location":null,"end_location":null,"events":[],"image_url":"https://develop.pamdas.org/static/sprite-src/suspicious_person_rep.svg","icon_id":"suspicious_person_rep","updates":[{"message":"Updated fields: ","time":"2022-01-18T22:04:22.401124+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_segment"},{"message":"Updated fields: End Time","time":"2022-01-18T21:42:44.781781+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_segment"},{"message":"Updated fields: Start Time","time":"2022-01-18T21:42:39.637430+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_segment"}]}],"updates":[{"message":"Updated fields: State is open","time":"2022-01-18T22:04:22.415344+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_patrol_state"},{"message":"Updated fields: State is done","time":"2022-01-18T21:42:44.799611+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_patrol_state"},{"message":"Patrol Added","time":"2022-01-05T18:17:47.436553+00:00","user":{"username":"azarael","first_name":"Azarael","last_name":"Romero","id":"82641cc1-3025-42bb-ac50-2a634ed307d2","content_type":"accounts.user"},"type":"add_patrol"}]},"leader":null,"trackData":null,"startStopGeometries":null},"isPatrolActive":true,"isPatrolCancelled":false,"isPatrolDone":false,"isPatrolOverdue":false,"isPatrolScheduled":false,"actualEndTime":null,"actualStartTime":"2022-01-18T21:42:39.502Z","canShowTrack":false,"displayTitle":"The Don Patrol Aza","patrolBounds":null,"patrolIconId":"suspicious_person_rep","patrolState":{"title":"Active","status":"open"},"scheduledStartTime":"18 Jan 15:42","theme":{"base":"patrolActiveThemeColor","background":"patrolActiveThemeBgColor"},"dateComponentDateString":"18 Jan 15:42"}');
  });

  test('provides the expected data for an overdue patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {}, tracks: [] }, view: {} })}>
        <Component patrol={overduePatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('{"patrolData":{"patrol":{"id":"fe65464e-ea6d-4144-bba0-f9d901ffa46b","priority":0,"state":"open","objective":null,"serial_number":1551,"title":null,"files":[],"notes":[],"patrol_segments":[{"id":"9884e2a2-0cb3-4b00-b75c-3048b7c34d94","patrol_type":"routine_patrol","leader":{"content_type":"observations.subject","id":"dba0e0a6-0083-41be-a0eb-99e956977748","name":"Alex","subject_type":"person","subject_subtype":"ranger","common_name":null,"additional":{},"created_at":"2021-08-31T14:42:06.701541-07:00","updated_at":"2021-08-31T14:42:06.701557-07:00","is_active":true,"tracks_available":false,"image_url":"/static/ranger-black.svg"},"scheduled_start":"2021-11-25T11:28:00.215000-08:00","scheduled_end":"2021-11-25T11:30:00.507000-08:00","time_range":{"start_time":null,"end_time":null},"start_location":null,"end_location":null,"events":[{"id":"e797c0a4-f063-498b-890a-3e065e7e4775","serial_number":156710,"event_type":"rhino_sighting_rep","priority":0,"title":null,"state":"new","contains":[],"updated_at":"2021-11-25T11:27:01.975955-08:00","geojson":{"type":"Feature","geometry":{"type":"Point","coordinates":[-98.65740154191465,39.25999430369339]},"properties":{"message":"","datetime":"2021-11-25T19:26:46.066000+00:00","image":"https://develop.pamdas.org/static/rhino_sighting-gray.svg","icon":{"iconUrl":"https://develop.pamdas.org/static/rhino_sighting-gray.svg","iconSize":[25,25],"iconAncor":[12,12],"popupAncor":[0,-13],"className":"dot"}}},"is_collection":false}],"image_url":"https://develop.pamdas.org/static/sprite-src/routine-patrol-icon.svg","icon_id":"routine-patrol-icon","updates":[{"message":"Updated fields: Tracking Subject","time":"2021-11-25T19:32:40.804899+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_segment"},{"message":"Updated fields: ","time":"2021-11-25T19:28:25.777428+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_segment"},{"message":"Report Added","time":"2021-11-25T19:27:01.982922+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"add_event"}]}],"updates":[{"message":"Patrol Added","time":"2021-11-25T19:25:58.621383+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"add_patrol"}]},"leader":{"content_type":"observations.subject","id":"dba0e0a6-0083-41be-a0eb-99e956977748","name":"Alex","subject_type":"person","subject_subtype":"ranger","common_name":null,"additional":{},"created_at":"2021-08-31T14:42:06.701541-07:00","updated_at":"2021-08-31T14:42:06.701557-07:00","is_active":true,"tracks_available":false,"image_url":"/static/ranger-black.svg"},"trackData":null,"startStopGeometries":null},"isPatrolActive":false,"isPatrolCancelled":false,"isPatrolDone":false,"isPatrolOverdue":true,"isPatrolScheduled":true,"actualEndTime":null,"actualStartTime":null,"canShowTrack":false,"displayTitle":"Alex","patrolBounds":null,"patrolIconId":"routine-patrol-icon","patrolState":{"title":"Start Overdue","status":"start-overdue"},"scheduledStartTime":"25 Nov \'21 13:28","theme":{"base":"patrolOverdueThemeColor","background":"patrolOverdueThemeBgColor"},"dateComponentDateString":"about 2 months"}');
  });

  test('provides the expected data for a done patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Component patrol={donePatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('{"patrolData":{"patrol":{"id":"36faa698-656a-4e4b-926c-d5147ac0967d","priority":0,"state":"done","objective":null,"serial_number":1647,"title":null,"files":[],"notes":[],"patrol_segments":[{"id":"3347ef68-2df1-4864-9600-15be22590d29","patrol_type":"aerial_patrol","leader":null,"scheduled_start":null,"scheduled_end":null,"time_range":{"start_time":"2022-01-18T14:12:12.474000-08:00","end_time":"2022-01-18T14:12:24.074000-08:00"},"start_location":null,"end_location":null,"events":[],"image_url":"https://develop.pamdas.org/static/sprite-src/steel_jaw_trap_rep.svg","icon_id":"steel_jaw_trap_rep","updates":[{"message":"Updated fields: End Time","time":"2022-01-18T22:12:24.184723+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_segment"}]}],"updates":[{"message":"Updated fields: State is done","time":"2022-01-18T22:12:24.207505+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_patrol_state"},{"message":"Patrol Added","time":"2022-01-18T22:12:15.992602+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"add_patrol"}]},"leader":null,"trackData":null,"startStopGeometries":null},"isPatrolActive":false,"isPatrolCancelled":false,"isPatrolDone":true,"isPatrolOverdue":false,"isPatrolScheduled":false,"actualEndTime":"2022-01-18T22:12:24.074Z","actualStartTime":"2022-01-18T22:12:12.474Z","canShowTrack":false,"displayTitle":"Unknown patrol type","patrolBounds":null,"patrolIconId":"steel_jaw_trap_rep","patrolState":{"title":"Done","status":"done"},"scheduledStartTime":"18 Jan 16:12","theme":{"base":"patrolDoneThemeColor","background":"patrolDoneThemeBgColor"},"dateComponentDateString":"18 Jan 16:12"}');
  });

  test('provides the expected data for a cancelled patrol', async () => {
    render(
      <Provider store={mockStore({ data: { subjectStore: {} }, view: {} })}>
        <Component patrol={cancelledPatrol} />
      </Provider>
    );

    expect((await screen.findByTestId('patrol-data'))).toHaveTextContent('{"patrolData":{"patrol":{"id":"05113dd3-3f41-49ef-aa7d-fbc6b7379533","priority":0,"state":"cancelled","objective":null,"serial_number":1595,"title":"The Don Patrol Aza","files":[],"notes":[],"patrol_segments":[{"id":"0fa397c7-23ae-46ed-a811-7e33aa2190db","patrol_type":"The_Don_Patrol","leader":null,"scheduled_start":"2022-01-07T10:17:00-08:00","scheduled_end":"2022-01-08T10:17:00-08:00","time_range":{"start_time":"2022-01-18T13:42:39.502000-08:00","end_time":null},"start_location":null,"end_location":null,"events":[],"image_url":"https://develop.pamdas.org/static/sprite-src/suspicious_person_rep.svg","icon_id":"suspicious_person_rep","updates":[{"message":"Updated fields: ","time":"2022-01-18T22:04:22.401124+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_segment"},{"message":"Updated fields: End Time","time":"2022-01-18T21:42:44.781781+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_segment"},{"message":"Updated fields: Start Time","time":"2022-01-18T21:42:39.637430+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_segment"}]}],"updates":[{"message":"Updated fields: State is cancelled","time":"2022-01-18T22:42:04.843502+00:00","user":{"username":"lchavez","first_name":"Luis","last_name":"Chavez","id":"2cc59835-ac53-4b78-b40a-2aa4ab93fe18","content_type":"accounts.user"},"type":"update_patrol_state"},{"message":"Updated fields: State is open","time":"2022-01-18T22:04:22.415344+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_patrol_state"},{"message":"Updated fields: State is done","time":"2022-01-18T21:42:44.799611+00:00","user":{"username":"yazzm","first_name":"Yazz","last_name":"","id":"4d4363e1-16d0-499b-856a-f8846ac23938","content_type":"accounts.user"},"type":"update_patrol_state"},{"message":"Patrol Added","time":"2022-01-05T18:17:47.436553+00:00","user":{"username":"azarael","first_name":"Azarael","last_name":"Romero","id":"82641cc1-3025-42bb-ac50-2a634ed307d2","content_type":"accounts.user"},"type":"add_patrol"}]},"leader":null,"trackData":null,"startStopGeometries":null},"isPatrolActive":false,"isPatrolCancelled":true,"isPatrolDone":false,"isPatrolOverdue":false,"isPatrolScheduled":false,"actualEndTime":null,"actualStartTime":"2022-01-18T21:42:39.502Z","canShowTrack":false,"displayTitle":"The Don Patrol Aza","patrolBounds":null,"patrolIconId":"suspicious_person_rep","patrolState":{"title":"Cancelled","status":"cancelled"},"scheduledStartTime":"18 Jan 15:42","theme":{"base":"patrolCancelledThemeColor","background":"patrolCancelledThemeBgColor"},"dateComponentDateString":"18 Jan 16:42"}');
  });
});
