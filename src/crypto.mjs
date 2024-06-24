import { Buffer } from 'node:buffer';
import {
  createHmac,
  createCipheriv,
  createDecipheriv,
  randomBytes,
  createHash,
  randomUUID,
} from 'node:crypto';

/**
 * The Crypto class is used to hash passwords and to encrypt personal information in
 * the database.
 * We decided to implement this on the server instead of using similar database
 * modules to avoid getting locked to a specific database.
 */
export class Crypto {
  constructor(secret) {
    this.secret = secret;
  }

  // Asymmetric one way encryption.
  hash(password) {
    return hash(this.secret, password);
  }

  // Symmetric encryption/decryption.
  encrypt(text) {
    return encrypt(this.secret, text);
  }

  decrypt(encryptedText) {
    return decrypt(this.secret, encryptedText);
  }

  uuid() {
    return randomUUID();
  }
}

function hash(secret, text) {
  return createHmac('sha256', secret).update(text).digest('hex');
}

function encrypt(secret, plaintext) {
  const key = getKey(secret);
  const aad = Buffer.from('0123456789', 'hex');

  const nonce = randomBytes(12);
  const cipher = createCipheriv('aes-192-ccm', key, nonce, {
    authTagLength: 16,
  });
  cipher.setAAD(aad, {
    plaintextLength: Buffer.byteLength(plaintext),
  });
  const ciphertext = cipher.update(plaintext, 'utf8');
  cipher.final();
  const tag = cipher.getAuthTag();
  const encodedData = [nonce, ciphertext, tag].map((v) => v.toString('base64'));
  return encodedData.join('|');
}

function decrypt(secret, encryptedText) {
  const key = getKey(secret);
  const aad = Buffer.from('0123456789', 'hex');
  const encodedData = encryptedText.split('|');
  const [nonce, ciphertext, tag] = encodedData.map((s) =>
    Buffer.from(s, 'base64'),
  );
  const decipher = createDecipheriv('aes-192-ccm', key, nonce, {
    authTagLength: 16,
  });
  decipher.setAuthTag(tag);
  decipher.setAAD(aad, {
    plaintextLength: ciphertext.length,
  });
  const text = decipher.update(ciphertext, null, 'utf8');

  try {
    decipher.final();
  } catch (err) {
    throw new Error('Authentication failed!', { cause: err });
  }
  return text;
}

function getKey(secret) {
  return createHash('sha256').update(secret).digest('base64').substring(0, 24);
}
