// Generate bcrypt hash for demo password
// Usage: npx tsx scripts/hash-password.ts

import bcrypt from 'bcryptjs';

const password = 'PMX@prototype2026';
const saltRounds = 12;

async function main() {
  const hash = await bcrypt.hash(password, saltRounds);
  console.log(`Password: ${password}`);
  console.log(`Hash: ${hash}`);

  // Verify it works
  const valid = await bcrypt.compare(password, hash);
  console.log(`Verification: ${valid ? 'PASS' : 'FAIL'}`);
}

main().catch(console.error);
