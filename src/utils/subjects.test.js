import { subjectIsStatic } from './subjects.js';
import { mockSubjectsData } from '../__test-helpers/fixtures/subjects';

import '@testing-library/jest-dom/extend-expect';

describe('Determining if a subject is static', () => {
  const knownStaticSubject = mockSubjectsData[1];
  const knownMovingSubject = mockSubjectsData[0];
  
  test('a static subject', () => {
    expect(subjectIsStatic(knownStaticSubject)).toBe(true);
  });
  test('a non-static subject', () => {
    expect(subjectIsStatic(knownMovingSubject)).toBe(false);
  });
});

