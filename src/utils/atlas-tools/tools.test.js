import { createHash } from 'crypto';

import toolsDocument from './tools.json';

// otus keeps a copy of tools.json, and Atlas is told its version on connect.
const CONTRACT_FINGERPRINT = {
  sha256: '6caba7b2d2104e5054dfff8b4403a6c0b4251c6c9f6eb164a05e5f375edd9b75',
  version: 1,
};

const CHANGED_MESSAGE = 'tools.json changed: bump its version, update this fingerprint, and copy the file to otus '
  + '(agents/otus/skills/show_in_app/tools.json)';

describe('utils - atlas-tools - tools.json', () => {
  test('matches the contract otus has a copy of', () => {
    const fingerprint = {
      sha256: createHash('sha256').update(JSON.stringify(toolsDocument.tools)).digest('hex'),
      version: toolsDocument.version,
    };

    if (fingerprint.sha256 !== CONTRACT_FINGERPRINT.sha256 || fingerprint.version !== CONTRACT_FINGERPRINT.version) {
      throw new Error(`${CHANGED_MESSAGE}. Now ${JSON.stringify(fingerprint)}.`);
    }

    expect(fingerprint).toEqual(CONTRACT_FINGERPRINT);
  });
});
