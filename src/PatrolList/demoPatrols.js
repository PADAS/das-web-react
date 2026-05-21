// Demo patrols — pre-seeded prototype data so the patrols list has a
// realistic mix of states without requiring the user to drive the app live.
//
// Composition (per the latest request):
//   1× Overdue · 1× Paused · 3× Active · 2× Done
//
// Each non-overdue patrol gets:
//   • 2–4 legs (last leg open if the patrol is Active or Paused)
//   • Track polylines for every tracked team member / asset
//   • A handful of events placed at coordinates along the tracks
//   • Some notes (rendered as activity-feed entries)
//   • Pause sessions where applicable
//
// On first app load the data is written into the existing stores
// (userPatrolsStore / legsStore / patrolStateStore / patrolTracksStore /
// addedReportsStore + a small inline events store) keyed by stable demo ids
// so reloads don't duplicate them.

import { addUserPatrolRaw } from './userPatrolsStore';
import { seedLegs } from '../PatrolOverview/legsStore';

const SEEDED_KEY = 'er-prototype-demo-patrols-seeded-v4';

// Build a polyline of N points stepping from start by heading + per-step
// jitter. Used to generate tracks that look hand-drawn rather than perfectly
// straight.
const polyline = (start, headingRad, stepDeg, count, jitter = 0.3) => {
  const pts = [];
  let lat = start.lat;
  let lng = start.lng;
  let heading = headingRad;
  for (let i = 0; i < count; i += 1) {
    pts.push({ lat: +lat.toFixed(6), lng: +lng.toFixed(6) });
    heading += (Math.random() - 0.5) * jitter;
    lat += Math.sin(heading) * stepDeg;
    lng += Math.cos(heading) * stepDeg;
  }
  return pts;
};

// Stamp times across a polyline given a start ISO + total minutes.
const withTimes = (pts, startISO, totalMins) => {
  const t0 = new Date(startISO).getTime();
  const step = (totalMins * 60 * 1000) / Math.max(1, pts.length - 1);
  return pts.map((p, i) => ({ ...p, time: new Date(t0 + i * step).toISOString() }));
};

// Add small per-entity offsets so a "team" reads as a tight pack of tracks.
const offsetTrack = (basePts, latOff, lngOff) => basePts.map((p) => ({
  ...p,
  lat: +(p.lat + latOff).toFixed(6),
  lng: +(p.lng + lngOff).toFixed(6),
}));

const SAFE_NAME = (s) => s.replace(/[^a-zA-Z0-9_-]/g, '_');

// ===== Definitions =====================================================
// Easter Island-area coordinates for visual interest.
const DEMO_PATROLS = [
  // -------------------------------------------------------------------
  // 1. OVERDUE — scheduled in the past, never started, no tracks/events.
  // -------------------------------------------------------------------
  {
    id: 'demo-overdue-1',
    serial: 48,
    state: 'Overdue',
    title: 'Fence Patrol',
    patrolType: 'Foot Patrol',
    startedAt: '2026-05-19T08:00:00',
    scheduledStart: '2026-05-19T08:00',
    legs: [],
    tracks: {},
    events: [],
    notes: [],
    pauseSessions: [],
  },

  // -------------------------------------------------------------------
  // 2. PAUSED — vehicle patrol that's been running, currently paused.
  // -------------------------------------------------------------------
  {
    id: 'demo-paused-1',
    serial: 56,
    state: 'Paused',
    title: 'Tango 01',
    patrolType: 'Vehicle Patrol',
    startedAt: '2026-05-20T06:00:00',
    legs: [
      {
        patrolType: 'Vehicle Patrol',
        startDate: '2026-05-20', startTime: '06:00',
        endDate: '', endTime: '',
        team: 'Alpha',
        teamMembers: [
          { id: 'alpha-1', name: 'Priya Sharma', role: 'Patrol Lead', tracked: true },
          { id: 'alpha-2', name: 'Jordan Reeves', role: 'Driver', tracked: true },
          { id: 'alpha-5', name: 'Sam Liu', role: 'Ranger', tracked: true },
        ],
        assets: [{ id: 'a-ktn-456', name: 'KTN-456' }],
        driverName: 'Jordan Reeves',
        vehicleName: 'KTN-456',
        objective: 'Sweep western access road',
        station: 'Station 2',
        armed: 'Yes',
      },
    ],
    tracks: (() => {
      const base = withTimes(
        polyline({ lat: -27.150, lng: -109.430 }, Math.PI * 0.3, 0.00045, 70, 0.25),
        '2026-05-20T06:00:00', 90,
      );
      return {
        'Priya Sharma': offsetTrack(base, 0.0003, -0.0004),
        'Jordan Reeves': offsetTrack(base, -0.0002, 0.0003),
        'Sam Liu': offsetTrack(base, 0.0005, 0.0005),
        'KTN-456': offsetTrack(base, -0.0004, -0.0002),
      };
    })(),
    events: [
      {
        id: 'ev-paused-1',
        title: 'Wire snare found on fence line',
        eventTypeName: 'Snare',
        event_type: 'snare_rep',
        priority: 300,
        color: '#B33A6E',
        time: '2026-05-20T06:30:00',
        lat: -27.142,
        lng: -109.424,
        event_details: {
          snare_type: 'Wire loop',
          wire_gauge: '2.5mm',
          set_or_sprung: 'Set',
          target_species: 'Unknown',
          number_of_snares: 1,
          evidence_collected: true,
          notes: 'Hidden in dense shrub cover near fence post. Wire looped around low branch, stake freshly set.',
        },
      },
      {
        id: 'ev-paused-2',
        title: 'Buffalo spoor — 4 animals, heading west',
        eventTypeName: 'Spoor',
        event_type: 'spoor_rep',
        priority: 0,
        color: '#78909C',
        time: '2026-05-20T07:10:00',
        lat: -27.130,
        lng: -109.416,
        event_details: {
          species: 'Cape Buffalo',
          number_of_animals: 4,
          direction_of_travel: 'West',
          age_of_spoor: '2-4 hours',
          notes: 'Clear hoofprints in soft ground near water point. Tracks lead toward western thicket.',
        },
      },
    ],
    notes: [
      { id: 'n-paused-1', text: 'Stopped for fuel check; resuming after radio sync.', time: '2026-05-20T07:32:00' },
    ],
    pauseSessions: [
      { id: 'ps-paused-1', start: '2026-05-20T07:30:00', end: null }, // still paused
    ],
  },

  // -------------------------------------------------------------------
  // 3. ACTIVE — Foot patrol, two legs (one done, one active).
  // -------------------------------------------------------------------
  {
    id: 'demo-active-1',
    serial: 102,
    state: 'Active',
    title: 'North Ridge Loop',
    patrolType: 'Foot Patrol',
    startedAt: '2026-05-20T08:00:00',
    legs: [
      {
        patrolType: 'Foot Patrol',
        startDate: '2026-05-20', startTime: '08:00',
        endDate: '2026-05-20', endTime: '10:30',
        team: 'Delta',
        teamMembers: [
          { id: 'd1', name: 'Maya Chen', role: 'Patrol Lead', tracked: true },
          { id: 'd3', name: 'Leo Nakamura', role: 'Ranger' },
        ],
        assets: [{ id: 'a-garmin-1', name: 'Maya Chen (Garmin)' }],
        gear: 'Hiking Pack',
        rations: ['Energy Bars', 'Water Bottles'],
        objective: 'Climb to north ridge overlook',
        station: 'Station 0',
        armed: 'Yes',
      },
      {
        patrolType: 'Foot Patrol',
        startDate: '2026-05-20', startTime: '10:30',
        endDate: '', endTime: '',
        team: 'Delta',
        teamMembers: [
          { id: 'd1', name: 'Maya Chen', role: 'Patrol Lead', tracked: true },
          { id: 'd4', name: 'Amara Osei', role: 'Ranger' },
        ],
        assets: [{ id: 'a-garmin-1', name: 'Maya Chen (Garmin)' }],
        gear: 'Hiking Pack',
        rations: ['Energy Bars', 'Trail Mix'],
        objective: 'Descend along eastern path',
        station: 'Station 0',
        armed: 'Yes',
      },
    ],
    tracks: (() => {
      const leg1 = withTimes(polyline({ lat: -27.090, lng: -109.330 }, 0.4 * Math.PI, 0.0004, 35, 0.3), '2026-05-20T08:00:00', 150);
      const leg2 = withTimes(polyline(leg1[leg1.length - 1], -0.3 * Math.PI, 0.00045, 45, 0.3), '2026-05-20T10:30:00', 120);
      const base = [...leg1, ...leg2];
      return {
        'Maya Chen': offsetTrack(base, 0.0002, -0.0003),
        'Maya Chen (Garmin)': offsetTrack(base, -0.0002, 0.0002),
      };
    })(),
    events: [
      // Leg 1 (08:00 – 10:30): climbing to north ridge
      {
        id: 'ev-a1-1',
        title: 'Mountain goat carcass — predation suspected',
        eventTypeName: 'Carcass',
        event_type: 'carcass_rep',
        priority: 200,
        color: '#8D6E63',
        time: '2026-05-20T09:00:00',
        lat: -27.085,
        lng: -109.328,
        event_details: {
          species: 'Mountain Goat',
          sex: 'Male',
          age_class: 'Adult',
          estimated_age: '4-6 years',
          cause_of_death: 'Predation',
          condition: 'Fresh (< 24h)',
          collar_id: '',
          notes: 'Carcass found 15m from water source. Claw marks visible on neck and shoulder. No collar or ear tag. Photos taken.',
        },
      },
      {
        id: 'ev-a1-2',
        title: 'Lantana camara — invasive plant colony',
        eventTypeName: 'Invasive Species',
        event_type: 'invasive_species_rep',
        priority: 100,
        color: '#388E3C',
        time: '2026-05-20T10:05:00',
        lat: -27.079,
        lng: -109.326,
        event_details: {
          species_name: 'Lantana camara',
          area_affected: '~80 sq m',
          density: 'Dense',
          location_description: 'Northern slope, 30m below ridge crest near stream bank',
          action_taken: 'Photographed and GPS-marked for follow-up removal',
          notes: 'Large established colony blocking native understorey. Recommend mechanical removal before flowering.',
        },
      },
      // Leg 2 (10:30 – open): descending eastern path
      {
        id: 'ev-a1-3',
        title: 'Leopard spoor — single animal, fresh',
        eventTypeName: 'Spoor',
        event_type: 'spoor_rep',
        priority: 0,
        color: '#78909C',
        time: '2026-05-20T11:30:00',
        lat: -27.085,
        lng: -109.320,
        event_details: {
          species: 'Leopard',
          number_of_animals: 1,
          direction_of_travel: 'South-East',
          age_of_spoor: '< 1 hour',
          notes: 'Very fresh tracks in soft soil. Stride length approx 70cm. Team maintained 200m buffer and continued.',
        },
      },
    ],
    notes: [
      { id: 'n-a1-1', text: 'Reached the ridge ahead of schedule. Visibility excellent.', time: '2026-05-20T09:20:00' },
      { id: 'n-a1-2', text: 'Descending via the eastern path with Amara.', time: '2026-05-20T10:35:00' },
    ],
    pauseSessions: [
      { id: 'ps-a1-1', start: '2026-05-20T09:00:00', end: '2026-05-20T09:08:00' },
    ],
  },

  // -------------------------------------------------------------------
  // 4. ACTIVE — Vehicle patrol, 3 legs (2 done, 1 active).
  // -------------------------------------------------------------------
  {
    id: 'demo-active-2',
    serial: 103,
    state: 'Active',
    title: 'Coast Road Sweep',
    patrolType: 'Vehicle Patrol',
    startedAt: '2026-05-20T05:30:00',
    legs: [
      {
        patrolType: 'Vehicle Patrol',
        startDate: '2026-05-20', startTime: '05:30',
        endDate: '2026-05-20', endTime: '07:15',
        team: 'Echo',
        teamMembers: [
          { id: 'echo-1', name: 'Maya Chen', role: 'Patrol Lead', tracked: true },
          { id: 'echo-3', name: 'Eli Rosenberg', role: 'Driver', tracked: true },
        ],
        assets: [{ id: 'a-ktn-123', name: 'KTN-123' }],
        driverName: 'Eli Rosenberg', vehicleName: 'KTN-123',
        objective: 'Inspect coastal fence line', station: 'Station 1', armed: 'Yes',
      },
      {
        patrolType: 'Foot Patrol',
        startDate: '2026-05-20', startTime: '07:15',
        endDate: '2026-05-20', endTime: '09:00',
        team: 'Echo',
        teamMembers: [
          { id: 'echo-1', name: 'Maya Chen', role: 'Patrol Lead', tracked: true },
          { id: 'echo-4', name: 'Sam Liu', role: 'Ranger' },
        ],
        assets: [],
        gear: 'Quick Response Kit', rations: ['Water Bottles'],
        objective: 'Cliff edge inspection on foot', station: 'Station 1', armed: 'Yes',
      },
      {
        patrolType: 'Vehicle Patrol',
        startDate: '2026-05-20', startTime: '09:00',
        endDate: '', endTime: '',
        team: 'Echo',
        teamMembers: [
          { id: 'echo-1', name: 'Maya Chen', role: 'Patrol Lead', tracked: true },
          { id: 'echo-3', name: 'Eli Rosenberg', role: 'Driver', tracked: true },
          { id: 'echo-5', name: 'Carter Mwangi', role: 'Ranger' },
        ],
        assets: [{ id: 'a-ktn-123', name: 'KTN-123' }],
        driverName: 'Eli Rosenberg', vehicleName: 'KTN-123',
        objective: 'Return route via inland road', station: 'Station 1', armed: 'Yes',
      },
    ],
    tracks: (() => {
      const a = withTimes(polyline({ lat: -27.180, lng: -109.450 }, 0.1 * Math.PI, 0.00055, 45, 0.2), '2026-05-20T05:30:00', 105);
      const b = withTimes(polyline(a[a.length - 1], -0.4 * Math.PI, 0.0003, 25, 0.3), '2026-05-20T07:15:00', 105);
      const c = withTimes(polyline(b[b.length - 1], 0.7 * Math.PI, 0.0005, 35, 0.2), '2026-05-20T09:00:00', 90);
      const base = [...a, ...b, ...c];
      return {
        'Maya Chen': offsetTrack(base, 0.0001, -0.0002),
        'Eli Rosenberg': offsetTrack(base, -0.0002, 0.0001),
        'KTN-123': offsetTrack(base, -0.0003, -0.0003),
      };
    })(),
    events: [
      // Leg 1 (05:30 – 07:15): coastal fence line inspection
      {
        id: 'ev-a2-1',
        title: 'Unknown 4x4 tracks near cut fence',
        eventTypeName: 'Suspicious Activity',
        event_type: 'suspicious_activity_rep',
        priority: 200,
        color: '#D89B23',
        time: '2026-05-20T06:05:00',
        lat: -27.177,
        lng: -109.442,
        event_details: {
          description: 'Fresh 4x4 tyre tracks approaching cut fence from beach access road',
          number_of_people: 0,
          number_of_vehicles: 1,
          vehicle_description: 'Heavy 4x4, wide aggressive-tread tyres',
          direction_of_travel: 'South',
          notes: 'Tracks lead directly to a 1.5m gap cut in the boundary fence. Tracks continue inland. Photos and casts taken.',
        },
      },
      {
        id: 'ev-a2-2',
        title: 'Spring-loaded snare — game trail',
        eventTypeName: 'Snare',
        event_type: 'snare_rep',
        priority: 300,
        color: '#B33A6E',
        time: '2026-05-20T06:50:00',
        lat: -27.174,
        lng: -109.432,
        event_details: {
          snare_type: 'Spring snare (sapling bent)',
          wire_gauge: '3mm',
          set_or_sprung: 'Set',
          target_species: 'Medium ungulate',
          number_of_snares: 2,
          evidence_collected: true,
          notes: 'Two snares placed 4m apart on well-used game trail near water source. Both removed and logged.',
        },
      },
      // Leg 2 (07:15 – 09:00): cliff edge on foot
      {
        id: 'ev-a2-3',
        title: 'Oil slick visible — approx 60m offshore',
        eventTypeName: 'Oil Slick',
        event_type: 'oil_slick_rep',
        priority: 200,
        color: '#5D4037',
        time: '2026-05-20T07:55:00',
        lat: -27.176,
        lng: -109.426,
        event_details: {
          slick_size: 'Approximately 40m × 8m',
          color: 'Rainbow/iridescent sheen',
          location_description: '60m offshore from main cliff face, drifting south-east',
          source: 'Unknown — possibly bilge discharge from passing vessel',
          weather: 'Light NW wind, calm sea state 1',
          action_taken: 'Photographed from cliff top, coordinates logged, maritime authority notified',
          notes: 'Slick extending south-east. No vessel visible at time of observation. Coastguard informed.',
        },
      },
      // Leg 3 (09:00 – open): inland return
      {
        id: 'ev-a2-4',
        title: 'Crop damage — maize field, elephant entry',
        eventTypeName: 'Human Wildlife Conflict',
        event_type: 'hwc_rep',
        priority: 200,
        color: '#D27A2F',
        time: '2026-05-20T09:35:00',
        lat: -27.175,
        lng: -109.429,
        event_details: {
          crop_type: 'Maize',
          area_affected: '~3 acres',
          damage_cause: 'Elephant',
          estimated_loss: '70%',
          farmer_name: 'Miguel Toro',
          farmer_contact: '+56 9 XXXX XXXX',
          notes: 'Farmer reports a herd of 6-8 elephants entered field overnight through boundary gap. Significant trampling and feeding damage. Farmer has chilli-rope deterrent but fence needs reinforcement.',
        },
      },
    ],
    notes: [
      { id: 'n-a2-1', text: 'Fence break reported, photos uploaded.', time: '2026-05-20T06:25:00' },
      { id: 'n-a2-2', text: 'Switching to foot for cliff section.', time: '2026-05-20T07:18:00' },
    ],
    pauseSessions: [],
  },

  // -------------------------------------------------------------------
  // 5. ACTIVE — Aerial patrol, 2 legs (1 done, 1 active).
  // -------------------------------------------------------------------
  {
    id: 'demo-active-3',
    serial: 104,
    state: 'Active',
    title: 'Aerial Sweep — Sector 9',
    patrolType: 'Aerial Patrol',
    startedAt: '2026-05-20T07:00:00',
    legs: [
      {
        patrolType: 'Aerial Patrol',
        startDate: '2026-05-20', startTime: '07:00',
        endDate: '2026-05-20', endTime: '08:30',
        team: 'Bravo',
        teamMembers: [
          { id: 'bravo-1', name: 'Lukas Becker', role: 'Patrol Lead', tracked: true },
          { id: 'bravo-2', name: 'Naledi Khumalo', role: 'Pilot', tracked: true },
        ],
        assets: [{ id: 'a-heli-1', name: 'Helicopter H-01' }],
        aircraft: 'Bell 206', pilotName: 'Naledi Khumalo',
        fuel: 120, altitude: 450,
        objective: 'East-coast reconnaissance', station: 'Station 3', armed: 'No',
      },
      {
        patrolType: 'Aerial Patrol',
        startDate: '2026-05-20', startTime: '08:30',
        endDate: '', endTime: '',
        team: 'Bravo',
        teamMembers: [
          { id: 'bravo-1', name: 'Lukas Becker', role: 'Patrol Lead', tracked: true },
          { id: 'bravo-2', name: 'Naledi Khumalo', role: 'Pilot', tracked: true },
        ],
        assets: [{ id: 'a-heli-1', name: 'Helicopter H-01' }],
        aircraft: 'Bell 206', pilotName: 'Naledi Khumalo',
        fuel: 90, altitude: 600,
        objective: 'Return survey along southern shore', station: 'Station 3', armed: 'No',
      },
    ],
    tracks: (() => {
      const a = withTimes(polyline({ lat: -27.060, lng: -109.290 }, 0.6 * Math.PI, 0.0009, 25, 0.12), '2026-05-20T07:00:00', 90);
      const b = withTimes(polyline(a[a.length - 1], 1.1 * Math.PI, 0.0009, 30, 0.12), '2026-05-20T08:30:00', 90);
      const base = [...a, ...b];
      return {
        'Lukas Becker': offsetTrack(base, 0.00015, -0.00015),
        'Naledi Khumalo': offsetTrack(base, -0.0001, 0.0001),
        'Helicopter H-01': offsetTrack(base, 0, 0),
      };
    })(),
    events: [
      // Leg 1 (07:00 – 08:30): east-coast reconnaissance
      {
        id: 'ev-a3-1',
        title: 'Unidentified vessel — restricted zone, no AIS',
        eventTypeName: 'Unidentified Vessel',
        event_type: 'unidentified_vessel_rep',
        priority: 200,
        color: '#0056C7',
        time: '2026-05-20T07:20:00',
        lat: -27.055,
        lng: -109.292,
        event_details: {
          vessel_type: 'Motorized fishing boat',
          vessel_size: 'Small (7-9m)',
          number_of_persons: 3,
          vessel_color: 'Blue hull, white cabin',
          heading: 'North-West',
          distance_from_shore: '1.8 nautical miles',
          behavior: 'Slow drift with nets deployed in restricted fishing zone',
          notes: 'No AIS signal detected. Vessel photographed from 300ft. Coastguard patrol tasked to intercept. Position: 27°02.4\'S 109°15.9\'W.',
        },
      },
      {
        id: 'ev-a3-2',
        title: 'Active wildfire — approx 1.5ha, spreading east',
        eventTypeName: 'Fire',
        event_type: 'fire_rep',
        priority: 300,
        color: '#E64A19',
        time: '2026-05-20T08:05:00',
        lat: -27.045,
        lng: -109.295,
        event_details: {
          fire_type: 'Wildfire',
          fire_size: 'Medium (1-2ha)',
          spreading_direction: 'East',
          flame_height: '2-4m',
          wind_speed: 'Moderate (15-20 km/h)',
          aerial_observation: true,
          nearest_structure: 'Ranger post approx 800m east',
          action_taken: 'Ground unit dispatched, aerial water drop requested',
          notes: 'Smoke column visible from 5km. Fire actively spreading east toward dry grassland. No evident human cause — likely lightning strike from yesterday\'s storm.',
        },
      },
      // Leg 2 (08:30 – open): southern shore return survey
      {
        id: 'ev-a3-3',
        title: 'Oil slick — 3nm south-east, vessel trail',
        eventTypeName: 'Oil Slick',
        event_type: 'oil_slick_rep',
        priority: 200,
        color: '#5D4037',
        time: '2026-05-20T09:10:00',
        lat: -27.043,
        lng: -109.308,
        event_details: {
          slick_size: 'Approximately 150m × 15m',
          color: 'Dark brown with rainbow fringe',
          location_description: '3 nautical miles south-east of main headland, along known vessel route',
          source: 'Likely bilge or fuel discharge — fresh trail leads north-west',
          weather: 'SE wind 10 knots, moderate swell',
          action_taken: 'Aerial photography completed, maritime pollution authority notified, coordinates transmitted',
          notes: 'Slick extends in direction consistent with recent vessel transit. Severity warrants ground sampling. No wildlife impacts observed from air.',
        },
      },
    ],
    notes: [
      { id: 'n-a3-1', text: 'Smoke confirmed as controlled burn, no action.', time: '2026-05-20T08:10:00' },
    ],
    pauseSessions: [],
  },

  // -------------------------------------------------------------------
  // 6. DONE — Vehicle patrol that completed earlier today.
  // -------------------------------------------------------------------
  {
    id: 'demo-done-1',
    serial: 90,
    state: 'Done',
    title: 'Morning Boundary Sweep',
    patrolType: 'Vehicle Patrol',
    startedAt: '2026-05-20T04:30:00',
    endedAt: '2026-05-20T08:15:00',
    legs: [
      {
        patrolType: 'Vehicle Patrol',
        startDate: '2026-05-20', startTime: '04:30',
        endDate: '2026-05-20', endTime: '06:20',
        team: 'Gamma',
        teamMembers: [
          { id: 'gamma-1', name: 'Eli Rosenberg', role: 'Patrol Lead', tracked: true },
          { id: 'gamma-2', name: 'Tomas Vega', role: 'Ranger' },
        ],
        assets: [{ id: 'a-ktn-789', name: 'KTN-789' }],
        driverName: 'Eli Rosenberg', vehicleName: 'KTN-789',
        objective: 'NW boundary sweep', station: 'Station 4', armed: 'Yes',
      },
      {
        patrolType: 'Vehicle Patrol',
        startDate: '2026-05-20', startTime: '06:20',
        endDate: '2026-05-20', endTime: '08:15',
        team: 'Gamma',
        teamMembers: [
          { id: 'gamma-1', name: 'Eli Rosenberg', role: 'Patrol Lead', tracked: true },
          { id: 'gamma-3', name: 'Amara Osei', role: 'Ranger' },
        ],
        assets: [{ id: 'a-ktn-789', name: 'KTN-789' }],
        driverName: 'Eli Rosenberg', vehicleName: 'KTN-789',
        objective: 'Return via service road', station: 'Station 4', armed: 'Yes',
      },
    ],
    tracks: (() => {
      const a = withTimes(polyline({ lat: -27.045, lng: -109.435 }, 0.8 * Math.PI, 0.0006, 40, 0.18), '2026-05-20T04:30:00', 110);
      const b = withTimes(polyline(a[a.length - 1], -0.2 * Math.PI, 0.0005, 40, 0.18), '2026-05-20T06:20:00', 115);
      const base = [...a, ...b];
      return {
        'Eli Rosenberg': offsetTrack(base, 0.0002, -0.00025),
        'KTN-789': offsetTrack(base, -0.0002, 0.0002),
      };
    })(),
    events: [
      // Leg 1 (04:30 – 06:20): NW boundary sweep
      {
        id: 'ev-d1-1',
        title: 'Cattle carcass — boundary fence, unknown cause',
        eventTypeName: 'Carcass',
        event_type: 'carcass_rep',
        priority: 200,
        color: '#8D6E63',
        time: '2026-05-20T05:05:00',
        lat: -27.041,
        lng: -109.441,
        event_details: {
          species: 'Domestic Cattle',
          sex: 'Female',
          age_class: 'Adult',
          estimated_age: '3-5 years',
          cause_of_death: 'Unknown — no external wounds',
          condition: 'Fresh (< 12h)',
          collar_id: 'Ear tag: EA-2291',
          notes: 'Carcass found against boundary fence. No predator marks. Possible disease or poisoning. Samples collected for lab. Owner ID from ear tag being followed up.',
        },
      },
      {
        id: 'ev-d1-2',
        title: 'Set trap — NW corner, near water pan',
        eventTypeName: 'Snare',
        event_type: 'snare_rep',
        priority: 300,
        color: '#B33A6E',
        time: '2026-05-20T05:50:00',
        lat: -27.035,
        lng: -109.449,
        event_details: {
          snare_type: 'Gin trap (leg-hold)',
          wire_gauge: 'N/A — metal jaw trap',
          set_or_sprung: 'Set',
          target_species: 'Medium carnivore',
          number_of_snares: 1,
          evidence_collected: true,
          notes: 'Concealed gin trap found under grass tufts at water pan edge. Common warthog/mongoose approach path. Trap seized and logged as evidence. Area swept for additional traps.',
        },
      },
      // Leg 2 (06:20 – 08:15): return via service road
      {
        id: 'ev-d1-3',
        title: 'Chromolaena odorata — invasive cover on roadside',
        eventTypeName: 'Invasive Species',
        event_type: 'invasive_species_rep',
        priority: 100,
        color: '#388E3C',
        time: '2026-05-20T07:10:00',
        lat: -27.036,
        lng: -109.447,
        event_details: {
          species_name: 'Chromolaena odorata (Siam weed)',
          area_affected: '~200 sq m',
          density: 'Moderate to Dense',
          location_description: 'East side of service road, between 3km and 3.4km markers',
          action_taken: 'Photographed and mapped. Flagged for herbicide treatment on next maintenance sweep.',
          notes: 'Rapidly expanding stand noted since last patrol 3 months ago. Encroaching on grass layer used by zebra.',
        },
      },
    ],
    notes: [
      { id: 'n-d1-1', text: 'Boundary clear. No incidents to report.', time: '2026-05-20T08:00:00' },
    ],
    pauseSessions: [
      { id: 'ps-d1-1', start: '2026-05-20T05:40:00', end: '2026-05-20T05:55:00' },
    ],
  },

  // -------------------------------------------------------------------
  // 7. DONE — Foot patrol completed yesterday.
  // -------------------------------------------------------------------
  {
    id: 'demo-done-2',
    serial: 86,
    state: 'Done',
    title: 'Western Cliffs Survey',
    patrolType: 'Foot Patrol',
    startedAt: '2026-05-19T13:00:00',
    endedAt: '2026-05-19T17:45:00',
    legs: [
      {
        patrolType: 'Foot Patrol',
        startDate: '2026-05-19', startTime: '13:00',
        endDate: '2026-05-19', endTime: '15:10',
        team: 'Charlie',
        teamMembers: [
          { id: 'charlie-1', name: 'Priya Sharma', role: 'Patrol Lead', tracked: true },
          { id: 'charlie-3', name: 'Wei Zhang', role: 'Ranger', tracked: true },
        ],
        assets: [{ id: 'a-garmin-2', name: 'Priya Sharma (Garmin)' }],
        gear: 'Camping Set', rations: ['Energy Bars', 'Trail Mix'],
        objective: 'Photograph cliff erosion sites', station: 'Station 5', armed: 'No',
      },
      {
        patrolType: 'Foot Patrol',
        startDate: '2026-05-19', startTime: '15:10',
        endDate: '2026-05-19', endTime: '17:45',
        team: 'Charlie',
        teamMembers: [
          { id: 'charlie-1', name: 'Priya Sharma', role: 'Patrol Lead', tracked: true },
          { id: 'charlie-2', name: 'Imani Ndlovu', role: 'Ranger' },
        ],
        assets: [],
        gear: 'Hiking Pack', rations: ['Water Bottles'],
        objective: 'Return via inland trail', station: 'Station 5', armed: 'No',
      },
    ],
    tracks: (() => {
      const a = withTimes(polyline({ lat: -27.155, lng: -109.470 }, -0.2 * Math.PI, 0.0004, 30, 0.25), '2026-05-19T13:00:00', 130);
      const b = withTimes(polyline(a[a.length - 1], 0.8 * Math.PI, 0.00038, 35, 0.25), '2026-05-19T15:10:00', 155);
      const base = [...a, ...b];
      return {
        'Priya Sharma': offsetTrack(base, 0.0002, -0.0002),
        'Wei Zhang': offsetTrack(base, -0.0002, 0.0002),
        'Priya Sharma (Garmin)': offsetTrack(base, 0.0001, 0.0003),
      };
    })(),
    events: [
      // Leg 1 (13:00 – 15:10): cliff erosion photography
      {
        id: 'ev-d2-1',
        title: 'Lion spoor — 2 animals, crossing cliff path',
        eventTypeName: 'Spoor',
        event_type: 'spoor_rep',
        priority: 0,
        color: '#78909C',
        time: '2026-05-19T13:45:00',
        lat: -27.157,
        lng: -109.467,
        event_details: {
          species: 'Lion',
          number_of_animals: 2,
          direction_of_travel: 'West toward cliff edge',
          age_of_spoor: '4-6 hours',
          notes: 'Two sets of lion prints crossing the cliff path. Older prints suggest pair using route regularly. Team alerted and maintained vigilance.',
        },
      },
      {
        id: 'ev-d2-2',
        title: 'Vessel boarding — illegal fishing, crew of 4',
        eventTypeName: 'Vessel Boarding',
        event_type: 'vessel_boarding_rep',
        priority: 300,
        color: '#1565C0',
        time: '2026-05-19T14:25:00',
        lat: -27.159,
        lng: -109.464,
        event_details: {
          vessel_name: 'None displayed',
          vessel_type: 'Wooden open fishing boat',
          flag: 'None visible',
          crew_count: 4,
          fishing_gear_found: true,
          contraband_found: false,
          action_taken: 'Warning issued and vessel escorted out of protected marine zone. Crew IDs recorded.',
          notes: 'Spotted from cliff top operating with long-line gear within the protected boundary. Coordinated with coastguard vessel for boarding. Catch (approx 30kg reef fish) confiscated.',
        },
      },
      // Leg 2 (15:10 – 17:45): return via inland trail
      {
        id: 'ev-d2-3',
        title: 'Maize crop damage — baboon raid, ongoing',
        eventTypeName: 'Human Wildlife Conflict',
        event_type: 'hwc_rep',
        priority: 200,
        color: '#D27A2F',
        time: '2026-05-19T16:05:00',
        lat: -27.159,
        lng: -109.465,
        event_details: {
          crop_type: 'Maize',
          area_affected: '~1.5 acres',
          damage_cause: 'Baboon troop (est. 20-25 animals)',
          estimated_loss: '40%',
          farmer_name: 'Ana Rapahango',
          farmer_contact: '+56 32 XXX XXXX',
          notes: 'Farmer reports daily baboon raids at mid-morning. Crop nearly ready for harvest and at high risk. Scarecrows and noise deterrents in use but ineffective. Recommended human-wildlife conflict team follow-up.',
        },
      },
      {
        id: 'ev-d2-4',
        title: 'Suspicious camp — no permit, evidence of fire',
        eventTypeName: 'Suspicious Activity',
        event_type: 'suspicious_activity_rep',
        priority: 200,
        color: '#D89B23',
        time: '2026-05-19T17:00:00',
        lat: -27.157,
        lng: -109.468,
        event_details: {
          description: 'Undeclared campsite with cold fire pit and discarded food containers',
          number_of_people: 0,
          number_of_vehicles: 0,
          vehicle_description: '',
          direction_of_travel: 'Unknown — occupants departed',
          notes: 'Abandoned camp found off-trail in restricted area. Fire pit used recently (warm ash). Plastic waste left behind. No permit issued for this zone. GPS marked for monitoring.',
        },
      },
    ],
    notes: [
      { id: 'n-d2-1', text: 'Submitted erosion report with photos. Recommend follow-up in 2 weeks.', time: '2026-05-19T17:00:00' },
      { id: 'n-d2-2', text: 'No civilian encounters on this route.', time: '2026-05-19T17:40:00' },
    ],
    pauseSessions: [],
  },
];

// ----- Helpers to write into the existing stores -------------------------

const STATE_KEY = 'er-prototype-patrol-state';
const ADDED_REPORTS_KEY = 'er-prototype-added-reports';
const TRACKS_KEY = 'er-prototype-patrol-tracks-v2';

const safeRead = (key) => {
  try { return JSON.parse(window.sessionStorage.getItem(key)) || {}; }
  catch (_e) { return {}; }
};
const safeWrite = (key, data) => {
  try { window.sessionStorage.setItem(key, JSON.stringify(data)); }
  catch (_e) { /* ignore quota */ }
};

const writePatrolState = (patrolId, entry) => {
  const all = safeRead(STATE_KEY);
  all[patrolId] = entry;
  safeWrite(STATE_KEY, all);
};

const writeTracksFor = (patrolId, tracks) => {
  const all = safeRead(TRACKS_KEY);
  all[patrolId] = tracks;
  safeWrite(TRACKS_KEY, all);
};

// Demo events live alongside addedReports so the activity feed picks them up
// via the existing flow. We expose a separate get for the map layer.
const EVENTS_KEY = 'er-prototype-demo-events-v3';
const NOTES_KEY = 'er-prototype-demo-notes-v1';

const writeEventsFor = (patrolId, events) => {
  const all = safeRead(EVENTS_KEY);
  all[patrolId] = events;
  safeWrite(EVENTS_KEY, all);
};
const writeNotesFor = (patrolId, notes) => {
  const all = safeRead(NOTES_KEY);
  all[patrolId] = notes;
  safeWrite(NOTES_KEY, all);
};

export const getDemoEvents = (patrolId) => {
  const all = safeRead(EVENTS_KEY);
  return all[patrolId] || [];
};
export const getDemoNotes = (patrolId) => {
  const all = safeRead(NOTES_KEY);
  return all[patrolId] || [];
};

// ----- Seeding entry point ----------------------------------------------

// Key used by PatrolOverview to track which real events were auto-seeded
// per demo patrol. We clear it on re-seed so stale real events don't appear.
const DEMO_SEEDED_PATROLS_KEY = 'er-proto-demo-seeded-patrols-v1';

export const seedDemoPatrolsOnce = () => {
  if (typeof window === 'undefined') return;
  if (window.sessionStorage.getItem(SEEDED_KEY) === '1') return;

  // Clear stale auto-seeded real events, added report IDs, and cached created-event
  // IDs so coordinate changes take effect and the activity feed stays consistent.
  window.sessionStorage.removeItem(DEMO_SEEDED_PATROLS_KEY);
  window.sessionStorage.removeItem('er-proto-created-event-ids-v1');
  try {
    const added = JSON.parse(window.sessionStorage.getItem(ADDED_REPORTS_KEY) || '{}');
    const cleaned = Object.fromEntries(
      Object.entries(added).filter(([key]) => !key.startsWith('demo-'))
    );
    window.sessionStorage.setItem(ADDED_REPORTS_KEY, JSON.stringify(cleaned));
  } catch (_e) { /* ignore */ }

  DEMO_PATROLS.forEach((demo) => {
    // Insert with a stable demo id so all the per-patrol stores (state,
    // legs, tracks, events, notes) line up.
    addUserPatrolRaw({
      id: demo.id,
      serial: demo.serial,
      title: demo.title,
      patrolType: demo.patrolType,
      objective: demo.legs?.[0]?.objective || '',
      startedAt: new Date(demo.startedAt),
    });

    // State + pause sessions + ended-at.
    writePatrolState(demo.id, {
      state: demo.state,
      pauseSessions: demo.pauseSessions || [],
      endedAt: demo.endedAt || null,
    });

    // Legs — seed verbatim so timestamps reflect the demo data instead of
    // being stamped to `Date.now()` by addLeg.
    if (demo.legs.length) seedLegs(demo.id, demo.legs);

    // Tracks — write directly to the tracks store key.
    writeTracksFor(demo.id, demo.tracks || {});

    // Events + notes — write to demo-specific stores; the activity feed reads
    // these in addition to the existing addedReports flow.
    writeEventsFor(demo.id, demo.events || []);
    writeNotesFor(demo.id, demo.notes || []);
  });

  window.sessionStorage.setItem(SEEDED_KEY, '1');
};

// Convenience: list helpers for the list view (in addition to whatever
// userPatrolsStore returns; demos are stored in there with their demo ids).
export { DEMO_PATROLS };

// Names used inside demo data for SAFE_NAME-based map source ids.
export { SAFE_NAME };
