// scripts/obfuscate.js
// Node.js script to encode only `.m3u8` URLs inside .m3u files found in input/.
// Outputs encoded files to output/<base>.encoded.m3u
//
// By default it replaces matched URLs with: <PREFIX><urlsafe_base64>
// Set PREFIX to "obf://" if you prefer a custom scheme (but players may not like it).
//
// Usage: node scripts/obfuscate.js

const fs = require('fs');
const path = require('path');

const INPUT_DIR = path.resolve(process.cwd(), 'input');
const OUTPUT_DIR = path.resolve(process.cwd(), 'output');

// Default prefix for encoded URLs. Change to "obf://" or to your gateway URL like:
// "https://your-gateway.example.com/decode/" (must end with slash if path style)
const PREFIX = process.env.OBF_PREFIX || 'https://your-gateway.example.com/decode/';

// URL-safe Base64 encode (no padding, +/ -> -_)
function urlsafeBase64Encode(s) {
  return Buffer.from(s, 'utf8').toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Regex: match http(s) URLs that end with .m3u8 (may have query string)
// We ensure we only touch .m3u8 (so .ts etc remain intact).
const M3U8_RE = /(https?:\/\/[^\s"'<>]+?\.m3u8(?:\?[^\s"'<>]*)?)/gi;

function obfuscateContent(content) {
  return content.replace(M3U8_RE, (match) => {
    try {
      const enc = urlsafeBase64Encode(match);
      return PREFIX + enc;
    } catch (e) {
      // on unexpected error, return original to avoid breaking playlists
      console.error('Encode error for', match, e);
      return match;
    }
  });
}

function ensureDir(d) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

function processFiles() {
  ensureDir(OUTPUT_DIR);
  if (!fs.existsSync(INPUT_DIR)) {
    console.error('Input directory not found:', INPUT_DIR);
    process.exit(1);
  }

  const files = fs.readdirSync(INPUT_DIR).filter(f => f.toLowerCase().endsWith('.m3u') || f.toLowerCase().endsWith('.m3u8'));

  if (files.length === 0) {
    console.log('No .m3u/.m3u8 files found in input/. Nothing to do.');
    return;
  }

  for (const file of files) {
    const inputPath = path.join(INPUT_DIR, file);
    const raw = fs.readFileSync(inputPath, 'utf8');

    const out = obfuscateContent(raw);

    const base = path.basename(file, path.extname(file));
    const outName = `${base}.encoded.m3u`; // final output file name
    const outPath = path.join(OUTPUT_DIR, outName);

    fs.writeFileSync(outPath, out, 'utf8');
    console.log(`Wrote: ${outPath}`);
  }
}

processFiles();
