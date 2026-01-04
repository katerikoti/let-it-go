/**
 * Client-side encryption utilities for end-to-end encrypted messages.
 * Uses Web Crypto API to derive encryption keys from user passwords.
 */

/**
 * Derives an encryption key from a password using PBKDF2.
 * The key is stored in sessionStorage and used to encrypt/decrypt messages.
 */
export async function deriveKeyFromPassword(password: string, username: string): Promise<string> {
  const encoder = new TextEncoder();
  
  // Use username as salt (in production, consider storing a random salt per user)
  const salt = encoder.encode(username);
  const passwordBuffer = encoder.encode(password);

  // Import password as key material
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    passwordBuffer,
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );

  // Derive AES-GCM key
  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // Export key to store in sessionStorage
  const exportedKey = await crypto.subtle.exportKey('raw', key);
  const keyArray = Array.from(new Uint8Array(exportedKey));
  return keyArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Encrypts a message using the user's encryption key.
 */
export async function encryptMessage(message: string, keyHex: string): Promise<string> {
  const encoder = new TextEncoder();
  const messageBuffer = encoder.encode(message);

  // Convert hex key back to CryptoKey
  const keyArray = new Uint8Array(keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
  const key = await crypto.subtle.importKey(
    'raw',
    keyArray,
    'AES-GCM',
    false,
    ['encrypt']
  );

  // Generate random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));

  // Encrypt
  const encryptedBuffer = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
    },
    key,
    messageBuffer
  );

  // Combine IV and encrypted data
  const encryptedArray = new Uint8Array(encryptedBuffer);
  const combined = new Uint8Array(iv.length + encryptedArray.length);
  combined.set(iv, 0);
  combined.set(encryptedArray, iv.length);

  // Convert to base64
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts a message using the user's encryption key.
 */
export async function decryptMessage(encryptedMessage: string, keyHex: string): Promise<string> {
  try {
    // Convert hex key back to CryptoKey
    const keyArray = new Uint8Array(keyHex.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    const key = await crypto.subtle.importKey(
      'raw',
      keyArray,
      'AES-GCM',
      false,
      ['decrypt']
    );

    // Decode base64
    const combined = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));

    // Extract IV and encrypted data
    const iv = combined.slice(0, 12);
    const encryptedData = combined.slice(12);

    // Decrypt
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
      },
      key,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error('Decryption failed:', error);
    return '[Unable to decrypt message]';
  }
}
