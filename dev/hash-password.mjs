// Usage: npm run hash-password -- "yeni-şifre"   → prints the value for ADMIN_PASSWORD_HASH
import { hashPassword } from '../api/_lib/auth.js';
const pw = process.argv[2];
if (!pw) { console.error('Usage: npm run hash-password -- "<password>"'); process.exit(1); }
console.log(hashPassword(pw));
