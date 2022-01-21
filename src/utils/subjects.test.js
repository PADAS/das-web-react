import { subjectIsStatic } from './subjects.js';
import { subjectFeatureWithOneDeviceProp, staticSubjectFeature } from '../__test-helpers/fixtures/subjects';


import '@testing-library/jest-dom/extend-expect';

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


it('works', () => {
  expect(true).toBe(true);
});