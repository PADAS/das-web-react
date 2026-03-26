import {
  subjectIsStatic,
  getSubjectDefaultDeviceProperty,
  addDefaultStatusValue,
  isBuoySubject,
  isGearSubjectSubtype,
  calcDisplayNameForSubject,
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