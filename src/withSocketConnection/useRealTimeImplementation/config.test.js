import { socketDeleteSubject, socketNewSubject } from '../../ducks/subjects';
import { events as SOCKET_DISPATCHES } from './config';

describe('SOCKET_DISPATCHES config', () => {
  describe('new_subject entry', () => {
    test('is present in the config', () => {
      expect(SOCKET_DISPATCHES).toHaveProperty('new_subject');
    });

    test('maps to the socketNewSubject action creator as the first handler', () => {
      expect(SOCKET_DISPATCHES.new_subject[0]).toBe(socketNewSubject);
    });

    test('includes a health-status updater as the second handler', () => {
      expect(typeof SOCKET_DISPATCHES.new_subject[1]).toBe('function');
    });
  });

  describe('delete_subject entry', () => {
    test('is present in the config', () => {
      expect(SOCKET_DISPATCHES).toHaveProperty('delete_subject');
    });

    test('maps to the socketDeleteSubject action creator as the first handler', () => {
      expect(SOCKET_DISPATCHES.delete_subject[0]).toBe(socketDeleteSubject);
    });

    test('includes a health-status updater as the second handler', () => {
      expect(typeof SOCKET_DISPATCHES.delete_subject[1]).toBe('function');
    });
  });
});
