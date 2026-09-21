import {
  subjectIsStatic,
  getSubjectDefaultDeviceProperty,
  addDefaultStatusValue,
  isBuoySubject,
  isGearSubjectSubtype,
  calcDisplayNameForSubject,
  updateSubjectLastPositionFromSocketStatusUpdate,
} from './subjects.js';
import { subjectFeatureWithOneDeviceProp, staticSubjectFeature, staticSubjectFeatureWithoutIcon } from '../__test-helpers/fixtures/subjects';
import {
  ropelessBuoySubject,
  ropelessBuoySubjectNoSerialNumber,
  ropelessBuoySubjectEmptyDeviceProps,
  ropelessBuoySubjectNullDeviceProps,
  nonBuoySubject
} from '../__test-helpers/fixtures/ropeless-buoy';


describe('Determining if a subject is static', () => {
  const knownStaticSubject = staticSubjectFeature;
  const knownMovingSubject = subjectFeatureWithOneDeviceProp;

  test('a static subject', () => {
    expect(subjectIsStatic(knownStaticSubject)).toBe(true);
  });
  test('a non-static subject', () => {
    expect(subjectIsStatic(knownMovingSubject)).toBe(false);
  });
});

describe('getting the feature default property from a subject', () => {
  const knownFeaturePropertyFromSubjectA = staticSubjectFeature.properties.device_status_properties[0];
  const knownFeaturePropertyFromSubjectB = staticSubjectFeatureWithoutIcon.properties.device_status_properties[1];

  test('getting correct feature default property', () => {
    expect(getSubjectDefaultDeviceProperty(staticSubjectFeature)).toBe(knownFeaturePropertyFromSubjectA);
    expect(getSubjectDefaultDeviceProperty(staticSubjectFeatureWithoutIcon)).toBe(knownFeaturePropertyFromSubjectB);
  });

  test('getting an empty object for subject without feature default property', () => {
    expect(getSubjectDefaultDeviceProperty(subjectFeatureWithOneDeviceProp)).toMatchObject({});
  });
});

test('adding a default status value to stationary subjects', () => {
  expect(staticSubjectFeature).not.toHaveProperty(['properties', 'default_status_value']);

  const withDefault = addDefaultStatusValue(staticSubjectFeature);
  expect(withDefault).toHaveProperty(['properties', 'default_status_value']);
});

describe('isGearSubjectSubtype', () => {
  test('returns true for ropeless buoy gearset and device subtypes', () => {
    expect(isGearSubjectSubtype({ subject_subtype: 'ropeless_buoy_gearset' })).toBe(true);
    expect(isGearSubjectSubtype({ subject_subtype: 'ropeless_buoy_device' })).toBe(true);
  });

  test('returns false for other subjects', () => {
    expect(isGearSubjectSubtype({ subject_subtype: 'pants' })).toBe(false);
    expect(isGearSubjectSubtype({})).toBe(false);
  });
});

describe('isBuoySubject', () => {
  test('returns true for subject with subject_subtype "ropeless_buoy_gearset"', () => {
    expect(isBuoySubject(ropelessBuoySubject)).toBe(true);
  });

  test('returns false for subject with different subject_subtype', () => {
    expect(isBuoySubject(nonBuoySubject)).toBe(false);
  });

  test('returns false for subject with undefined subject_subtype', () => {
    const subjectWithoutSubtype = { name: 'Test' };
    expect(isBuoySubject(subjectWithoutSubtype)).toBe(false);
  });

  test('returns false for subject with null subject_subtype', () => {
    const subjectWithNullSubtype = { subject_subtype: null };
    expect(isBuoySubject(subjectWithNullSubtype)).toBe(false);
  });

  test('returns false for empty object', () => {
    expect(isBuoySubject({})).toBe(false);
  });
});

describe('calcDisplayNameForSubject', () => {
  describe('for non-buoy subjects', () => {
    test('returns name property when available', () => {
      expect(calcDisplayNameForSubject(nonBuoySubject)).toBe('Test Whale');
    });

    test('returns title when name is not available', () => {
      const subjectWithTitle = { title: 'My Title', subject_subtype: 'other' };
      expect(calcDisplayNameForSubject(subjectWithTitle)).toBe('My Title');
    });

    test('returns empty string when neither name nor title available', () => {
      const subjectWithNothing = { subject_subtype: 'other' };
      expect(calcDisplayNameForSubject(subjectWithNothing)).toBe('');
    });
  });

  describe('for buoy subjects', () => {
    test('returns serialNumber from device_status_properties when available', () => {
      expect(calcDisplayNameForSubject(ropelessBuoySubject)).toBe('SN-12345-BUOY');
    });

    test('falls back to name when serialNumber is not in device_status_properties', () => {
      expect(calcDisplayNameForSubject(ropelessBuoySubjectNoSerialNumber)).toBe('Buoy Epsilon');
    });

    test('falls back to name when device_status_properties is empty array', () => {
      expect(calcDisplayNameForSubject(ropelessBuoySubjectEmptyDeviceProps)).toBe('Buoy Zeta');
    });

    test('falls back to name when device_status_properties is null', () => {
      expect(calcDisplayNameForSubject(ropelessBuoySubjectNullDeviceProps)).toBe('Buoy Eta');
    });

    test('falls back to title when name is not available', () => {
      const buoyWithTitleOnly = {
        ...ropelessBuoySubjectNoSerialNumber,
        name: undefined,
        title: 'Buoy Title'
      };
      expect(calcDisplayNameForSubject(buoyWithTitleOnly)).toBe('Buoy Title');
    });

    test('returns empty string when no identifying properties available', () => {
      const buoyWithNothing = {
        subject_subtype: 'ropeless_buoy_gearset',
        device_status_properties: []
      };
      expect(calcDisplayNameForSubject(buoyWithNothing)).toBe('');
    });
  });
});

// Minimal subject_status socket update (GeoJSON Feature shape that SOCKET_SUBJECT_STATUS delivers).
const makeStatusUpdate = (overrides = {}) => ({
  type: 'Feature',
  geometry: { type: 'Point', coordinates: [-122.38, 47.52] },
  properties: {
    id: 'test-subject-id',
    title: 'Test Subject',
    state: 'online',
    last_voice_call_start_at: '2024-01-01T10:00:00Z',
    radio_state_at: '2024-01-01T10:00:00Z',
    coordinateProperties: { time: '2024-01-01T10:00:00Z' },
    ...overrides.properties,
  },
  ...overrides,
});

const makeSubjectWithNullPosition = (overrides = {}) => ({
  id: 'test-subject-id',
  name: 'Test Subject',
  subject_type: 'wildlife',
  subject_subtype: 'dugong',
  is_active: true,
  last_position: null,
  last_position_status: null,
  last_position_date: null,
  device_status_properties: null,
  ...overrides,
});

const makeSubjectWithPosition = (overrides = {}) => ({
  ...makeSubjectWithNullPosition(),
  last_position: {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [-100.0, 40.0] },
    properties: {
      id: 'test-subject-id',
      title: 'Test Subject',
      radio_state: 'offline',
      coordinateProperties: { time: '2023-12-01T08:00:00Z' },
    },
  },
  last_position_date: '2023-12-01T08:00:00Z',
  last_position_status: {
    radio_state: 'offline',
    radio_state_at: '2023-12-01T08:00:00Z',
    last_voice_call_start_at: null,
  },
  ...overrides,
});

describe('updateSubjectLastPositionFromSocketStatusUpdate', () => {
  describe('subject with last_position: null (first position update after SOCKET_NEW_SUBJECT)', () => {
    test('does not throw when subject.last_position is null and update.properties.state is falsy', () => {
      const subject = makeSubjectWithNullPosition();
      const update = makeStatusUpdate({ properties: { state: '' } });
      expect(() => updateSubjectLastPositionFromSocketStatusUpdate(subject, update)).not.toThrow();
    });

    test('does not throw when subject.last_position is null and properties.state is undefined', () => {
      const subject = makeSubjectWithNullPosition();
      const update = makeStatusUpdate({ properties: { state: undefined } });
      expect(() => updateSubjectLastPositionFromSocketStatusUpdate(subject, update)).not.toThrow();
    });

    test('populates last_position with the incoming geometry', () => {
      const subject = makeSubjectWithNullPosition();
      const update = makeStatusUpdate();
      const result = updateSubjectLastPositionFromSocketStatusUpdate(subject, update);
      expect(result.last_position).not.toBeNull();
      expect(result.last_position.geometry).toEqual(update.geometry);
    });

    test('sets last_position_date from update.properties.coordinateProperties.time', () => {
      const subject = makeSubjectWithNullPosition();
      const update = makeStatusUpdate();
      const result = updateSubjectLastPositionFromSocketStatusUpdate(subject, update);
      expect(result.last_position_date).toBe('2024-01-01T10:00:00Z');
    });

    test('sets last_position_status.radio_state from update.properties.state when state is present', () => {
      const subject = makeSubjectWithNullPosition();
      const update = makeStatusUpdate({ properties: { state: 'roam app state' } });
      const result = updateSubjectLastPositionFromSocketStatusUpdate(subject, update);
      expect(result.last_position_status.radio_state).toBe('roam app state');
    });

    test('sets last_position_status.radio_state to undefined (not throw) when both state and last_position are absent', () => {
      const subject = makeSubjectWithNullPosition();
      const update = makeStatusUpdate({ properties: { state: '' } });
      const result = updateSubjectLastPositionFromSocketStatusUpdate(subject, update);
      expect(result.last_position_status.radio_state).toBeUndefined();
    });
  });

  describe('subject with existing last_position (normal update, unchanged behavior)', () => {
    test('does not throw', () => {
      const subject = makeSubjectWithPosition();
      const update = makeStatusUpdate();
      expect(() => updateSubjectLastPositionFromSocketStatusUpdate(subject, update)).not.toThrow();
    });

    test('updates last_position geometry with incoming coordinates', () => {
      const subject = makeSubjectWithPosition();
      const update = makeStatusUpdate();
      const result = updateSubjectLastPositionFromSocketStatusUpdate(subject, update);
      expect(result.last_position.geometry.coordinates).toEqual([-122.38, 47.52]);
    });

    test('updates last_position_date from the incoming update', () => {
      const subject = makeSubjectWithPosition();
      const update = makeStatusUpdate();
      const result = updateSubjectLastPositionFromSocketStatusUpdate(subject, update);
      expect(result.last_position_date).toBe('2024-01-01T10:00:00Z');
    });

    test('falls back to subject.last_position.radio_state when update.properties.state is falsy', () => {
      // last_position is a GeoJSON Feature; radio_state is not a top-level Feature
      // field, so the fallback resolves to undefined — same behavior as the original
      // code (subject.last_position.radio_state was always undefined for real Feature
      // objects). The guard change just makes it null-safe.
      const subject = makeSubjectWithPosition();
      const update = makeStatusUpdate({ properties: { state: '' } });
      const result = updateSubjectLastPositionFromSocketStatusUpdate(subject, update);
      expect(result.last_position_status.radio_state).toBeUndefined();
    });

    test('uses update.properties.state when present, overriding the stored radio_state', () => {
      const subject = makeSubjectWithPosition();
      const update = makeStatusUpdate({ properties: { state: 'online' } });
      const result = updateSubjectLastPositionFromSocketStatusUpdate(subject, update);
      expect(result.last_position_status.radio_state).toBe('online');
    });

    test('merges existing last_position.properties with incoming properties', () => {
      const subject = makeSubjectWithPosition();
      const update = makeStatusUpdate({ properties: { state: 'online', extra_field: 'kept' } });
      const result = updateSubjectLastPositionFromSocketStatusUpdate(subject, update);
      expect(result.last_position.properties.extra_field).toBe('kept');
    });
  });
});