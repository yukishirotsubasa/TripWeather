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

export const decompressData = (encoded) => {
  if (!encoded) return null;
  try {
    const compressed = toUint8Array(encoded);
    const decompressed = pako.inflate(compressed, { to: 'string' });
    return JSON.parse(decompressed);
  } catch (err) {
    console.error('Decompression failed:', err);
    return null;
  }
};
