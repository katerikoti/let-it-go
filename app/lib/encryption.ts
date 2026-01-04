/**
 * Client-side encryption utilities for end-to-end encrypted messages.
 * Uses Web Crypto API to derive encryption keys from user passwords.
 */

/**
 * Derives an encryption key from a password using PBKDF2.
 * The key is stored in sessionStorage and used to encrypt/decrypt messages.
 */
export async function deriveKeyFromPassword(password: string, username: string, iterations: number = 100000): Promise<string> {
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
      iterations: iterations,
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
 * Tries multiple iteration counts for backwards compatibility.
 */
export async function decryptMessage(encryptedMessage: string, keyHex: string, username?: string, password?: string): Promise<string> {
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
    // If decryption fails and we have username/password, try with old iteration count (10000)
    if (username && password) {
      try {
        console.log('Trying decryption with old iteration count (10000)...');
        const oldKey = await deriveKeyFromPassword(password, username, 10000);
        const keyArray = new Uint8Array(oldKey.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
        const key = await crypto.subtle.importKey(
          'raw',
          keyArray,
          'AES-GCM',
          false,
          ['decrypt']
        );

        const combined = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
        const iv = combined.slice(0, 12);
        const encryptedData = combined.slice(12);

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
      } catch (oldError) {
        console.error('Decryption failed with both iteration counts:', oldError);
        return '[Unable to decrypt message]';
      }
    }
    console.error('Decryption failed:', error);
    return '[Unable to decrypt message]';
  }
}

/**
 * Checks if a message is already encrypted by attempting to decrypt it.
 * Returns true if the message appears to be encrypted, false otherwise.
 */
export async function isMessageEncrypted(message: string, keyHex: string): Promise<boolean> {
  try {
    // Try to decrypt - if successful and doesn't return error message, it's encrypted
    const decrypted = await decryptMessage(message, keyHex);
    return decrypted !== '[Unable to decrypt message]';
  } catch {
    return false;
  }
}
