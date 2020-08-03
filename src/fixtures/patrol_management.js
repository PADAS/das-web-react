import { uuid } from '../utils/string';

const priorities = [0, 100, 200, 300];
const iconIds = ['dog-patrol-icon',
  'fence-patrol-icon',
  'helicopter-patrol-icon',
  'response-patrol-icon',
  'routine-patrol-icon'];


const randomItemFromArray = array => array[Math.floor(Math.random()*array.length)];


const createMockPatrolTypes = (numberToCreate) => {
  const patrolTypes = [];
  for (let i = 0; i < numberToCreate; i++) {
    patrolTypes.push({
      'id': uuid(),
      'value': `patrol${i+1}`,
      'display': `Patrol ${i+1}`,
      'ordernum': i+1,
      'is_collection': false,
      'category': {
        'value': 'patrols',
        'display': 'Patrols',
        'ordernum': null,
        'flag': 'user',
        'permissions': [
          'create',
          'update',
          'read',
          'delete'
        ]
      },
      'icon_id': randomItemFromArray(iconIds),
      'default_priority': randomItemFromArray(priorities),
    });
  }
  return patrolTypes;
};

export const generatePatrolEventCategory = () => ({
  'value': 'patrols',
  'display': 'Patrols',
  'ordernum': 0,
  'flag': 'user',
  'permissions': [
    'create',
    'update',
    'read',
    'delete'
  ],
  'types': createMockPatrolTypes(5),
});