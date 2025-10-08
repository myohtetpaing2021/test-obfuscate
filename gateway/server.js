// gateway/server.js
// Simple decoder redirect server
// Install: cd gateway && npm install
// Run: node server.js
// Env: PORT (optional, default 3000)

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

function urlSafeBase64Decode(s) {
  // convert -_ back to +/ and add padding
  s = s.replace(/-/g, '+').replace(/_/g, '/');
  const pad = 4 - (s.length % 4);
  if (pad !== 4) s += '='.repeat(pad);
  return Buffer.from(s, 'base64').toString('utf8');
}

app.get('/decode/:b64', (req, res) => {
  const b64 = req.params.b64;
  try {
    const orig = urlSafeBase64Decode(b64);
    // Optional: you may want to validate orig startsWith('http')
    if (!/^https?:\/\//i.test(orig)) {
      return res.status(400).send('Invalid original URL');
    }
    // Redirect client to the original m3u8 URL
    return res.redirect(302, orig);
  } catch (e) {
    console.error('decode error', e);
    return res.status(400).send('Bad request');
  }
});

// For debugging: show a friendly page
app.get('/', (req, res) => {
  res.send('M3U decode gateway is running. Use /decode/<base64>');
});

app.listen(port, () => {
  console.log(`Gateway listening on port ${port}`);
});
