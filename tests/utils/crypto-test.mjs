import { Crypto } from '../../src/utils/crypto.mjs';

describe('Crypto', () => {
  const crypto = new Crypto('hoally-pwd');

  it('Will make different hashes for big similar passwords', () => {
    // TODO: silly expectation for the linter - remove.
    expect(crypto).not.toBe(null);

    // TODO(leandrosdim): implement
  });

  it('Will encrypt a string and decrypt it back', () => {
    // TODO(leandrosdim): implement
  });

  it('Will return a uuid', () => {
    // TODO(leandrosdim): implement
  });
});
