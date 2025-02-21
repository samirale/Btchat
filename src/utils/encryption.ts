// Polyfill for Buffer in browser environment
const bufferFromPolyfill = (data: string, encoding?: string): Uint8Array => {
  if (encoding === 'base64') {
    const binaryString = window.atob(data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }
  return new TextEncoder().encode(data);
};

const bufferToBase64Polyfill = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

export class MessageEncryption {
  private static readonly ALGORITHM = 'AES-GCM';
  private static readonly KEY_LENGTH = 256;
  private static readonly IV_LENGTH = 12;

  static async generateConversationKey(): Promise<string> {
    const key = await window.crypto.subtle.generateKey(
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );

    const exportedKey = await window.crypto.subtle.exportKey('raw', key);
    return bufferToBase64Polyfill(exportedKey);
  }

  static async importKey(keyBase64: string): Promise<CryptoKey> {
    const keyBuffer = bufferFromPolyfill(keyBase64, 'base64');
    return await window.crypto.subtle.importKey(
      'raw',
      keyBuffer,
      {
        name: this.ALGORITHM,
        length: this.KEY_LENGTH
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  static async encryptMessage(message: string, keyBase64: string): Promise<string> {
    const key = await this.importKey(keyBase64);
    const iv = window.crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));
    const encodedMessage = new TextEncoder().encode(message);

    const encryptedData = await window.crypto.subtle.encrypt(
      {
        name: this.ALGORITHM,
        iv
      },
      key,
      encodedMessage
    );

    const encryptedArray = new Uint8Array(encryptedData);
    const combined = new Uint8Array(iv.length + encryptedArray.length);
    combined.set(iv);
    combined.set(encryptedArray, iv.length);

    return bufferToBase64Polyfill(combined.buffer);
  }

  static async decryptMessage(encryptedMessage: string, keyBase64: string): Promise<string> {
    try {
      const key = await this.importKey(keyBase64);
      const encryptedArray = bufferFromPolyfill(encryptedMessage, 'base64');

      const iv = encryptedArray.slice(0, this.IV_LENGTH);
      const data = encryptedArray.slice(this.IV_LENGTH);

      const decryptedData = await window.crypto.subtle.decrypt(
        {
          name: this.ALGORITHM,
          iv
        },
        key,
        data
      );

      return new TextDecoder().decode(decryptedData);
    } catch (error) {
      console.error('Erreur de déchiffrement:', error);
      return '[Message chiffré]';
    }
  }
}