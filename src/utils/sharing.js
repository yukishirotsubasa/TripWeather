import pako from 'pako';
import { encode, decode } from 'base64-url';

// Helper: Uint8Array to Base64 (URL safe)
const uint8ToBase64URL = (uint8) => {
  let bin = '';
  for (let i = 0; i < uint8.length; i++) {
    bin += String.fromCharCode(uint8[i]);
  }
  return window.btoa(bin)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

// Helper: Base64 (URL safe) to Uint8Array
const base64URLToUint8 = (base64) => {
  const normalized = base64.replace(/-/g, '+').replace(/_/g, '/');
  const bin = window.atob(normalized);
  const uint8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    uint8[i] = bin.charCodeAt(i);
  }
  return uint8;
};

export const compressData = (data) => {
  try {
    const json = JSON.stringify(data);
    const compressed = pako.deflate(json);
    return uint8ToBase64URL(compressed);
  } catch (err) {
    console.error('Compression failed:', err);
    return null;
  }
};

export const decompressData = (encoded) => {
  if (!encoded) return null;
  try {
    const uint8 = base64URLToUint8(encoded);
    const decompressed = pako.inflate(uint8, { to: 'string' });
    return JSON.parse(decompressed);
  } catch (err) {
    console.error('Decompression failed:', err);
    return null;
  }
};
