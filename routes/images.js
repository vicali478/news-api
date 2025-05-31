// routes/images.js
const express = require('express');
const { decrypt } = require('../middlewares/crypto-helper'); // ⬅ decrypt only!
const fs      = require('fs').promises;
const path    = require('path');
const axios   = require('axios');
const sharp   = require('sharp');

const router = express.Router();

// ───────── crop helper ─────────
async function loadImage(src) {
  if (/^https?:\/\//i.test(src)) {
    const { data } = await axios.get(src, { responseType: 'arraybuffer' });
    return Buffer.from(data);
  }
  return fs.readFile(path.resolve(src));
}

async function crop20pct(buf) {
  const img = sharp(buf);
  const { width, height } = await img.metadata();
  const left   = Math.round(width  * 0.20);
  const top    = Math.round(height * 0.20);
  const w      = Math.round(width  * 0.60);
  const h      = Math.round(height * 0.60);
  return img.extract({ left, top, width: w, height: h });
}

// ───────── route ─────────
/**
 * GET /images?token=<encrypted‑id>
 *   token  – value produced by crypto‑helper.encrypt('4458829a882717d0')
 */
router.get('/', async (req, res) => {
  const { token } = req.query;
  if (!token) return res.status(400).send('missing ?token=');

  let id;
  try {
    id = decrypt(token);                       // recover raw hash
    if (!/^[a-f0-9]{16}$/i.test(id)) throw new Error('invalid id');
  } catch (e) {
    return res.status(400).send('bad token');
  }

  const src = `https://cdn.tuko.co.ke/images/1120/${id}.jpeg?v=1`;

  try {
    const input   = await loadImage(src);
    const cropped = await crop20pct(input);

    res.type('jpeg');                          // always jpeg here
    cropped.jpeg({ quality: 92 }).pipe(res);

  } catch (err) {
    console.error('✖ processing error:', err.message);
    res.status(502).send('unable to fetch or process image');
  }
});

module.exports = router;
