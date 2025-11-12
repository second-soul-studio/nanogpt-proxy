import { encrypt } from './utilities/crypto.js';

const input = process.argv[2];

if (!input) {
  console.error('❌ Usage: node encrypt-cli.js "<apiKey>"');
  process.exit(1);
}

try {
  const encrypted = encrypt(input);
  console.log('✅ Encrypted value (hex):');
  console.log(encrypted);
} catch (err) {
  console.error('❌ Error encrypting value:', err.message);
  process.exit(1);
}
