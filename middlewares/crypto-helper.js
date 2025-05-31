// crypto-helper.js
// Usage:
//   const { encrypt, decrypt } = require('./crypto-helper');
//   const token = encrypt('4458829a882717d0');   // → '0f7e…'
//   const id    = decrypt(token);                // → '4458829a882717d0'

const { randomBytes, createCipheriv, createDecipheriv } = require('crypto');

const ALGO = 'aes-256-ctr';
const KEY  = Buffer.from(
  process.env.HASH_SECRET ||
  'b4d23ae0be590af39740e7325c9afdf3b4d23ae0be590af39740e7325c9afdf3', // 64‑hex = 32‑bytes
  'hex'
);

/**
 * Encrypt a plain string → URL‑safe base64
 */
function encrypt(plain) {
  const iv  = randomBytes(16);                    // unique per message
  const enc = createCipheriv(ALGO, KEY, iv)
               .update(plain, 'utf8');
  const out = Buffer.concat([iv, enc]);           // prepend IV
  return out.toString('base64url');               // URL‑safe
}

/**
 * Decrypt a token produced by encrypt()
 */
function decrypt(token) {
  const buf = Buffer.from(token, 'base64url');
  const iv  = buf.subarray(0, 16);                // first 16‑bytes = IV
  const enc = buf.subarray(16);
  const dec = createDecipheriv(ALGO, KEY, iv)
               .update(enc)
               .toString('utf8');
  return dec;
}

module.exports = { encrypt, decrypt };
