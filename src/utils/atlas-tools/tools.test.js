import { createHash } from 'crypto';

import toolsDocument from './tools.json';

// The sha256 of each contract version's tool names and input schemas. otus
// keeps a copy of tools.json, and Atlas is told its version on connect, so a
// version, once shipped, always means the same schemas.
const CONTRACT_FINGERPRINTS = {
  1: 'f96d5df99300674ef83cec9952e26b024bcc77a8716f3a1a456770dc7e146469',
};

const CHANGED_MESSAGE = 'The names or input schemas in tools.json changed: bump its version, add the new version and '
  + 'its sha256 to CONTRACT_FINGERPRINTS (never edit an existing entry), and copy tools.json to otus '
  + '(agents/otus/skills/show_in_app/tools.json)';

const fingerprint = (tools) => createHash('sha256')
  .update(JSON.stringify(tools.map(({ name, inputSchema }) => ({ name, inputSchema }))))
  .digest('hex');

describe('utils - atlas-tools - tools.json', () => {
  test('has the names and input schemas pinned for its version', () => {
    const sha256 = fingerprint(toolsDocument.tools);

    if (sha256 !== CONTRACT_FINGERPRINTS[toolsDocument.version]) {
      throw new Error(`${CHANGED_MESSAGE}. Version ${toolsDocument.version} is now ${sha256}.`);
    }

    expect(sha256).toBe(CONTRACT_FINGERPRINTS[toolsDocument.version]);
  });

  test('pins each version to its own names and input schemas', () => {
    const shas = Object.values(CONTRACT_FINGERPRINTS);

    if (new Set(shas).size !== shas.length) {
      throw new Error(`Two versions in CONTRACT_FINGERPRINTS share a sha256, so one was edited. ${CHANGED_MESSAGE}.`);
    }

    expect(new Set(shas).size).toBe(shas.length);
  });

  test('is the latest version pinned', () => {
    const latestVersion = Math.max(...Object.keys(CONTRACT_FINGERPRINTS).map(Number));

    expect(toolsDocument.version).toBe(latestVersion);
  });
});
