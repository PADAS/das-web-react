import { subjectIsStatic, getSubjectDefaultDeviceProperty, addDefaultStatusValue } from './subjects.js';
import { subjectFeatureWithOneDeviceProp, staticSubjectFeature, staticSubjectFeatureWithoutIcon, staticSubjectFeatureWithoutDefaultValue } from '../__test-helpers/fixtures/subjects';


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