import pako from 'pako';
import { encode, decode } from 'base64-url';

/**
 * Compresses an object to a URL-safe Base64 string.
 */
export const compressData = (data) => {
  try {
    const jsonString = JSON.stringify(data);
    const compressed = pako.deflate(jsonString);
    // Convert Uint8Array to Binary string
    const binaryString = String.fromCharCode.apply(null, compressed);
    return encode(window.btoa(binaryString));
  } catch (err) {
    console.error('Compression failed:', err);
    return null;
  }
};

/**
 * Decompresses a URL-safe Base64 string back to an object.
 */
export const decompressData = (base64) => {
  try {
    const decoded = decode(base64);
    const binaryString = window.atob(decoded);
    const charData = binaryString.split('').map(x => x.charCodeAt(0));
    const binData = new Uint8Array(charData);
    const decompressed = pako.inflate(binData, { to: 'string' });
    return JSON.parse(decompressed);
  } catch (err) {
    console.error('Decompression failed:', err);
    return null;
  }
};
