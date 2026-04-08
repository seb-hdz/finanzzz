/** PBKDF2 iterations for encrypted blobs (backup + shared sync). */
export const CRYPTO_PBKDF2_ITERATIONS = 100_000;

function requireSubtle(): SubtleCrypto {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error(
      "Este entorno no permite cifrado web (falta crypto.subtle). Abre la app por HTTPS o por localhost, no por una IP de red en HTTP."
    );
  }
  return subtle;
}

export async function deriveAesKeyFromPassword(
  password: string,
  salt: Uint8Array
): Promise<CryptoKey> {
  const subtle = requireSubtle();
  const encoder = new TextEncoder();
  const keyMaterial = await subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt.buffer as ArrayBuffer,
      iterations: CRYPTO_PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/** Wire format: 16-byte salt | 12-byte IV | ciphertext */
export async function encryptBinaryWithPassword(
  plaintext: Uint8Array,
  password: string
): Promise<Uint8Array> {
  const subtle = requireSubtle();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveAesKeyFromPassword(password, salt);
  const ciphertext = await subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    plaintext as BufferSource
  );
  const out = new Uint8Array(16 + 12 + ciphertext.byteLength);
  out.set(salt, 0);
  out.set(iv, 16);
  out.set(new Uint8Array(ciphertext), 28);
  return out;
}

export async function decryptBinaryWithPassword(
  payload: Uint8Array,
  password: string
): Promise<Uint8Array> {
  if (payload.byteLength < 28) {
    throw new Error("Payload demasiado corto.");
  }
  const salt = payload.slice(0, 16);
  const iv = payload.slice(16, 28);
  const ciphertext = payload.slice(28);
  const subtle = requireSubtle();
  const key = await deriveAesKeyFromPassword(password, salt);
  try {
    const plaintext = await subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      ciphertext as BufferSource
    );
    return new Uint8Array(plaintext);
  } catch {
    throw new Error("Contraseña incorrecta o datos corruptos.");
  }
}
